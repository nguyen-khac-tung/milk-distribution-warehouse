using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IAreaRepository
    {
        IQueryable<Area>? GetAreas();
        Task<Area?> GetAreaById(int areaId);
        Task<Area?> GetAreaToCreateLocation(int areaId);
        Task<List<AreaDto.AreaLocationAvailableDto>> GetAvailableLocationCountByAreaAsync();
        Task<Area?> CreateArea(Area entity);
        Task<Area?> UpdateArea(Area entity);
        Task<bool> IsDuplicateAreaCode(string areaCode);
        Task<bool> IsDuplicationByIdAndCode(int areaId, string areaCode);
        Task<bool> HasDependentLocationsOrStocktakingsAsync(int areaId);
        Task<bool> VerifyStorageConditionUsage(int storageConditionId);
        Task<List<Area>> GetActiveAreasAsync();
        Task<List<Area>> GetActiveAreasByStocktakingId();
    }

    public class AreaRepository : IAreaRepository
    {
        private readonly WarehouseContext _context;

        public AreaRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Area>? GetAreas()
        {
            return _context.Areas
                .Where(a => a.Status == CommonStatus.Active || a.Status == CommonStatus.Inactive)
                .OrderByDescending(a => a.CreatedAt)
                .AsNoTracking();
        }

        public async Task<Area?> GetAreaById(int areaId)
        {
            return await _context.Areas.Include(a => a.StorageCondition)
                .Where(a => a.AreaId == areaId && a.Status != CommonStatus.Deleted)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }
        public async Task<Area?> GetAreaToCreateLocation(int areaId)
        {
            return await _context.Areas.Include(a => a.StorageCondition)
                .Where(a => a.AreaId == areaId && a.Status == CommonStatus.Active)
                .AsNoTracking()
                .FirstOrDefaultAsync();
        }
        public async Task<List<AreaDto.AreaLocationAvailableDto>> GetAvailableLocationCountByAreaAsync()
        {
            return await _context.Areas
                .Where(a => a.Status == CommonStatus.Active)
                .Select(a => new AreaDto.AreaLocationAvailableDto
                {
                    AreaId = a.AreaId,
                    AreaName = a.AreaName,
                    TotalLocations = a.Locations.Count(l => l.Status == CommonStatus.Active),
                    AvailableLocationCount = a.Locations.Count(l => l.IsAvailable == true && l.Status == CommonStatus.Active)
                })
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Area?> CreateArea(Area entity)
        {
            try
            {
                await _context.Areas.AddAsync(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Không thể tạo khu vực.", ex);
            }
        }

        public async Task<Area?> UpdateArea(Area entity)
        {
            try
            {
                entity.StorageCondition = null;
                _context.Areas.Attach(entity);
                _context.Entry(entity).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return entity;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Không thể cập nhật khu vực.", ex);
            }
        }

        public async Task<bool> IsDuplicateAreaCode(string areaCode)
        {
            return await _context.Areas.AnyAsync(a =>
                a.AreaCode.ToLower().Trim() == areaCode.ToLower().Trim() &&
                a.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicationByIdAndCode(int areaId, string areaCode)
        {
            return await _context.Areas.AnyAsync(a =>
                a.AreaId != areaId &&
                a.AreaCode.ToLower().Trim() == areaCode.ToLower().Trim() &&
                a.Status != CommonStatus.Deleted);
        }

        public async Task<bool> HasDependentLocationsOrStocktakingsAsync(int areaId)
        {
            return await _context.Locations.AnyAsync(l => l.AreaId == areaId && l.Status != CommonStatus.Deleted) ||
                   await _context.StocktakingAreas.AnyAsync(sa => sa.AreaId == areaId);
        }

        public async Task<bool> VerifyStorageConditionUsage(int storageConditionId)
        {
            return _context.Areas.Any(a =>
                a.StorageConditionId == storageConditionId &&
                a.Status != CommonStatus.Deleted);
        }
        public async Task<List<Area>> GetActiveAreasAsync()
        {
            return await _context.Areas
                .Include(a => a.Locations)
                .Include(a => a.StorageCondition)
                .Where(a => a.Status == CommonStatus.Active)
                .OrderBy(a => a.AreaName)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Area>> GetActiveAreasByStocktakingId()
        {
            return await _context.Areas
                .Where(a => a.Status == CommonStatus.Active)
                .Include(a => a.StorageCondition)
                .Include(a => a.Locations)
                .Where(a => a.Status == CommonStatus.Active && a.Locations.Any())
                .AsNoTracking()
                .ToListAsync();
        }

    }
}