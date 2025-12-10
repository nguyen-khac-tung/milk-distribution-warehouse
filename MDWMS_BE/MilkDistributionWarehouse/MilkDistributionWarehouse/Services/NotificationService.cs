using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Hubs;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface INotificationService
    {
        Task CreateNotification(NotificationCreateDto notificationCreateDto);
        Task CreateNotificationBulk(IEnumerable<NotificationCreateDto> notificationList);
        Task<(string, List<NotificationDto>?)> GetNotifications(int? userId);
        Task<(string, NotificationDetailDto?)> GetNotificationDetail(Guid notificationId, int? userId);
        Task<string> MarkAsRead(NotificationMarkAsReadDto dto, int? userId);
        Task<string> MarkAllAsRead(int? userId);
        Task CreateNotificationNoTransaction(NotificationCreateDto notificationCreateDto);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepositoy;
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IGoodsReceiptNoteRepository _goodsReceiptNoteRepository;
        private readonly IGoodsIssueNoteRepository _goodsIssueNoteRepository;
        private readonly IDisposalRequestRepository _disposalRequestRepository;
        private readonly IDisposalNoteRepository _disposalNoteRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public NotificationService(INotificationRepository notificationRepository,
                                   IPurchaseOrderRepositoy purchaseOrderRepositoy,
                                   ISalesOrderRepository salesOrderRepository,
                                   IGoodsReceiptNoteRepository goodsReceiptNoteRepository,
                                   IGoodsIssueNoteRepository goodsIssueNoteRepository,
                                   IDisposalRequestRepository disposalRequestRepository,
                                   IDisposalNoteRepository disposalNoteRepository,
                                   IStocktakingSheetRepository stocktakingSheetRepository,
                                   IStocktakingAreaRepository stocktakingAreaRepository,
                                   IHubContext<NotificationHub> hubContext,
                                   IUnitOfWork unitOfWork,
                                   IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _purchaseOrderRepositoy = purchaseOrderRepositoy;
            _salesOrderRepository = salesOrderRepository;
            _goodsReceiptNoteRepository = goodsReceiptNoteRepository;
            _goodsIssueNoteRepository = goodsIssueNoteRepository;
            _disposalRequestRepository = disposalRequestRepository;
            _disposalNoteRepository = disposalNoteRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _hubContext = hubContext;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task CreateNotification(NotificationCreateDto notificationCreateDto)
        {
            if (notificationCreateDto == null) return;

            var notification = _mapper.Map<Notification>(notificationCreateDto);
            try
            {
                await _unitOfWork.BeginTransactionAsync();
                await _notificationRepository.CreateNotification(notification);
                var notificationDto = _mapper.Map<NotificationDto>(notification);
                await _unitOfWork.CommitTransactionAsync();

                await _hubContext.Clients
                    .Group(notification.UserId.ToString() ?? "")
                    .SendAsync("ReceiveNotification", notificationDto);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
            }
        }

        public async Task CreateNotificationNoTransaction(NotificationCreateDto notificationCreateDto)
        {
            if (notificationCreateDto == null) return;

            var notification = _mapper.Map<Notification>(notificationCreateDto);
            try
            {
                await _notificationRepository.CreateNotification(notification);
                var notificationDto = _mapper.Map<NotificationDto>(notification);

                await _hubContext.Clients
                    .Group(notification.UserId.ToString() ?? "")
                    .SendAsync("ReceiveNotification", notificationDto);
            }
            catch
            {
            }
        }

        public async Task CreateNotificationBulk(IEnumerable<NotificationCreateDto> notificationList)
        {
            if (notificationList.IsNullOrEmpty()) return;

            var notificationEntities = _mapper.Map<List<Notification>>(notificationList);
            try
            {
                await _unitOfWork.BeginTransactionAsync();
                await _notificationRepository.CreateNotifications(notificationEntities);
                await _unitOfWork.CommitTransactionAsync();

                var notificationDtos = _mapper.Map<List<NotificationDto>>(notificationEntities);
                foreach (var notification in notificationDtos)
                {
                    await _hubContext.Clients
                        .Group(notification.UserId.ToString() ?? "")
                        .SendAsync("ReceiveNotification", notification);
                }
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
            }
        }

        public async Task<(string, List<NotificationDto>?)> GetNotifications(int? userId)
        {
            if (userId == null) return ("Current user id is null", null);

            var notifications = await _notificationRepository.GetNotificationsByUserId(userId);

            var result = _mapper.Map<List<NotificationDto>>(notifications);
            return ("", result);
        }

        public async Task<(string, NotificationDetailDto?)> GetNotificationDetail(Guid notificationId, int? userId)
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

            var message = await ValidationNotificationEntityId(notification);
            if (message.Length > 0) return (message, null);

            return ("", _mapper.Map<NotificationDetailDto>(notification));
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

        public async Task<string> MarkAsRead(NotificationMarkAsReadDto dto, int? userId)
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

        private async Task<string> ValidationNotificationEntityId(Notification notification)
        {
            var errorMessage = "Trang này hiện tại không tìm thấy.".ToMessageForUser();

            if (notification.EntityType == null) return errorMessage;

            switch (notification.EntityType)
            {
                case NotificationEntityType.PurchaseOrder:
                    var purchaseOrder = await _purchaseOrderRepositoy.GetPurchaseOrderByPurchaseOrderId(notification.EntityId);
                    if (purchaseOrder == null) return errorMessage;
                    break;

                case NotificationEntityType.SaleOrder:
                    var saleOrder = await _salesOrderRepository.GetSalesOrderById(notification.EntityId);
                    if (saleOrder == null) return errorMessage;
                    break;

                case NotificationEntityType.DisposalRequest:
                    var disposalRequest = await _disposalRequestRepository.GetDisposalRequestById(notification.EntityId);
                    if (disposalRequest == null) return errorMessage;
                    break;

                case NotificationEntityType.GoodsReceiptNote:
                    var goodsReceiptNote = await _goodsReceiptNoteRepository.GetGRNByPurchaseOrderId(notification.EntityId);
                    if (goodsReceiptNote == null) return errorMessage;
                    break;

                case NotificationEntityType.GoodsIssueNote:
                    var goodsIssueNote = await _goodsIssueNoteRepository.GetGINBySalesOrderId(notification.EntityId);
                    if (goodsIssueNote == null) return errorMessage;
                    break;

                case NotificationEntityType.DisposalNote:
                    var disposalNote = await _disposalNoteRepository.GetDNByDisposalRequestId(notification.EntityId);
                    if (disposalNote == null) return errorMessage;
                    break;

                case NotificationEntityType.StocktakingSheet:
                    var stocktakingSheet = await _stocktakingSheetRepository.GetStocktakingSheetById(notification.EntityId);
                    if (stocktakingSheet == null) return errorMessage;
                    break;

                case NotificationEntityType.InventoryReport:
                    break;

                case NotificationEntityType.NoNavigation:
                    break;

                case NotificationEntityType.StocktakingAreaStaff:
                    var stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(notification.EntityId);
                    if (!stocktakingAreas.Any()) return errorMessage;
                    break;

                case NotificationEntityType.StocktakingAreaManager:
                    var stocktakingAreasManager = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(notification.EntityId);
                    if (!stocktakingAreasManager.Any()) return errorMessage;
                    break;

                default: return errorMessage;
            }

            return "";
        }
    }
}
