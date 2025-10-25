using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{

    public interface ISalesOrderRepository
    {
        Task<bool> HasActiveSalesOrder(int retailerId);
        Task<bool> IsAllSalesOrderDraffOrEmpty(int retailerId);
    }
    public class SalesOrderRepository : ISalesOrderRepository
    {
        private readonly WarehouseContext _context;
        public SalesOrderRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<bool> HasActiveSalesOrder(int retailerId)
        {
            return await _context.SalesOrders
                .AnyAsync(so => so.RetailerId == retailerId
                && so.Status != SalesOrderStatus.Draft 
                && so.Status != SalesOrderStatus.Completed);
        }

        public async Task<bool> IsAllSalesOrderDraffOrEmpty(int retailerId)
        {
            var salesOrder = _context.SalesOrders.Where(so => so.RetailerId == retailerId);
            return !await salesOrder.AnyAsync(so => so.Status != SalesOrderStatus.Draft);
        }
    }
}
