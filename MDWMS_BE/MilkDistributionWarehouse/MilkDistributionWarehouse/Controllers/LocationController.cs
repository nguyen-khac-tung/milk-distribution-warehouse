using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using static MilkDistributionWarehouse.Models.DTOs.LocationDto;

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

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff, Business Owner, Administrator")]
        [HttpPost("Locations")]
        public async Task<IActionResult> GetLocations([FromBody] PagedRequest request)
        {
            var (msg, locations) = await _locationService.GetLocations(request);
            if (msg.Length > 0)
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<LocationResponseDto>>.ToResultOk(locations);
        }

        [Authorize(Roles = "Warehouse Manager, Warehouse Staff, Business Owner, Administrator")]
        [HttpGet("LocationDetail/{id}")]
        public async Task<IActionResult> GetLocationDetail(int id)
        {
            var (msg, location) = await _locationService.GetLocationDetail(id);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationResponseDto>.ToResultOk(location);
        }

        [HttpGet("LocationDropdown")]
        public async Task<IActionResult> GetLocationDropdown()
        {
            var (msg, locations) = await _locationService.GetActiveLocations();

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<LocationActiveDto>>.ToResultOk(locations);
        }

        [HttpGet("LocationPallet/{locationcode}")]
        public async Task<IActionResult> GetLocationPallet(string locationcode)
        {
            var (msg, locations) = await _locationService.GetLocationsPallet(locationcode);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationActiveDto>.ToResultOk(locations);
        }

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPost("Create")]
        public async Task<IActionResult> CreateLocation([FromBody] LocationRequestDto dto)
        {
            var (msg, location) = await _locationService.CreateLocation(dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationResponseDto>.ToResultOk(location);
        }
        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPost("CreateMultiple")]
        public async Task<IActionResult> CreateLocationsBulk([FromBody] LocationBulkCreate create)
        {
            var (msg, response) = await _locationService.CreateLocationsBulk(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationBulkResponse>.ToResultOk(response);
        }

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPut("Update/{locationId}")]
        public async Task<IActionResult> UpdateLocation(int locationId, [FromBody] LocationRequestDto dto)
        {
            var (msg, location) = await _locationService.UpdateLocation(locationId, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationResponseDto>.ToResultOk(location);
        }

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpPut("UpdateStatus/{locationId}")]
        public async Task<IActionResult> UpdateStatusLocation(int locationId, int status)
        {
            var (msg, location) = await _locationService.UpdateStatus(locationId, status);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationResponseDto>.ToResultOk(location);
        }

        [Authorize(Roles = "Business Owner, Administrator")]
        [HttpDelete("Delete/{locationId}")]
        public async Task<IActionResult> DeleteLocation(int locationId)
        {
            var (msg, location) = await _locationService.DeleteLocation(locationId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<LocationResponseDto>.ToResultOk(location);
        }
    }
}