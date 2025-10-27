using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ISalesOrderDetailRepository
    {
        Task Remove(SalesOrderDetail salesOrderDetail);
    }

    public class SalesOrderDetailRepository : ISalesOrderDetailRepository
    {
        private readonly WarehouseContext _context;
        public SalesOrderDetailRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task Remove(SalesOrderDetail salesOrderDetail)
        {
            _context.SalesOrderDetails.Remove(salesOrderDetail);
            await Task.CompletedTask;
        }
    }
}
