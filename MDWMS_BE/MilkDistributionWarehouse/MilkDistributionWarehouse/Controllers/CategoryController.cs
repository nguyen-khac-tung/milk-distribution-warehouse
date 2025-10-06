using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.Common;
using MilkDistributionWarehouse.Models.DTOs;
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
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<string>.ErrorResponse("Invalid data"));
            string msg = await _categoryService.CreateCategory(categoryCreate);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<CategoryCreate>.SuccessResponse(categoryCreate));
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateCategory([FromBody]CategoryUpdate categoryUpdate)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<string>.ErrorResponse("Invalid data"));
            string msg = await _categoryService.UpdateCategory(categoryUpdate);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<CategoryUpdate>.SuccessResponse(categoryUpdate));
        }

        [HttpDelete("Delete/{categoryId}")]
        public async Task<IActionResult> DeleteCategory(int categoryId)
        {
            string msg = await _categoryService.DeleteCategory(categoryId);
            if(!string.IsNullOrEmpty(msg)) 
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<int>.SuccessResponse(categoryId));
        }

    }
}
