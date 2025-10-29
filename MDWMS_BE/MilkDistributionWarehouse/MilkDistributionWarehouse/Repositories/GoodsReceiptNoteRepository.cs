using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsReceiptNoteRepository
    {
        IQueryable<GoodsReceiptNote?> GetGRN();
        Task<GoodsReceiptNote?> CreateGoodsReceiptNote(GoodsReceiptNote create);
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
    }
}
