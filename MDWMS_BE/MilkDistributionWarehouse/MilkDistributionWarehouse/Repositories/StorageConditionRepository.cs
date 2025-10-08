using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStorageConditionRepository
    {
        IQueryable<StorageCondition> GetStorageConditions();
        Task<StorageCondition?> GetStorageConditionById(int storageConditionId);
        Task<StorageCondition?> CreateStorageCondition(StorageCondition entity);
        Task<StorageCondition?> UpdateStorageCondition(StorageCondition entity);
        Task<bool> DeleteStorageCondition(int storageConditionId);
    }

    public class StorageConditionRepository : IStorageConditionRepository
    {
        private readonly WarehouseContext _context;

        public StorageConditionRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<StorageCondition> GetStorageConditions()
        {
            return _context.StorageConditions
                .Where(sc => sc.Status != CommonStatus.Inactive)
                .AsNoTracking();
        }

        public async Task<StorageCondition?> GetStorageConditionById(int storageConditionId)
        {
            return await _context.StorageConditions
                .Where(sc => sc.StorageConditionId == storageConditionId && sc.Status != CommonStatus.Inactive)
                .FirstOrDefaultAsync();
        }

        public async Task<StorageCondition?> CreateStorageCondition(StorageCondition entity)
        {
            try
            {
                await _context.StorageConditions.AddAsync(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public async Task<StorageCondition?> UpdateStorageCondition(StorageCondition entity)
        {
            try
            {
                _context.StorageConditions.Update(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> DeleteStorageCondition(int storageConditionId)
        {
            try
            {
                var entity = await _context.StorageConditions
                    .Where(sc => sc.StorageConditionId == storageConditionId && sc.Status != CommonStatus.Inactive)
                    .FirstOrDefaultAsync();

                if (entity == null) return false;

                entity.Status = CommonStatus.Inactive;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}