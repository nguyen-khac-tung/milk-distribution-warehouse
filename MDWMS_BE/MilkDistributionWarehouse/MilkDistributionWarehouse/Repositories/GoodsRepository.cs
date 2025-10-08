using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsRepository
    {
        IQueryable<Good> GetGoods();
        Task<Good> CreateGoods(Good good);
        Task<Good> UpdateGoods(Good good);
        Task<Good> GetGoodsById(int goodsId);
        Task<bool> IsDuplicationCode(int? goodIds, string goodsCode);
    }
    public class GoodsRepository : IGoodsRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public GoodsRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public IQueryable<Good> GetGoods()
        {
            return _warehouseContext.Goods.AsNoTracking();
        }

        public async Task<Good> CreateGoods(Good good)
        {
            try
            {
                _warehouseContext.Goods.Add(good);
                await _warehouseContext.SaveChangesAsync();
                return good;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Good> UpdateGoods(Good good)
        {
            try
            {
                _warehouseContext.Update(good);
                await _warehouseContext.SaveChangesAsync();
                return good;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Good> GetGoodsById(int goodsId)
        {
            return await _warehouseContext.Goods.FirstOrDefaultAsync(g => g.GoodsId == goodsId || g.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicationCode(int? goodsId, string goodsCode)
        {
            goodsCode = goodsCode.ToLower().Trim();

            return await _warehouseContext.Goods.AnyAsync(g =>
                g.GoodsCode.ToLower().Trim() == goodsCode &&
                g.Status != CommonStatus.Deleted &&
                (goodsId == null || g.GoodsId != goodsId));
        }

    }
}
