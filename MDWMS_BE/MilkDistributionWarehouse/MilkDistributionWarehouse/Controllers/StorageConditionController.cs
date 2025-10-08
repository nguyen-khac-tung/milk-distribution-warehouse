using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Utilities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StorageConditionController : ControllerBase
    {
        private readonly IStorageConditionService _storageConditionService;

        public StorageConditionController(IStorageConditionService storageConditionService)
        {
            _storageConditionService = storageConditionService;
        }

        [HttpPost("StorageConditions")]
        public async Task<IResult> GetStorageConditions([FromBody] PagedRequest request)
        {
            var (msg, conditions) = await _storageConditionService.GetStorageConditions(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<StorageConditionDto.StorageConditionResponseDto>>.ToResultOk(conditions);
        }

        [HttpPost("Create")]
        public async Task<IResult> CreateStorageCondition([FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            var (msg, createdStorageCondition) = await _storageConditionService.CreateStorageCondition(dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(createdStorageCondition);
        }

        [HttpPut("Update/{id}")]
        public async Task<IResult> UpdateStorageCondition(int id, [FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            var (msg, updatedStorageCondition) = await _storageConditionService.UpdateStorageCondition(id, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(updatedStorageCondition);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IResult> DeleteStorageCondition(int id)
        {
            var (msg, deleted) = await _storageConditionService.DeleteStorageCondition(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<string>.ToResultOk();
        }
    }
}