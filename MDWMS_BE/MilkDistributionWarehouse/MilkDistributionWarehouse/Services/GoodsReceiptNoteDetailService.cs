using AutoMapper;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using static MilkDistributionWarehouse.Models.DTOs.GoodsReceiptNoteDetailDto;
using static MilkDistributionWarehouse.Repositories.GoodsReceiptNoteDetailRepository;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsReceiptNoteDetailService
    {
        Task<(string, List<GoodsReceiptNoteDetailPalletDto>)> GetListGRNDByGRNId(string grnId);
        Task<(string, T?)> UpdateGRNDetail<T>(T update, int? userId) where T : GoodsReceiptNoteDetailUpdateStatus;
        Task<(string, List<GoodsReceiptNoteDetailRejectDto>?)> UpdateGRNReject(List<GoodsReceiptNoteDetailRejectDto> updateRejects, int? userId);
    }

    public class GoodsReceiptNoteDetailService : IGoodsReceiptNoteDetailService
    {
        private readonly IGoodsReceiptNoteDetailRepository _grndRepository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;

        public GoodsReceiptNoteDetailService(IGoodsReceiptNoteDetailRepository grndRepository, IMapper mapper,
            IUnitOfWork unitOfWork,
            INotificationService notificationService, IUserRepository userRepository)
        {
            _grndRepository = grndRepository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _userRepository = userRepository;
        }

        public async Task<(string, List<GoodsReceiptNoteDetailPalletDto>)> GetListGRNDByGRNId(string grnId)
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
                var flag = 0;

                var grnDetail = await _grndRepository.GetGRNDetailById(update.GoodsReceiptNoteDetailId);

                if (grnDetail == null) throw new Exception("GRN detail is not exist.");

                var createdBy = grnDetail.GoodsReceiptNote.CreatedBy;
                var approvalBy = grnDetail.GoodsReceiptNote.ApprovalBy;
                var currentStatus = grnDetail.Status;

                if (update is GoodsReceiptNoteDetailInspectedDto inspectedDto)
                {
                    if (currentStatus != ReceiptItemStatus.Receiving)
                        throw new Exception("Chỉ được chuyển thạng thái đã kiểm tra khi mục nhập kho chi tiết ở trạng thái Đang tiếp nhận.".ToMessageForUser());
                    if (createdBy != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    string msg = CheckGRNDetailUpdateValidation(inspectedDto, grnDetail);
                    if (!string.IsNullOrEmpty(msg))
                        throw new Exception(msg);

                    grnDetail = _mapper.Map(update, grnDetail);
                }

                if (update is GoodsReceiptNoteDetailCancelDto)
                {
                    if (currentStatus != ReceiptItemStatus.Inspected)
                        throw new Exception("Chỉ được chuyển về trạng thái Đang tiếp nhận khi mục nhập kho chi tiết ở trạng thái Đã kiểm tra.".ToMessageForUser());
                    if (createdBy != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    grnDetail = _mapper.Map(update, grnDetail);
                }

                if (update is GoodsReceiptNoteDetailPendingApprovalDto)
                {
                    if (currentStatus != ReceiptItemStatus.Inspected)
                        throw new Exception("Chỉ được chuyển sang trạng thái Đã kiểm tra khi mục nhập kho chi tiết ở trạng thái Đã kiểm tra.".ToMessageForUser());
                    if (createdBy != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    grnDetail = _mapper.Map(update, grnDetail);
                }

                //warehouse - manager
                if (update is GoodsReceiptNoteDetailRejectDto rejectDto)
                {
                    if (currentStatus != ReceiptItemStatus.PendingApproval)
                        throw new Exception("Chỉ được chuyển sang trạng thái Từ chối khi mục nhập kho chi tiết ở trạng thái Chờ duyệt.".ToMessageForUser());

                    await EnsureRolePermission(
                            RoleType.WarehouseManager,
                            userId,
                            "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                            "Bạn không có quyền thực hiện chức năng này");

                    if (string.IsNullOrEmpty(rejectDto.RejectionReason))
                        throw new Exception("Từ chối phải có lý do.".ToMessageForUser());

                    grnDetail = _mapper.Map(update, grnDetail);
                    grnDetail.GoodsReceiptNote.Status = GoodsReceiptNoteStatus.Receiving;

                    flag = 1;
                }

                //warehouse - manager
                if (update is GoodsReceiptNoteDetailCompletedDto)
                {
                    if (currentStatus != ReceiptItemStatus.PendingApproval)
                        throw new Exception("Chỉ được chuyển sang trạng thái Đã hoàn thành khi mục nhập kho chi tiết ở trạng thái Chờ duyệt.".ToMessageForUser());

                    await EnsureRolePermission(
                            RoleType.WarehouseManager,
                            userId,
                            "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                            "Bạn không có quyền thực hiện chức năng này");

                    grnDetail = _mapper.Map(update, grnDetail);
                    grnDetail.RejectionReason = "";
                }

                var resultUpdate = await _grndRepository.UpdateGRNDetail(grnDetail);
                if (resultUpdate == null)
                    throw new Exception("Cập nhật mục nhập kho chi tiết thất bại.".ToMessageForUser());

                if (flag == 1)
                {
                    flag = 0;
                }

                return ("", update);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, List<GoodsReceiptNoteDetailRejectDto>?)> UpdateGRNReject(List<GoodsReceiptNoteDetailRejectDto> updateRejects, int? userId)
        {
            if (updateRejects.Count == 0)
                return ("Data list input is invalid.", default);
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var rejectDto in updateRejects)
                {
                    var grnDetail = await _grndRepository.GetGRNDetailById(rejectDto.GoodsReceiptNoteDetailId);

                    await EnsureRolePermission(
                            RoleType.WarehouseManager,
                            userId,
                            "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                            "Bạn không có quyền thực hiện chức năng này");

                    if (grnDetail == null) throw new Exception("GRN detail is not exist.");

                    var currentStatus = grnDetail.Status;

                    if (currentStatus != ReceiptItemStatus.PendingApproval)
                        throw new Exception("Chỉ được chuyển sang trạng thái Từ chối khi mục nhập kho chi tiết ở trạng thái Chờ duyệt.");

                    if (string.IsNullOrEmpty(rejectDto.RejectionReason))
                        throw new Exception("Từ chối phải có lý do.");

                    grnDetail = _mapper.Map(rejectDto, grnDetail);
                    grnDetail.GoodsReceiptNote.Status = GoodsReceiptNoteStatus.Receiving;

                    var resultUpdate = await _grndRepository.UpdateGRNDetail(grnDetail);
                    if (resultUpdate == null)
                        throw new Exception("Cập nhật mục nhập kho chi tiết thất bại.");

                }
                await _unitOfWork.CommitTransactionAsync();

                var grnDetail_1 = await _grndRepository.GetGRNDetailById(updateRejects.FirstOrDefault().GoodsReceiptNoteDetailId);
                await HandleStatusNotificationChange(grnDetail_1.GoodsReceiptNote);

                return ("", updateRejects);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}".ToMessageForUser(), default);
            }
        }

        private string CheckGRNDetailUpdateValidation(GoodsReceiptNoteDetailInspectedDto inspectedDto, GoodsReceiptNoteDetail grnDetail)
        {
            var delivered = inspectedDto.DeliveredPackageQuantity;
            var expected = grnDetail.ExpectedPackageQuantity;
            var rejected = inspectedDto.RejectPackageQuantity;

            if (rejected > delivered)
                return "Số lượng thùng từ chối không thể lớn hơn số lượng thùng được vận chuyển đến.".ToMessageForUser();

            var exceededQuantity = delivered - expected;

            if (exceededQuantity > 0 && rejected < exceededQuantity)
                return $"Phải trả lại ít nhất {exceededQuantity} thùng khi số lượng giao đến vượt dự kiến.";

            if (rejected > 0 && string.IsNullOrEmpty(inspectedDto.Note))
                return "Từ chối thùng hàng phải có lý do.".ToMessageForUser();

            return string.Empty;
        }
        private async Task HandleStatusNotificationChange(GoodsReceiptNote goodsReceiptNote)
        {
            var notificationToCreate = new NotificationCreateDto
            {
                UserId = goodsReceiptNote.PurchaseOder.AssignTo,
                Title = "Phiếu nhập kho bị từ chối",
                Content = $"Phiếu nhập kho {goodsReceiptNote.GoodsReceiptNoteId} được yêu cầu kiểm tra lại.",
                EntityId = goodsReceiptNote.PurchaseOderId,
                EntityType = NotificationEntityType.GoodsReceiptNote,
                Category = NotificationCategory.Important
            };
            await _notificationService.CreateNotification(notificationToCreate);
        }

        private async Task EnsureRolePermission(int roleType, int? userId, string missingRoleMessage, string noPermissionMessage)
        {
            var users = await _userRepository.GetUsersByRoleId(roleType);

            if (!users.Any())
                throw new Exception(missingRoleMessage.ToMessageForUser(), default);

            if (userId == null || !users.Any(user => user.UserId == userId))
                throw new Exception(noPermissionMessage.ToMessageForUser(), default);
        }
    }
}
