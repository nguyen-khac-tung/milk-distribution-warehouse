using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IPurchaseOrderService
    {
        Task<(string, PageResult<PurchaseOrderDtoSaleRepresentative>)> GetPurchaseOrderSaleRepresentatives(PagedRequest request);
        Task<(string, PageResult<PurchaseOrderDtoSaleManager>)> GetPurchaseOrderSaleManagers(PagedRequest request);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IMapper _mapper;
        public PurchaseOrderService(IPurchaseOrderRepositoy purchaseOrderRepository, IMapper mapper, IPurchaseOrderDetailRepository purchaseOrderDetailRepository)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _mapper = mapper;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
        }

        public async Task<(string, PageResult<TDto>)> GetPurchaseOrdersAsync<TDto>(PagedRequest request)
        {
            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrder();

            var projectedQuery = purchaseOrderQuery.ProjectTo<TDto>(_mapper.ConfigurationProvider);

            var items = await projectedQuery.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách mua hàng trống.".ToMessageForUser(), new PageResult<TDto>());

            return ("", items);
        }

        public async Task<(string, PageResult<PurchaseOrderDtoSaleRepresentative>)> GetPurchaseOrderSaleRepresentatives(PagedRequest request)
            => await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleRepresentative>(request);

        public async Task<(string, PageResult<PurchaseOrderDtoSaleManager>)> GetPurchaseOrderSaleManagers(PagedRequest request)
            => await GetPurchaseOrdersAsync<PurchaseOrderDtoSaleManager>(request);

        //public (string, PurchaseOrderDetailDto) GetPurchaseOrderDetailById(Guid purchaseOrderId)
        //{
            
        //}
    }
}
