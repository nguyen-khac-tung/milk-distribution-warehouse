using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsPackingRepository
    {
        Task<List<GoodsPacking>?> GetGoodsPackingsByGoodsId(int goodsId);
        Task<List<GoodsPacking>?> DeleteGoodsPackingsBulk(List<GoodsPacking> goodsPackings);
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

        public async Task<List<GoodsPacking>?> GetGoodsPackingsByGoodsId(int goodsId)
        {
            return await _context.GoodsPackings
                .Where(gp => gp.GoodsId == goodsId && gp.Status == CommonStatus.Active)
                .ToListAsync();
        }

        public async Task<List<GoodsPacking>?> DeleteGoodsPackingsBulk(List<GoodsPacking> goodsPackings)
        {
            try
            {
                _context.GoodsPackings.RemoveRange(goodsPackings);
                await _context.SaveChangesAsync();
                return goodsPackings;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<bool> HasActiveSaleOrder(int goodsPackingId)
        {
            return await _context.SalesOrders
                .AnyAsync(so => so.Status != SalesOrderStatus.Draft && so.SalesOrderDetails
                .Any(sod => sod.GoodsPackingId == goodsPackingId));
        }

        public async Task<bool> HasActivePurchaseOrder(int goodsPackingId)
        {
            return await _context.PurchaseOrders
                .AnyAsync(po => po.Status != PurchaseOrderStatus.Draft && po.PurchaseOderDetails
                .Any(pod => pod.GoodsPackingId == goodsPackingId));
        }

        //public async Task<bool> HasGoodsReceiptNote(int goodsPackingId)
        //{
        //    return await _context.GoodsReceiptNotes
        //        .AnyAsync(grn => grn.Status != GoodsReceiptNoteStatus.Draft && grn.GoodsReceiptNoteDetails
        //        .Any(grnd => grnd.GoodsPackingId == goodsPackingId));
        //}
        
    }
}
