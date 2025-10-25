using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

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

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPost("StorageConditions")]
        public async Task<IActionResult> GetStorageConditions([FromBody] PagedRequest request)
        {
            var (msg, conditions) = await _storageConditionService.GetStorageConditions(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<StorageConditionDto.StorageConditionResponseDto>>.ToResultOk(conditions);
        }

        [HttpGet("StorageConditionsDropdown")]
        public async Task<IActionResult> GetStorageConditionsActive()
        {
            var (msg, activeConditions) = await _storageConditionService.GetActiveStorageConditions();

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<StorageConditionDto.StorageConditionActiveDto>>.ToResultOk(activeConditions);
        }

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPost("Create")]
        public async Task<IActionResult> CreateStorageCondition([FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            var (msg, createdStorageCondition) = await _storageConditionService.CreateStorageCondition(dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(createdStorageCondition);
        }
        
        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateStorageCondition(int id, [FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            var (msg, updatedStorageCondition) = await _storageConditionService.UpdateStorageCondition(id, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(updatedStorageCondition);
        }
        
        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPut("UpdateStatus/{storageConditionId}")]
        public async Task<IActionResult> UpdateStatus(int storageConditionId, [FromQuery] int status)
        {
            var (msg, result) = await _storageConditionService.UpdateStatus(storageConditionId, status);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(result);
        }

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteStorageCondition(int id)
        {
            var (msg, deleted) = await _storageConditionService.DeleteStorageCondition(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}