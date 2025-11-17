using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IDisposalNoteDetailRepository
    {
        Task<DisposalNoteDetail?> GetDisposalNoteDetailById(Guid? id);
        Task<List<PickAllocation>?> GetPickAllocationsByDN(Guid? id);
        Task<List<DisposalNoteDetail>?> GetDisposalNoteDetailByIds(List<Guid?> ids);
        Task UpdateDisposalNoteDetailList(List<DisposalNoteDetail> details);
        Task UpdateDisposalNoteDetail(DisposalNoteDetail detail);
    }

    public class DisposalNoteDetailRepository : IDisposalNoteDetailRepository
    {
        private readonly WarehouseContext _context;

        public DisposalNoteDetailRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<DisposalNoteDetail?> GetDisposalNoteDetailById(Guid? id)
        {
            return await _context.DisposalNoteDetails
                .Include(d => d.DisposalNote)
                .Include(d => d.PickAllocations)
                .FirstOrDefaultAsync(d => d.DisposalNoteDetailId == id);
        }

        public async Task<List<PickAllocation>?> GetPickAllocationsByDN(Guid? id)
        {
            return await _context.DisposalNoteDetails
                .Where(d => d.DisposalNoteDetailId == id)
                .SelectMany(d => d.PickAllocations)
                .ToListAsync();
        }

        public async Task<List<DisposalNoteDetail>?> GetDisposalNoteDetailByIds(List<Guid?> ids)
        {
            return await _context.DisposalNoteDetails
                .Where(d => ids.Contains(d.DisposalNoteDetailId))
                .Include(d => d.DisposalNote)
                .Include(d => d.PickAllocations)
                .ToListAsync();
        }

        public async Task UpdateDisposalNoteDetailList(List<DisposalNoteDetail> details)
        {
            _context.DisposalNoteDetails.UpdateRange(details);
            await Task.CompletedTask;
        }

        public async Task UpdateDisposalNoteDetail(DisposalNoteDetail detail)
        {
            _context.DisposalNoteDetails.Update(detail);
            await Task.CompletedTask;
        }
    }
}
