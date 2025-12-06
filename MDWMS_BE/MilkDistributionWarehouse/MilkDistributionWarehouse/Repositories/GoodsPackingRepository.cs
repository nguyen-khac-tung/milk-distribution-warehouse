using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsPackingRepository
    {
        Task<GoodsPacking?> CreateGoodsPacking(GoodsPacking create);
        Task<List<GoodsPacking>?> GetGoodsPackingsByGoodsId(int goodsId);
        Task<List<GoodsPacking>?> DeleteGoodsPackingsBulk(List<GoodsPacking> goodsPackings);
        Task<GoodsPacking?> DeleteGoodsPacking(GoodsPacking goodsPacking);
        Task<bool> HasActivePurchaseOrder(int goodsPackingId);
        Task<bool> HasActiveSaleOrder(int goodsPackingId);
        Task<bool> HasActiveDisposalRequest(int goodsPackingId);
        Task<bool> HasActiveGoodsReceiptNote(int goodsPackingId);
        Task<bool> HasActiveGoodsIssueNote(int goodsPackingId);
        Task<bool> HasActiveDisposalNote(int goodsPackingId);
        Task<bool> HasActiveAndDeletedPallet(int goodsPackingId);
        Task<bool> IsPurchaseOrderByGoodsPackingId(int goodsPackingId);
        Task<bool> IsSalesOrderByGoodsPackingId(int goodsPackingId);
        Task<bool> IsGoodsReceiptNoteByGoodsPackingId(int goodsPackingId);
        Task<bool> IsGoodsIssueNoteByGoodsPackingId(int goodPackingId);
        Task<bool> IsPalletByGoodsPackingId(int goodsPackingId);
        Task<bool> IsDisposalRequestByGoodsPackingId(int goodsPackingId);
        Task<bool> IsDisposalNoteByGoodsPackingId(int goodsPackingId);
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
            catch
            {
                return null;
            }
        }

        public async Task<GoodsPacking?> DeleteGoodsPacking(GoodsPacking goodsPacking)
        {
            try
            {
                _context.GoodsPackings.Remove(goodsPacking);
                await _context.SaveChangesAsync();
                return goodsPacking;
            }
            catch
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

        public async Task<bool> HasActiveDisposalRequest(int goodsPackingId)
        {
            return await _context.DisposalRequests
                .AnyAsync(dr => dr.Status != DisposalRequestStatus.Draft && dr.DisposalRequestDetails
                .Any(drd => drd.GoodsPackingId == goodsPackingId));
        }

        public async Task<bool> HasActiveGoodsReceiptNote(int goodsPackingId)
        {
            return await _context.GoodsReceiptNotes
                .AnyAsync(grn => grn.Status != GoodsReceiptNoteStatus.Receiving && grn.GoodsReceiptNoteDetails
                .Any(grnd => grnd.GoodsPackingId == goodsPackingId));
        }

        public async Task<bool> HasActiveGoodsIssueNote(int goodsPackingId)
        {
            return await _context.GoodsIssueNotes
                .AnyAsync(gin => gin.Status != GoodsIssueNoteStatus.Picking && gin.GoodsIssueNoteDetails
                .Any(gin => gin.GoodsPackingId == goodsPackingId));
        }

        public async Task<bool> HasActiveDisposalNote(int goodsPackingId)
        {
            return await _context.DisposalNotes
                .AnyAsync(dn => dn.Status != DisposalNoteStatus.Picking && dn.DisposalNoteDetails
                .Any(dnd => dnd.GoodsPackingId == goodsPackingId));
        }

        public async Task<bool> HasActiveAndDeletedPallet(int goodsPackingId)
        {
            return await _context.Pallets
                //.AnyAsync(p => p.Status != CommonStatus.Inactive && p.GoodsPackingId == goodsPackingId);
                .AnyAsync(p => p.GoodsPackingId == goodsPackingId);
        }

        public async Task<bool> IsPurchaseOrderByGoodsPackingId(int goodsPackingId)
        {
            return await _context.PurchaseOderDetails
                .AnyAsync(pod => pod.GoodsPackingId == goodsPackingId);
        }

        public async Task<bool> IsSalesOrderByGoodsPackingId(int goodsPackingId)
        {
            return await _context.SalesOrderDetails
                .AnyAsync(sod => sod.GoodsPackingId == goodsPackingId);
        }

        public async Task<bool> IsDisposalRequestByGoodsPackingId(int goodsPackingId)
        {
            return await _context.DisposalRequestDetails
                .AnyAsync(drd => drd.GoodsPackingId == goodsPackingId);
        }

        public async Task<bool> IsGoodsReceiptNoteByGoodsPackingId(int goodsPackingId)
        {
            return await _context.GoodsReceiptNoteDetails
                .AnyAsync(grnd => grnd.GoodsPackingId == goodsPackingId);
        }

        public async Task<bool> IsGoodsIssueNoteByGoodsPackingId(int goodPackingId)
        {
            return await _context.GoodsIssueNoteDetails
                .AnyAsync(gind => gind.GoodsPackingId == goodPackingId);
        }

        public async Task<bool> IsDisposalNoteByGoodsPackingId(int goodsPackingId)
        {
            return await _context.DisposalNoteDetails
                .AnyAsync(dnd => dnd.GoodsPackingId == goodsPackingId);
        }

        public async Task<bool> IsPalletByGoodsPackingId(int goodsPackingId)
        {
            return await _context.Pallets
                .AnyAsync(p => p.GoodsPackingId == goodsPackingId);
        }

    }
}
