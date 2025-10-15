using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ILocationRepository
    {
        IQueryable<Location>? GetLocations();
        Task<Location?> CreateLocation(Location entity);
        Task<bool> IsDuplicateLocationCode(string locationCode);
        Task<Location?> GetLocationById(int locationId);
        Task<bool> IsDuplicationByIdAndCode(int locationId, string locationCode);
        Task<Location?> UpdateLocation(Location entity);
        Task<bool> HasDependentPalletsOrStocktakingsAsync(int locationId);
        Task<bool> IsDuplicateLocationAsync(string rack, int? row, int? column, int areaId, int? excludeId = null);
    }

    public class LocationRepository : ILocationRepository
    {
        private readonly WarehouseContext _context;

        public LocationRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Location>? GetLocations()
        {
            return _context.Locations
                .Include(l => l.Area)
                .Where(l => l.Status != CommonStatus.Deleted)
                .OrderByDescending(l => l.CreatedAt)
                .AsNoTracking();
        }

        public async Task<Location?> CreateLocation(Location entity)
        {
            try
            {
                await _context.Locations.AddAsync(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> IsDuplicateLocationCode(string locationCode)
        {
            return await _context.Locations.AnyAsync(l =>
                l.LocationCode.ToLower().Trim() == locationCode.ToLower().Trim() &&
                l.Status != CommonStatus.Deleted);
        }

        public async Task<Location?> UpdateLocation(Location entity)
        {
            try
            {
                _context.Locations.Update(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Location?> GetLocationById(int locationId)
        {
            return await _context.Locations
                .Include(l => l.Area)
                .FirstOrDefaultAsync(l => l.LocationId == locationId);
        }

        public async Task<bool> IsDuplicationByIdAndCode(int locationId, string locationCode)
        {
            return await _context.Locations.AnyAsync(l =>
                l.LocationId != locationId &&
                l.LocationCode.ToLower().Trim() == locationCode.ToLower().Trim() &&
                l.Status != CommonStatus.Deleted);
        }

        public async Task<bool> HasDependentPalletsOrStocktakingsAsync(int locationId)
        {
            return await _context.Pallets.AnyAsync(p => p.LocationId == locationId && p.Status != CommonStatus.Deleted) ||
                   await _context.StocktakingLocations.AnyAsync(sl => sl.LocationId == locationId && sl.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicateLocationAsync(string rack, int? row, int? column, int areaId, int? excludeId = null)
        {
            var query = _context.Locations
                .Where(l => l.AreaId == areaId && l.Status != CommonStatus.Deleted);

            if (excludeId.HasValue)
                query = query.Where(l => l.LocationId != excludeId.Value);

            return await query.AnyAsync(l =>
                l.Rack.ToLower().Trim() == rack.ToLower().Trim()
                || (l.Row == row && l.Column == column));
        }
    }
}