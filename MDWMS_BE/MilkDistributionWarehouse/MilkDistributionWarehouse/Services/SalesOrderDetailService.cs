using AutoMapper;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface ISalesOrderDetailService
    {

    }


    public class SalesOrderDetailService : ISalesOrderDetailService
    {
        private readonly ISalesOrderDetailRepository _salesOrderDetailRepository;
        private readonly IMapper _mapper;

        public SalesOrderDetailService(ISalesOrderDetailRepository salesOrderDetailRepository,
                                 IMapper mapper, IAreaRepository areaRepository)
        {
            _salesOrderDetailRepository = salesOrderDetailRepository;
            _mapper = mapper;
        }
    }
}
