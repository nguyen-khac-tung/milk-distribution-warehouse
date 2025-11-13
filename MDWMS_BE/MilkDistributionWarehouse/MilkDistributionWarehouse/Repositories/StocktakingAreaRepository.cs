using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingAreaRepository
    {
        Task<StocktakingArea?> GetStocktakingAreaByStocktakingSheetIdAndAssignTo(string stocktakingSheetId, int? assignTo);
        Task<List<Guid>> GetAreaIdsBySheetId(string stocktakingSheetId);
        Task<List<StocktakingArea>> GetStocktakingAreasByStocktakingSheetId(string stocktakingSheetId);
        Task<int?> CreateStocktakingAreaBulk(List<StocktakingArea> creates);
        Task<int?> UpdateStocktakingAreaBulk(List<StocktakingArea> updates);
        Task<bool> IsStocktakingAreaAssignTo(int? areaId, string stocktakingSheetId, int assignTo);
        Task<bool> IsCheckStocktakingAreaExist(string stocktakingSheetId);
    }
    public class StocktakingAreaRepository : IStocktakingAreaRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingAreaRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<Guid>> GetAreaIdsBySheetId(string stocktakingSheetId)
        {
            return await _context.StocktakingAreas
                .Where(sa => sa.StocktakingSheetId.Equals(stocktakingSheetId))
                .Select(sa => sa.StocktakingAreaId)
                .ToListAsync();
        }

        public async Task<StocktakingArea?> GetStocktakingAreaByStocktakingSheetIdAndAssignTo(string stocktakingSheetId, int? assignTo)
        {
            return await _context.StocktakingAreas
                .Include(sa => sa.Area)
                    .ThenInclude(a => a.StorageCondition)
                .Include(sa => sa.AssignToNavigation)
                .Include(sa => sa.StocktakingLocations)
                    .ThenInclude(sl => sl.Location)
                .FirstOrDefaultAsync(sa => 
                                sa.StocktakingSheetId.Equals(stocktakingSheetId) &&
                                (assignTo == null || sa.AssignTo == assignTo));
        }

        public async Task<List<StocktakingArea>> GetStocktakingAreasByStocktakingSheetId(string stocktakingSheetId)
        {
            return await _context.StocktakingAreas
                .Where(sa => sa.StocktakingSheetId.Equals(stocktakingSheetId))
                .ToListAsync();
        }

        public async Task<int?> CreateStocktakingAreaBulk(List<StocktakingArea> creates)
        {
            try
            {
                await _context.StocktakingAreas.AddRangeAsync(creates);
                await _context.SaveChangesAsync();
                return creates.Count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int?> UpdateStocktakingAreaBulk(List<StocktakingArea> updates)
        {
            try
            {
                _context.StocktakingAreas.UpdateRange(updates);
                await _context.SaveChangesAsync();
                return updates.Count;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<bool> IsStocktakingAreaAssignTo(int? areaId, string stocktakingSheetId, int assignTo)
        {
            return await _context.StocktakingAreas
                .AnyAsync(sa => sa.StocktakingSheetId.Equals(stocktakingSheetId)
                            && (areaId == null || areaId != sa.AreaId)
                            && sa.AssignTo == assignTo);
        }

        public async Task<bool> IsCheckStocktakingAreaExist(string stocktakingSheetId)
        {
            return await _context.StocktakingAreas.AnyAsync(sa => sa.StocktakingSheetId.Equals(stocktakingSheetId));
        }

    }
}
