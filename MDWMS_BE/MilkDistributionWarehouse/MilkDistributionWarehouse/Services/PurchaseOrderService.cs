using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Http.HttpResults;
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
        Task<(string, PurchaseOrderCreateResponse?)> CreatePurchaseOrder(PurchaseOrderCreate create, int? userId, string? userName);
        Task<(string, PurchaseOrdersDetail?)> GetPurchaseOrderDetailById(string purchaseOrderId, int? userId, List<string>? roles);
        Task<(string, PurchaseOrderUpdate?)> UpdatePurchaseOrder(PurchaseOrderUpdate update, int? userId);
        Task<(string, T?)> UpdateStatusPurchaseOrder<T>(T purchaseOrdersUpdateStatus, int? userId) where T : PurchaseOrderUpdateStatusDto;
        Task<(string, PurchaseOrder?)> DeletePurchaseOrder(string purchaseOrderId, int? userId);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        private readonly IPurchaseOrderDetailService _purchaseOrderDetailService;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IGoodsReceiptNoteService _goodsReceiptNoteService;
        private readonly IUserRepository _userRepository;
        private readonly IPalletRepository _palletRepository;
        private readonly ISalesOrderRepository _saleOrderRepository;
        private readonly ISupplierRepository _supplierRepository;
        private readonly INotificationService _notificationService;
        private readonly IGoodsRepository _goodRepository;
        public PurchaseOrderService(IPurchaseOrderRepositoy purchaseOrderRepository, IMapper mapper, IPurchaseOrderDetailService purchaseOrderDetailService,
            IPurchaseOrderDetailRepository purchaseOrderDetailRepository, IUnitOfWork unitOfWork, IGoodsReceiptNoteService goodsReceiptNoteService,
            IUserRepository userRepository, IPalletRepository palletRepository,
            ISalesOrderRepository salesOrderRepository, ISupplierRepository supplierRepository,
            INotificationService notificationService, IGoodsRepository goodsRepository)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _mapper = mapper;
            _purchaseOrderDetailService = purchaseOrderDetailService;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _unitOfWork = unitOfWork;
            _goodsReceiptNoteService = goodsReceiptNoteService;
            _userRepository = userRepository;
            _palletRepository = palletRepository;
            _saleOrderRepository = salesOrderRepository;
            _supplierRepository = supplierRepository;
            _notificationService = notificationService;
            _goodRepository = goodsRepository;
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
                PurchaseOrderStatus.Draft
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
                          PurchaseOrderStatus.Approved
                        };
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoWarehouseManager>(request, null, RoleNames.WarehouseManager, excludedStatus);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoWarehouseStaff>?)> GetPurchaseOrderWarehouseStaff(PagedRequest request, int? userId)
        {
            var excludedStatus = new int[]
                        {
                          PurchaseOrderStatus.AwaitingArrival,
                          PurchaseOrderStatus.AssignedForReceiving,
                          PurchaseOrderStatus.Receiving,
                          PurchaseOrderStatus.Inspected,
                          PurchaseOrderStatus.Completed,
                        };
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoWarehouseStaff>(request, userId, RoleNames.WarehouseStaff, excludedStatus);
        }

        public async Task<(string, PurchaseOrdersDetail?)> GetPurchaseOrderDetailById(string purchaseOrderId, int? userId, List<string>? roles)
        {
            var role = roles?.FirstOrDefault();

            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId().Where(pod => pod.PurchaseOderId.Equals(purchaseOrderId));

            var purchaseOrderMap = purchaseOrderQuery.ProjectTo<PurchaseOrdersDetail>(_mapper.ConfigurationProvider);

            var purchaseOrderMapDetal = await purchaseOrderMap.FirstOrDefaultAsync();

            if (purchaseOrderMapDetal == null)
                return ("PurchaseOrder is not found.", default);

            bool isDisableButton = true;
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
                        isDisableButton = purchaseOrderMapDetal.AssignTo != userId;
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

        public async Task<(string, PurchaseOrderCreateResponse?)> CreatePurchaseOrder(PurchaseOrderCreate create, int? userId, string? userName)
        {
            if (create == null)
                return ("PurchaseOrder data create is null.", default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var purchaseOrderCreate = _mapper.Map<PurchaseOrder>(create);

                if (!string.IsNullOrEmpty(create.Note))
                    create.Note = create.Note;

                var supplier = await _supplierRepository.GetSupplierBySupplierId(create.SupplierId);

                if (supplier == null)
                    throw new Exception("Nhà cung cấp không tồn tại.".ToMessageForUser());

                purchaseOrderCreate.PurchaseOderId = PrimaryKeyUtility.GenerateKey(supplier.BrandName ?? "SUP", "PO");
                purchaseOrderCreate.CreatedBy = userId;

                var resultPOCreate = await _purchaseOrderRepository.CreatePurchaseOrder(purchaseOrderCreate);

                if (resultPOCreate == null)
                    throw new Exception("Lưu đơn đặt hàng thất bại.");

                var purchaseOrderDetailCreate = _mapper.Map<List<PurchaseOderDetail>>(create.PurchaseOrderDetailCreate);

                foreach (var poDetail in purchaseOrderDetailCreate)
                {
                    poDetail.PurchaseOderId = resultPOCreate.PurchaseOderId;
                }

                var areInActiveGoods = await _goodRepository.AreInActiveGoods(create.PurchaseOrderDetailCreate);
                if (areInActiveGoods)
                    throw new Exception("Một hoặc nhiều hàng hoá trong đơn đặt hàng không tồn tại hoặc không hoạt động.".ToMessageForUser());

                var resultPODetailCreate = await _purchaseOrderDetailRepository.CreatePODetailBulk(purchaseOrderDetailCreate);

                if (resultPODetailCreate == 0)
                    throw new Exception("Lưu đơn đặt hàng thất bại.");

                await _unitOfWork.CommitTransactionAsync();

                return ("", new PurchaseOrderCreateResponse { PurchaseOderId = resultPOCreate.PurchaseOderId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}".ToMessageForUser(), default);
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

                var purchaseOrderDetails = await _purchaseOrderDetailRepository.GetPurchaseOrderDetailsByPurchaseOrderId(update.PurchaseOderId);

                if (!purchaseOrderDetails.Any())
                    throw new Exception("List purchase order detail is empty.");

                var resultDeletePODetail = await _purchaseOrderDetailRepository.DeletePODetailBulk(purchaseOrderDetails);

                if (resultDeletePODetail == 0)
                    throw new Exception("Delete PO Details is failed.");

                var newDetails = _mapper.Map<List<PurchaseOderDetail>>(update.PurchaseOrderDetailUpdates);

                if (!string.IsNullOrEmpty(update.Note))
                    purchaseOrderExist.Note = update.Note;

                newDetails.ForEach(pod =>
                {
                    pod.PurchaseOderId = update.PurchaseOderId;
                    pod.PurchaseOrderDetailId = 0;
                });

                var areInActiveGoods = await _goodRepository.AreInActiveGoods(_mapper.Map<List<PurchaseOrderDetailCreate>>(update.PurchaseOrderDetailUpdates));
                if (areInActiveGoods)
                    throw new Exception("Một hoặc nhiều hàng hoá trong đơn đặt hàng không tồn tại hoặc không hoạt động.".ToMessageForUser());

                var resultCreatePODetail = await _purchaseOrderDetailRepository.CreatePODetailBulk(newDetails);

                if (resultCreatePODetail == 0)
                    throw new Exception("Create PO Details is failed.");

                purchaseOrderExist.UpdatedAt = DateTimeUtility.Now();
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
            bool isReassignmentAction = false;
            List<int>? removedAssignees = null;
            List<int>? newAssignees = null;
            bool isEstimatedArrivalUpdated = false;

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (purchaseOrdersUpdateStatus is PurchaseOrderPendingApprovalDto)
                {
                    if (currentStatus != PurchaseOrderStatus.Draft && currentStatus != PurchaseOrderStatus.Rejected)
                        throw new Exception("Chỉ được nộp đơn khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser());

                    if (purchaseOrder.CreatedBy != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    var msg = await CheckPendingPurchaseOrderValidation(purchaseOrder, userId);

                    if (!string.IsNullOrEmpty(msg)) throw new Exception(msg);

                    purchaseOrder.Status = PurchaseOrderStatus.PendingApproval;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderRejectDto rejectDto)
                {
                    if (rejectDto == null) throw new Exception("PurchaseOrderRejectDto is invalid.");

                    if (currentStatus != PurchaseOrderStatus.PendingApproval)
                        throw new Exception("Chỉ được từ chối đơn khi đơn hàng ở trạng thái Chờ duyệt.".ToMessageForUser());

                    await EnsureRolePermission(
                        RoleType.SaleManager,
                        userId,
                        "Tài khoản quản lý kinh doanh không tồn tại hoặc đã bị vô hiệu hoá.",
                        "Bạn không có quyền thực hiện chức năng này");

                    if (string.IsNullOrEmpty(rejectDto.RejectionReason))
                        throw new Exception("Từ chối đơn phải có lý do.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Rejected;
                    purchaseOrder.ApprovalBy = userId;
                    purchaseOrder.RejectionReason = rejectDto.RejectionReason;
                    purchaseOrder.ApprovedAt = DateTimeUtility.Now();
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderApprovalDto)
                {
                    if (currentStatus != PurchaseOrderStatus.PendingApproval)
                        throw new Exception("Chỉ được duyệt đơn khi đơn hàng ở trạng thái Chờ duyệt.".ToMessageForUser());

                    await EnsureRolePermission(
                        RoleType.SaleManager,
                        userId,
                        "Tài khoản quản lý kinh doanh không tồn tại hoặc đã bị vô hiệu hoá.",
                        "Bạn không có quyền thực hiện chức năng này");

                    purchaseOrder.Status = PurchaseOrderStatus.Approved;
                    purchaseOrder.ApprovalBy = userId;
                    purchaseOrder.RejectionReason = "";
                    purchaseOrder.ApprovedAt = DateTimeUtility.Now();
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderOrderedDto purchaseOrderOrderedDto)
                {
                    if (currentStatus != PurchaseOrderStatus.Approved)
                        throw new Exception("Chỉ được chuyển trạng thái đã đặt đơn khi đơn mua hàng ở trạng thái Đã duyệt".ToMessageForUser());

                    if (purchaseOrder.CreatedBy != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    var today = DateTimeUtility.Now();
                    if (purchaseOrderOrderedDto.EstimatedTimeArrival < today)
                        throw new Exception("Ngày dự kiến giao hàng phải là ngày trong tương lai.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Ordered;
                    purchaseOrder.EstimatedTimeArrival = purchaseOrderOrderedDto.EstimatedTimeArrival;
                    purchaseOrder.UpdatedAt = DateTimeUtility.Now();
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderOrderedUpdateDto orderOrderedUpdateDto)
                {
                    if (currentStatus != PurchaseOrderStatus.Ordered && currentStatus != PurchaseOrderStatus.AwaitingArrival)
                        throw new Exception("Chỉ được cập nhật ngày dự kiến giao hàng khi đơn mua hàng ở trạng thái Đã đặt hàng hoặc Chờ đến.".ToMessageForUser());

                    if (purchaseOrder.ArrivalConfirmedBy != null)
                        throw new Exception("Đơn hàng đã giao đến. Không thể thay đổi ngày dự kiến giao hàng.".ToMessageForUser());

                    if (purchaseOrder.CreatedBy != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    var today = DateTimeUtility.Now();
                    if (orderOrderedUpdateDto.EstimatedTimeArrival < today)
                        throw new Exception("Ngày dự kiến giao hàng phải là ngày trong tương lai.".ToMessageForUser());

                    if (string.IsNullOrEmpty(orderOrderedUpdateDto.DeliveryDateChangeReason))
                        throw new Exception("Thay đổi ngày dự kiến hàng cần phải có lý do.".ToMessageForUser());

                    purchaseOrder.EstimatedTimeArrival = orderOrderedUpdateDto.EstimatedTimeArrival;
                    purchaseOrder.DeliveryDateChangeReason = orderOrderedUpdateDto.DeliveryDateChangeReason;
                    purchaseOrder.UpdatedAt = DateTimeUtility.Now();
                    isEstimatedArrivalUpdated = true;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderGoodsReceivedDto)
                {
                    await EnsureRolePermission(
                        RoleType.WarehouseManager,
                        userId,
                        "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                        "Bạn không có quyền thực hiện chức năng này");

                    var estimatedTimeArrival = purchaseOrder.EstimatedTimeArrival;
                    var today = DateTimeUtility.Now();

                    if (currentStatus != PurchaseOrderStatus.Ordered && currentStatus != PurchaseOrderStatus.AwaitingArrival)
                        throw new Exception("Chỉ được xác nhận đơn hàng đã đến khi đơn hàng ở trạng thái Đã đặt hàng hoặc Chờ đến.".ToMessageForUser());

                    //if(estimatedTimeArrival != null && estimatedTimeArrival > today)
                    //    throw new Exception("Không thể xác nhận đơn hàng đã đến trước ngày dự kiến giao hàng.");

                    purchaseOrder.Status = currentStatus == PurchaseOrderStatus.AwaitingArrival ?
                        PurchaseOrderStatus.AssignedForReceiving : PurchaseOrderStatus.GoodsReceived;

                    purchaseOrder.ArrivalConfirmedBy = userId;
                    purchaseOrder.DeliveryDateChangeReason = "";
                    purchaseOrder.ArrivalConfirmedAt = DateTimeUtility.Now();
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderAssignedForReceivingDto assignedForReceivingDto)
                {
                    if (currentStatus != PurchaseOrderStatus.GoodsReceived && currentStatus != PurchaseOrderStatus.Ordered)
                        throw new Exception("Chỉ được phân công đơn hàng khi đơn hàng ở trạng thái đơn hàng Đã xác nhận đến hoặc Đã đặt hàng.".ToMessageForUser());

                    if (assignedForReceivingDto.AssignTo <= 0)
                        throw new Exception("Vui lòng chọn nhân viên kho để phân công.".ToMessageForUser());

                    await EnsureRolePermission(
                        RoleType.WarehouseManager,
                        userId,
                        "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                        "Bạn không có quyền thực hiện chức năng này");

                    purchaseOrder.Status = purchaseOrder.ArrivalConfirmedBy == null ?
                        PurchaseOrderStatus.AwaitingArrival : PurchaseOrderStatus.AssignedForReceiving;

                    purchaseOrder.AssignTo = assignedForReceivingDto.AssignTo;
                    purchaseOrder.AssignedAt = DateTimeUtility.Now();
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderReAssignForReceivingDto reAssignForReceivingDto)
                {
                    if (currentStatus != PurchaseOrderStatus.AssignedForReceiving && currentStatus != PurchaseOrderStatus.AwaitingArrival)
                        throw new Exception("Chỉ được phân công lại đơn hàng khi đơn hàng ở trạng thái đơn hàng Đã phân công hoặc Chờ đến.".ToMessageForUser());

                    if (purchaseOrder.AssignTo != null && purchaseOrder.AssignTo == reAssignForReceivingDto.ReAssignTo)
                        throw new Exception("Phải phân công cho người khác khi phân công lại.".ToMessageForUser());

                    await EnsureRolePermission(
                        RoleType.WarehouseManager,
                        userId,
                        "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                        "Bạn không có quyền thực hiện chức năng này");

                    //var msg = await CheckAssignedForReceivingPO(reAssignForReceivingDto.ReAssignTo, purchaseOrder);
                    //if (!string.IsNullOrEmpty(msg))
                    //    throw new Exception(msg.ToMessageForUser());

                    var previousAssignee = purchaseOrder.AssignTo;

                    if (previousAssignee.HasValue)
                    {
                        removedAssignees ??= new List<int>();
                        removedAssignees.Add(previousAssignee.Value);
                    }

                    purchaseOrder.AssignTo = reAssignForReceivingDto.ReAssignTo;
                    purchaseOrder.AssignedAt = DateTimeUtility.Now();

                    newAssignees ??= new List<int>();
                    newAssignees.Add(reAssignForReceivingDto.ReAssignTo);
                    isReassignmentAction = true;
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderReceivingDto)
                {
                    if (currentStatus != PurchaseOrderStatus.AssignedForReceiving)
                        throw new Exception("Chỉ được tiếp nhận đơn hàng khi đơn hàng ở trạng thái Đã phân công.".ToMessageForUser());

                    if (purchaseOrder.AssignTo != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Receiving;
                    purchaseOrder.UpdatedAt = DateTimeUtility.Now();

                    var (msg, grnCreate) = await _goodsReceiptNoteService.CreateGoodsReceiptNote(
                        new GoodsReceiptNoteCreate { PurchaseOderId = purchaseOrder.PurchaseOderId }, userId);

                    if (!string.IsNullOrEmpty(msg))
                        throw new Exception(msg);
                }

                if (purchaseOrdersUpdateStatus is PurchaseOrderCompletedDto)
                {
                    if (currentStatus != PurchaseOrderStatus.Inspected)
                        throw new Exception("Chỉ được Hoàn thành đơn hàng khi đơn hàng ở trạng thái Đã kiểm tra.".ToMessageForUser());

                    if (purchaseOrder.AssignTo != userId)
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    string msg = await CheckCompletedPO(purchaseOrder.GoodsReceiptNotes.FirstOrDefault(g => g.PurchaseOderId.Equals(purchaseOrder.PurchaseOderId)));
                    if (!string.IsNullOrEmpty(msg))
                        throw new Exception(msg.ToMessageForUser());

                    purchaseOrder.Status = PurchaseOrderStatus.Completed;
                    purchaseOrder.UpdatedAt = DateTimeUtility.Now();
                }

                purchaseOrder.UpdatedAt = DateTimeUtility.Now();
                await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrder);
                await _unitOfWork.CommitTransactionAsync();

                await HandleStatusChangeNotification(purchaseOrder, isReassignmentAction, removedAssignees, newAssignees, isEstimatedArrivalUpdated);

                return ("", purchaseOrdersUpdateStatus);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, PurchaseOrder?)> DeletePurchaseOrder(string purchaseOrderId, int? userId)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (string.IsNullOrEmpty(purchaseOrderId))
                    throw new Exception("PurchaseOrderId is invalid.");

                var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderId);

                if (purchaseOrderExist == null)
                    throw new Exception("PurchaseOrder is not exist.");

                if (purchaseOrderExist.CreatedBy != userId)
                    throw new Exception("No PO delete permission.");

                if (purchaseOrderExist.Status != PurchaseOrderStatus.Draft && purchaseOrderExist.Status != PurchaseOrderStatus.Rejected)
                    throw new Exception("Chỉ được xoá khi đơn hàng ở trạng thái Nháp.");

                var podExist = await _purchaseOrderDetailRepository.GetPurchaseOrderDetailsByPurchaseOrderId(purchaseOrderId);

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
        private async Task<string> CheckPendingPurchaseOrderValidation(PurchaseOrder purchaseOrder, int? userId)
        {
            var query = _purchaseOrderRepository.GetPurchaseOrder()
                .Where(po => po.PurchaseOderId != purchaseOrder.PurchaseOderId
                          && po.SupplierId == purchaseOrder.SupplierId);

            var hasPOPendingApproval = await query
                .AnyAsync(po => po.Status == PurchaseOrderStatus.PendingApproval
                             && po.CreatedBy == userId);

            if (hasPOPendingApproval)
                return "Không thể gửi duyệt. Nhà cung cấp này đã có một đơn mua khác đang chờ duyệt."
                    .ToMessageForUser();

            var approvalPurchaseOrders = await query
                .Where(po => po.Status == PurchaseOrderStatus.PendingApproval
                          || po.Status == PurchaseOrderStatus.Approved)
                .Include(po => po.PurchaseOderDetails)
                .ToListAsync();

            var hasApprovalPurchaseOrder = approvalPurchaseOrders.Any(po =>
                AreDetailListsPOEqual(po.PurchaseOderDetails, purchaseOrder.PurchaseOderDetails));

            if (hasApprovalPurchaseOrder)
                return "Không thể gửi duyệt vì đơn mua này trùng lặp hoàn toàn với một đơn mua Đang chờ duyệt/Đã được duyệt trước đó."
                    .ToMessageForUser();

            return "";
        }
        private bool AreDetailListsPOEqual(ICollection<PurchaseOderDetail> d1, ICollection<PurchaseOderDetail> d2)
        {
            if (d1 == null || d2 == null) return false;
            if (d1.Count != d2.Count) return false;

            var dic1 = d1.GroupBy(d => (d.GoodsId, d.GoodsPackingId, d.PackageQuantity))
                         .ToDictionary(g => g.Key, g => g.Count());

            var dic2 = d2.GroupBy(d => (d.GoodsId, d.GoodsPackingId, d.PackageQuantity))
                         .ToDictionary(g => g.Key, g => g.Count());

            return dic1.Count == dic2.Count &&
                   dic1.All(kvp => dic2.TryGetValue(kvp.Key, out var c) && c == kvp.Value);
        }
        private async Task<string> CheckAssignedForReceivingPO(int assignTo, PurchaseOrder purchaseOrder)
        {
            if (assignTo <= 0)
                return "Vui lòng chọn nhân viên kho để phân công.";

            if (assignTo == purchaseOrder.AssignTo)
                return "Vui lòng chọn nhân viên kho khác nhân viên kho hiện tại.";

            var isWarehouseStaff = await _userRepository.GetUsers()
                .AnyAsync(u => u.UserId == assignTo
                && u.Status == CommonStatus.Active
                && u.Roles.Any(r => r.RoleName.Equals("Warehouse Staff")));

            if (!isWarehouseStaff)
                return "Nhân viên được phân công phải là nhân viên kho và đang hoạt động.";

            var isBusyPurchaseOrder = await _purchaseOrderRepository.GetPurchaseOrder()
                    .AnyAsync(po => po.AssignTo == assignTo
                    && (po.Status == PurchaseOrderStatus.AssignedForReceiving
                    || po.Status == PurchaseOrderStatus.Receiving
                    || po.Status == PurchaseOrderStatus.Inspected)
                    && po.PurchaseOderId != purchaseOrder.PurchaseOderId);

            var today = DateOnly.FromDateTime(DateTimeUtility.Now());

            var isBusySaleOrder = await _saleOrderRepository.GetAllSalesOrders()
                .AnyAsync(so => so.AssignTo == assignTo
                && so.EstimatedTimeDeparture == today
                && (so.Status == SalesOrderStatus.AssignedForPicking
                || so.Status == SalesOrderStatus.Picking));

            if (isBusyPurchaseOrder || isBusySaleOrder)
                return "Nhân viên này đã được phân công cho đơn hàng khác.";

            return "";
        }
        private async Task<string> CheckCompletedPO(GoodsReceiptNote grn)
        {
            if (grn.Status != GoodsReceiptNoteStatus.Completed)
                return "Không thể hoàn thành đơn mua hàng. Phiếu nhập kho chưa được hoàn thành.";

            var isAnyDiffActivePallet = await _palletRepository.IsAnyDiffActivePalletByGRNId(grn.GoodsReceiptNoteId);
            if (isAnyDiffActivePallet)
                return "Không thể hoàn thành đơn mua hàng. Hàng hoá chưa được sắp xếp vào pallet.";

            return "";
        }
        private async Task HandleStatusChangeNotification(
            PurchaseOrder purchaseOrder,
            bool isReassignment = false,
            List<int>? removedAssignees = null,
            List<int>? newAssignees = null,
            bool isEstimatedArrivalUpdated = false)
        {
            var notificationStatusChange = new List<NotificationCreateDto>();
            switch (purchaseOrder.Status)
            {
                case PurchaseOrderStatus.PendingApproval:

                    var salesManagers = await _userRepository.GetUsersByRoleId(RoleType.SaleManager);
                    foreach (var salesManager in salesManagers)
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = salesManager.UserId,
                            Title = "Đơn mua hàng chờ duyệt",
                            Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đang chờ duyệt.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId
                        });
                    }
                    break;
                case PurchaseOrderStatus.Approved:
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.CreatedBy,
                        Title = "Đơn mua hàng đã được duyệt",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã được duyệt.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId
                    });
                    break;
                case PurchaseOrderStatus.Rejected:
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.CreatedBy,
                        Title = "Đơn mua hàng bị từ chối",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã bị từ chối.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId,
                        Category = NotificationCategory.Important
                    });
                    break;
                case PurchaseOrderStatus.Ordered:
                    var orderedTitle = isEstimatedArrivalUpdated
                        ? "Ngày giao hàng dự kiến thay đổi"
                        : "Đơn mua hàng đã được đặt";
                    var orderedContent = isEstimatedArrivalUpdated
                        ? $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' vừa cập nhật thời gian giao hàng dự kiến."
                        : $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã được đặt.";
                    var warehouseManagers = await _userRepository.GetUsersByRoleId(RoleType.WarehouseManager);
                    foreach (var warehouseManager in warehouseManagers)
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = warehouseManager.UserId,
                            Title = orderedTitle,
                            Content = orderedContent,
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId
                        });
                    }
                    salesManagers = await _userRepository.GetUsersByRoleId(RoleType.SaleManager);
                    foreach (var salesManager in salesManagers)
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = salesManager.UserId,
                            Title = orderedTitle,
                            Content = orderedContent,
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId
                        });
                    }
                    break;
                case PurchaseOrderStatus.AwaitingArrival:
                    if (!isReassignment)
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = purchaseOrder.AssignTo,
                            Title = "Đơn mua hàng đã được phân công và đang chờ đến",
                            Content = $"Bạn đã được phân công nhận đơn mua hàng '{purchaseOrder.PurchaseOderId}' và đang chờ đến.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId,
                        });
                    }
                    break;
                case PurchaseOrderStatus.GoodsReceived:
                    var warehouseStaffAssign = purchaseOrder.AssignTo;
                    if (warehouseStaffAssign != null)
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = warehouseStaffAssign,
                            Title = "Đơn mua hàng đã được xác nhận đến",
                            Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã được xác nhận đến.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId,
                            Category = NotificationCategory.Important
                        });
                    }

                    notificationStatusChange.AddRange(new List<NotificationCreateDto>
                    {
                        new NotificationCreateDto
                        {
                            UserId = purchaseOrder.CreatedBy,
                            Title = "Đơn mua hàng đã được xác nhận đến",
                            Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã được xác nhận đến.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId,
                        },
                        new NotificationCreateDto
                        {
                            UserId = purchaseOrder.ApprovalBy,
                            Title = "Đơn mua hàng đã được xác nhận đến",
                            Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã được xác nhận đến.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId,
                        }
                    });
                    
                    break;
                case PurchaseOrderStatus.AssignedForReceiving:
                    if (!isReassignment)
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = purchaseOrder.AssignTo,
                            Title = "Đơn mua hàng đã được phân công và đã đến",
                            Content = $"Bạn đã được phân công nhận đơn mua hàng '{purchaseOrder.PurchaseOderId}'.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId
                        });
                    }
                    break;
                case PurchaseOrderStatus.Receiving:
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.ArrivalConfirmedBy,
                        Title = "Đơn mua hàng đang được tiếp nhận",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đang được tiếp nhận.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId
                    });
                    break;
                case PurchaseOrderStatus.Inspected:
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.ArrivalConfirmedBy,
                        Title = "Đơn mua hàng đã được kiểm tra",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã được kiểm tra.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId
                    });
                    break;
                case PurchaseOrderStatus.Completed:
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.ArrivalConfirmedBy,
                        Title = "Đơn mua hàng đã hoàn thành",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId,
                    });
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.CreatedBy,
                        Title = "Đơn mua hàng đã hoàn thành",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId,
                    });
                    notificationStatusChange.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOrder.ApprovalBy,
                        Title = "Đơn mua hàng đã hoàn thành",
                        Content = $"Đơn mua hàng '{purchaseOrder.PurchaseOderId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOrder.PurchaseOderId,
                    });
                    break;
                default:
                    break;
            }

            if (isReassignment)
            {
                if (removedAssignees?.Any() == true)
                {
                    foreach (var removedUserId in removedAssignees.Distinct())
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = removedUserId,
                            Title = "Đơn mua hàng đã gỡ phân công",
                            Content = $"Bạn không còn được phân công nhận đơn mua hàng '{purchaseOrder.PurchaseOderId}'.",
                            EntityType = NotificationEntityType.NoNavigation,
                            Category = NotificationCategory.Important
                        });
                    }
                }

                if (newAssignees?.Any() == true)
                {
                    foreach (var newUserId in newAssignees.Distinct())
                    {
                        notificationStatusChange.Add(new NotificationCreateDto
                        {
                            UserId = newUserId,
                            Title = "Đơn mua hàng được phân công lại",
                            Content = $"Bạn được phân công nhận đơn mua hàng '{purchaseOrder.PurchaseOderId}'.",
                            EntityType = NotificationEntityType.PurchaseOrder,
                            EntityId = purchaseOrder.PurchaseOderId
                        });
                    }
                }
            }
            if (notificationStatusChange.Any())
                await _notificationService.CreateNotificationBulk(notificationStatusChange);
        }

        private async Task EnsureRolePermission(int roleType, int? userId, string missingRoleMessage, string noPermissionMessage)
        {
            var users = await _userRepository.GetUsersByRoleId(roleType);

            if (!users.Any())
                throw new Exception(missingRoleMessage.ToMessageForUser(), default);

            if (userId == null || !users.Any(user => user.UserId == userId))
                throw new Exception(noPermissionMessage.ToMessageForUser(), default);
        }
    }
}
