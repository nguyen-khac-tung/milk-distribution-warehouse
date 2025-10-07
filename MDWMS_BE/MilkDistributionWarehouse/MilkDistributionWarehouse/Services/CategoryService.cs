using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface ICategoryService
    {
        Task<(string, PageResult<CategoryDto>)> GetCategories(Filter filter);
        Task<(string, PageResult<CategoryDto>)> GetCategories(PagedRequest request);
        Task<(string, CategoryDto)> CreateCategory(CategoryCreate category);
        Task<(string, CategoryDto)> UpdateCategory(CategoryUpdate categoryUpdate);
        Task<(string, CategoryDto)> DeleteCategory(int categoryId);
    }
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        public CategoryService(ICategoryRepository categoryRepository, IMapper mapper)
        {
            _categoryRepository = categoryRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<CategoryDto>)> GetCategories(Filter filter)
        {
            var categories = _categoryRepository.GetCategories();

            if (categories == null || !categories.Any())
                return ("The list category is null", new PageResult<CategoryDto>());

            if (!string.IsNullOrEmpty(filter.Search))
                categories = categories.Where(c => c.CategoryName.Contains(filter.Search) || c.Description.Contains(filter.Search));
            
            if(filter.Status != null)
                categories = categories.Where(c => c.Status == filter.Status);

            var categoryDtos = categories.ProjectTo<CategoryDto>(_mapper.ConfigurationProvider);

            var items = await categoryDtos.ToPagedResultAsync(filter.PageNumber, filter.PageSize);

            return ("", items);
        }

        public async Task<(string, PageResult<CategoryDto>)> GetCategories(PagedRequest request)
        {
            var categories = _categoryRepository.GetCategories();

            var categoryDtos = categories.ProjectTo<CategoryDto>(_mapper.ConfigurationProvider);

            var items = await categoryDtos.ToPagedResultAsync(request);

            return ("", items);
        }

        public async Task<(string, CategoryDto)> CreateCategory(CategoryCreate categoryCreate)
        {
            if (categoryCreate == null) return ("Category create is null", new CategoryDto());

            if (await _categoryRepository.IsDuplicateCategoryName(categoryCreate.CategoryName))
                return ("Category Name is exist", new CategoryDto());

            if (ContainsSpecialCharacters(categoryCreate.CategoryName))
                return ("Category Name is invalid", new CategoryDto());

            var category = _mapper.Map<Category>(categoryCreate);

            var createResult = await _categoryRepository.CreateCategory(category);

            if (createResult == null)
                return ("Create category is failed", new CategoryDto());

            return ("", _mapper.Map<CategoryDto>(category));
        }

        public async Task<(string, CategoryDto)> UpdateCategory(CategoryUpdate categoryUpdate)
        {
            if (categoryUpdate == null) return ("Category update is null", new CategoryDto());

            var categoryExist = await _categoryRepository.GetCategoryByCategoryId(categoryUpdate.CategoryId);

            if (categoryExist == null)
                return ("Category is not exist", new CategoryDto());

            if (await _categoryRepository.IsDuplicationByIdAndName(categoryUpdate.CategoryId, categoryUpdate.CategoryName))
                return ("Category Name is exist", new CategoryDto());

            if (ContainsSpecialCharacters(categoryUpdate.CategoryName))
                return ("Category Name is invalid", new CategoryDto());

            _mapper.Map(categoryUpdate, categoryExist);

            var updateResult = await _categoryRepository.UpdateCategory(categoryExist);
            if (updateResult == null)
                return ("Update category is fail", new CategoryDto());

            return ("", _mapper.Map<CategoryDto>(categoryExist));
        }

        public async Task<(string, CategoryDto)> DeleteCategory(int categoryId)
        {
            if (categoryId == 0) 
                return ("CategoryId is invalid", new CategoryDto());

            var categoryExist = await _categoryRepository.GetCategoryByCategoryId(categoryId);

            if (categoryExist == null)
                return ("Category is not exist", new CategoryDto());

            if (await _categoryRepository.IsCategoryContainingGoodsAsync(categoryId))
                return ("Cannot delete, category is in use", new CategoryDto());

            categoryExist.Status = CommonStatus.Deleted;
            categoryExist.UpdateAt = DateTime.Now;

            var resultDelete = await _categoryRepository.UpdateCategory(categoryExist);
            if (resultDelete == null) 
                return ("Delete category is fail", new CategoryDto());

            return ("", _mapper.Map<CategoryDto>(resultDelete));
        }

        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }

    }
}
