using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface ICategoryService
    {
        Task<(string, PageResult<CategoryDto>)> GetCategories(PagedRequest request);
        Task<(string, CategoryDto)> CreateCategory(CategoryCreate category);
        Task<(string, CategoryDto)> UpdateCategory(CategoryUpdate categoryUpdate);
        Task<(string, CategoryDto)> DeleteCategory(int categoryId);
        Task<(string, List<CategoryDropDown>)> GetCategoryDropDown();
        Task<(string, CategoryUpdateStatus)> UpdateCategoryStatus(CategoryUpdateStatus update);
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

        public async Task<(string, PageResult<CategoryDto>)> GetCategories(PagedRequest request)
        {
            var categories = _categoryRepository.GetCategories();

            var categoryDtos = categories.ProjectTo<CategoryDto>(_mapper.ConfigurationProvider);

            var items = await categoryDtos.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách danh mục trống.".ToMessageForUser(), new PageResult<CategoryDto> { });

            return ("", items);
        }

        public async Task<(string, List<CategoryDropDown>)> GetCategoryDropDown()
        {
            var categories = await _categoryRepository.GetCategories()
                .Where(c => c.Status == CommonStatus.Active).ToListAsync();

            var categoryDropDown = _mapper.Map<List<CategoryDropDown>>(categories);

            if (!categoryDropDown.Any())
                return ("Danh sách danh mục trống.".ToMessageForUser(), new List<CategoryDropDown>());

            return ("", categoryDropDown);
        }

        public async Task<(string, CategoryDto)> CreateCategory(CategoryCreate categoryCreate)
        {
            if (categoryCreate == null) return ("Category create is null", new CategoryDto());

            if (await _categoryRepository.IsDuplicationByName(null, categoryCreate.CategoryName))
                return ("Tên loại sản phẩm đã tồn tại trong hệ thống".ToMessageForUser(), new CategoryDto());

            var category = _mapper.Map<Category>(categoryCreate);

            var createResult = await _categoryRepository.CreateCategory(category);

            if (createResult == null)
                return ("Tạo loại sản phẩm thất bại".ToMessageForUser(), new CategoryDto());

            return ("", _mapper.Map<CategoryDto>(category));
        }

        public async Task<(string, CategoryDto)> UpdateCategory(CategoryUpdate categoryUpdate)
        {
            if (categoryUpdate == null) return ("Category update is null", new CategoryDto());

            var categoryExist = await _categoryRepository.GetCategoryByCategoryId(categoryUpdate.CategoryId);

            if (categoryExist == null)
                return ("Category is not exist", new CategoryDto());


            if (await _categoryRepository.IsDuplicationByName(categoryUpdate.CategoryId, categoryUpdate.CategoryName))
                return ("Tên danh mục đã tồn tại trong hệ thống".ToMessageForUser(), new CategoryDto());

            _mapper.Map(categoryUpdate, categoryExist);

            var updateResult = await _categoryRepository.UpdateCategory(categoryExist);
            if (updateResult == null)
                return ("Cập nhật danh mục thất bại".ToMessageForUser(), new CategoryDto());

            return ("", _mapper.Map<CategoryDto>(categoryExist));
        }

        public async Task<(string, CategoryUpdateStatus)> UpdateCategoryStatus(CategoryUpdateStatus update)
        {
            if (update.CategoryId <= 0)
                return ("CategoryId is invalid.", new CategoryUpdateStatus());

            var categoryExist = await _categoryRepository.GetCategoryByCategoryId(update.CategoryId);

            if (categoryExist == null)
                return ("Category is not exist", new CategoryUpdateStatus());

            if (categoryExist.Status == CommonStatus.Deleted || update.Status == CommonStatus.Deleted)
                return ("Danh mục đã bị xóa hoặc không thể chuyển sang trạng thái đã xóa".ToMessageForUser(), new CategoryUpdateStatus());

            bool isChangingToInactive = categoryExist.Status != CommonStatus.Inactive
                               && update.Status == CommonStatus.Inactive;

            if (isChangingToInactive)
            {
                var allGoodsInactive = await _categoryRepository.IsCategoryContainingGoodsInActive(update.CategoryId);

                if (!allGoodsInactive)
                    return ("Danh mục không thể vô hiệu hoá vì có sản phẩm đang liên kết với danh mục".ToMessageForUser(), new CategoryUpdateStatus());
            }

            categoryExist.Status = update.Status;
            categoryExist.UpdateAt = DateTime.Now;

            var updateResult = await _categoryRepository.UpdateCategory(categoryExist);

            if(updateResult == null)
                return ("Cập nhật danh mục thất bại.".ToMessageForUser(), new CategoryUpdateStatus());

            return ("", update);
        }

        public async Task<(string, CategoryDto)> DeleteCategory(int categoryId)
        {
            if (categoryId == 0)
                return ("CategoryId is invalid", new CategoryDto());

            var categoryExist = await _categoryRepository.GetCategoryByCategoryId(categoryId);

            if (categoryExist == null)
                return ("Category is not exist", new CategoryDto());

            if (await _categoryRepository.IsCategoryContainingGoodsAsync(categoryId))
                return ("Không thể xoá danh mục, danh mục đang được liên kết với sản phẩm".ToMessageForUser(), new CategoryDto());

            categoryExist.Status = CommonStatus.Deleted;
            categoryExist.UpdateAt = DateTime.Now;

            var resultDelete = await _categoryRepository.UpdateCategory(categoryExist);
            if (resultDelete == null)
                return ("Xoá danh mục thất bại".ToMessageForUser(), new CategoryDto());

            return ("", _mapper.Map<CategoryDto>(resultDelete));
        }

    }
}
