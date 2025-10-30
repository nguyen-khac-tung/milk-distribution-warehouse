using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsReceiptNoteDetailRepository
    {
        Task<List<GoodsReceiptNoteDetail>> GetListByGRNId(Guid grnId);

        Task<GoodsReceiptNoteDetail?> GetGRNDetailById(Guid grnId);
        Task<GoodsReceiptNoteDetail?> UpdateGRNDetail(GoodsReceiptNoteDetail update);
    }

    public class GoodsReceiptNoteDetailRepository : IGoodsReceiptNoteDetailRepository
    {
        private readonly WarehouseContext _context;
        public GoodsReceiptNoteDetailRepository(WarehouseContext context)
        {
            _context = context;
        }

        public Task<GoodsReceiptNoteDetail?> GetGRNDetailById(Guid grnId)
        {
            return _context.GoodsReceiptNoteDetails.Include(grnd => grnd.GoodsReceiptNote)
                .FirstOrDefaultAsync(grnd => grnd.GoodsReceiptNoteDetailId == grnId);
        }

        public async Task<List<GoodsReceiptNoteDetail>> GetListByGRNId(Guid grnId)
        {
            return await _context.GoodsReceiptNoteDetails
                .Include(x => x.Goods)
                .Where(x => x.GoodsReceiptNoteId == grnId)
                .ToListAsync();
        }

        public async Task<GoodsReceiptNoteDetail?> UpdateGRNDetail(GoodsReceiptNoteDetail update)
        {
            try
            {
                _context.GoodsReceiptNoteDetails.Update(update);    
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
