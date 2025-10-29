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
        Task<(string, PurchaseOrder)> SubmitPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userName);
        Task<(string, PurchaseOrder)> ApprovePurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userName);
        Task<(string, PurchaseOrder)> RejectPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userName);
        Task<(string, PurchaseOrder)> GoodsReceivedPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId);
        Task<(string, PurchaseOrder?)> AssignForReceivingPurchaseOrder(PurchaseOrderProcessAssignTo purchaseOrderProcess, int? userId);
        Task<(string, PurchaseOrderProcess?)> StartReceivingPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId);
        Task<(string, PurchaseOrder?)> DeletePurchaseOrder(Guid purchaseOrderId, int? userId);
        Task<(string, List<PurchaseOrderDetailBySupplier>?)> GetPurchaseOrderDetailBySupplierId(int supplierId, int? userId);
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

        public async Task<(string, List<PurchaseOrderDetailBySupplier>?)> GetPurchaseOrderDetailBySupplierId(int supplierId, int? userId)
        {
            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId();

            var purchaseOrderMap = purchaseOrderQuery.ProjectTo<PurchaseOrderDetailBySupplier>(_mapper.ConfigurationProvider);

            var purchaseOrderMapDetal = await purchaseOrderMap
                .Where(pod => pod.SupplierId == supplierId
                    && pod.CreatedBy == userId && pod.Status == PurchaseOrderStatus.Draft).ToListAsync();

            if (!purchaseOrderMapDetal.Any())
                return ("PurchaseOrder is not found.", default);

            foreach (var po in purchaseOrderMapDetal)
            {
                var (msg, purchaseOrderDetail) = await _purchaseOrderDetailService.GetPurchaseOrderDetailByPurchaseOrderId(po.PurchaseOderId);
                po.PurchaseOrderDetails = purchaseOrderDetail;
            }

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

        private async Task<(string, PurchaseOrder?)> UpdatePurchaseOrderProcess(PurchaseOrderProcess purchaseOrderProcess, int changeStatus, int? userId, string? userRole, string? userName)
        {
            var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderProcess.PurchaseOrderId);

            if (purchaseOrderExist == null)
                return ("PurchaseOrder is not exist.", default);

            var currentStatus = purchaseOrderExist.Status;

            string message = "";
            PurchaseOrder purchaseOrderUpdate = new PurchaseOrder();

            if (userRole == null)
                return ("User role is required.", default);

            (message, purchaseOrderUpdate) = (userRole) switch
            {
                RoleNames.SalesRepresentative
                   => SubmitPurchaseOrder(purchaseOrderExist, currentStatus, changeStatus, purchaseOrderProcess, userId, userName),
                RoleNames.SalesManager
                   => ApprovalOrRejectPO(purchaseOrderExist, currentStatus, changeStatus, purchaseOrderProcess, userId, userName),
                RoleNames.WarehouseManager
                   => GoodsReceivedPO(purchaseOrderExist, currentStatus, changeStatus, purchaseOrderProcess, userId),
                RoleNames.WarehouseStaff
                   => StartReceivingPO(purchaseOrderExist, currentStatus, changeStatus, purchaseOrderProcess, userId),
                _ => ("User role not supported.", default)
            };

            if (!string.IsNullOrEmpty(message))
                return (message, default);

            if (purchaseOrderUpdate == null)
                return ("The process purchase order is fail", default);

            var resultUpdate = await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrderUpdate);
            if (resultUpdate == null)
                return ("Xử lý trạng thái của đơn đặt hàng thất bại.".ToMessageForUser(), default);

            return ("", resultUpdate);
        }

        public async Task<(string, PurchaseOrder)> SubmitPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userName)
            => await UpdatePurchaseOrderProcess(purchaseOrderProcess, PurchaseOrderStatus.PendingApproval, userId, RoleNames.SalesRepresentative, userName);

        public async Task<(string, PurchaseOrder)> ApprovePurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userName)
            => await UpdatePurchaseOrderProcess(purchaseOrderProcess, PurchaseOrderStatus.Approved, userId, RoleNames.SalesManager, userName);

        public async Task<(string, PurchaseOrder)> RejectPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userName)
            => await UpdatePurchaseOrderProcess(purchaseOrderProcess, PurchaseOrderStatus.Rejected, userId, RoleNames.SalesManager, userName);

        public async Task<(string, PurchaseOrder)> GoodsReceivedPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId)
            => await UpdatePurchaseOrderProcess(purchaseOrderProcess, PurchaseOrderStatus.GoodsReceived, userId, RoleNames.WarehouseManager, null);

        public async Task<(string, PurchaseOrderProcess?)> StartReceivingPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var (msg, purchaseOrder) = await UpdatePurchaseOrderProcess(purchaseOrderProcess, PurchaseOrderStatus.Receiving, userId, RoleNames.WarehouseStaff, null);

                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                var (msg1, grnCreate) = await _goodsReceiptNoteService.CreateGoodsReceiptNote(new GoodsReceiptNoteCreate { PurchaseOderId = purchaseOrder.PurchaseOderId }, userId);

                if (!string.IsNullOrEmpty(msg1))
                    throw new Exception(msg1);

                await _unitOfWork.CommitTransactionAsync();

                return ("", purchaseOrderProcess);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, PurchaseOrder?)> AssignForReceivingPurchaseOrder(PurchaseOrderProcessAssignTo purchaseOrderProcess,
            int? userId)
        {
            var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderProcess.PurchaseOrderId);

            if (purchaseOrderExist == null)
                return ("PurchaseOrder is not exist.", default);

            var currentStatus = purchaseOrderExist.Status;
            var changeStatus = PurchaseOrderStatus.AssignedForReceiving;

            if (currentStatus != PurchaseOrderStatus.GoodsReceived)
                return ("Purchase Orders status is invalid.", default);

            if (purchaseOrderExist.ArrivalConfirmedBy == null)
                return ("Unconfirmed order has arrived.", default);

            if (purchaseOrderExist.ArrivalConfirmedBy != userId)
                return ("No permission assign to staff.", default);

            purchaseOrderExist.Status = changeStatus;
            purchaseOrderExist.AssignTo = purchaseOrderProcess.AssignTo;
            purchaseOrderExist.UpdatedAt = DateTime.Now;

            var resultUpdate = await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrderExist);
            if (resultUpdate == null)
                return ("Giao việc cho nhân viên thất bại".ToMessageForUser(), default);

            return ("", resultUpdate);
        }

        public async Task<(string, PurchaseOrder?)> DeletePurchaseOrder(Guid purchaseOrderId, int? userId)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (Guid.Empty == purchaseOrderId)
                    return ("PurchaseOrderId is invalid.", default);

                var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderId);

                if (purchaseOrderExist == null)
                    return ("PurchaseOrder is not exist.", default);

                if (purchaseOrderExist.CreatedBy != userId)
                    return ("No PO delete permission.", default);

                if (purchaseOrderExist.Status != PurchaseOrderStatus.Draft && purchaseOrderExist.Status != PurchaseOrderStatus.Rejected)
                    throw new Exception("Chỉ được xoá khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.");

                var podExist = await _purchaseOrderDetailRepository.GetPurchaseOrderDetail()
                    .Where(pod => pod.PurchaseOderId == purchaseOrderId)
                    .ToListAsync();

                if (!podExist.Any())
                    return ("List purchase order detail is null.", default);

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

        private (string, PurchaseOrder?) SubmitPurchaseOrder(PurchaseOrder purchaseOrderExist, int? currentStatus,
            int? changeStatus, PurchaseOrderProcess processPO,
            int? userId, string? userName)
        {
            if (purchaseOrderExist.CreatedBy != userId)
                return ("Bạn không có quyền nộp đơn đặt hàng.", default);

            if ((currentStatus != PurchaseOrderStatus.Draft && currentStatus != PurchaseOrderStatus.Rejected)
                || changeStatus != PurchaseOrderStatus.PendingApproval)
                return ("Purchaes Orders status is invalid.", default);

            purchaseOrderExist.Status = PurchaseOrderStatus.PendingApproval;

            purchaseOrderExist.UpdatedAt = DateTime.Now;

            return ("", purchaseOrderExist);
        }

        private (string, PurchaseOrder?) ApprovalOrRejectPO(PurchaseOrder purchaseOrderExist, int? currentStatus,
            int? changeStatus, PurchaseOrderProcess processPO,
            int? userId, string? userName)
        {
            if (currentStatus != PurchaseOrderStatus.PendingApproval ||
                (changeStatus != PurchaseOrderStatus.Approved && changeStatus != PurchaseOrderStatus.Rejected))
                return ("Purchase Orders status is invalid.", default);

            if (changeStatus == PurchaseOrderStatus.Rejected && string.IsNullOrEmpty(processPO.Note))
                return ("Từ chối đơn phải cần có lý do.".ToMessageForUser(), default);

            purchaseOrderExist.Status = changeStatus == PurchaseOrderStatus.Approved
                ? PurchaseOrderStatus.Approved
                : PurchaseOrderStatus.Rejected;

            if (changeStatus == PurchaseOrderStatus.Approved)
            {
                purchaseOrderExist.ApprovalBy = userId;
                purchaseOrderExist.Note = "";
            }
            else
            {
                if (!string.IsNullOrEmpty(processPO.Note))
                    purchaseOrderExist.Note = $"[{userName}] - " + processPO.Note;
            }

            purchaseOrderExist.UpdatedAt = DateTime.Now;

            return ("", purchaseOrderExist);
        }

        private (string, PurchaseOrder?) GoodsReceivedPO(PurchaseOrder purchaseOrderExist, int? currentStatus,
            int? changeStatus, PurchaseOrderProcess processPO,
            int? userId)
        {
            if (currentStatus != PurchaseOrderStatus.Approved ||
                    changeStatus != PurchaseOrderStatus.GoodsReceived)
                return ("Purchase Orders status is invalid.", default);

            if (purchaseOrderExist.ApprovalBy == null)
                return ("Đơn đặt hàng chưa được duyệt.", default);

            purchaseOrderExist.Status = changeStatus;
            purchaseOrderExist.ArrivalConfirmedBy = userId;
            purchaseOrderExist.UpdatedAt = DateTime.Now;

            return ("", purchaseOrderExist);
        }

        private (string, PurchaseOrder?) StartReceivingPO(PurchaseOrder purchaseOrderExist, int? currentStatus,
            int changeStatus, PurchaseOrderProcess purchaseOrderProcess, int? userId)
        {
            if (currentStatus != PurchaseOrderStatus.AssignedForReceiving ||
                    changeStatus != PurchaseOrderStatus.Receiving)
                return ("Purchase Orders status is invalid.", default);

            if (purchaseOrderExist.AssignTo == null)
                return ("Purchase Orders not yet assigned to warehouse staff.", default);

            if (purchaseOrderExist.AssignTo != userId)
                return ("You are not entitled to receive the goods.", default);

            purchaseOrderExist.Status = changeStatus;
            purchaseOrderExist.UpdatedAt = DateTime.Now;

            return ("", purchaseOrderExist);
        }

        private (string, PurchaseOrder?) InspectPO(PurchaseOrder purchaseOrderExist, int? currentStatus,
                int changeStatus, PurchaseOrderProcess purchaseOrderProcess, int? userId)
        {
            if (currentStatus != PurchaseOrderStatus.Receiving ||
                    changeStatus != PurchaseOrderStatus.Inspected)
                return ("Purchase Orders status is invalid.", default);

            if (purchaseOrderExist.AssignTo == null)
                return ("Purchase Orders not yet receive to warehouse staff.", default);

            if (purchaseOrderExist.AssignTo != userId)
                return ("You are not entitled to receive the goods.", default);

            purchaseOrderExist.Status = changeStatus;
            purchaseOrderExist.UpdatedAt = DateTime.Now;

            return ("", purchaseOrderExist);
        }
    }
}
