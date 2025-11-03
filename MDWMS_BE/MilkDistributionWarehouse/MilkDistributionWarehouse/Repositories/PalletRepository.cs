using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
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
        Task<List<Pallet>> GetPalletsByGRNID(Guid grnId);
        Task<bool> IsLocationAvailable(int? locationId);
        Task<bool> ExistsBatch(Guid? batchId);
        Task<bool> ExistsLocation(int? locationId);
        Task<bool> ExistsGoodRecieveNote(Guid? goodRcNoteId);
        Task<List<Pallet>> GetPotentiallyPalletsForPicking(int? goodsId, int? goodsPackingId);
        Task<bool> IsAnyDiffActivePalletByGRNId(Guid grndId);
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

        public async Task<List<Pallet>> GetPalletsByGRNID(Guid grnId)
        {
            return await _context.Pallets
                .Include(p => p.Batch)
                    .ThenInclude(p => p.Goods)
                .Include(p => p.Location)
                .Include(p => p.GoodsPacking)
                .Include(p => p.CreateByNavigation)
                .Where(p => p.GoodsReceiptNoteId == grnId)
                .OrderBy(p => p.CreateAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public Task<bool> IsLocationAvailable(int? locationId)
        {
            if (!locationId.HasValue) return Task.FromResult(false);

            return _context.Locations
                .AsNoTracking()
                .AnyAsync(l => l.LocationId == locationId.Value && l.IsAvailable == true && l.Status != CommonStatus.Deleted);
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

        public Task<bool> ExistsGoodRecieveNote(Guid? goodRcNoteId)
        {
            if (!goodRcNoteId.HasValue) return Task.FromResult(false);

            return _context.GoodsReceiptNotes
                .AsNoTracking()
                .AnyAsync(po => po.GoodsReceiptNoteId == goodRcNoteId.Value);
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
                            p.Batch.ExpiryDate >= DateOnly.FromDateTime(DateTime.Now))
                .ToListAsync();
        }

        public async Task<bool> IsAnyDiffActivePalletByGRNId(Guid grndId)
        {
            return await _context.Pallets
                .AnyAsync(p => p.GoodsReceiptNoteId == grndId
                && (p.Status != CommonStatus.Active
                || p.LocationId == null));
        }
    }
}
