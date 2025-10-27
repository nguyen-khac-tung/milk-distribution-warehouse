using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using System.Linq;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ILocationRepository
    {
        IQueryable<Location>? GetLocations();
        Task<Location?> CreateLocation(Location entity);
        Task<Location?> GetLocationById(int locationId);
        Task<Location?> UpdateLocation(Location entity);
        Task<bool> HasDependentPalletsAsync(int locationId);
        Task<List<Location>> GetActiveLocationsAsync();
        Task<Location> GetLocationPallet(string locationcode);
        Task<List<string>> GetExistingLocationKeys(List<int> areaIds);
        Task<int> CreateLocationsBulk(List<Location> locations);
        Task<bool> IsDuplicateLocationCodeInAreaAsync(string locationCode, int areaId, int? excludeId = null);
        Task<bool> InUsed(int locationId);
        Task<bool> UpdateIsAvailableAsync(int? locationId, bool isAvailable);
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

        public async Task<bool> HasDependentPalletsAsync(int locationId)
        {
            return await _context.Pallets.AnyAsync(p => p.LocationId == locationId && p.Status != CommonStatus.Deleted);
        }

        public async Task<List<Location>> GetActiveLocationsAsync()
        {
            return await _context.Locations
                .Where(l => l.Status == CommonStatus.Active && l.IsAvailable == true)
                .OrderBy(l => l.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Location> GetLocationPallet(string locationcode)
        {
            return await _context.Locations
                .FirstOrDefaultAsync(l => l.LocationCode.ToLower().Trim() == locationcode.ToLower().Trim() && l.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicateLocationCodeInAreaAsync(string locationCode, int areaId, int? excludeId = null)
        {
            var query = _context.Locations
                .Where(l => l.AreaId == areaId && l.Status != CommonStatus.Deleted);

            if (excludeId.HasValue)
                query = query.Where(l => l.LocationId != excludeId.Value);

            return await query.AnyAsync(l => l.LocationCode.ToLower().Trim() == locationCode.ToLower().Trim());
        }

        public async Task<List<string>> GetExistingLocationKeys(List<int> areaIds)
        {
            return await _context.Locations
                .Where(l => areaIds.Contains((int)l.AreaId) && l.Status != CommonStatus.Deleted)
                .Select(l => $"{l.AreaId}:{l.Rack.ToLower().Trim()}:{l.Row}:{l.Column}")
                .ToListAsync();
        }

        public async Task<int> CreateLocationsBulk(List<Location> locations)
        {
            try
            {
                await _context.Locations.AddRangeAsync(locations);
                return await _context.SaveChangesAsync();
            }
            catch
            {
                return 0;
            }
        }
        public async Task<bool> InUsed(int locationId)
        {
            return await _context.Locations
                .AnyAsync(l => l.LocationId == locationId && l.IsAvailable == false);
        }
        public async Task<bool> UpdateIsAvailableAsync(int? locationId, bool isAvailable)
        {
            if (locationId == null)
                return false;

            var location = await _context.Locations
                    .FirstOrDefaultAsync(l => l.LocationId == locationId);

            if (location == null)
                return false;

            location.IsAvailable = isAvailable;
            location.UpdateAt = DateTime.UtcNow;

            _context.Locations.Update(location);
            await _context.SaveChangesAsync();

            return true;
        }

    }
}