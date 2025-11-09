using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using static MilkDistributionWarehouse.Models.DTOs.BackOrderDto;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BackOrderController : ControllerBase
    {
        private readonly IBackOrderService _backOrderService;

        public BackOrderController(IBackOrderService backOrderService)
        {
            _backOrderService = backOrderService;
        }

        [HttpPost("BackOrders")]
        public async Task<IActionResult> GetBackOrders([FromBody] PagedRequest request)
        {
            var (msg, result) = await _backOrderService.GetBackOrders(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<BackOrderResponseDto>>.ToResultOk(result);
        }

        [HttpGet("BackOrderDetail/{id}")]
        public async Task<IActionResult> GetBackOrder(Guid id)
        {
            var (msg, backOrder) = await _backOrderService.GetBackOrderById(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<BackOrderResponseDto>.ToResultOk(backOrder);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateBackOrder([FromBody] BackOrderRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            int? userId = User.GetUserId();
            var (msg, created) = await _backOrderService.CreateBackOrder(dto, userId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<BackOrderResponseCreateDto>.ToResultOk(created);
        }

        [HttpPost("CreateBulk")]
        public async Task<IActionResult> CreateBackOrdersBulk([FromBody] BackOrderBulkCreate create)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            int? userId = User.GetUserId();
            var (msg, result) = await _backOrderService.CreateBackOrderBulk(create, userId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<BackOrderBulkResponse>.ToResultOk(result);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateBackOrder(Guid id, [FromBody] BackOrderRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            var (msg, updated) = await _backOrderService.UpdateBackOrder(id, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<BackOrderResponseDto>.ToResultOk(updated);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteBackOrder(Guid id)
        {
            var (msg, deleted) = await _backOrderService.DeleteBackOrder(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<BackOrderResponseDto>.ToResultOk(deleted);
        }
    }
}