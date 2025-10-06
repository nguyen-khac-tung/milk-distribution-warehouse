using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.Common;
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

        [HttpGet]
        public IActionResult GetStorageConditions()
        {
            string msg = _storageConditionService.GetStorageConditions(out List<StorageConditionDto.StorageConditionResponseDto> storageConditions);
            if (msg.Length > 0) return BadRequest(ApiResponse<string>.ErrorResponse(msg));

            return Ok(ApiResponse<List<StorageConditionDto.StorageConditionResponseDto>>.SuccessResponse(storageConditions));
        }

        [HttpGet("{id}")]
        public IActionResult GetStorageCondition(int id)
        {
            string msg = _storageConditionService.GetStorageConditionById(id, out StorageConditionDto.StorageConditionResponseDto? storageCondition);
            if (msg.Length > 0) return BadRequest(ApiResponse<string>.ErrorResponse(msg));

            return Ok(ApiResponse<StorageConditionDto.StorageConditionResponseDto>.SuccessResponse(storageCondition));
        }

        [HttpPost]
        public IActionResult CreateStorageCondition([FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            string msg = _storageConditionService.CreateStorageCondition(dto, out StorageConditionDto.StorageConditionResponseDto? createdStorageCondition);
            if (msg.Length > 0) return BadRequest(ApiResponse<string>.ErrorResponse(msg));

            return CreatedAtAction(nameof(GetStorageCondition), new { id = createdStorageCondition.StorageConditionId }, ApiResponse<StorageConditionDto.StorageConditionResponseDto>.SuccessResponse(createdStorageCondition));
        }

        [HttpPut("{id}")]
        public IActionResult UpdateStorageCondition(int id, [FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            string msg = _storageConditionService.UpdateStorageCondition(id, dto, out StorageConditionDto.StorageConditionResponseDto? updatedStorageCondition);
            if (msg.Length > 0) return BadRequest(ApiResponse<string>.ErrorResponse(msg));

            return Ok(ApiResponse<StorageConditionDto.StorageConditionResponseDto>.SuccessResponse(updatedStorageCondition));
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteStorageCondition(int id)
        {
            string msg = _storageConditionService.DeleteStorageCondition(id, out bool deleted);
            if (msg.Length > 0) return BadRequest(ApiResponse<string>.ErrorResponse(msg));

            if (!deleted)
            {
                return NotFound(ApiResponse<string>.ErrorResponse("Storage condition not found"));
            }

            return NoContent();
        }
    }
}