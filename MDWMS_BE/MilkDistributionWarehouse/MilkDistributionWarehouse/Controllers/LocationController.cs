using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Utilities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [HttpPost("Locations")]
        public async Task<IActionResult> GetLocations([FromBody] PagedRequest request)
        {
            var (msg, locations) = await _locationService.GetLocations(request);
            if (msg.Length > 0)
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<LocationDto.LocationResponseDto>>.ToResultOk(locations);
        }

        [HttpGet("LocationDetail/{id}")]
        public async Task<IActionResult> GetLocationDetail(int id)
        {
            var (msg, location) = await _locationService.GetLocationDetail(id);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(location);
        }

        [HttpGet("LocationDropdown")]
        public async Task<IActionResult> GetLocationDropdown()
        {
            var (msg, locations) = await _locationService.GetActiveLocations();

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<LocationDto.LocationActiveDto>>.ToResultOk(locations);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateLocation([FromBody] LocationDto.LocationRequestDto dto)
        {
            var (msg, location) = await _locationService.CreateLocation(dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(location);
        }

        [HttpPost("CreateMultiple")]
        public async Task<IActionResult> CreateMultipleLocations([FromBody] List<LocationDto.LocationRequestDto> dtos)
        {
            var (msg, createdList) = await _locationService.CreateMultipleLocations(dtos);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<LocationDto.LocationResponseDto>>.ToResultOk(createdList);
        }

        [HttpPut("Update/{locationId}")]
        public async Task<IActionResult> UpdateLocation(int locationId, [FromBody] LocationDto.LocationRequestDto dto)
        {
            var (msg, location) = await _locationService.UpdateLocation(locationId, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(location);
        }

        [HttpPut("UpdateStatus/{locationId}")]
        public async Task<IActionResult> UpdateStatusLocation(int locationId, int status)
        {
            var (msg, location) = await _locationService.UpdateStatus(locationId, status);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(location);
        }

        [HttpDelete("Delete/{locationId}")]
        public async Task<IActionResult> DeleteLocation(int locationId)
        {
            var (msg, location) = await _locationService.DeleteLocation(locationId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(location);
        }
    }
}