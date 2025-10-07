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

        [HttpGet]
        public IResult GetAreas()
        {
            string msg = _areaService.GetAreas(out List<AreaDto.AreaResponseDto> areas);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<AreaDto.AreaResponseDto>>.ToResultOk(areas);
        }

        [HttpGet("{id}")]
        public IResult GetArea(int id)
        {
            string msg = _areaService.GetAreaById(id, out AreaDto.AreaResponseDto? area);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(area);
        }

        [HttpPost]
        public IResult CreateArea([FromBody] AreaDto.AreaRequestDto dto)
        {
            string msg = _areaService.CreateArea(dto, out AreaDto.AreaResponseDto? createdArea);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(createdArea);
        }

        [HttpPut("{id}")]
        public IResult UpdateArea(int id, [FromBody] AreaDto.AreaRequestDto dto)
        {
            string msg = _areaService.UpdateArea(id, dto, out AreaDto.AreaResponseDto? updatedArea);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<AreaDto.AreaResponseDto>.ToResultOk(updatedArea);
        }

        [HttpDelete("{id}")]
        public IResult DeleteArea(int id)
        {
            string msg = _areaService.DeleteArea(id, out bool deleted);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOk();
        }
    }
}