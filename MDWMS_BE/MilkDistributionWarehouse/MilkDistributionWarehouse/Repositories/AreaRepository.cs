using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IAreaRepository
    {
        List<Area> GetAreas();
        Area? GetAreaById(int areaId);
        Area? CreateArea(Area entity);
        Area? UpdateArea(Area entity);
        bool DeleteArea(int areaId);
    }

    public class AreaRepository : IAreaRepository
    {
        private readonly WarehouseContext _context;

        public AreaRepository(WarehouseContext context)
        {
            _context = context;
        }

        public List<Area> GetAreas()
        {
            return _context.Areas
                .Where(a => a.Status != CommonStatus.Inactive)
                .ToList();
        }

        public Area? GetAreaById(int areaId)
        {
            return _context.Areas
                .Where(a => a.AreaId == areaId && a.Status != CommonStatus.Inactive)
                .FirstOrDefault();
        }

        public Area? CreateArea(Area entity)
        {
            try
            {
                _context.Areas.Add(entity);
                _context.SaveChanges();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public Area? UpdateArea(Area entity)
        {
            try
            {
                _context.Areas.Update(entity);
                _context.SaveChanges();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public bool DeleteArea(int areaId)
        {
            try
            {
                var entity = _context.Areas
                    .Where(a => a.AreaId == areaId && a.Status != CommonStatus.Inactive)
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