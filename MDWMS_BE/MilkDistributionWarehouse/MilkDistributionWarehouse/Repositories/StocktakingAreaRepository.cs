using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStocktakingAreaRepository
    {
        Task<StocktakingArea?> GetStocktakingAreaByStocktakingSheetId(Guid stocktakingSheetId);
        Task<List<Guid>> GetAreaIdsBySheetId(Guid stocktakingSheetId);
        Task<int?> CreateStocktakingAreaBulk(List<StocktakingArea> creates);
        Task<bool> IsStocktakingAreaAssignTo(int? areaId, Guid stocktakingSheetId, int assignTo);
        Task<bool> IsCheckStocktakingAreaExist(Guid stocktakingSheetId);
    }
    public class StocktakingAreaRepository : IStocktakingAreaRepository
    {
        private readonly WarehouseContext _context;
        public StocktakingAreaRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<StocktakingArea?> GetStocktakingAreaByStocktakingSheetId (Guid stocktakingSheetId)
        {
            return await _context.StocktakingAreas
                .Include(sa => sa.Area)
                    .ThenInclude(a => a.StorageCondition)
                .Include(sa => sa.AssignToNavigation)
                .Include(sa => sa.StocktakingLocations)
                    .ThenInclude(sl => sl.Location)
                .FirstOrDefaultAsync(sa => sa.StocktakingSheetId == stocktakingSheetId);
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

        public async Task<bool> IsStocktakingAreaAssignTo(int? areaId, Guid stocktakingSheetId, int assignTo)
        {
            return await _context.StocktakingAreas
                .AnyAsync(sa => sa.StocktakingSheetId == stocktakingSheetId 
                            && (areaId == null || areaId != sa.AreaId)
                            && sa.AssignTo == assignTo);
        }

        public async Task<bool> IsCheckStocktakingAreaExist(Guid stocktakingSheetId)
        {
            return await _context.StocktakingAreas.AnyAsync(sa => sa.StocktakingSheetId == stocktakingSheetId);
        }

        public async Task<List<Guid>> GetAreaIdsBySheetId (Guid stocktakingSheetId)
        {
            return await _context.StocktakingAreas
                .Where(sa => sa.StocktakingSheetId == stocktakingSheetId)
                .Select(sa => sa.StocktakingAreaId)
                .ToListAsync();
        }
    }
}
