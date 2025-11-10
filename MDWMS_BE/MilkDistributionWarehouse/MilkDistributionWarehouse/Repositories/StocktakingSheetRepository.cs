using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{

    public interface IStocktakingSheetRepository
    {
        IQueryable<StocktakingSheet> GetStocktakingSheet();
        Task<int> CreateStocktakingSheet(StocktakingSheet create);
        Task<bool> IsDuplicationStartTimeStocktakingSheet(Guid? stocktakingSheetId, DateTime startTime);
    }
    public class StocktakingSheetRepository : IStocktakingSheetRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingSheetRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<StocktakingSheet> GetStocktakingSheet()
        {
            return _context.StocktakingSheets.OrderByDescending(ss => ss.CreatedAt).AsNoTracking();
        }

        public async Task<int> CreateStocktakingSheet(StocktakingSheet create)
        {
            try
            {
                await _context.StocktakingSheets.AddAsync(create);
                await _context.SaveChangesAsync();
                return 1;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> UpdateStockingtakingSheet(StocktakingSheet update)
        {
            try
            {
                _context.StocktakingSheets.Update(update);
                await _context.SaveChangesAsync();
                return 1;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> IsDuplicationStartTimeStocktakingSheet(Guid? stocktakingSheetId, DateTime startTime)
        {
            return await _context.StocktakingSheets
                .AnyAsync(ss => (stocktakingSheetId == null || stocktakingSheetId != ss.StocktakingSheetId)
                && ss.StartTime.HasValue 
                && ss.StartTime.Value.Date == startTime.Date);
        }
    }
}
