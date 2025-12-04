using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IStorageConditionRepository
    {
        IQueryable<StorageCondition> GetStorageConditions();
        Task<StorageCondition?> GetStorageConditionById(int storageConditionId);
        Task<StorageCondition?> CreateStorageCondition(StorageCondition entity);
        Task<StorageCondition?> UpdateStorageCondition(StorageCondition entity);
        Task<bool> IsDuplicateStorageConditionAsync(int? storageConditionId, decimal? temperatureMin, decimal? temperatureMax, decimal? humidityMin, decimal? humidityMax, string lightLevel);
        Task<bool> DeleteStorageCondition(int storageConditionId);
        Task<List<StorageCondition>> GetActiveStorageConditionsAsync();
        Task<bool> IsActiveStorageCondition(int storageConditionId);
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
                .Where(sc => sc.Status == CommonStatus.Active || sc.Status == CommonStatus.Inactive)
                .OrderByDescending(sc => sc.CreatedAt)
                .AsNoTracking();
        }

        public async Task<StorageCondition?> GetStorageConditionById(int storageConditionId)
        {
            return await _context.StorageConditions
                .Where(sc => sc.StorageConditionId == storageConditionId && sc.Status != CommonStatus.Deleted)
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

                entity.Status = CommonStatus.Deleted;
                entity.UpdateAt = DateTimeUtility.Now();
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> IsDuplicateStorageConditionAsync(int? storageConditionId, decimal? temperatureMin, decimal? temperatureMax, decimal? humidityMin, decimal? humidityMax, string lightLevel)
        {
            return await _context.StorageConditions
                .AnyAsync(sc =>
                    sc.Status != CommonStatus.Deleted &&
                    (!storageConditionId.HasValue || sc.StorageConditionId != storageConditionId) &&
                    sc.TemperatureMin == temperatureMin &&
                    sc.TemperatureMax == temperatureMax &&
                    sc.HumidityMin == humidityMin &&
                    sc.HumidityMax == humidityMax &&
                    sc.LightLevel == lightLevel);
        }

        public async Task<List<StorageCondition>> GetActiveStorageConditionsAsync()
        {
            return await _context.StorageConditions
                .Where(sc => sc.Status == CommonStatus.Active)
                .OrderByDescending(sc => sc.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> IsActiveStorageCondition(int storageConditionId)
        {
            return await _context.StorageConditions
                .AnyAsync(sc => sc.StorageConditionId == storageConditionId &&
                            sc.Status == CommonStatus.Active);
        }
    }
}