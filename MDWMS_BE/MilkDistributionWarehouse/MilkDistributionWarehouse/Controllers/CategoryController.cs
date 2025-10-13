using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : Controller
    {
        private readonly ICategoryService _categoryService;
        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet("GetCategoriesDropDown")]
        public async Task<IActionResult> GetCategoriesDropDown()
        {
            var (msg, categoriesDropDown) = await _categoryService.GetCategoryDropDown();
            if (msg.Length > 0)
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<CategoryDropDown>>.ToResultOk(categoriesDropDown);
        }

        [HttpPost("Categories")]
        public async Task<IActionResult> GetCategories(PagedRequest request)
        {
            var(msg, categories) = await _categoryService.GetCategories(request);
            if(msg.Length > 0) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<CategoryDto>>.ToResultOk(categories);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateCategory([FromBody]CategoryCreate categoryCreate)
        {
            var (msg, category) = await _categoryService.CreateCategory(categoryCreate);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryDto>.ToResultOk(category);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateCategory([FromBody]CategoryUpdate categoryUpdate)
        {
            var(msg,category) = await _categoryService.UpdateCategory(categoryUpdate);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryDto>.ToResultOk(category);
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateCategoryStatus([FromBody] CategoryUpdateStatus update)
        {
            var (msg, categoryStatus) = await _categoryService.UpdateCategoryStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryUpdateStatus>.ToResultOk(categoryStatus);
        }

        [HttpDelete("Delete/{categoryId}")]
        public async Task<IActionResult> DeleteCategory(int categoryId)
        {
            var (msg, category) = await _categoryService.DeleteCategory(categoryId);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryDto>.ToResultOk(category);
        }

    }
}
