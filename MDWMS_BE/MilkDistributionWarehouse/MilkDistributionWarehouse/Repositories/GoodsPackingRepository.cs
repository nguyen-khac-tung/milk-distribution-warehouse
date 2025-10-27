using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsPackingRepository
    {

    }

    public class GoodsPackingRepository : IGoodsPackingRepository
    {
        private readonly WarehouseContext _context;
        public GoodsPackingRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<GoodsPacking?> CreateGoodsPacking(GoodsPacking create)
        {
            try
            {
                await _context.GoodsPackings.AddAsync(create);  
                await _context.SaveChangesAsync();
                return create;
            }
            catch
            {
                return null;
            }
        }
    }
}
