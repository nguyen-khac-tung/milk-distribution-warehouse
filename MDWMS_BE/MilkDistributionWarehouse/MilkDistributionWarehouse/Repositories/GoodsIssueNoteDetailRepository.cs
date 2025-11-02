using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsIssueNoteDetailRepository
    {
        Task<GoodsIssueNoteDetail?> GetGoodsIssueNoteDetailById(Guid? id);
        Task<List<PickAllocation>?> GetPickAllocationsByGIN(Guid? id);
        Task UpdateGoodsIssueNoteDetail(GoodsIssueNoteDetail detail);
    }

    public class GoodsIssueNoteDetailRepository : IGoodsIssueNoteDetailRepository
    {
        private readonly WarehouseContext _context;

        public GoodsIssueNoteDetailRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<GoodsIssueNoteDetail?> GetGoodsIssueNoteDetailById(Guid? id)
        {
            return await _context.GoodsIssueNoteDetails
                .Include(d => d.GoodsIssueNote)
                .Include(d => d.PickAllocations)
                .FirstOrDefaultAsync(d => d.GoodsIssueNoteDetailId == id);
        }

        public async Task<List<PickAllocation>?> GetPickAllocationsByGIN(Guid? id)
        {
            return await _context.GoodsIssueNoteDetails
                .Where(g => g.GoodsIssueNoteDetailId == id)
                .SelectMany(g => g.PickAllocations)
                .ToListAsync();
        }

        public async Task UpdateGoodsIssueNoteDetail(GoodsIssueNoteDetail detail)
        {
            _context.GoodsIssueNoteDetails.Update(detail);
            await Task.CompletedTask;
        }
    }
}
