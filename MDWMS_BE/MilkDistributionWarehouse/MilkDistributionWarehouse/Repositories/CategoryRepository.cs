using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ICategoryRepository
    {
        IQueryable<Category>? GetCategories();
        Task<Category?> CreateCategory(Category category);
        Task<Category?> GetCategoryByCategoryId(int categoryId);
        Task<bool> IsDuplicationByName(int? categoryId, string categoryName);
        Task<Category?> UpdateCategory(Category category);
        Task<bool> IsCategoryContainingGoodsAsync(int categoryId); 
        Task<bool> IsCategoryContainingGoodsInActive(int categoryId);

    }
    public class CategoryRepository : ICategoryRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public CategoryRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public IQueryable<Category>? GetCategories()
        {
            return _warehouseContext.Categories.Where(c => c.Status != CommonStatus.Deleted).OrderByDescending(c => c.CreatedAt).AsNoTracking();
        }

        public async Task<Category?> CreateCategory(Category category)
        {
            try
            {
                await _warehouseContext.Categories.AddAsync(category);
                await _warehouseContext.SaveChangesAsync();
                return category;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Category?> UpdateCategory(Category category)
        {
            try
            {
                _warehouseContext.Categories.Update(category);
                await (_warehouseContext.SaveChangesAsync());
                return category;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Category?> GetCategoryByCategoryId(int categoryId)
        {
            return await _warehouseContext.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicationByName(int? categoryId, string categoryName)
        {
            return await _warehouseContext.Categories.AnyAsync(c => (c.CategoryId != categoryId || categoryId == null)
                            && c.CategoryName.ToLower().Trim().Equals(categoryName.ToLower().Trim())
                            && c.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsCategoryContainingGoodsAsync(int categoryId)
        {
            return await _warehouseContext.Goods.AnyAsync(g => g.CategoryId == categoryId && g.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsCategoryContainingGoodsInActive(int categoryId)
        {
            IQueryable<Good> goods = _warehouseContext.Goods.Where(g => g.CategoryId == categoryId && g.Status != CommonStatus.Deleted);

            return !(await goods.AnyAsync(g => g.Status != CommonStatus.Inactive));
        }
    }
}
