using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
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
        Task<(string, PurchaseOrdersDetail?)> GetPurchaseOrderDetailById(Guid purchaseOrderId);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        private readonly IPurchaseOrderDetailService _purchaseOrderDetailService;
        private readonly IMapper _mapper;
        public PurchaseOrderService(IPurchaseOrderRepositoy purchaseOrderRepository, IMapper mapper, IPurchaseOrderDetailService purchaseOrderDetailService)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _mapper = mapper;
            _purchaseOrderDetailService = purchaseOrderDetailService;
        }

        private async Task<(string, PageResult<TDto>?)> GetPurchaseOrdersAsync<TDto>(PagedRequest request, int? userId, string? userRole, params int[] excludedStatuses)
        {
            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrder();

            if (userRole != null)
            {
                switch (userRole)
                {
                    case "Sales Representative":
                        purchaseOrderQuery = purchaseOrderQuery.Where(pod => pod.CreatedBy == userId);
                        break;
                    case "Warehouse Staff":
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.AssignTo == userId
                            && (pod.Status != null && excludedStatuses.Contains((int)pod.Status)));
                        break;
                    case "Warehouse Manager":
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.Status != null 
                            && excludedStatuses.Contains((int)pod.Status));
                        break;
                    case "Sale Manager":
                        purchaseOrderQuery = purchaseOrderQuery
                            .Where(pod => pod.Status != null 
                            && !excludedStatuses.Contains((int)pod.Status));
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
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleRepresentative>(request, userId, "Sales Representative");
        }

        public async Task<(string, PageResult<PurchaseOrderDtoSaleManager>?)> GetPurchaseOrderSaleManagers(PagedRequest request)
        {
            var excludedStatus = new int[]
            {
                PurchaseOrderStatus.Draft
            };
            
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleManager>(request, null, "Sale Manager", excludedStatus);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoWarehouseManager>?)> GetPurchaseOrderWarehouseManager(PagedRequest request)
        {
            var excludedStatus = new int[]
                        {
                          PurchaseOrderStatus.Approved,  
                          PurchaseOrderStatus.GoodsReceived,
                          PurchaseOrderStatus.AssignedForReceiving,
                          PurchaseOrderStatus.Receiving,
                          PurchaseOrderStatus.Inspected,
                          PurchaseOrderStatus.Completed
                        };
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoWarehouseManager>(request, null, "Warehouse Manager", excludedStatus);
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
            return await GetPurchaseOrdersAsync<PurchaseOrderDtoWarehouseStaff>(request, userId, "Warehouse Staff", excludedStatus);
        }

        public async Task<(string, PurchaseOrdersDetail?)> GetPurchaseOrderDetailById(Guid purchaseOrderId)
        {
            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(purchaseOrderId);

            var purchaseOrderMap = purchaseOrderQuery.ProjectTo<PurchaseOrdersDetail>(_mapper.ConfigurationProvider);

            var purchaseOrderMapDetal = purchaseOrderMap.FirstOrDefault(pod => pod.PurchaseOderId == purchaseOrderId);

            if (purchaseOrderMapDetal == null)
                return ("PurchaseOrder is not found.", default);

            var (msg, purchaseOrderDetail) = await _purchaseOrderDetailService.GetPurchaseOrderDetailByPurchaseOrderId(purchaseOrderId);

            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            purchaseOrderMapDetal.PurchaseOrderDetails = purchaseOrderDetail;

            return ("", purchaseOrderMapDetal);
        }
    }
}
