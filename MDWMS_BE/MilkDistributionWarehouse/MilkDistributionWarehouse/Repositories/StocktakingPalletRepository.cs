using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingPalletRepository
    {
        Task<StocktakingPallet?> GetStocktakingPalletByStocktakingPalletId(Guid stocktakingPalletId);
        Task<List<StocktakingPallet>?> GetStocktakingPalletByStocktakingLocationId(Guid stoctakingLocationId);
        Task<StocktakingPallet?> GetStocktakingPalletByStockLocationIdAndPalletId(Guid stocktakingLocationId, string palletId);
        Task<StocktakingPallet?> CreateStocktakingPallet(StocktakingPallet create);
        Task<int> CreateStocktakingPalletBulk(List<StocktakingPallet> creates);
        Task<int> UpdateStocktakingPallet(StocktakingPallet update);
        Task<int> DeleteStockPallet(StocktakingPallet stocktakingPallet);
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
                var trackedEntity = await _context.StocktakingPallets
                    .FirstOrDefaultAsync(sp => sp.StocktakingPalletId == update.StocktakingPalletId);

                if (trackedEntity != null)
                {
                    trackedEntity.Status = update.Status;
                    trackedEntity.ActualPackageQuantity = update.ActualPackageQuantity;
                    trackedEntity.ExpectedPackageQuantity = update.ExpectedPackageQuantity;
                    trackedEntity.Note = update.Note;
                    trackedEntity.UpdateAt = update.UpdateAt;
                }
                else
                {
                    // Clear navigation properties before attaching to avoid tracking conflicts
                    update.Pallet = null;
                    update.StocktakingLocation = null;

                    _context.StocktakingPallets.Attach(update);
                    _context.Entry(update).Property(x => x.Status).IsModified = true;
                    _context.Entry(update).Property(x => x.ActualPackageQuantity).IsModified = true;
                    _context.Entry(update).Property(x => x.ExpectedPackageQuantity).IsModified = true;
                    _context.Entry(update).Property(x => x.Note).IsModified = true;
                    _context.Entry(update).Property(x => x.UpdateAt).IsModified = true;
                }

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
    }
}
