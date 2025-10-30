using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using static MilkDistributionWarehouse.Models.DTOs.GoodsReceiptNoteDetailDto;
using static MilkDistributionWarehouse.Repositories.GoodsReceiptNoteDetailRepository;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsReceiptNoteDetailService
    {
        Task<(string, List<GoodsReceiptNoteDetailPalletDto>)> GetListGRNDByGRNId(Guid grnId);
        Task<(string, T?)> UpdateGRNDetail<T>(T update, int? userId) where T : GoodsReceiptNoteDetailUpdateStatus;
    }
    
    public class GoodsReceiptNoteDetailService : IGoodsReceiptNoteDetailService
    {
        private readonly IGoodsReceiptNoteDetailRepository _grndRepository;
        private readonly IMapper _mapper;

        public GoodsReceiptNoteDetailService(IGoodsReceiptNoteDetailRepository grndRepository, IMapper mapper)
        {
            _grndRepository = grndRepository;
            _mapper = mapper;
        }

        public async Task<(string, List<GoodsReceiptNoteDetailPalletDto>)> GetListGRNDByGRNId(Guid grnId)
        {
            try
            {
                var grndList = await _grndRepository.GetListByGRNId(grnId);
                if (grndList == null || !grndList.Any())
                {
                    return ("No goods receipt note details found", new List<GoodsReceiptNoteDetailPalletDto>());
                }

                var grndDtos = _mapper.Map<List<GoodsReceiptNoteDetailPalletDto>>(grndList);
                return (string.Empty, grndDtos);
            }
            catch (Exception ex)
            {
                return ($"Error retrieving goods receipt note details: {ex.Message}", new List<GoodsReceiptNoteDetailPalletDto>());
            }
        }

        public async Task<(string, T?)> UpdateGRNDetail<T>(T update, int? userId) where T : GoodsReceiptNoteDetailUpdateStatus
        {
            try
            {
                var grnDetail = await _grndRepository.GetGRNDetailById(update.GoodsReceiptNoteDetailId);

                if (grnDetail == null) throw new Exception ("GRN detail is not exist.");
                
                var createBy = grnDetail.GoodsReceiptNote.CreatedBy;
                var currentStatus = grnDetail.Status;

                if(update is GoodsReceiptNoteDetailInspectedDto inspectedDto)
                {
                    if (currentStatus != ReceiptItemStatus.Receiving)
                        throw new Exception ("Chỉ được chuyển thạng thái đã kiểm tra khi mục nhập kho chi tiết ở trạng thái Đang tiếp nhận.".ToMessageForUser());
                    if (createBy != userId)
                        throw new Exception("Current User has no permission to update.");

                    string msg = CheckGRNDetailUpdateValidation(inspectedDto, grnDetail);
                    if(!string.IsNullOrEmpty(msg))
                        throw new Exception (msg);

                    grnDetail = _mapper.Map(update, grnDetail);
                }

                if(update is GoodsReceiptNoteDetailCancelDto)
                {
                    if (currentStatus != ReceiptItemStatus.PendingApproval)
                        throw new Exception("Chỉ được chuyển về trạng thái Đang tiếp nhận khi mục nhập kho chi tiết ở trạng thái Chờ duyệt.".ToMessageForUser());
                    if (createBy != userId)
                        throw new Exception("Current User has no permission to update.");

                    grnDetail = _mapper.Map(update,grnDetail);
                }

                var resultUpdate = await _grndRepository.UpdateGRNDetail(grnDetail);
                if (resultUpdate == null)
                    throw new Exception("Cập nhật mục nhập kho chi tiết thất bại.".ToMessageForUser());

                return ("", update);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        private string CheckGRNDetailUpdateValidation(GoodsReceiptNoteDetailInspectedDto inspectedDto, GoodsReceiptNoteDetail grnDetail)
        {
            if (inspectedDto.RejectPackageQuantity > inspectedDto.DeliveredPackageQuantity)
                return "Số lượng thùng từ chối không thể lớn hơn số lượng thùng được vận chuyển đến.".ToMessageForUser();

            if (inspectedDto.RejectPackageQuantity > 0 && string.IsNullOrEmpty(inspectedDto.Note))
                return "Từ chối thùng hàng phải có lý do.".ToMessageForUser();

            return "";
        }
    }
}
