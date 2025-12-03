using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IPickAllocationService
    {
        Task<(string, PickAllocationDetailDto?)> GetPickAllocationDetailById(int? pickAllocationId);
        Task<string> ConfirmPickAllocation(ConfirmPickAllocationDto confirmPickAllocation);
    }

    public class PickAllocationService : IPickAllocationService
    {
        private readonly IPickAllocationRepository _pickAllocationRepository;
        private readonly IGoodsIssueNoteDetailRepository _goodsIssueNoteDetailRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IDisposalNoteDetailRepository _disposalNoteDetailRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public PickAllocationService(IPickAllocationRepository pickAllocationRepository,
                            IGoodsIssueNoteDetailRepository goodsIssueNoteDetailRepository,
                            IStocktakingSheetRepository stocktakingSheetRepository,
                            IDisposalNoteDetailRepository disposalNoteDetailRepository,
                            IUnitOfWork unitOfWork,
                            IMapper mapper)
        {
            _pickAllocationRepository = pickAllocationRepository;
            _goodsIssueNoteDetailRepository = goodsIssueNoteDetailRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _disposalNoteDetailRepository = disposalNoteDetailRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<(string, PickAllocationDetailDto?)> GetPickAllocationDetailById(int? pickAllocationId)
        {
            if (pickAllocationId == null) return ("PickAllocationId is invalid.", null);

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), null);

            var pickAllocation = await _pickAllocationRepository.GetPickAllocationDetailById(pickAllocationId);
            if (pickAllocation == null) return ("Pick Allocation exist is null", null);

            var pickDetailDto = _mapper.Map<PickAllocationDetailDto>(pickAllocation);
            return ("", pickDetailDto);
        }

        public async Task<string> ConfirmPickAllocation(ConfirmPickAllocationDto confirmPickAllocation)
        {
            var pickAllocation = await _pickAllocationRepository.GetPickAllocationDetailById(confirmPickAllocation.PickAllocationId);
            if (pickAllocation == null) return "Pick Allocation exist is null";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            if (pickAllocation.PalletId != confirmPickAllocation.PalletId)
                return "Mã kệ kê hàng được quét không khớp với kệ kê hàng được chỉ định.".ToMessageForUser();

            if (pickAllocation.Status != PickAllocationStatus.UnScanned)
                return "Không thể xác nhận lần lấy hàng ở trạng thái hiện tại.".ToMessageForUser();
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                pickAllocation.Status = PickAllocationStatus.Scanned;
                await _pickAllocationRepository.UpdatePickAllocation(pickAllocation);

                if (pickAllocation.GoodsIssueNoteDetailId.HasValue)
                {
                    var relatedPickAllocations = await _goodsIssueNoteDetailRepository.GetPickAllocationsByGIN(pickAllocation.GoodsIssueNoteDetailId);
                    if (relatedPickAllocations != null && relatedPickAllocations.All(p => p.Status == PickAllocationStatus.Scanned))
                    {
                        var ginDetail = await _goodsIssueNoteDetailRepository.GetGoodsIssueNoteDetailById(pickAllocation.GoodsIssueNoteDetailId);
                        if (ginDetail != null)
                        {
                            ginDetail.Status = IssueItemStatus.Picked;
                            ginDetail.UpdatedAt = DateTimeUtility.Now();
                            await _goodsIssueNoteDetailRepository.UpdateGoodsIssueNoteDetail(ginDetail);
                        }
                    }
                }
                
                if (pickAllocation.DisposalNoteDetailId.HasValue)
                {
                    var relatedPickAllocations = await _disposalNoteDetailRepository.GetPickAllocationsByDN(pickAllocation.DisposalNoteDetailId);
                    if (relatedPickAllocations != null && relatedPickAllocations.All(p => p.Status == PickAllocationStatus.Scanned))
                    {
                        var dnDetail = await _disposalNoteDetailRepository.GetDisposalNoteDetailById(pickAllocation.DisposalNoteDetailId);
                        if (dnDetail != null)
                        {
                            dnDetail.Status = DisposalNoteItemStatus.Picked;
                            dnDetail.UpdatedAt = DateTimeUtility.Now();
                            await _disposalNoteDetailRepository.UpdateDisposalNoteDetail(dnDetail);
                        }
                    }
                }

                await _unitOfWork.CommitTransactionAsync();
                return "";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi xác nhận lấy hàng.".ToMessageForUser();
            }
        }
    }
}
