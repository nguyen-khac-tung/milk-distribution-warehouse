using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.Common;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;
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

        [HttpPost("Categories")]
        public async Task<IActionResult> GetCategories(CategoryFilter categoryFilter)
        {
            var(msg, categories) = await _categoryService.GetCategories(categoryFilter);
            if(msg.Length > 0) 
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<List<CategoryDto>>.SuccessResponse(categories));
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateCategory([FromBody]CategoryCreate categoryCreate)
        {
            var (msg, category) = await _categoryService.CreateCategory(categoryCreate);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<CategoryDto>.SuccessResponse(category));
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateCategory([FromBody]CategoryUpdate categoryUpdate)
        {
            var(msg,category) = await _categoryService.UpdateCategory(categoryUpdate);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<CategoryDto>.SuccessResponse(category));
        }

        [HttpDelete("Delete/{categoryId}")]
        public async Task<IActionResult> DeleteCategory(int categoryId)
        {
            var (msg, category) = await _categoryService.DeleteCategory(categoryId);
            if(!string.IsNullOrEmpty(msg)) 
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<CategoryDto>.SuccessResponse(category));
        }

    }
}
