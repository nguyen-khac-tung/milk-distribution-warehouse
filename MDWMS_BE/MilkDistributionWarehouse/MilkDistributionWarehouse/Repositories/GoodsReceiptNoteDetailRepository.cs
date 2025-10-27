using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsReceiptNoteDetailRepository
    {
        Task<List<GoodsReceiptNoteDetail>> GetListByGRNId(Guid grnId);
    }

    public class GoodsReceiptNoteDetailRepository : IGoodsReceiptNoteDetailRepository
    {
        private readonly WarehouseContext _context;
        public GoodsReceiptNoteDetailRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<GoodsReceiptNoteDetail>> GetListByGRNId(Guid grnId)
        {
            return await _context.GoodsReceiptNoteDetails
                .Include(x => x.Goods)
                .Where(x => x.GoodsReceiptNoteId == grnId)
                .ToListAsync();
        }
    }
}
