using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface INotificationRepository
    {
        Task<List<Notification>?> GetNotificationsByUserId(int? userId);
        Task<List<Notification>?> GetUnreadNotificationsByUserId(int? userId);
        Task<Notification?> GetNotificationById(Guid notificationId, int? userId);
        Task<List<Notification>> GetNotificationsByIds(List<Guid> notificationIds, int? userId);
        Task CreateNotification(Notification notification);
        Task CreateNotifications(List<Notification> notifications);
        Task UpdateNotification(Notification notification);
        Task UpdateNotifications(List<Notification> notifications);
    }

    public class NotificationRepository : INotificationRepository
    {
        private readonly WarehouseContext _context;

        public NotificationRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<Notification>?> GetNotificationsByUserId(int? userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && n.Status != NotificationStatus.Deleted)
                .OrderByDescending(n => n.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Notification>?> GetUnreadNotificationsByUserId(int? userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && n.Status == NotificationStatus.Unread)
                .ToListAsync();
        }

        public async Task<Notification?> GetNotificationById(Guid notificationId, int? userId)
        {
            return await _context.Notifications
                .Where(n => n.NotificationId == notificationId 
                    && n.UserId == userId && n.Status != NotificationStatus.Deleted)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Notification>> GetNotificationsByIds(List<Guid> notificationIds, int? userId)
        {
            return await _context.Notifications
                .Where(n => notificationIds.Contains(n.NotificationId)
                   && n.UserId == userId && n.Status != NotificationStatus.Deleted)
                .ToListAsync();
        }

        public async Task CreateNotification(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
        }

        public async Task CreateNotifications(List<Notification> notifications)
        {
            await _context.Notifications.AddRangeAsync(notifications);
        }

        public async Task UpdateNotification(Notification notification)
        {
            _context.Notifications.Update(notification);
            await Task.CompletedTask;
        }

        public async Task UpdateNotifications(List<Notification> notifications)
        {
            _context.Notifications.UpdateRange(notifications);
            await Task.CompletedTask;
        }
    }
}
