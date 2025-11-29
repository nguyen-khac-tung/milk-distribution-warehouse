using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IDisposalNoteRepository
    {
        Task<DisposalNote?> GetDNByDisposalRequestId(string? disposalRequestId);
        Task<DisposalNote?> GetDNDetailByDisposalRequestId(string? disposalRequestId);
        Task<DisposalNote?> GetDNByDisposalNoteId(string? disposalNoteId);
        Task CreateDisposalNote(DisposalNote disposalNote);
        Task UpdateDisposalNote(DisposalNote disposalNote);
    }

    public class DisposalNoteRepository : IDisposalNoteRepository
    {
        private readonly WarehouseContext _context;

        public DisposalNoteRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<DisposalNote?> GetDNByDisposalRequestId(string? disposalRequestId)
        {
            return await _context.DisposalNotes.FirstOrDefaultAsync(dn => dn.DisposalRequestId == disposalRequestId);
        }

        public async Task<DisposalNote?> GetDNDetailByDisposalRequestId(string? disposalRequestId)
        {
            return await _context.DisposalNotes
                .Where(dn => dn.DisposalRequestId == disposalRequestId)
                .Include(dn => dn.DisposalRequest)
                .Include(dn => dn.CreatedByNavigation)
                .Include(dn => dn.ApprovalByNavigation)
                .Include(dn => dn.DisposalNoteDetails)
                    .ThenInclude(d => d.Goods)
                .Include(dn => dn.DisposalNoteDetails)
                    .ThenInclude(d => d.GoodsPacking)
                .Include(dn => dn.DisposalNoteDetails)
                    .ThenInclude(d => d.PickAllocations)
                        .ThenInclude(pa => pa.Pallet)
                            .ThenInclude(p => p.Location)
                                .ThenInclude(l => l.Area)
                .Include(dn => dn.DisposalNoteDetails)
                    .ThenInclude(d => d.PickAllocations)
                        .ThenInclude(pa => pa.Pallet)
                            .ThenInclude(p => p.Batch)
                .FirstOrDefaultAsync();
        }

        public async Task<DisposalNote?> GetDNByDisposalNoteId(string? disposalNoteId)
        {
            return await _context.DisposalNotes
                .Include(dn => dn.DisposalRequest)
                .Include(dn => dn.DisposalNoteDetails)
                    .ThenInclude(dnd => dnd.PickAllocations)
                        .ThenInclude(p => p.Pallet)
                            .ThenInclude(l => l.Location)
                .FirstOrDefaultAsync(dn => dn.DisposalNoteId == disposalNoteId);
        }

        public async Task UpdateDisposalNote(DisposalNote disposalNote)
        {
            _context.DisposalNotes.Update(disposalNote);
            await Task.CompletedTask;
        }

        public async Task CreateDisposalNote(DisposalNote disposalNote)
        {
            await _context.DisposalNotes.AddAsync(disposalNote);
        }
    }
}
