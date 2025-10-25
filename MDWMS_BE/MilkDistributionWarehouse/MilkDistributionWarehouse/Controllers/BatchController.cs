using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BatchController : ControllerBase
    {
        private readonly IBatchService _batchService;

        public BatchController(IBatchService batchService)
        {
            _batchService = batchService;
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff")]
        [HttpPost("GetBatchList")]
        public async Task<IActionResult> GetBatchList(PagedRequest request)
        {
            var (msg, batchs) = await _batchService.GetBatchList(request);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<BatchDto>>.ToResultOk(batchs);
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff")]
        [HttpGet("DropDown/{goodsId}")]
        public async Task<IActionResult> GetBatchDropDown(int goodsId)
        {
            var (msg, batches) = await _batchService.GetBatchDropDown(goodsId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<BatchDropDownDto>>.ToResultOk(batches);
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff")]
        [HttpPost("Create")]
        public async Task<IActionResult> CreateBatch(BatchCreateDto createDto)
        {
            var (msg, batch) = await _batchService.CreateBatch(createDto);
            if (!string.IsNullOrEmpty(msg)) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<BatchDto>.ToResultOk(batch);
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff")]
        [HttpPut("Update")]
        public async Task<IActionResult> UpdateBatch(BatchUpdateDto updateDto)
        {
            var (msg, batch) = await _batchService.UpdateBatch(updateDto);
            if (!string.IsNullOrEmpty(msg)) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<BatchDto>.ToResultOk(batch);
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff")]
        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateBatchStatus(BatchUpdateStatusDto updateDto)
        {
            var (msg, batchStatus) = await _batchService.UpdateBatchStatus(updateDto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<BatchUpdateStatusDto>.ToResultOk(batchStatus);
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff")]
        [HttpDelete("Delete/{batchId}")]
        public async Task<IActionResult> DeleteBatch(Guid batchId)
        {
            var msg = await _batchService.DeleteBatch(batchId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
