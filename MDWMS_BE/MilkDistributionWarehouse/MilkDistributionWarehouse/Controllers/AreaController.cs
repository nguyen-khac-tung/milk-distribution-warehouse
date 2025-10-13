using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Utilities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AreaController : ControllerBase
    {
        private readonly IAreaService _areaService;

        public AreaController(IAreaService areaService)
        {
            _areaService = areaService;
        }

        [HttpPost("Areas")]
        public async Task<IActionResult> GetAreas([FromBody] PagedRequest request)
        {
            var (msg, areas) = await _areaService.GetAreas(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<AreaDto.AreaResponseDto>>.ToResultOk(areas);
        }

        [HttpGet("AreaDetail/{id}")]
        public async Task<IActionResult> GetArea(int id)
        {
            var (msg, area) = await _areaService.GetAreaById(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<AreaDto.AreaDetailDto>.ToResultOk(area);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateArea([FromBody] AreaDto.AreaRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");

            var (msg, createdArea) = await _areaService.CreateArea(dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(createdArea);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateArea(int id, [FromBody] AreaDto.AreaRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");

            var (msg, updatedArea) = await _areaService.UpdateArea(id, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(updatedArea);
        }

        [HttpPut("UpdateStatus/{areaId}")]
        public async Task<IActionResult> UpdateStatusArea(int areaId, [FromQuery] int status)
        {
            var (msg, area) = await _areaService.UpdateStatus(areaId, status);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(area);
        }


        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteArea(int id)
        {
            var (msg, area) = await _areaService.DeleteArea(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(area);
        }
    }
}