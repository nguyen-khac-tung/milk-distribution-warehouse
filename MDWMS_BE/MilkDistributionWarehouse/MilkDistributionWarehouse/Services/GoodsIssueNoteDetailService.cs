using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsIssueNoteDetailService
    {
        Task<string> RePickGoodsIssueNoteDetail(RePickGoodsIssueNoteDetailDto rePickGoodsIssue, int? userId);
    }

    public class GoodsIssueNoteDetailService : IGoodsIssueNoteDetailService
    {
        private readonly IGoodsIssueNoteDetailRepository _goodsIssueNoteDetailRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public GoodsIssueNoteDetailService(IGoodsIssueNoteDetailRepository goodsIssueNoteDetailRepository,
                                           IUserRepository userRepository,
                                           IUnitOfWork unitOfWork)
        {
            _goodsIssueNoteDetailRepository = goodsIssueNoteDetailRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<string> RePickGoodsIssueNoteDetail(RePickGoodsIssueNoteDetailDto rePickGoodsIssue, int? userId)
        {
            var issueNoteDetail = await _goodsIssueNoteDetailRepository.GetGoodsIssueNoteDetailById(rePickGoodsIssue.GoodsIssueNoteDetailId);
            if (issueNoteDetail == null)
                return "Không tìm thấy chi tiết phiếu xuất kho.".ToMessageForUser();

            if (issueNoteDetail.Status != IssueItemStatus.Picked && issueNoteDetail.Status != IssueItemStatus.PendingApproval)
                return "Chỉ có thể thực hiện thao tác này khi hạng mục đang ở trạng thái 'Đã lấy hàng' hoặc 'Chờ duyệt'.".ToMessageForUser();

            var user = await _userRepository.GetUserById(userId);
            if (user == null) return "Current user is null";

            if (user.Roles.Any(r => r.RoleId == RoleType.WarehouseStaff) && user.UserId != issueNoteDetail.GoodsIssueNote.CreatedBy)
                return "Người dùng hiện tại không được phân công cho đơn hàng này.".ToMessageForUser();

            if(user.Roles.Any(r => r.RoleId == RoleType.WarehouseManager) && string.IsNullOrWhiteSpace(rePickGoodsIssue.RejectionReason))
                return "Quản lý kho phải cung cấp lý do từ chối.".ToMessageForUser();

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

                if (issueNoteDetail.GoodsIssueNote != null && issueNoteDetail.GoodsIssueNote.Status == GoodsIssueNoteStatus.PendingApproval)
                {
                    issueNoteDetail.GoodsIssueNote.Status = GoodsIssueNoteStatus.Picking;
                    issueNoteDetail.GoodsIssueNote.UpdatedAt = DateTime.Now;
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
    }
}
