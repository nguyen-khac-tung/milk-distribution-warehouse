using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ILocationRepository
    {
        List<Location> GetLocations();
        Location? GetLocationById(int locationId);
        Location? CreateLocation(Location entity);
        Location? UpdateLocation(Location entity);
        bool DeleteLocation(int locationId);
    }

    public class LocationRepository : ILocationRepository
    {
        private readonly WarehouseContext _context;

        public LocationRepository(WarehouseContext context)
        {
            _context = context;
        }

        public List<Location> GetLocations()
        {
            return _context.Locations
                .Where(l => l.Status != CommonStatus.Inactive)
                .ToList();
        }

        public Location? GetLocationById(int locationId)
        {
            return _context.Locations
                .Where(l => l.LocationId == locationId && l.Status != CommonStatus.Inactive)
                .FirstOrDefault();
        }

        public Location? CreateLocation(Location entity)
        {
            try
            {
                _context.Locations.Add(entity);
                _context.SaveChanges();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public Location? UpdateLocation(Location entity)
        {
            try
            {
                _context.Locations.Update(entity);
                _context.SaveChanges();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public bool DeleteLocation(int locationId)
        {
            try
            {
                var entity = _context.Locations
                    .Where(l => l.LocationId == locationId && l.Status != CommonStatus.Inactive)
                    .FirstOrDefault();

                if (entity == null) return false;

                entity.Status = CommonStatus.Inactive;
                _context.SaveChanges();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}