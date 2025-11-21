using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IDisposalNoteDetailService
    {
        Task<string> RePickDisposalNoteDetail(RePickDisposalNoteDetailDto rePickDto, int? userId);
        Task<string> RePickDisposalNoteDetailList(List<RePickDisposalNoteDetailDto> rePickList);
    }

    public class DisposalNoteDetailService : IDisposalNoteDetailService
    {
        private readonly IDisposalNoteDetailRepository _disposalNoteDetailRepository;
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DisposalNoteDetailService(IDisposalNoteDetailRepository disposalNoteDetailRepository,
                                         INotificationService notificationService,
                                         IUserRepository userRepository,
                                         IUnitOfWork unitOfWork)
        {
            _disposalNoteDetailRepository = disposalNoteDetailRepository;
            _notificationService = notificationService;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<string> RePickDisposalNoteDetail(RePickDisposalNoteDetailDto rePickDto, int? userId)
        {
            var noteDetail = await _disposalNoteDetailRepository.GetDisposalNoteDetailById(rePickDto.DisposalNoteDetailId);
            if (noteDetail == null)
                return "Không tìm thấy chi tiết phiếu xuất hủy.".ToMessageForUser();

            if (noteDetail.Status != DisposalNoteItemStatus.Picked)
                return "Chỉ có thể thực hiện thao tác này khi hạng mục đang ở trạng thái 'Đã lấy hàng'.".ToMessageForUser();

            var user = await _userRepository.GetUserById(userId);
            if (user == null) return "Current user is null";

            if (user.UserId != noteDetail.DisposalNote.CreatedBy)
                return "Người dùng hiện tại không được phân công cho phiếu xuất hủy này.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                noteDetail.RejectionReason = rePickDto.RejectionReason ?? "";
                noteDetail.Status = DisposalNoteItemStatus.Picking;
                noteDetail.UpdatedAt = DateTime.Now;

                foreach (var pickAllocation in noteDetail.PickAllocations)
                {
                    pickAllocation.Status = PickAllocationStatus.UnScanned;
                }

                await _disposalNoteDetailRepository.UpdateDisposalNoteDetail(noteDetail);
                await _unitOfWork.CommitTransactionAsync();

                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu.".ToMessageForUser();
            }
        }

        public async Task<string> RePickDisposalNoteDetailList(List<RePickDisposalNoteDetailDto> rePickList)
        {
            if (rePickList.IsNullOrEmpty()) return "Danh sách yêu cầu lấy lại hàng không được bỏ trống.".ToMessageForUser();

            if (rePickList.Any(re => string.IsNullOrWhiteSpace(re.RejectionReason)))
                return "Quản lý kho phải cung cấp lý do từ chối cho mỗi mặt hàng lấy lại.".ToMessageForUser();

            var ids = rePickList.Select(r => r.DisposalNoteDetailId).ToList();
            var noteDetails = await _disposalNoteDetailRepository.GetDisposalNoteDetailByIds(ids);

            if (noteDetails?.Count != ids.Count)
                return "Một hoặc nhiều chi tiết phiếu xuất hủy không tìm thấy.".ToMessageForUser();

            if (noteDetails.Any(d => d.Status != DisposalNoteItemStatus.PendingApproval))
                return "Tất cả các hạng mục phải ở trạng thái 'Chờ duyệt' để thực hiện thao tác này.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var noteDetail in noteDetails)
                {
                    noteDetail.RejectionReason = rePickList.First(r => r.DisposalNoteDetailId == noteDetail.DisposalNoteDetailId).RejectionReason ?? "";
                    noteDetail.Status = DisposalNoteItemStatus.Picking;
                    noteDetail.UpdatedAt = DateTime.Now;

                    foreach (var pickAllocation in noteDetail.PickAllocations)
                    {
                        pickAllocation.Status = PickAllocationStatus.UnScanned;
                    }
                }

                var disposalNote = noteDetails.FirstOrDefault()?.DisposalNote;
                if (disposalNote != null && disposalNote.Status == DisposalNoteStatus.PendingApproval)
                {
                    disposalNote.Status = DisposalNoteStatus.Picking;
                    disposalNote.UpdatedAt = DateTime.Now;
                }

                await _disposalNoteDetailRepository.UpdateDisposalNoteDetailList(noteDetails);
                await _unitOfWork.CommitTransactionAsync();

                await HandleDNStatusChangeNotification(disposalNote);
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu.".ToMessageForUser();
            }
        }

        private async Task HandleDNStatusChangeNotification(DisposalNote disposalNote)
        {
            var notificationToCreate = new NotificationCreateDto()
            {
                UserId = disposalNote.DisposalRequest.CreatedBy,
                Title = "Yêu cầu lấy lại hàng đơn xuất hủy",
                Content = $"Đơn xuất hủy '{disposalNote.DisposalNoteId}' có hàng hóa mà quản lý kho yêu cầu bạn lấy lại hàng",
                EntityType = NotificationEntityType.DisposalNote,
                EntityId = disposalNote.DisposalRequestId
            };

            await _notificationService.CreateNotification(notificationToCreate);
        }
    }
}
