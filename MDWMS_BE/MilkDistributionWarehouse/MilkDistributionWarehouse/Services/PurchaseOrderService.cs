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
        Task<(string, PageResult<PurchaseOrderDto>)> GetPurchaseOrders(PagedRequest request);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        private readonly IMapper _mapper;
        public PurchaseOrderService(IPurchaseOrderRepositoy purchaseOrderRepository, IMapper mapper)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<PurchaseOrderDto>)> GetPurchaseOrders(PagedRequest request)
        {
            var purchaseOrderQuery = _purchaseOrderRepository.GetPurchaseOrder();

            var purcharOrder = purchaseOrderQuery.ProjectTo<PurchaseOrderDto>(_mapper.ConfigurationProvider);

            var items = await purcharOrder.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách mua hàng trống.".ToMessageForUser(), new PageResult<PurchaseOrderDto>());

            return ("", items);
        }
    }
}
