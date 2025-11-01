using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPickAllocationRepository
    {
        Task<Dictionary<string, int>> GetCommittedQuantitiesByPallet();
    }

    public class PickAllocationRepository : IPickAllocationRepository
    {
        private readonly WarehouseContext _context;

        public PickAllocationRepository(WarehouseContext context)
        {
            _context = context;
        }

        // Get the total allocated quantity on each pallet for uncompleted goods issue notes detail
        public async Task<Dictionary<string, int>> GetCommittedQuantitiesByPallet()
        {
            
            return await _context.PickAllocations
                .Where(pa => pa.GoodsIssueNoteDetail.GoodsIssueNote.Status != GoodsIssueNoteStatus.Completed)
                .GroupBy(pa => pa.PalletId)
                .Select(g => new
                {
                    PalletId = g.Key,
                    CommittedQuantity = g.Sum(pa => pa.PackageQuantity ?? 0)
                })
                .ToDictionaryAsync(x => x.PalletId, x => x.CommittedQuantity);
        }
    }
}
