using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ICategoryRepository
    {
        Task<List<Category>>? GetCategories();
        Task<Category?> CreateCategory(Category category);
        Task<bool> IsDuplicateCategoryName(string categoryName);
        Task<Category?> GetCategoryByCategoryId(int categoryId);
        Task<bool> IsDuplicationByIdAndName(int categoryId, string categoryName);
        Task<Category?> UpdateCategory(Category category);
        Task<bool> IsCategoryContainingGoodsAsync(int categoryId);

    }
    public class CategoryRepository : ICategoryRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public CategoryRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public async Task<List<Category>>? GetCategories()
        {
            return await _warehouseContext.Categories.ToListAsync();
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

        public async Task<bool> IsDuplicateCategoryName(string categoryName)
        {
            return await _warehouseContext.Categories.AnyAsync(c => c.CategoryName.ToLower().Trim().Equals(categoryName.ToLower().Trim()) && c.Status != CommonStatus.Deleted);
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

        public async Task<bool> IsDuplicationByIdAndName(int categoryId, string categoryName)
        {
            return await _warehouseContext.Categories.AnyAsync(c => c.CategoryId != categoryId
                            && c.CategoryName.ToLower().Trim().Equals(categoryName.ToLower().Trim())
                            && c.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsCategoryContainingGoodsAsync(int categoryId)
        {
            return await _warehouseContext.Goods.AnyAsync(g => g.CategoryId == categoryId && g.Status != CommonStatus.Deleted);
        }


    }
}
