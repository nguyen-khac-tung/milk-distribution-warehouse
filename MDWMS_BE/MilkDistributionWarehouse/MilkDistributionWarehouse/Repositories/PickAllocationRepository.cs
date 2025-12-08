using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPickAllocationRepository
    {
        Task<PickAllocation?> GetPickAllocationDetailById(int? id);
        Task<Dictionary<string, int>> GetCommittedQuantitiesForSalesByPallet();
        Task<Dictionary<string, int>> GetCommittedQuantitiesForDisposalByPallet();
        Task UpdatePickAllocation(PickAllocation pickAllocation);
    }

    public class PickAllocationRepository : IPickAllocationRepository
    {
        private readonly WarehouseContext _context;

        public PickAllocationRepository(WarehouseContext context)
        {
            _context = context;
        }

        // Get the total allocated quantity on each pallet for uncompleted goods issue notes detail
        public async Task<Dictionary<string, int>?> GetCommittedQuantitiesForSalesByPallet()
        {
            
            return await _context.PickAllocations
                .Where(pa => pa.GoodsIssueNoteDetailId != null 
                             && pa.GoodsIssueNoteDetail.GoodsIssueNote.Status != GoodsIssueNoteStatus.Completed)
                .GroupBy(pa => pa.PalletId)
                .Select(g => new
                {
                    PalletId = g.Key,
                    CommittedQuantity = g.Sum(pa => pa.PackageQuantity ?? 0)
                })
                .ToDictionaryAsync(x => x.PalletId, x => x.CommittedQuantity);
        }

        public async Task<Dictionary<string, int>> GetCommittedQuantitiesForDisposalByPallet()
        {
            return await _context.PickAllocations
                .Where(pa => pa.DisposalNoteDetailId != null
                             && pa.DisposalNoteDetail.DisposalNote.Status != DisposalNoteStatus.Completed)
                .GroupBy(pa => pa.PalletId)
                .Select(g => new
                {
                    PalletId = g.Key,
                    CommittedQuantity = g.Sum(pa => pa.PackageQuantity ?? 0)
                })
                .ToDictionaryAsync(x => x.PalletId, x => x.CommittedQuantity);
        }

        public async Task<PickAllocation?> GetPickAllocationDetailById(int? id)
        {
            return await _context.PickAllocations
                .Include(p => p.GoodsIssueNoteDetail)
                    .ThenInclude(g => g.GoodsIssueNote)
                .Include(p => p.DisposalNoteDetail)
                    .ThenInclude(d => d.DisposalNote)
                .Include(p => p.Pallet)
                    .ThenInclude(p => p.GoodsPacking)
                .Include(p => p.Pallet)
                    .ThenInclude(p => p.Batch)
                        .ThenInclude(b => b.Goods)
                            .ThenInclude(g => g.UnitMeasure)
                .FirstOrDefaultAsync(p => p.PickAllocationId == id);
        }

        public async Task UpdatePickAllocation(PickAllocation pickAllocation)
        {
            _context.PickAllocations.Update(pickAllocation);
            await Task.CompletedTask;
        }
    }
}
