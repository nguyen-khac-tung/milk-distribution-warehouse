using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IPurchaseOrderService
    {
        Task<(string, PageResult<PurchaseOrderDtoSaleRepresentative>?)> GetPurchaseOrderSaleRepresentatives(PagedRequest request, int? userId);
        Task<(string, PageResult<PurchaseOrderDtoSaleManager>?)> GetPurchaseOrderSaleManagers(PagedRequest request);
        Task<(string, PageResult<PurchaseOrderDtoWarehouseManager>?)> GetPurchaseOrderWarehouseManager(PagedRequest request);
        Task<(string, PageResult<PurchaseOrderDtoWarehouseStaff>?)> GetPurchaseOrderWarehouseStaff(PagedRequest request, int? userId);
        Task<(string, PurchaseOrderCreate?)> CreatePurchaseOrder(PurchaseOrderCreate create, int? userId, string? userName);
        Task<(string, PurchaseOrdersDetail?)> GetPurchaseOrderDetailById(Guid purchaseOrderId, int? userId, List<string>? roles);
        Task<(string, PurchaseOrderUpdate?)> UpdatePurchaseOrder(PurchaseOrderUpdate update, int? userId);
        Task<(string, T?)> UpdateStatusPurchaseOrder<T>(T purchaseOrdersUpdateStatus, int? userId) where T : PurchaseOrderUpdateStatusDto;
        Task<(string, PurchaseOrder?)> DeletePurchaseOrder(Guid purchaseOrderId, int? userId);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        private readonly IPurchaseOrderDetailService _purchaseOrderDetailService;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IGoodsReceiptNoteService _goodsReceiptNoteService;
        public PurchaseOrderService(IPurchaseOrderRepositoy purchaseOrderRepository, IMapper mapper, IPurchaseOrderDetailService purchaseOrderDetailService,
            IPurchaseOrderDetailRepository purchaseOrderDetailRepository, IUnitOfWork unitOfWork, IGoodsReceiptNoteService goodsReceiptNoteService)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _mapper = mapper;
            _purchaseOrderDetailService = purchaseOrderDetailService;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _unitOfWork = unitOfWork;
            _goodsReceiptNoteService = goodsReceiptNoteService;
        }

        private async Task<(string, PageResult<TDto>?)> GetPurchaseOrdersAsync<TDto>(PagedRequest request, int? userId, string? userRole, params int[] excludedStatuses)
        {
            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrder();

            if (userRole != null)
            {
                switch (userRole)
                {
                    case RoleNames.SalesManager:
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.Status != null
                            && !excludedStatuses.Contains((int)pod.Status));
                        break;
                    case RoleNames.SalesRepresentative:
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.CreatedBy == userId
                            || (pod.CreatedBy != userId && !excludedStatuses.Contains((int)pod.Status)));
                        break;
                    case RoleNames.WarehouseManager:
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.Status != null
                            && !excludedStatuses.Contains((int)pod.Status));
                        break;
                    case RoleNames.WarehouseStaff:
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.AssignTo == userId
                            && (pod.Status != null && excludedStatuses.Contains((int)pod.Status)));
                        break;
                    default:
                        break;
                }
            }

            var projectedQuery = purchaseOrderQuery.ProjectTo<TDto>(_mapper.ConfigurationProvider);

            var items = await projectedQuery.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách mua hàng trống.".ToMessageForUser(), default);

            return ("", items);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoSaleRepresentative>?)> GetPurchaseOrderSaleRepresentatives(PagedRequest request, int? userId)
        {
            var excludedStatus = new int[]
            {
                PurchaseOrderStatus.Draft,
                PurchaseOrderStatus.PendingApproval,
                PurchaseOrderStatus.Rejected,
            };

            var (msg, item) = await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleRepresentative>(request, userId, RoleNames.SalesRepresentative, excludedStatus);

            item?.Items.ForEach(po =>
            {
                if (po.CreatedBy != userId)
                {
                    po.IsDisableDelete = true;
                    po.IsDisableUpdate = true;
                }

            });
            return (msg, item);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoSaleManager>?)> GetPurchaseOrderSaleManagers(PagedRequest request)
        {
            var excludedStatus = new int[]
            {
                PurchaseOrderStatus.Draft
            };

            return await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleManager>(request, null, RoleNames.SalesManager, excludedStatus);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoWarehouseManager>?)> GetPurchaseOrderWarehouseManager(PagedRequest request)
        {
            var excludedStatus = new int[]
                        {
                          PurchaseOrderStatus.Draft,
                          PurchaseOrderStatus.Rejected,
                          PurchaseOrderStatus.PendingApproval,
                        };
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoWarehouseManager>(request, null, RoleNames.WarehouseManager, excludedStatus);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoWarehouseStaff>?)> GetPurchaseOrderWarehouseStaff(PagedRequest request, int? userId)
        {
            var excludedStatus = new int[]
                        {
                          PurchaseOrderStatus.AssignedForReceiving,
                          PurchaseOrderStatus.Receiving,
                          PurchaseOrderStatus.Inspected,
                          PurchaseOrderStatus.Completed
                        };
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoWarehouseStaff>(request, userId, RoleNames.WarehouseStaff, excludedStatus);
        }

        public async Task<(string, PurchaseOrdersDetail?)> GetPurchaseOrderDetailById(Guid purchaseOrderId, int? userId, List<string>? roles)
        {
            var role = roles?.FirstOrDefault();

            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId().Where(pod => pod.PurchaseOderId == purchaseOrderId);

            var purchaseOrderMap = purchaseOrderQuery.ProjectTo<PurchaseOrdersDetail>(_mapper.ConfigurationProvider);

            var purchaseOrderMapDetal = await purchaseOrderMap.FirstOrDefaultAsync();

            if (purchaseOrderMapDetal == null)
                return ("PurchaseOrder is not found.", default);

            bool isDisableButton = false;

            if (role != null)
            {
                switch (role)
                {
                    case RoleNames.SalesRepresentative:
                        isDisableButton = purchaseOrderMapDetal.CreatedBy != userId
                            && purchaseOrderMapDetal.Status != PurchaseOrderStatus.Draft
                            && purchaseOrderMapDetal.Status != PurchaseOrderStatus.Rejected;
                        break;
                    case RoleNames.SalesManager:
                        isDisableButton = purchaseOrderMapDetal.Status != PurchaseOrderStatus.PendingApproval;
                        break;
                    case RoleNames.WarehouseManager:
                        isDisableButton = false;
                        break;
                    case RoleNames.WarehouseStaff:
                        isDisableButton = purchaseOrderMapDetal.AssignTo == userId;
                        break;
                    default:
                        break;
                }
            }

            purchaseOrderMapDetal.IsDisableButton = isDisableButton;

            var (msg, purchaseOrderDetail) = await _purchaseOrderDetailService.GetPurchaseOrderDetailByPurchaseOrderId(purchaseOrderId);

            purchaseOrderMapDetal.PurchaseOrderDetails = purchaseOrderDetail;

            return ("", purchaseOrderMapDetal);
        }

        public async Task<(string, PurchaseOrderCreate?)> CreatePurchaseOrder(PurchaseOrderCreate create, int? userId, string? userName)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();
                if (create == null)
                    return ("PurchaseOrder data create is null.", default);

                if (!string.IsNullOrEmpty(create.Note))
                    create.Note = $"[{userName}] - " + create.Note;

                var purchaseOrderCreate = _mapper.Map<PurchaseOrder>(create);

                purchaseOrderCreate.CreatedBy = userId;

                var resultPOCreate = await _purchaseOrderRepository.CreatePurchaseOrder(purchaseOrderCreate);

                if (resultPOCreate == null)
                    return ("Lưu đơn đặt hàng thất bại.".ToMessageForUser(), default);

                var purchaseOrderDetailCreate = _mapper.Map<List<PurchaseOderDetail>>(create.PurchaseOrderDetailCreate);

                foreach (var poDetail in purchaseOrderDetailCreate)
                {
                    poDetail.PurchaseOderId = resultPOCreate.PurchaseOderId;
                }

                var resultPODetailCreate = await _purchaseOrderDetailRepository.CreatePODetailBulk(purchaseOrderDetailCreate);

                if (resultPODetailCreate == 0)
                    return ("Lưu đơn đặt hàng thất bại.".ToMessageForUser(), default);

                await _unitOfWork.CommitTransactionAsync();

                return ("", create);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Lưu đơn hàng thất bại.".ToMessageForUser(), default);
            }

        }

        public async Task<(string, PurchaseOrderUpdate?)> UpdatePurchaseOrder(PurchaseOrderUpdate update, int? userId)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();
                if (update == null)
                    throw new Exception("PurchaseOrder data update is invalid.");

                var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(update.PurchaseOderId);

                if (purchaseOrderExist == null)
                    throw new Exception("PurchaseOrder is not exist.");

                if (purchaseOrderExist.Status != PurchaseOrderStatus.Draft && purchaseOrderExist.Status != PurchaseOrderStatus.Rejected)
                    throw new Exception("Chỉ được cập nhật khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser());

                if (purchaseOrderExist.CreatedBy != userId)
                    throw new Exception("No PO update permission.");

                var purchaseOrderDetails = await _purchaseOrderDetailRepository.GetPurchaseOrderDetail()
                    .Where(pod => pod.PurchaseOderId == update.PurchaseOderId)
                    .ToListAsync();

                if (!purchaseOrderDetails.Any())
                    throw new Exception("List purchase order detail is empty.");

                var resultDeletePODetail = await _purchaseOrderDetailRepository.DeletePODetailBulk(purchaseOrderDetails);

                if (resultDeletePODetail == 0)
                    throw new Exception("Delete PO Details is failed.");

                var newDetails = _mapper.Map<List<PurchaseOderDetail>>(update.PurchaseOrderDetailUpdates);

                newDetails.ForEach(pod =>
                {
                    pod.PurchaseOderId = update.PurchaseOderId;
                    pod.PurchaseOrderDetailId = 0;
                });

                var resultCreatePODetail = await _purchaseOrderDetailRepository.CreatePODetailBulk(newDetails);

                if (resultCreatePODetail == 0)
                    throw new Exception("Create PO Details is failed.");

                purchaseOrderExist.UpdatedAt = DateTime.Now;
                var resultUpdatePO = await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrderExist);

                if (resultUpdatePO == null)
                    throw new Exception("Update Purchase Order is failed.");

                await _unitOfWork.CommitTransactionAsync();

                return ("", update);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, T?)> UpdateStatusPurchaseOrder<T>(T purchaseOrdersUpdateStatus, int? userId) where T : PurchaseOrderUpdateStatusDto
        {
            var purchaseOrder = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrdersUpdateStatus.PurchaseOrderId);

            if (purchaseOrder == null) return ("Purchase order is not exist.", default);

            var currentStatus = purchaseOrder.Status;

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (purchaseOrdersUpdateStatus is PurchaseOrderPendingApprovalDto)
                {
                    if (currentStatus != PurchaseOrderStatus.Draft && currentStatus != PurchaseOrderStatus.Rejected)
                        throw new Exception("Chỉ được nộp đơn khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser());

                    if (purchaseOrder.CreatedBy != userId)
                        throw new Exception ("Current User has no permission to update.");

                    var msg = await CheckPendingPurchaseOrderValidation(purchaseOrder);

                    if (!string.IsNullOrEmpty(msg)) return (msg, default);

                    purchaseOrder.Status = PurchaseOrderStatus.PendingApproval;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderRejectDto rejectDto)
                {
                    if (rejectDto == null) throw new Exception("PurchaseOrderRejectDto is invalid.");

                    if (currentStatus != PurchaseOrderStatus.PendingApproval)
                        throw new Exception("Chỉ được từ chối đơn khi đơn hàng ở trạng thái Chờ duyệt.".ToMessageForUser());

                    if (string.IsNullOrEmpty(rejectDto.RejectionReason))
                        throw new Exception("Từ chối đơn phải có lý do.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Rejected;
                    purchaseOrder.ApprovalBy = userId;
                    purchaseOrder.RejectionReason = rejectDto.RejectionReason;
                    purchaseOrder.ApprovedAt = DateTime.Now;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderApprovalDto)
                {
                    if (currentStatus != PurchaseOrderStatus.PendingApproval)
                        throw new Exception("Chỉ được duyệt đơn khi đơn hàng ở trạng thái Chờ duyệt.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Approved;
                    purchaseOrder.ApprovalBy = userId;
                    purchaseOrder.RejectionReason = "";
                    purchaseOrder.ApprovedAt = DateTime.Now;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderGoodsReceivedDto)
                {
                    if (currentStatus != PurchaseOrderStatus.Approved)
                        throw new Exception("Chỉ được xác nhận đơn hàng đã đến khi đơn hàng ở trạng thái Đã duyệt.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.GoodsReceived;
                    purchaseOrder.ArrivalConfirmedBy = userId;
                    purchaseOrder.ArrivalConfirmedAt = DateTime.Now;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderAssignedForReceivingDto assignedForReceivingDto)
                {
                    if (currentStatus != PurchaseOrderStatus.GoodsReceived)
                        throw new Exception("Chỉ được phân công đơn hàng khi đơn hàng ở trạng thái đơn hàng Đã xác nhận đến.".ToMessageForUser());

                    var msg = await CheckAssignedForReceivingPO(assignedForReceivingDto.AssignTo);
                    if (!string.IsNullOrEmpty(msg))
                        throw new Exception(msg.ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.AssignedForReceiving;
                    purchaseOrder.AssignTo = assignedForReceivingDto.AssignTo;
                    purchaseOrder.AssignedAt = DateTime.Now;
                }

                if(purchaseOrdersUpdateStatus is PurchaseOrderReceivingDto)
                {
                    if (currentStatus != PurchaseOrderStatus.AssignedForReceiving)
                        throw new Exception ("Chỉ được tiếp nhận đơn hàng khi đơn hàng ở trạng thái Đã phân công.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Receiving;
                    purchaseOrder.UpdatedAt = DateTime.Now;

                    var (msg, grnCreate) = await _goodsReceiptNoteService.CreateGoodsReceiptNote(
                        new GoodsReceiptNoteCreate { PurchaseOderId = purchaseOrder.PurchaseOderId }, userId);
                    
                    if (!string.IsNullOrEmpty(msg))
                        throw new Exception(msg);
                }

                purchaseOrder.UpdatedAt = DateTime.Now;
                await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrder);
                await _unitOfWork.CommitTransactionAsync();

                return ("", purchaseOrdersUpdateStatus);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, PurchaseOrder?)> DeletePurchaseOrder(Guid purchaseOrderId, int? userId)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (Guid.Empty == purchaseOrderId)
                    throw new Exception("PurchaseOrderId is invalid.");

                var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderId);

                if (purchaseOrderExist == null)
                    throw new Exception("PurchaseOrder is not exist.");

                if (purchaseOrderExist.CreatedBy != userId)
                    throw new Exception("No PO delete permission.");

                if (purchaseOrderExist.Status != PurchaseOrderStatus.Draft && purchaseOrderExist.Status != PurchaseOrderStatus.Rejected)
                    throw new Exception("Chỉ được xoá khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.");

                var podExist = await _purchaseOrderDetailRepository.GetPurchaseOrderDetail()
                    .Where(pod => pod.PurchaseOderId == purchaseOrderId)
                    .ToListAsync();

                if (!podExist.Any())
                    throw new Exception("List purchase order detail is null.");

                var resultDeletePOD = await _purchaseOrderDetailRepository.DeletePODetailBulk(podExist);

                if (resultDeletePOD == 0)
                    throw new Exception("Xoá đơn đặt hàng thất bại.");

                var resultDeletePO = await _purchaseOrderRepository.DeletePurchaseOrder(purchaseOrderExist);

                if (resultDeletePO == null)
                    throw new Exception("Xoá đơn đặt hàng thất bại.");

                await _unitOfWork.CommitTransactionAsync();

                return ("", purchaseOrderExist);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}".ToMessageForUser(), default);
            }
        }
        private async Task<string> CheckPendingPurchaseOrderValidation(PurchaseOrder purchaseOrder)
        {
            var purchaseOrders = _purchaseOrderRepository.GetPurchaseOrder().Where(po => po.PurchaseOderId != purchaseOrder.PurchaseOderId);

            var hasPODraft = await purchaseOrders.AnyAsync(po => po.Status == PurchaseOrderStatus.PendingApproval && po.SupplierId == purchaseOrder.SupplierId);

            if (hasPODraft)
                return "Không thể gửi duyệt. Nhà cung cấp này đã có một đơn mua khác đang chờ duyệt.".ToMessageForUser();

            var approvalPurchaseOrderQuery = await purchaseOrders.Where(po => po.Status == PurchaseOrderStatus.Approved
                                    && po.SupplierId == purchaseOrder.SupplierId
                                    && po.PurchaseOderDetails.Count == purchaseOrder.PurchaseOderDetails.Count).ToListAsync();

            var hasApprovalPurchaseOrder = approvalPurchaseOrderQuery.Any(po =>
                                            AreDetailListsPOEqual(po.PurchaseOderDetails, purchaseOrder.PurchaseOderDetails));

            if (hasApprovalPurchaseOrder)
                return "Không thể gửi duyệt vì đơn mua này trùng lặp hoàn toàn với một đơn mua đã được duyệt trước đó.".ToMessageForUser();

            return "";
        }

        private bool AreDetailListsPOEqual(ICollection<PurchaseOderDetail> purchaseOderDetails1, ICollection<PurchaseOderDetail> purchaseOderDetails2)
        {
            if (purchaseOderDetails1.Count != purchaseOderDetails2.Count) return false;

            var dicPOls1 = purchaseOderDetails1.GroupBy(d => (d.GoodsId, d.GoodsPackingId, d.PackageQuantity))
                .ToDictionary(g => g.Key, g => g.Count());

            var dicPOls2 = purchaseOderDetails2.GroupBy(d => (d.GoodsId, d.GoodsPackingId, d.PackageQuantity))
                .ToDictionary(g => g.Key, g => g.Count());

            if (dicPOls1.Count != dicPOls2.Count) return false;

            return dicPOls1.All(kvp => dicPOls2.TryGetValue(kvp.Key, out var count) && count == kvp.Value);
        }

        private async Task<string> CheckAssignedForReceivingPO(int assignTo)
        {
            var hasUserAssignedToOtherReceivingPOAsync = await _purchaseOrderRepository.HasUserAssignedToOtherReceivingPOAsync(assignTo);
            if (hasUserAssignedToOtherReceivingPOAsync)
                return "Không theo phân công cho nhân viên. Nhân viên này đã được phân công cho đơn hàng khác.";

            return "";
        }
    }
}
