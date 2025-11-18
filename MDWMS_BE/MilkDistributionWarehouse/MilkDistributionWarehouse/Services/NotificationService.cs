using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface INotificationService
    {
        Task<(string, List<NotificationDto>?)> GetNotifications(int? userId);
        Task<(string, NotificationDto?)> GetNotificationDetail(Guid notificationId, int? userId);
        Task<string> MarkAsRead(NotificationMarkAsReadDto dto, int? userId);
        Task<string> MarkAllAsRead(int? userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public NotificationService(INotificationRepository notificationRepository, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<(string, List<NotificationDto>?)> GetNotifications(int? userId)
        {
            if (userId == null) return ("Current user id is null", null);

            var notifications = await _notificationRepository.GetNotificationsByUserId(userId);

            var result = _mapper.Map<List<NotificationDto>>(notifications);
            return ("", result);
        }

        public async Task<(string, NotificationDto?)> GetNotificationDetail(Guid notificationId, int? userId)
        {
            if (notificationId == Guid.Empty) return ("Notification id is null", null);

            var notification = await _notificationRepository.GetNotificationById(notificationId, userId);
            if (notification == null) return ("Không tìm thấy thông báo.".ToMessageForUser(), null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();
                notification.Status = NotificationStatus.Read;
                await _notificationRepository.UpdateNotification(notification);
                await _unitOfWork.CommitTransactionAsync();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
            }

            return ("", _mapper.Map<NotificationDto>(notification));
        }

        public async Task<string> MarkAllAsRead(int? userId)
        {
            if (userId == null) return "Current user id is null";

            var unreadNotifications = await _notificationRepository.GetUnreadNotificationsByUserId(userId);
            if (unreadNotifications.IsNullOrEmpty()) return "";

            try
            {
                await _unitOfWork.BeginTransactionAsync();
                foreach (var notification in unreadNotifications)
                {
                    notification.Status = NotificationStatus.Read;
                }
                await _notificationRepository.UpdateNotifications(unreadNotifications);
                await _unitOfWork.CommitTransactionAsync();
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi khi cập nhật thông báo.".ToMessageForUser();
            }
        }

        public async Task<string> MarkAsRead(NotificationMarkAsReadDto dto,int? userId)
        {
            if (userId == null) return "Current user id is null";

            var notificationsToUpdate = await _notificationRepository.GetNotificationsByIds(dto.NotificationIds, userId);
            if (notificationsToUpdate.IsNullOrEmpty()) return "";

            var unreadNotifications = notificationsToUpdate.Where(n => n.Status == NotificationStatus.Unread).ToList();
            if (unreadNotifications.IsNullOrEmpty()) return "";

            try
            {
                await _unitOfWork.BeginTransactionAsync();
                foreach (var notification in unreadNotifications)
                {
                    notification.Status = NotificationStatus.Read;
                }
                await _notificationRepository.UpdateNotifications(unreadNotifications);
                await _unitOfWork.CommitTransactionAsync();
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi khi cập nhật thông báo.".ToMessageForUser();
            }
        }
    }
}
