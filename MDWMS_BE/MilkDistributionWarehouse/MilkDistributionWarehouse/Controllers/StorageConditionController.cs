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

        [HttpGet]
        public IResult GetStorageConditions()
        {
            string msg = _storageConditionService.GetStorageConditions(out List<StorageConditionDto.StorageConditionResponseDto> storageConditions);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<StorageConditionDto.StorageConditionResponseDto>>.ToResultOk(storageConditions);
        }

        [HttpGet("{id}")]
        public IResult GetStorageCondition(int id)
        {
            string msg = _storageConditionService.GetStorageConditionById(id, out StorageConditionDto.StorageConditionResponseDto? storageCondition);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(storageCondition);
        }

        [HttpPost]
        public IResult CreateStorageCondition([FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            string msg = _storageConditionService.CreateStorageCondition(dto, out StorageConditionDto.StorageConditionResponseDto? createdStorageCondition);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(createdStorageCondition);
        }

        [HttpPut("{id}")]
        public IResult UpdateStorageCondition(int id, [FromBody] StorageConditionDto.StorageConditionRequestDto dto)
        {
            string msg = _storageConditionService.UpdateStorageCondition(id, dto, out StorageConditionDto.StorageConditionResponseDto? updatedStorageCondition);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<StorageConditionDto.StorageConditionResponseDto>.ToResultOk(updatedStorageCondition);
        }

        [HttpDelete("{id}")]
        public IResult DeleteStorageCondition(int id)
        {
            string msg = _storageConditionService.DeleteStorageCondition(id, out bool deleted);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOk();
        }
    }
}