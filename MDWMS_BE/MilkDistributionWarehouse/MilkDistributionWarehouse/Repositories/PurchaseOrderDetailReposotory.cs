using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPurchaseOrderDetailRepository
    {
        IQueryable<PurchaseOderDetail> GetPurchaseOrderDetail();
    }

    public class PurchaseOrderDetailReposotory : IPurchaseOrderDetailRepository
    {
        private readonly WarehouseContext _context;
        public PurchaseOrderDetailReposotory(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<PurchaseOderDetail> GetPurchaseOrderDetail()
        {
            return _context.PurchaseOderDetails.AsNoTracking();
        }

    }
}
