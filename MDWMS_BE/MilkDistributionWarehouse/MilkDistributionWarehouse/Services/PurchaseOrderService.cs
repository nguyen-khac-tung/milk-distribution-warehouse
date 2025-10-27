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
        Task<(string, PurchaseOrderProcess)> SubmitPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId);
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
        public PurchaseOrderService(IPurchaseOrderRepositoy purchaseOrderRepository, IMapper mapper, IPurchaseOrderDetailService purchaseOrderDetailService,
            IPurchaseOrderDetailRepository purchaseOrderDetailRepository, IUnitOfWork unitOfWork)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _mapper = mapper;
            _purchaseOrderDetailService = purchaseOrderDetailService;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _unitOfWork = unitOfWork;
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
                    //case RoleNames.SalesRepresentative:
                    //    purchaseOrderQuery = purchaseOrderQuery.Where(pod => pod.CreatedBy == userId);
                    //    break;
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
            var (msg, item) = await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleRepresentative>(request, userId, RoleNames.SalesRepresentative);

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


            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId();

            var purchaseOrderMap = purchaseOrderQuery.ProjectTo<PurchaseOrdersDetail>(_mapper.ConfigurationProvider);

            var purchaseOrderMapDetal = await purchaseOrderMap.FirstOrDefaultAsync(pod => pod.PurchaseOderId == purchaseOrderId);

            if (purchaseOrderMapDetal == null)
                return ("PurchaseOrder is not found.", default);

            bool isDisableButton = false;

            if (role != null)
            {
                switch (role)
                {
                    case RoleNames.SalesRepresentative:
                        isDisableButton = purchaseOrderMapDetal.CreatedBy != userId
                            && (purchaseOrderMapDetal.Status != PurchaseOrderStatus.Draft || purchaseOrderMapDetal.Status != PurchaseOrderStatus.Rejected);
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

                if(!string.IsNullOrEmpty(create.Note))
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
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return ("PurchaseOrder data update is invalid.", default);
                }

                var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(update.PurchaseOderId);

                if (purchaseOrderExist == null)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return ("PurchaseOrder is not exist.", default);
                }

                if (purchaseOrderExist.Status != PurchaseOrderStatus.Draft && purchaseOrderExist.Status != PurchaseOrderStatus.Rejected)
                    throw new Exception("Chỉ được cập nhật khi đơn hàng ở trạng thái Nháp hoặc Bị từ chối.");

                if (purchaseOrderExist.CreatedBy != userId)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return ("No PO update permission.", default);
                }

                var purchaseOrderDetails = await _purchaseOrderDetailRepository.GetPurchaseOrderDetail()
                    .Where(pod => pod.PurchaseOderId == update.PurchaseOderId)
                    .ToListAsync();

                if (!purchaseOrderDetails.Any())
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return ("List purchase order detail is null.", default);
                }

                var resultDeletePODetail = await _purchaseOrderDetailRepository.DeletePODetailBulk(purchaseOrderDetails);

                if (resultDeletePODetail == 0)
                    return ("Delete PO Details is failed.", default);

                var newDetails = _mapper.Map<List<PurchaseOderDetail>>(update.PurchaseOrderDetailUpdates);

                newDetails.ForEach(pod =>
                {
                    pod.PurchaseOderId = update.PurchaseOderId;
                    pod.PurchaseOrderDetailId = 0;
                });

                var resultCreatePODetail = await _purchaseOrderDetailRepository.CreatePODetailBulk(newDetails);

                if (resultCreatePODetail == 0)
                    return ("Create PO Details is failed.", default);

                purchaseOrderExist.UpdatedAt = DateTime.Now;
                var resultUpdatePO = await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrderExist);

                if (resultUpdatePO == null)
                    throw new Exception("Cập nhật đơn hàng thất bại");

                await _unitOfWork.CommitTransactionAsync();

                return ("", update);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}".ToMessageForUser(), default);
            }
        }

        private async Task<(string, PurchaseOrderProcess?)> UpdatePurchaseOrderProcess(PurchaseOrderProcess purchaseOrderProcess, int? userId, string? userRole)
        {
            var purchaseOrderExist = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderProcess.PurchaseOrderId);

            if (purchaseOrderExist == null)
                return ("PurchaseOrder is not exist.", default);

            if (userRole != null)
            {
                switch (userRole)
                {
                    case RoleNames.SalesRepresentative:
                        if(purchaseOrderExist.CreatedBy != userId)
                            return ("Bạn không có quyền nộp đơn đặt hàng.".ToMessageForUser(), default);

                        purchaseOrderExist.Status = PurchaseOrderStatus.PendingApproval;
                        purchaseOrderExist.Note = purchaseOrderProcess.Note;
                        purchaseOrderExist.UpdatedAt = DateTime.Now;

                        var resultUpdate = await _purchaseOrderRepository.UpdatePurchaseOrder(purchaseOrderExist);
                        if (resultUpdate == null)
                            return ("Nộp đơn đặt hàng để duyệt thất bại.".ToMessageForUser(), default);
                        break;
                    //case RoleNames.SalesManager:
                    //    purchaseOrderQuery = purchaseOrderQuery.Where(pod => pod.CreatedBy == userId);
                    //    break;
                    case RoleNames.WarehouseManager:
                       
                        break;
                    case RoleNames.WarehouseStaff:
                        
                        break;
                    default:
                        break;
                }
            }

            return ("", purchaseOrderProcess);
        }

        public async Task<(string, PurchaseOrderProcess)> SubmitPurchaseOrder(PurchaseOrderProcess purchaseOrderProcess, int? userId)
        {
            return await UpdatePurchaseOrderProcess(purchaseOrderProcess, userId, RoleNames.SalesRepresentative);
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
    }
}
