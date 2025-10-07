using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Utilities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;

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

        [HttpPost("Categories")]
        public async Task<IResult> GetCategories(Filter filter)
        {
            var(msg, categories) = await _categoryService.GetCategories(filter);
            if(msg.Length > 0) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<CategoryDto>>.ToResultOk(categories);
        }

        [HttpPost("Create")]
        public async Task<IResult> CreateCategory([FromBody]CategoryCreate categoryCreate)
        {
            var (msg, category) = await _categoryService.CreateCategory(categoryCreate);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryDto>.ToResultOk(category);
        }

        [HttpPut("Update")]
        public async Task<IResult> UpdateCategory([FromBody]CategoryUpdate categoryUpdate)
        {
            var(msg,category) = await _categoryService.UpdateCategory(categoryUpdate);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryDto>.ToResultOk(category);
        }

        [HttpDelete("Delete/{categoryId}")]
        public async Task<IResult> DeleteCategory(int categoryId)
        {
            var (msg, category) = await _categoryService.DeleteCategory(categoryId);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<CategoryDto>.ToResultOk(category);
        }

    }
}
