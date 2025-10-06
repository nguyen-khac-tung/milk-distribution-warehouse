using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface ICategoryService
    {
        Task<(string, List<CategoryDto>)> GetCategories(CategoryFilter categoryFilter);
        Task<string> CreateCategory(CategoryCreate category);
        Task<string> UpdateCategory(CategoryUpdate categoryUpdate);
        Task<string> DeleteCategory(int categoryId);
    }
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }
        

        public async Task<(string, List<CategoryDto>)> GetCategories(CategoryFilter categoryFilter)
        {
            var categories = await _categoryRepository.GetCategories();

            if(!string.IsNullOrEmpty(categoryFilter.CategorySearch))
                categories = categories.Where(c => c.CategoryName.Contains(categoryFilter.CategorySearch) || c.Description.Contains(categoryFilter.CategorySearch)).ToList();
            
            if(categoryFilter.Status != null)
                categories = categories.Where(c => c.Status ==  categoryFilter.Status).ToList();

            if(categories == null || !categories.Any()) 
                return ("The list category is null", new List<CategoryDto>());

            var categoryDtos = categories.Select(c => new CategoryDto
            {
                CategoryName = c.CategoryName,
                Description = c.Description,
                Status = c.Status ?? 0
            }).ToList();

            return ("", categoryDtos);
        }

        public async Task<string> CreateCategory(CategoryCreate categoryCreate)
        {
            if (categoryCreate == null) return "Category create is null";

            if (await _categoryRepository.IsDuplicateCategoryName(categoryCreate.CategoryName))
                return "Category Name is exist";

            if (ContainsSpecialCharacters(categoryCreate.CategoryName))
                return "Category Name is invalid";

            var category = new Category
            {
                CategoryName = categoryCreate.CategoryName.Trim(),
                Description = categoryCreate.Description.Trim(),
                Status = CommonStatus.Active,
                CreatedAt = DateTime.Now,
                UpdateAt = null
            };

            var createResult = await _categoryRepository.CreateCategory(category);

            if (createResult == 0)
                return "Create category is failed";

            return "";
        }

        public async Task<string> UpdateCategory(CategoryUpdate categoryUpdate)
        {
            if (categoryUpdate == null) return "Category update is null";

            var categoryExist = await _categoryRepository.IsCategoryExist(categoryUpdate.CategoryId);

            if (categoryExist == null)
                return "Category is not exist";

            if (await _categoryRepository.IsDuplicationByIdAndName(categoryUpdate.CategoryId, categoryUpdate.CategoryName))
                return "Category Name is exist";

            if (ContainsSpecialCharacters(categoryUpdate.CategoryName))
                return "Category Name is invalid";

            categoryExist.CategoryName = categoryUpdate.CategoryName.Trim();
            categoryExist.Description = categoryUpdate.Description.Trim();
            categoryExist.Status = categoryUpdate.Status;
            categoryExist.UpdateAt = DateTime.Now;

            var updateResult = await _categoryRepository.UpdateCategory(categoryExist);
            if (updateResult == 0)
                return "Update category is fail";

            return "";
        }

        public async Task<string> DeleteCategory(int categoryId)
        {
            if (categoryId == 0) 
                return "CategoryId is invalid";

            var categoryExist = await _categoryRepository.IsCategoryExist(categoryId);

            if (categoryExist == null)
                return "Category is not exist";

            if (await _categoryRepository.IsCategoryContainingProductsAsync(categoryId))
                return "Cannot delete, category is in use";

            categoryExist.Status = CommonStatus.Deleted;
            categoryExist.UpdateAt = DateTime.Now;

            var resultDelete = await _categoryRepository.UpdateCategory(categoryExist);
            if (resultDelete == 0) 
                return "Delete category is fail";

            return "";
        }

        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }

    }
}
