using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface ISalesOrderService
    {
        Task<(string, PageResult<SalesOrderDtoSaleRepresentative>?)> GetSalesOrderListSaleRepresentatives(PagedRequest request, int? userId);

    }


    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IMapper _mapper;

        public SalesOrderService(ISalesOrderRepository salesOrderRepository,
                                 IMapper mapper, IAreaRepository areaRepository)
        {
            _salesOrderRepository = salesOrderRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<SalesOrderDtoSaleRepresentative>?)> GetSalesOrderListSaleRepresentatives(PagedRequest request, int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var salesOrders = _salesOrderRepository.GetSalesOrderBySaleRepresentative(userId);

            var salesOrderDtos = salesOrders.ProjectTo<SalesOrderDtoSaleRepresentative>(_mapper.ConfigurationProvider);

            var result = await salesOrderDtos.ToPagedResultAsync(request);

            if (!result.Items.Any())
                return ("Danh sách đơn bán hàng trống.".ToMessageForUser(), null);
            return ("", result);
        }
    }
}
