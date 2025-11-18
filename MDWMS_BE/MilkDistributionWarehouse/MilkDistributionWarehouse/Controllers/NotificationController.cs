using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [Authorize]
        [HttpGet("GetNotifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var (msg, notifications) = await _notificationService.GetNotifications(User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<NotificationDto>?>.ToResultOk(notifications);
        }

        [Authorize]
        [HttpGet("GetNotificationDetail/{notificationId}")]
        public async Task<IActionResult> GetNotificationDetail(Guid notificationId)
        {
            var (msg, notification) = await _notificationService.GetNotificationDetail(notificationId, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<NotificationDto>.ToResultOk(notification);
        }

        [Authorize]
        [HttpPut("MarkAllAsRead")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var msg = await _notificationService.MarkAllAsRead(User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize]
        [HttpPut("MarkAsRead")]
        public async Task<IActionResult> MarkAsRead(NotificationMarkAsReadDto dto)
        {
            var msg = await _notificationService.MarkAsRead(dto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
