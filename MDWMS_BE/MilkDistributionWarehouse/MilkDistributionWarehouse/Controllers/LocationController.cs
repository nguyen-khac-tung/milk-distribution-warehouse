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

        [HttpGet]
        public IResult GetLocations()
        {
            string msg = _locationService.GetLocations(out List<LocationDto.LocationResponseDto> locations);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<LocationDto.LocationResponseDto>>.ToResultOk(locations);
        }

        [HttpGet("{id}")]
        public IResult GetLocation(int id)
        {
            string msg = _locationService.GetLocationById(id, out LocationDto.LocationResponseDto? location);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(location);
        }

        [HttpPost]
        public IResult CreateLocation([FromBody] LocationDto.LocationRequestDto dto)
        {
            string msg = _locationService.CreateLocation(dto, out LocationDto.LocationResponseDto? createdLocation);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(createdLocation);
        }

        [HttpPut("{id}")]
        public IResult UpdateLocation(int id, [FromBody] LocationDto.LocationRequestDto dto)
        {
            string msg = _locationService.UpdateLocation(id, dto, out LocationDto.LocationResponseDto? updatedLocation);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<LocationDto.LocationResponseDto>.ToResultOk(updatedLocation);
        }

        [HttpDelete("{id}")]
        public IResult DeleteLocation(int id)
        {
            string msg = _locationService.DeleteLocation(id, out bool deleted);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOk();
        }
    }
}