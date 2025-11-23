using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{

    public interface IStocktakingSheetRepository
    {
        IQueryable<StocktakingSheet> GetStocktakingSheet();
        Task<StocktakingSheet?> GetStocktakingSheetById(string stocktakingSheetId);
        Task<int> CreateStocktakingSheet(StocktakingSheet create);
        Task<int> UpdateStockingtakingSheet(StocktakingSheet update);
        Task<int> DeleteStocktakingSheet(StocktakingSheet delete);
        Task<bool> IsDuplicationStartTimeStocktakingSheet(string? stocktakingSheetId, DateTime startTime);
        Task<bool> HasActiveStocktakingInProgressAsync();
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

        public async Task<StocktakingSheet?> GetStocktakingSheetById(string stocktakingSheetId)
        {
            return await _context.StocktakingSheets

                .Include(ss => ss.CreatedByNavigation)

                .Include(ss => ss.StocktakingAreas)
                    .ThenInclude(sa => sa.AssignToNavigation)

                .Include(ss => ss.StocktakingAreas)
                    .ThenInclude(sa => sa.Area)
                        .ThenInclude(a => a.StorageCondition)

                .Include(ss => ss.StocktakingAreas)
                    .ThenInclude(sa => sa.Area)
                        .ThenInclude(a => a.Locations)

                .AsSplitQuery()
                .AsNoTracking()
                .FirstOrDefaultAsync(ss => ss.StocktakingSheetId.Equals(stocktakingSheetId));
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
                var trackedEntity = await _context.StocktakingSheets
                    .FirstOrDefaultAsync(ss => ss.StocktakingSheetId == update.StocktakingSheetId);

                if (trackedEntity != null)
                {
                    trackedEntity.Status = update.Status;
                    trackedEntity.StartTime = update.StartTime;
                    trackedEntity.Note = update.Note;
                    trackedEntity.UpdateAt = update.UpdateAt;
                }
                else
                {
                    update.StocktakingAreas = null;
                    update.CreatedByNavigation = null;

                    _context.StocktakingSheets.Attach(update);
                    _context.Entry(update).Property(x => x.Status).IsModified = true;
                    _context.Entry(update).Property(x => x.StartTime).IsModified = true;
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

        public async Task<int> DeleteStocktakingSheet(StocktakingSheet delete)
        {
            try
            {
                _context.StocktakingSheets.Remove(delete);
                await _context.SaveChangesAsync();
                return 1;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> IsDuplicationStartTimeStocktakingSheet(string? stocktakingSheetId, DateTime startTime)
        {
            return await _context.StocktakingSheets
                .AnyAsync(ss => (stocktakingSheetId == null || !stocktakingSheetId.Equals(ss.StocktakingSheetId))
                && ss.StartTime.HasValue
                && ss.StartTime.Value.Date == startTime.Date);
        }

        public async Task<bool> HasActiveStocktakingInProgressAsync()
        {
            return await _context.StocktakingSheets
                .AnyAsync(ss => ss.Status == StocktakingStatus.InProgress 
                    || ss.Status == StocktakingStatus.PendingApproval 
                    || ss.Status == StocktakingStatus.Approved);
        }
    }
}
