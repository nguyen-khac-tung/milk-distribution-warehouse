using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IAreaRepository
    {
        IQueryable<Area>? GetAreas();
        Task<Area?> GetAreaById(int areaId);
        Task<Area?> CreateArea(Area entity);
        Task<Area?> UpdateArea(Area entity);
        Task<bool> IsDuplicateAreaCode(string areaCode);
        Task<bool> IsDuplicationByIdAndCode(int areaId, string areaCode);
        Task<bool> HasDependentLocationsOrStocktakingsAsync(int areaId);
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
            return await _context.Areas
                .Where(a => a.AreaId == areaId && a.Status != CommonStatus.Deleted)
                .AsNoTracking()
                .FirstOrDefaultAsync();
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
                _context.Areas.Update(entity);
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
    }
}