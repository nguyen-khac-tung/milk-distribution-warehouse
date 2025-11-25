using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsIssueNoteDetailService
    {
        Task<string> RePickGoodsIssueNoteDetail(RePickGoodsIssueNoteDetailDto rePickGoodsIssue, int? userId);
        Task<string> RePickGoodsIssueNoteDetailList(List<RePickGoodsIssueNoteDetailDto> rePickGoodsIssueList);
    }

    public class GoodsIssueNoteDetailService : IGoodsIssueNoteDetailService
    {
        private readonly IGoodsIssueNoteDetailRepository _goodsIssueNoteDetailRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public GoodsIssueNoteDetailService(IGoodsIssueNoteDetailRepository goodsIssueNoteDetailRepository,
                                           IStocktakingSheetRepository stocktakingSheetRepository,
                                           INotificationService notificationService,
                                           IUserRepository userRepository,
                                           IUnitOfWork unitOfWork)
        {
            _goodsIssueNoteDetailRepository = goodsIssueNoteDetailRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _notificationService = notificationService;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<string> RePickGoodsIssueNoteDetail(RePickGoodsIssueNoteDetailDto rePickGoodsIssue, int? userId)
        {
            var issueNoteDetail = await _goodsIssueNoteDetailRepository.GetGoodsIssueNoteDetailById(rePickGoodsIssue.GoodsIssueNoteDetailId);
            if (issueNoteDetail == null)
                return "Không tìm thấy chi tiết phiếu xuất kho.".ToMessageForUser();

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            if (issueNoteDetail.Status != IssueItemStatus.Picked)
                return "Chỉ có thể thực hiện thao tác này khi hạng mục đang ở trạng thái 'Đã lấy hàng'.".ToMessageForUser();

            var user = await _userRepository.GetUserById(userId);
            if (user == null) return "Current user is null";

            if (user.UserId != issueNoteDetail.GoodsIssueNote.CreatedBy)
                return "Người dùng hiện tại không được phân công cho đơn hàng này.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                issueNoteDetail.RejectionReason = rePickGoodsIssue.RejectionReason ?? "";
                issueNoteDetail.Status = IssueItemStatus.Picking;
                issueNoteDetail.UpdatedAt = DateTime.Now;

                foreach (var pickAllocation in issueNoteDetail.PickAllocations)
                {
                    pickAllocation.Status = PickAllocationStatus.UnScanned;
                }

                await _goodsIssueNoteDetailRepository.UpdateGoodsIssueNoteDetail(issueNoteDetail);
                await _unitOfWork.CommitTransactionAsync();

                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu.".ToMessageForUser();
            }
        }

        public async Task<string> RePickGoodsIssueNoteDetailList(List<RePickGoodsIssueNoteDetailDto> rePickGoodsIssueList)
        {
            if (rePickGoodsIssueList.IsNullOrEmpty()) return "Danh sách lấy lại hàng không được bỏ trống".ToMessageForUser();

            if (rePickGoodsIssueList.Any(re => string.IsNullOrWhiteSpace(re.RejectionReason)))
                return "Quản lý kho phải cung cấp lý do từ chối cho mỗi mặt hàng lấy lại.".ToMessageForUser();

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var ids = rePickGoodsIssueList.Select(r => r.GoodsIssueNoteDetailId).ToList();
            var issueNoteDetails = await _goodsIssueNoteDetailRepository.GetGoodsIssueNoteDetailByIds(ids);

            if (issueNoteDetails?.Count != ids.Count)
                return "Một hoặc nhiều chi tiết phiếu xuất kho không tìm thấy.".ToMessageForUser();

            if (issueNoteDetails.Any(d => d.Status != IssueItemStatus.PendingApproval))
                return "Tất cả các hạng mục phải ở trạng thái 'Chờ duyệt'.".ToMessageForUser();
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var issueNoteDetail in issueNoteDetails)
                {
                    issueNoteDetail.RejectionReason = rePickGoodsIssueList.First(r => r.GoodsIssueNoteDetailId == issueNoteDetail.GoodsIssueNoteDetailId).RejectionReason ?? "";
                    issueNoteDetail.Status = IssueItemStatus.Picking;
                    issueNoteDetail.UpdatedAt = DateTime.Now;

                    foreach (var pickAllocation in issueNoteDetail.PickAllocations)
                    {
                        pickAllocation.Status = PickAllocationStatus.UnScanned;
                    }
                }

                var goodsIssueNote = issueNoteDetails.FirstOrDefault()?.GoodsIssueNote;
                if (goodsIssueNote != null && goodsIssueNote.Status == GoodsIssueNoteStatus.PendingApproval)
                {
                    goodsIssueNote.Status = GoodsIssueNoteStatus.Picking;
                    goodsIssueNote.UpdatedAt = DateTime.Now;
                }

                await _goodsIssueNoteDetailRepository.UpdateGoodsIssueNoteDetailList(issueNoteDetails);
                await _unitOfWork.CommitTransactionAsync();

                await HandleGINStatusChangeNotification(goodsIssueNote);
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu.".ToMessageForUser();
            }
        }

        private async Task HandleGINStatusChangeNotification(GoodsIssueNote goodsIssueNote)
        {
            var notificationsToCreate = new NotificationCreateDto()
            {
                UserId = goodsIssueNote.CreatedBy,
                Title = "Yêu cầu lấy lại hàng đơn xuất kho",
                Content = $"Đơn xuất kho '{goodsIssueNote.GoodsIssueNoteId}' có hàng hóa mà quản lý kho yêu cầu bạn lấy lại hàng",
                EntityType = NotificationEntityType.GoodsIssueNote,
                EntityId = goodsIssueNote.SalesOderId
            };

            await _notificationService.CreateNotification(notificationsToCreate);
        }
    }
}
