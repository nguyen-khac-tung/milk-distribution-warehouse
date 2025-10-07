using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface ILocationService
    {
        string GetLocations(out List<LocationDto.LocationResponseDto> locations);
        string GetLocationById(int locationId, out LocationDto.LocationResponseDto? location);
        string CreateLocation(LocationDto.LocationRequestDto dto, out LocationDto.LocationResponseDto? createdLocation);
        string UpdateLocation(int locationId, LocationDto.LocationRequestDto dto, out LocationDto.LocationResponseDto? updatedLocation);
        string DeleteLocation(int locationId, out bool deleted);
    }

    public class LocationService : ILocationService
    {
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;
        private readonly WarehouseContext _context; 

        public LocationService(ILocationRepository locationRepository, IMapper mapper, WarehouseContext context)
        {
            _locationRepository = locationRepository;
            _mapper = mapper;
            _context = context;
        }

        public string GetLocations(out List<LocationDto.LocationResponseDto> locations)
        {
            locations = new List<LocationDto.LocationResponseDto>();

            var result = _locationRepository.GetLocations();
            if (result == null || !result.Any())
            {
                return "No locations found.";
            }

            locations = _mapper.Map<List<LocationDto.LocationResponseDto>>(result);
            return "";
        }

        public string GetLocationById(int locationId, out LocationDto.LocationResponseDto? location)
        {
            location = null;

            var result = _locationRepository.GetLocationById(locationId);
            if (result == null)
            {
                return "Location not found.";
            }

            location = _mapper.Map<LocationDto.LocationResponseDto>(result);
            return "";
        }

        public string CreateLocation(LocationDto.LocationRequestDto dto, out LocationDto.LocationResponseDto? createdLocation)
        {
            createdLocation = null;

            if (dto.AreaId <= 0)
            {
                return "Valid AreaId is required.";
            }
            if (string.IsNullOrWhiteSpace(dto.LocationCode))
            {
                return "LocationCode is required.";
            }
            if (string.IsNullOrWhiteSpace(dto.Rack))
            {
                return "Rack is required.";
            }
            if (dto.Row.HasValue && dto.Row < 1)
            {
                return "Row must be a positive integer.";
            }
            if (dto.Column.HasValue && dto.Column < 1)
            {
                return "Column must be a positive integer.";
            }

            var existingLocation = _locationRepository.GetLocations().FirstOrDefault(l => l.LocationCode == dto.LocationCode.Trim());
            if (existingLocation != null)
            {
                return "LocationCode already exists.";
            }

            var area = _context.Areas.FirstOrDefault(a => a.AreaId == dto.AreaId && a.Status != CommonStatus.Inactive);
            if (area == null)
            {
                return "Invalid AreaId.";
            }

            var entity = _mapper.Map<Location>(dto);
            entity.AreaId = dto.AreaId;
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = _locationRepository.CreateLocation(entity);
            if (createdEntity == null)
            {
                return "Failed to create location.";
            }

            createdLocation = _mapper.Map<LocationDto.LocationResponseDto>(createdEntity);
            return "";
        }

        public string UpdateLocation(int locationId, LocationDto.LocationRequestDto dto, out LocationDto.LocationResponseDto? updatedLocation)
        {
            updatedLocation = null;

            if (dto.AreaId <= 0)
            {
                return "Valid AreaId is required.";
            }
            if (string.IsNullOrWhiteSpace(dto.LocationCode))
            {
                return "LocationCode is required.";
            }
            if (string.IsNullOrWhiteSpace(dto.Rack))
            {
                return "Rack is required.";
            }
            if (dto.Row.HasValue && dto.Row < 1)
            {
                return "Row must be a positive integer.";
            }
            if (dto.Column.HasValue && dto.Column < 1)
            {
                return "Column must be a positive integer.";
            }

            var entity = _locationRepository.GetLocationById(locationId);
            if (entity == null)
            {
                return "Location not found.";
            }

            var existingLocation = _locationRepository.GetLocations().FirstOrDefault(l => l.LocationCode == dto.LocationCode.Trim() && l.LocationId != locationId);
            if (existingLocation != null)
            {
                return "LocationCode already exists.";
            }

            var area = _context.Areas.FirstOrDefault(a => a.AreaId == dto.AreaId && a.Status != CommonStatus.Inactive);
            if (area == null)
            {
                return "Invalid AreaId.";
            }

            _mapper.Map(dto, entity);
            entity.AreaId = dto.AreaId;
            entity.UpdateAt = DateTime.UtcNow;

            var updatedEntity = _locationRepository.UpdateLocation(entity);
            if (updatedEntity == null)
            {
                return "Failed to update location.";
            }

            updatedLocation = _mapper.Map<LocationDto.LocationResponseDto>(updatedEntity);
            return "";
        }

        public string DeleteLocation(int locationId, out bool deleted)
        {
            deleted = false;

            var entity = _locationRepository.GetLocationById(locationId);
            if (entity == null)
            {
                return "Location not found.";
            }

            if (_context.Pallets.Any(p => p.LocationId == locationId) || _context.StocktakingLocations.Any(sl => sl.LocationId == locationId))
            {
                return "Cannot delete location with existing pallets or stocktakings.";
            }

            deleted = _locationRepository.DeleteLocation(locationId);
            if (!deleted)
            {
                return "Failed to delete location.";
            }

            return "";
        }
    }
}