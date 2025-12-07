using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface ISalesOrderService
    {
        Task<(string, PageResult<T>?)> GetSalesOrderList<T>(PagedRequest request, int? userId);
        Task<(string, SalesOrderDetailDto?)> GetSalesOrderDetail(string? saleOrderId);
        Task<(string, SalesOrderCreateDto?)> CreateSalesOrder(SalesOrderCreateDto salesOrderCreate, int? userId);
        Task<(string, SalesOrderUpdateDto?)> UpdateSalesOrder(SalesOrderUpdateDto salesOrderUpdate, int? userId);
        Task<(string, T?)> UpdateStatusSalesOrder<T>(T salesOrderUpdateStatus, int? userId) where T : SaleSOrderUpdateStatusDto;
        Task<string> DeleteSalesOrder(string? salesOrderId, int? userId);
    }


    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly ISalesOrderDetailRepository _salesOrderDetailRepository;
        private readonly IRetailerRepository _retailerRepository;
        private readonly IGoodsRepository _goodsRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public SalesOrderService(ISalesOrderRepository salesOrderRepository,
                                 ISalesOrderDetailRepository salesOrderDetailRepository,
                                 IRetailerRepository retailerRepository,
                                 IGoodsRepository goodsRepository,
                                 IUserRepository userRepository,
                                 INotificationService notificationService,
                                 IUnitOfWork unitOfWork,
                                 IMapper mapper)
        {
            _salesOrderRepository = salesOrderRepository;
            _salesOrderDetailRepository = salesOrderDetailRepository;
            _retailerRepository = retailerRepository;
            _goodsRepository = goodsRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<T>?)> GetSalesOrderList<T>(PagedRequest request, int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null || user.Roles.IsNullOrEmpty()) return ("User is not valid", null);
            var userRoles = user.Roles.Select(r => r.RoleId).ToList();
            var salesOrders = _salesOrderRepository.GetAllSalesOrders();

            if (userRoles.Contains(RoleType.SalesRepresentative))
                salesOrders = salesOrders.Where(s => s.Status != null &&
                                                    (s.Status != SalesOrderStatus.Draft || (s.Status == SalesOrderStatus.Draft && s.CreatedBy == userId)));

            if (userRoles.Contains(RoleType.SaleManager))
                salesOrders = salesOrders.Where(s => s.Status != null && s.Status != SalesOrderStatus.Draft);

            if (userRoles.Contains(RoleType.WarehouseManager))
            {
                int[] statusAllowed = [SalesOrderStatus.Approved, SalesOrderStatus.AssignedForPicking, SalesOrderStatus.Picking, SalesOrderStatus.Completed];
                salesOrders = salesOrders.Where(s => s.Status != null && statusAllowed.Contains((int)s.Status));
            }

            if (userRoles.Contains(RoleType.WarehouseStaff))
            {
                int[] statusAllowed = [SalesOrderStatus.AssignedForPicking, SalesOrderStatus.Picking, SalesOrderStatus.Completed];
                salesOrders = salesOrders.Where(s => s.Status != null && statusAllowed.Contains((int)s.Status) && s.AssignTo == userId);
            }

            if (request.Filters != null && request.Filters.Any())
            {
                var fromDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "fromdate");
                var toDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "todate");
                DateOnly.TryParse(fromDate.Value, out DateOnly startDate);
                DateOnly.TryParse(toDate.Value, out DateOnly endDate);
                salesOrders = salesOrders.Where(s => (startDate == default || s.EstimatedTimeDeparture >= startDate) &&
                                                     (endDate == default || s.EstimatedTimeDeparture <= endDate));
                if (fromDate.Key != null) request.Filters.Remove(fromDate.Key);
                if (toDate.Key != null) request.Filters.Remove(toDate.Key);
            }

            var salesOrderDtos = salesOrders.ProjectTo<T>(_mapper.ConfigurationProvider);
            var result = await salesOrderDtos.ToPagedResultAsync(request);
            if (!result.Items.Any())
                return ("Danh sách đơn bán hàng trống.".ToMessageForUser(), null);

            return ("", result);
        }

        public async Task<(string, SalesOrderDetailDto?)> GetSalesOrderDetail(string? saleOrderId)
        {
            if (saleOrderId == null) return ("SaleOrderId is invalid.", null);
            var salesOrder = await _salesOrderRepository.GetSalesOrderById(saleOrderId);
            if (salesOrder == null) return ("Không tìm thấy đơn bán hàng này.".ToMessageForUser(), null);

            var salesOrderDetail = _mapper.Map<SalesOrderDetailDto>(salesOrder);
            return ("", salesOrderDetail);
        }

        public async Task<(string, SalesOrderCreateDto?)> CreateSalesOrder(SalesOrderCreateDto salesOrderCreate, int? userId)
        {
            if (salesOrderCreate == null) return ("Data sales order create is null.", null);

            var retailer = await _retailerRepository.GetRetailerByRetailerId(salesOrderCreate.RetailerId ?? 0);
            if (retailer == null) return ("Nhà bán lẻ không hợp lệ.".ToMessageForUser(), null);
            if (retailer.Status == CommonStatus.Inactive) return ("Nhà bán lẻ này không còn hoạt động.".ToMessageForUser(), null);

            if (salesOrderCreate.EstimatedTimeDeparture < DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày giao hàng không thể trong quá khứ.".ToMessageForUser(), null);

            if (salesOrderCreate.SalesOrderItemDetailCreateDtos.IsNullOrEmpty())
                return ("Danh sách hàng hóa không được bỏ trống.".ToMessageForUser(), null);

            var itemsToCheck = _mapper.Map<List<SalesOrderDetail>>(salesOrderCreate.SalesOrderItemDetailCreateDtos);
            var message = await ValidateSalesOrderItems(itemsToCheck);
            if (message.Length > 0) return (message, null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var salesOrder = _mapper.Map<SalesOrder>(salesOrderCreate);
                salesOrder.SalesOrderId = PrimaryKeyUtility.GenerateKey("RET", "SO");
                salesOrder.CreatedBy = userId;
                await _salesOrderRepository.CreateSalesOrder(salesOrder);

                await _unitOfWork.CommitTransactionAsync();
                return ("", salesOrderCreate);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Lưu đơn hàng thất bại.".ToMessageForUser(), null);
            }
        }

        public async Task<(string, SalesOrderUpdateDto?)> UpdateSalesOrder(SalesOrderUpdateDto salesOrderUpdate, int? userId)
        {
            if (salesOrderUpdate == null) return ("Data sales order update is null.", null);

            var retailer = await _retailerRepository.GetRetailerByRetailerId(salesOrderUpdate.RetailerId ?? 0);
            if (retailer == null) return ("Nhà bán lẻ không hợp lệ.".ToMessageForUser(), null);
            if (retailer.Status == CommonStatus.Inactive) return ("Nhà bán lẻ này không còn hoạt động.".ToMessageForUser(), null);

            if (salesOrderUpdate.EstimatedTimeDeparture < DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày giao hàng không thể trong quá khứ.".ToMessageForUser(), null);

            if (salesOrderUpdate.SalesOrderItemDetailUpdateDtos.IsNullOrEmpty())
                return ("Danh sách hàng hóa không được bỏ trống.".ToMessageForUser(), null);

            var salesOrderExist = await _salesOrderRepository.GetSalesOrderById(salesOrderUpdate.SalesOrderId);
            if (salesOrderExist == null) return ("Sales order exist is null", null);

            if (salesOrderExist.Status != SalesOrderStatus.Draft && salesOrderExist.Status != SalesOrderStatus.Rejected)
                return ("Chỉ được cập nhật khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser(), null);

            if (salesOrderExist.CreatedBy != userId) return ("Current User has no permission to update.", null);

            var itemsToCheck = _mapper.Map<List<SalesOrderDetail>>(salesOrderUpdate.SalesOrderItemDetailUpdateDtos);
            var message = await ValidateSalesOrderItems(itemsToCheck);
            if (message.Length > 0) return (message, null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                _mapper.Map(salesOrderUpdate, salesOrderExist);

                var updateDetails = salesOrderUpdate.SalesOrderItemDetailUpdateDtos;
                var existingDetails = salesOrderExist.SalesOrderDetails.ToList();

                existingDetails.ForEach(ex =>
                {
                    if (updateDetails != null && !updateDetails.Any(up => up.SalesOrderDetailId == ex.SalesOrderDetailId))
                        _salesOrderDetailRepository.Remove(ex);
                });

                updateDetails.ForEach(updateDetail =>
                {
                    var existingDetail = existingDetails?.FirstOrDefault(ex => ex.SalesOrderDetailId == updateDetail.SalesOrderDetailId);
                    if (existingDetail != null)
                    {
                        _mapper.Map(updateDetail, existingDetail);
                    }
                    else
                    {
                        var newDetail = _mapper.Map<SalesOrderDetail>(updateDetail);
                        salesOrderExist.SalesOrderDetails.Add(newDetail);
                    }
                });

                await _salesOrderRepository.UpdateSalesOrder(salesOrderExist);

                await _unitOfWork.CommitTransactionAsync();
                return ("", salesOrderUpdate);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Cập nhật đơn hàng thất bại.".ToMessageForUser(), null);
            }
        }

        public async Task<string> DeleteSalesOrder(string? salesOrderId, int? userId)
        {
            if (salesOrderId == null) return "SalesOrderId is invalid.";

            var salesOrderExist = await _salesOrderRepository.GetSalesOrderById(salesOrderId);
            if (salesOrderExist == null) return "Sales order exist is null";

            if (salesOrderExist.CreatedBy != userId) return "Current User has no permission to delete.";

            if (salesOrderExist.Status != SalesOrderStatus.Draft)
                return "Chỉ những đơn trạng thái Nháp mới có thể xóa.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var item in salesOrderExist.SalesOrderDetails)
                {
                    await _salesOrderDetailRepository.Remove(item);
                }

                await _salesOrderRepository.DeleteSalesOrder(salesOrderExist);

                await _unitOfWork.CommitTransactionAsync();
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Xoá đơn hàng thất bại.".ToMessageForUser();
            }
        }

        public async Task<(string, T?)> UpdateStatusSalesOrder<T>(T salesOrderUpdateStatus, int? userId)
            where T : SaleSOrderUpdateStatusDto
        {
            var salesOrder = await _salesOrderRepository.GetSalesOrderById(salesOrderUpdateStatus.SalesOrderId);
            if (salesOrder == null) return ("Sales order exist is null", null);

            int? previousAssignee = null;
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (salesOrderUpdateStatus is SalesOrderPendingApprovalDto)
                {
                    if (salesOrder.Status != SalesOrderStatus.Draft && salesOrder.Status != SalesOrderStatus.Rejected)
                        return ("Chỉ được nộp đơn khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser(), null);
                    if (salesOrder.CreatedBy != userId) return ("Current User has no permission to update.", null);
                    
                    var message = await ValidateSalesOrderItems(salesOrder.SalesOrderDetails.ToList());
                    if (message.Length>0) return (message, null);

                    message = await CheckPendingSalesOrderValidation(salesOrder);
                    if (message.Length > 0) return (message, null);

                    salesOrder.Status = SalesOrderStatus.PendingApproval;
                }

                if (salesOrderUpdateStatus is SalesOrderRejectDto rejectDto)
                {
                    if (rejectDto == null) return ("SalesOrderRejectDto is not valid", null);
                    if (salesOrder.Status != SalesOrderStatus.PendingApproval)
                        return ("Chỉ được từ chối khi đơn hàng ở trạng thái Chờ duyệt.".ToMessageForUser(), null);
                    salesOrder.Status = SalesOrderStatus.Rejected;
                    salesOrder.ApprovalBy = userId;
                    salesOrder.RejectionReason = rejectDto.RejectionReason;
                    salesOrder.ApprovalAt = DateTimeUtility.Now();
                }

                if (salesOrderUpdateStatus is SalesOrderApprovalDto)
                {
                    if (salesOrder.Status != SalesOrderStatus.PendingApproval)
                        return ("Chỉ được duyệt khi đơn hàng ở trạng thái Chờ duyệt.".ToMessageForUser(), null);
                    salesOrder.Status = SalesOrderStatus.Approved;
                    salesOrder.ApprovalBy = userId;
                    salesOrder.RejectionReason = "";
                    salesOrder.ApprovalAt = DateTimeUtility.Now();
                }

                if (salesOrderUpdateStatus is SalesOrderAssignedForPickingDto assignedForPickingDto)
                {
                    if (salesOrder.Status != SalesOrderStatus.Approved && salesOrder.Status != SalesOrderStatus.AssignedForPicking)
                        return ("Chỉ được phân công khi đơn hàng ở trạng thái Đã duyệt hoặc Đã phân công".ToMessageForUser(), null);
                    salesOrder.Status = SalesOrderStatus.AssignedForPicking;
                    salesOrder.AcknowledgedBy = userId;
                    previousAssignee = salesOrder.AssignTo;
                    salesOrder.AssignTo = assignedForPickingDto.AssignTo;
                    salesOrder.AcknowledgeAt = DateTimeUtility.Now();
                }

                salesOrder.UpdateAt = DateTimeUtility.Now();
                await _salesOrderRepository.UpdateSalesOrder(salesOrder);
                await _unitOfWork.CommitTransactionAsync();

                await HandleStatusChangeNotification(salesOrder, previousAssignee);

                return ("", salesOrderUpdateStatus);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Cập nhật trạng thái đơn hàng thất bại.".ToMessageForUser(), null);
            }
        }

        private async Task<string> ValidateSalesOrderItems(List<SalesOrderDetail> itemsToCheck)
        {
            if (itemsToCheck == null || !itemsToCheck.Any()) return "";

            var goodsIds = itemsToCheck.Select(x => x.GoodsId ?? 0).Distinct().ToList();

            var goodsList = await _goodsRepository.GetGoodsForSalesOrder(goodsIds);

            var committedList = await _salesOrderRepository.GetCommittedSaleOrderQuantities(goodsIds);

            foreach (var item in itemsToCheck)
            {
                var goods = goodsList.FirstOrDefault(s =>
                    s.Goods?.GoodsId == item.GoodsId &&
                    s.GoodsPacking?.GoodsPackingId == item.GoodsPackingId);

                var totalOnHand = goods != null ? goods.TotalPackageQuantity : 0;

                var totalCommitted = committedList
                    .Where(c => c.GoodsId == item.GoodsId && c.GoodsPackingId == item.GoodsPackingId)
                    .Sum(c => c.PackageQuantity ?? 0);

                var availableQuantity = totalOnHand - totalCommitted;

                if (item.PackageQuantity > availableQuantity)
                {
                    var goodsName = goods?.Goods?.GoodsName ?? $"ID {item.GoodsId}";
                    return $"Sản phẩm '{goodsName}' không đủ số lượng." +
                           $"Yêu cầu: {item.PackageQuantity}, Khả dụng: {availableQuantity} " +
                           $"(Tồn kho: {totalOnHand}, Đang giữ chỗ: {totalCommitted})".ToMessageForUser();
                }
            }

            return "";
        }

        private async Task<string> CheckPendingSalesOrderValidation(SalesOrder salesOrderUpdate)
        {

            var pendingSalesOrders = _salesOrderRepository.GetListSalesOrdersByStatus(SalesOrderStatus.PendingApproval);
            var hasPendingSaleOrder = await pendingSalesOrders.AnyAsync(s => s.RetailerId == salesOrderUpdate.RetailerId
                && s.EstimatedTimeDeparture == salesOrderUpdate.EstimatedTimeDeparture);
            if (hasPendingSaleOrder) return "Không thể gửi duyệt.Nhà bán lẻ này đã có một đơn hàng khác đang chờ duyệt cho cùng ngày giao dự kiến.".ToMessageForUser();

            var approvalSalesOrdersQuery = _salesOrderRepository.GetListSalesOrdersByStatus(SalesOrderStatus.Approved);
            var potentialMatches = await approvalSalesOrdersQuery
                                    .Where(s => s.RetailerId == salesOrderUpdate.RetailerId
                                                && s.EstimatedTimeDeparture == salesOrderUpdate.EstimatedTimeDeparture
                                                && s.SalesOrderDetails.Count == salesOrderUpdate.SalesOrderDetails.Count)
                                    .ToListAsync();
            var hasApprovalSaleOrder = potentialMatches.Any(s =>
                                        AreDetailListsEqual(s.SalesOrderDetails, salesOrderUpdate.SalesOrderDetails));
            if (hasApprovalSaleOrder) return "Không thể gửi duyệt vì đơn hàng này trùng lặp hoàn toàn với một đơn hàng đã được duyệt trước đó.".ToMessageForUser();

            return "";
        }

        private bool AreDetailListsEqual(ICollection<SalesOrderDetail> list1, ICollection<SalesOrderDetail> list2)
        {
            if (list1.Count != list2.Count) return false;

            var dictionary1 = list1
                .GroupBy(d => (d.GoodsId, d.GoodsPackingId, d.PackageQuantity))
                .ToDictionary(g => g.Key, g => g.Count());

            var dictionary2 = list2
                .GroupBy(d => (d.GoodsId, d.GoodsPackingId, d.PackageQuantity))
                .ToDictionary(g => g.Key, g => g.Count());

            if (dictionary1.Count != dictionary2.Count) return false;

            return dictionary1.All(kvp =>
                dictionary2.TryGetValue(kvp.Key, out var count) && count == kvp.Value);
        }

        private async Task HandleStatusChangeNotification(SalesOrder salesOrder, int? previousAssignee)
        {
            var notificationsToCreate = new List<NotificationCreateDto>();

            switch (salesOrder.Status)
            {
                case SalesOrderStatus.PendingApproval:
                    var saleManagers = await _userRepository.GetUsersByRoleId(RoleType.SaleManager);
                    foreach (var manager in saleManagers ?? new List<User>())
                    {
                        notificationsToCreate.Add(new NotificationCreateDto()
                        {
                            UserId = manager.UserId,
                            Title = "Đơn bán hàng mới chờ duyệt",
                            Content = $"Đơn bán hàng bán '{salesOrder.SalesOrderId}' vừa được gửi và đang chờ bạn duyệt.",
                            EntityType = NotificationEntityType.SaleOrder,
                            EntityId = salesOrder.SalesOrderId
                        });
                    }
                    break;

                case SalesOrderStatus.Approved:
                    var warehouseManagers = await _userRepository.GetUsersByRoleId(RoleType.WarehouseManager);
                    foreach (var manager in warehouseManagers ?? new List<User>())
                    {
                        notificationsToCreate.Add(new NotificationCreateDto()
                        {
                            UserId = manager.UserId,
                            Title = "Đơn bán hàng đã được duyệt",
                            Content = $"Đơn bán hàng '{salesOrder.SalesOrderId}' đã được duyệt và sẵn sàng để phân công soạn hàng.",
                            EntityType = NotificationEntityType.SaleOrder,
                            EntityId = salesOrder.SalesOrderId
                        });
                    }
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = salesOrder.CreatedBy,
                        Title = "Đơn bán hàng đã được duyệt",
                        Content = $"Đơn bán hàng '{salesOrder.SalesOrderId}' đã được duyệt.",
                        EntityType = NotificationEntityType.SaleOrder,
                        EntityId = salesOrder.SalesOrderId
                    });
                    break;

                case SalesOrderStatus.Rejected:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = salesOrder.CreatedBy,
                        Title = "Đơn bán hàng của bạn bị từ chối",
                        Content = $"Đơn bán hàng '{salesOrder.SalesOrderId}' đã bị từ chối. Lý do: {salesOrder.RejectionReason}",
                        EntityType = NotificationEntityType.SaleOrder,
                        EntityId = salesOrder.SalesOrderId,
                        Category = NotificationCategory.Important
                    });
                    break;

                case SalesOrderStatus.AssignedForPicking:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = salesOrder.AssignTo,
                        Title = "Bạn được phân công một đơn hàng mới",
                        Content = $"Bạn vừa được phân công để soạn hàng cho đơn bán hàng '{salesOrder.SalesOrderId}'.",
                        EntityType = NotificationEntityType.SaleOrder,
                        EntityId = salesOrder.SalesOrderId,
                        Category = NotificationCategory.Important
                    });

                    if (previousAssignee != null)
                    {
                        notificationsToCreate.Add(new NotificationCreateDto()
                        {
                            UserId = previousAssignee,
                            Title = "Đơn bán hàng đã gỡ phân công",
                            Content = $"Bạn không còn được phân công nhận đơn bán hàng '{salesOrder.SalesOrderId}'.",
                            EntityType = NotificationEntityType.SaleOrder,
                            EntityId = salesOrder.SalesOrderId,
                            Category = NotificationCategory.Important
                        });
                    }
                    break;

                default: break;
            }

            if (notificationsToCreate.Count > 0)
                await _notificationService.CreateNotificationBulk(notificationsToCreate);
        }
    }
}
