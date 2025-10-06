using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStorageConditionRepository
    {
        List<StorageCondition> GetStorageConditions();
        StorageCondition? GetStorageConditionById(int storageConditionId);
        StorageCondition? CreateStorageCondition(StorageCondition entity);
        StorageCondition? UpdateStorageCondition(StorageCondition entity);
        bool DeleteStorageCondition(int storageConditionId);
    }

    public class StorageConditionRepository : IStorageConditionRepository
    {
        private readonly WarehouseContext _context;

        public StorageConditionRepository(WarehouseContext context)
        {
            _context = context;
        }

        public List<StorageCondition> GetStorageConditions()
        {
            return _context.StorageConditions
                .Where(sc => sc.Status != CommonStatus.Inactive)
                .ToList();
        }

        public StorageCondition? GetStorageConditionById(int storageConditionId)
        {
            return _context.StorageConditions
                .Where(sc => sc.StorageConditionId == storageConditionId && sc.Status != CommonStatus.Inactive)
                .FirstOrDefault();
        }

        public StorageCondition? CreateStorageCondition(StorageCondition entity)
        {
            try
            {
                _context.StorageConditions.Add(entity);
                _context.SaveChanges();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public StorageCondition? UpdateStorageCondition(StorageCondition entity)
        {
            try
            {
                _context.StorageConditions.Update(entity);
                _context.SaveChanges();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public bool DeleteStorageCondition(int storageConditionId)
        {
            try
            {
                var entity = _context.StorageConditions
                    .Where(sc => sc.StorageConditionId == storageConditionId && sc.Status != CommonStatus.Inactive)
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