using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ISalesOrderDetailRepository
    {

    }

    public class SalesOrderDetailRepository : ISalesOrderDetailRepository
    {
        private readonly WarehouseContext _context;
        public SalesOrderDetailRepository(WarehouseContext context)
        {
            _context = context;
        }
    }
}
