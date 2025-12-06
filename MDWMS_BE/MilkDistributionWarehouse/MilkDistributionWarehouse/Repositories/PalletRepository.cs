using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPalletRepository
    {
        IQueryable<Pallet>? GetPallets();
        Task<Pallet?> GetPalletById(string palletId);
        Task<Pallet?> CreatePallet(Pallet entity);
        Task<Pallet?> UpdatePallet(Pallet entity);
        Task<bool> HasDependencies(string palletId);
        Task<List<Pallet>> GetActivePalletsAsync();
        Task<List<Pallet>> GetPalletsByGRNID(string grnId);
        Task<bool> IsLocationAvailable(int? locationId, string? palletID = null);
        Task<bool> ExistsBatch(Guid? batchId);
        Task<bool> ExistsLocation(int? locationId);
        Task<bool> ExistsGoodRecieveNote(string? goodRcNoteId);
        Task<bool> CheckUserCreatePallet(string? goodRcNoteId, int? userID);
        Task<List<Pallet>> GetPotentiallyPalletsForPicking(int? goodsId, int? goodsPackingId);
        Task<List<Pallet>> GetExpiredPalletsForPicking(int? goodsId, int? goodsPackingId);
        Task<bool> IsAnyDiffActivePalletByGRNId(string grndId);
        Task<List<Pallet>> GetActivePalletIdsByLocationId(List<int> locationIds);
        Task<List<Pallet>> GetMisstoredPallets();
    }

    public class PalletRepository : IPalletRepository
    {
        private readonly WarehouseContext _context;

        public PalletRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Pallet>? GetPallets()
        {
            return _context.Pallets
                .Include(p => p.Batch)
                .Include(p => p.Location)
                .Include(p => p.GoodsPacking)
                .Where(p => p.Status != CommonStatus.Deleted)
                .OrderByDescending(p => p.CreateAt)
                .AsNoTracking();
        }

        public async Task<Pallet?> GetPalletById(string palletId)
        {
            return await _context.Pallets
                .Include(p => p.CreateByNavigation)
                .Include(p => p.Batch)
                    .ThenInclude(b => b.Goods)
                        .ThenInclude(u => u.UnitMeasure)
                .Include(p => p.Location)
                    .ThenInclude(l => l.Area)
                .Include(p => p.GoodsReceiptNote)
                .Include(p => p.GoodsPacking)
                .FirstOrDefaultAsync(p => p.PalletId == palletId);
        }

        public async Task<Pallet?> CreatePallet(Pallet entity)
        {
            await _context.Pallets.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Pallet?> UpdatePallet(Pallet entity)
        {
            _context.Pallets.Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> HasDependencies(string palletId)
        {
            return await _context.StocktakingPallets.AnyAsync(sp => sp.PalletId == palletId);
        }

        public async Task<List<Pallet>> GetActivePalletsAsync()
        {
            return await _context.Pallets
                .Where(p => p.Status == CommonStatus.Active)
                .OrderBy(p => p.CreateAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Pallet>> GetPalletsByGRNID(string grnId)
        {
            return await _context.Pallets
                .Include(p => p.Batch)
                    .ThenInclude(p => p.Goods)
                .Include(p => p.Location)
                .Include(p => p.GoodsPacking)
                .Include(p => p.CreateByNavigation)
                .Where(p => p.GoodsReceiptNoteId.Equals(grnId))
                .OrderBy(p => p.CreateAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> IsLocationAvailable(int? locationId, string? palletID = null)
        {
            if (!locationId.HasValue) return false;

            var location = await _context.Locations
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.LocationId == locationId.Value && l.Status == CommonStatus.Active);

            if (location == null) return false;

            if (location.IsAvailable == true) return true;

            if (string.IsNullOrEmpty(palletID)) return false;

            var existingPallet = await _context.Pallets
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PalletId == palletID && p.LocationId == locationId.Value && p.Status != CommonStatus.Deleted);

            return existingPallet != null;
        }

        public Task<bool> ExistsBatch(Guid? batchId)
        {
            if (!batchId.HasValue) return Task.FromResult(false);

            return _context.Batchs
                .AsNoTracking()
                .AnyAsync(b => b.BatchId == batchId.Value && b.Status == CommonStatus.Active);
        }

        public Task<bool> ExistsLocation(int? locationId)
        {
            if (!locationId.HasValue) return Task.FromResult(false);

            return _context.Locations
                .AsNoTracking()
                .AnyAsync(l => l.LocationId == locationId.Value && l.Status == CommonStatus.Active);
        }

        public Task<bool> ExistsGoodRecieveNote(string? goodRcNoteId)
        {
            if (string.IsNullOrEmpty(goodRcNoteId)) return Task.FromResult(false);

            return _context.GoodsReceiptNotes
                .AsNoTracking()
                .AnyAsync(po => po.GoodsReceiptNoteId.Equals(goodRcNoteId));
        }
        public async Task<bool> CheckUserCreatePallet(string? goodRcNoteId, int? userID)
        {
            if (string.IsNullOrEmpty(goodRcNoteId) || userID == null)
                return false;

            return await _context.GoodsReceiptNotes
                .AsNoTracking()
                .AnyAsync(x =>
                    x.GoodsReceiptNoteId == goodRcNoteId
                    && x.CreatedBy == userID
                );
        }

        public Task<bool> ExistsGoodPackage(int? gpId)
        {
            if (!gpId.HasValue) return Task.FromResult(false);

            return _context.GoodsPackings
                .AsNoTracking()
                .AnyAsync(g => g.GoodsPackingId == gpId.Value && g.Status == CommonStatus.Active);
        }

        public async Task<List<Pallet>> GetPotentiallyPalletsForPicking(int? goodsId, int? goodsPackingId)
        {
            return await _context.Pallets
                .Include(p => p.Batch)
                .Where(p => p.Batch.GoodsId == goodsId &&
                            p.GoodsPackingId == goodsPackingId &&
                            p.PackageQuantity > 0 &&
                            p.Status == CommonStatus.Active &&
                            p.Batch.ExpiryDate >= DateOnly.FromDateTime(DateTimeUtility.Now()))
                .ToListAsync();
        }

        public async Task<List<Pallet>> GetExpiredPalletsForPicking(int? goodsId, int? goodsPackingId)
        {
            var today = DateOnly.FromDateTime(DateTimeUtility.Now());
            return await _context.Pallets
                .Include(p => p.Batch)
                .Where(p => p.Batch.GoodsId == goodsId &&
                            p.GoodsPackingId == goodsPackingId &&
                            p.Status == CommonStatus.Active &&
                            p.Batch.ExpiryDate <= today)
                .ToListAsync();
        }

        public async Task<bool> IsAnyDiffActivePalletByGRNId(string grndId)
        {
            return await _context.Pallets
                .AnyAsync(p => p.GoodsReceiptNoteId.Equals(grndId)
                && (p.Status != CommonStatus.Active
                || p.LocationId == null));
        }

        public async Task<List<Pallet>> GetActivePalletIdsByLocationId(List<int> locationIds)
        {
            return await _context.Pallets
                .Where(p => p.LocationId.HasValue 
                && locationIds.Contains(p.LocationId.Value) 
                && p.Status == CommonStatus.Active)
                .ToListAsync();
        }

        public async Task<List<Pallet>> GetMisstoredPallets()
        {
            return await _context.Pallets
                .Include(p => p.Batch).ThenInclude(b => b.Goods)
                .Include(p => p.Location).ThenInclude(l => l.Area)
                .Where(p => p.Status == CommonStatus.Active
                       && p.LocationId != null
                       && p.Batch.Goods.StorageConditionId != p.Location.Area.StorageConditionId)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
