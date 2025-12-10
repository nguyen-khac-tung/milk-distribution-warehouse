using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsReceiptNoteRepository
    {
        IQueryable<GoodsReceiptNote?> GetGRN();
        Task<GoodsReceiptNote?> GetGoodsReceiptNoteById(string grnId);
        Task<GoodsReceiptNote?> GetGRNByPurchaseOrderId(string purchaseOrderId);
        Task<GoodsReceiptNote?> CreateGoodsReceiptNote(GoodsReceiptNote create);
        Task<GoodsReceiptNote?> UpdateGoodsReceiptNote(GoodsReceiptNote update);
    }

    public class GoodsReceiptNoteRepository : IGoodsReceiptNoteRepository
    {
        private readonly WarehouseContext _context;
        public GoodsReceiptNoteRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<GoodsReceiptNote?> GetGRN()
        {
            return _context.GoodsReceiptNotes.AsNoTracking();
        }

        public async Task<GoodsReceiptNote?> GetGoodsReceiptNoteById(string grnId)
        {
            return await _context.GoodsReceiptNotes.Include(grn => grn.GoodsReceiptNoteDetails)
                .Include(grn => grn.GoodsReceiptNoteDetails)
                    .ThenInclude(grnd => grnd.Goods)
                .Include(grn => grn.PurchaseOder)
                .FirstOrDefaultAsync(grn => grn.GoodsReceiptNoteId.Equals(grnId));
        }

        public async Task<GoodsReceiptNote?> GetGRNByPurchaseOrderId(string purchaseOrderId)
        {
            return await _context.GoodsReceiptNotes
                .Include(grn => grn.PurchaseOder)
                    .ThenInclude(po => po.Supplier)
                .Include(grn => grn.GoodsReceiptNoteDetails)
                    .ThenInclude(grnd => grnd.Goods)
                .FirstOrDefaultAsync(g => g.PurchaseOderId == purchaseOrderId);
        }

        public async Task<GoodsReceiptNote?> CreateGoodsReceiptNote(GoodsReceiptNote create)
        {
            try
            {
                await _context.GoodsReceiptNotes.AddAsync(create);
                await _context.SaveChangesAsync();
                return create;
            }
            catch
            {
                return null;
            }
        }

        public async Task<GoodsReceiptNote?> UpdateGoodsReceiptNote(GoodsReceiptNote update)
        {
            try
            {
                _context.GoodsReceiptNotes.Update(update);
                await _context.SaveChangesAsync();
                return update;  
            }
            catch
            {
                return null;
            }
        }
    }
}
