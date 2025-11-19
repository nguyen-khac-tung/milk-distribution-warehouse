using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingPalletRepository
    {
        Task<StocktakingPallet?> GetStocktakingPalletByStocktakingPalletId(Guid stocktakingPalletId);
        Task<List<StocktakingPallet>?> GetStocktakingPalletByStocktakingLocationId(Guid stoctakingLocationId);
        Task<StocktakingPallet?> GetStocktakingPalletByStockLocationIdAndPalletId(Guid stocktakingLocationId, string palletId);
        Task<List<StocktakingPallet>?> GetStocktakingPalletsByStocktakingLocationIds(List<Guid> stocktakingLocationIds);
        Task<StocktakingPallet?> GetScannedPalletInOtherLocationAsync(string palletId, Guid stocktakingLocationId, Guid stocktakingAreaId);
        Task<StocktakingPallet?> CreateStocktakingPallet(StocktakingPallet create);
        Task<int> CreateStocktakingPalletBulk(List<StocktakingPallet> creates);
        Task<int> UpdateStocktakingPallet(StocktakingPallet update);
        Task<int> DeleteStockPallet(StocktakingPallet stocktakingPallet);
        Task<int> DeleteStocktakingPalletBulk(List<StocktakingPallet> deletes);
        Task<bool> HasUnscannedPalletInOtherLocationAsync(string palletId, Guid stocktakingLocationId);
    }

    public class StocktakingPalletRepository : IStocktakingPalletRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingPalletRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<StocktakingPallet?> GetStocktakingPalletByStocktakingPalletId(Guid stocktakingPalletId)
        {
            return await _context.StocktakingPallets
                .Include(sp => sp.Pallet)
                .FirstOrDefaultAsync(sp => sp.StocktakingPalletId == stocktakingPalletId);
        }

        public async Task<List<StocktakingPallet>?> GetStocktakingPalletByStocktakingLocationId(Guid stoctakingLocationId)
        {
            return await _context.StocktakingPallets
                .Include(sp => sp.Pallet)
                    .ThenInclude(sp => sp.Batch)
                        .ThenInclude(sp => sp.Goods)
                .Where(sp => sp.StocktakingLocationId == stoctakingLocationId)
                .ToListAsync();
        }

        public async Task<StocktakingPallet?> GetStocktakingPalletByStockLocationIdAndPalletId(Guid stocktakingLocationId, string palletId)
        {
            return await _context.StocktakingPallets
                .Include(sp => sp.Pallet)
                    .ThenInclude(sp => sp.Batch)
                        .ThenInclude(sp => sp.Goods)
                .FirstOrDefaultAsync(sp => sp.StocktakingLocationId == stocktakingLocationId && sp.PalletId.Equals(palletId));
        }

        public async Task<List<StocktakingPallet>?> GetStocktakingPalletsByStocktakingLocationIds(List<Guid> stocktakingLocationIds)
        {
            return await _context.StocktakingPallets
                .Where(sp => stocktakingLocationIds.Contains((Guid)sp.StocktakingLocationId))
                .ToListAsync();
        }

        public async Task<StocktakingPallet?> CreateStocktakingPallet(StocktakingPallet create)
        {
            try
            {
                await _context.StocktakingPallets.AddAsync(create);
                await _context.SaveChangesAsync();
                return create;
            }
            catch
            {
                return null;
            }
        }

        public async Task<int> CreateStocktakingPalletBulk(List<StocktakingPallet> creates)
        {
            try
            {
                await _context.StocktakingPallets.AddRangeAsync(creates);
                await _context.SaveChangesAsync();
                return creates.Count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> UpdateStocktakingPallet(StocktakingPallet update)
        {
            try
            {
                _context.StocktakingPallets.Update(update);
                await _context.SaveChangesAsync();
                return 1;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> DeleteStockPallet(StocktakingPallet stocktakingPallet)
        {
            try
            {
                _context.StocktakingPallets.Remove(stocktakingPallet);
                await _context.SaveChangesAsync();
                return 1;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> DeleteStocktakingPalletBulk(List<StocktakingPallet> deletes)
        {
            try
            {
                _context.StocktakingPallets.RemoveRange(deletes);
                await _context.SaveChangesAsync();  
                return deletes.Count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> HasUnscannedPalletInOtherLocationAsync(string palletId, Guid stocktakingLocationId)
        {
            return await _context.StocktakingPallets
                .AsNoTracking()
                .AnyAsync(sp =>
                    sp.PalletId.Equals(palletId) &&
                    sp.StocktakingLocationId != stocktakingLocationId &&
                    sp.Status == StockPalletStatus.Unscanned);
        }

        public async Task<StocktakingPallet?> GetScannedPalletInOtherLocationAsync(
            string palletId, Guid stocktakingLocationId, Guid stocktakingAreaId)
        {
            return await _context.StocktakingPallets
                .Include(sp => sp.StocktakingLocation)
                .ThenInclude(sl => sl.Location)
                .AsNoTracking()
                .FirstOrDefaultAsync(sp =>
                    sp.StocktakingLocation.StocktakingAreaId == stocktakingAreaId &&
                    sp.PalletId == palletId &&
                    sp.StocktakingLocationId != stocktakingLocationId &&
                    sp.Status != StockPalletStatus.Unscanned);
        }
    }
}
