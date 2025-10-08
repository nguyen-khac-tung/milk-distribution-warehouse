using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface ILocationService
    {
        Task<(string, PageResult<LocationDto.LocationResponseDto>)> GetLocations(PagedRequest request);
        Task<(string, LocationDto.LocationResponseDto)> CreateLocation(LocationDto.LocationRequestDto dto);
        Task<(string, LocationDto.LocationResponseDto)> UpdateLocation(int locationId, LocationDto.LocationRequestDto dto);
        Task<(string, LocationDto.LocationResponseDto)> DeleteLocation(int locationId);
    }

    public class LocationService : ILocationService
    {
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;
        private readonly WarehouseContext _context;  // For FK validation

        public LocationService(ILocationRepository locationRepository, IMapper mapper, WarehouseContext context)
        {
            _locationRepository = locationRepository;
            _mapper = mapper;
            _context = context;
        }

        public async Task<(string, PageResult<LocationDto.LocationResponseDto>)> GetLocations(PagedRequest request)
        {
            var locations = _locationRepository.GetLocations();

            if (locations == null)
                return ("No locations available", new PageResult<LocationDto.LocationResponseDto>());

            var locationDtos = locations.ProjectTo<LocationDto.LocationResponseDto>(_mapper.ConfigurationProvider);

            var pagedResult = await locationDtos.ToPagedResultAsync(request);

            return ("", pagedResult);
        }

        public async Task<(string, LocationDto.LocationResponseDto)> CreateLocation(LocationDto.LocationRequestDto dto)
        {
            if (dto == null) return ("Location create is null", new LocationDto.LocationResponseDto());

            if (await _locationRepository.IsDuplicateLocationCode(dto.LocationCode))
                return ("LocationCode already exists", new LocationDto.LocationResponseDto());

            if (ContainsSpecialCharacters(dto.LocationCode))
                return ("LocationCode is invalid", new LocationDto.LocationResponseDto());

            if (string.IsNullOrWhiteSpace(dto.Rack))
                return ("Rack is required", new LocationDto.LocationResponseDto());

            if (dto.AreaId <= 0)
                return ("Valid AreaId is required", new LocationDto.LocationResponseDto());

            // Validate Area FK async
            var areaExists = await _context.Areas.AnyAsync(a => a.AreaId == dto.AreaId && a.Status != CommonStatus.Deleted);
            if (!areaExists)
                return ("Invalid AreaId", new LocationDto.LocationResponseDto());

            if (dto.Row.HasValue && dto.Row < 1)
                return ("Row must be a positive integer", new LocationDto.LocationResponseDto());

            if (dto.Column.HasValue && dto.Column < 1)
                return ("Column must be a positive integer", new LocationDto.LocationResponseDto());

            var entity = _mapper.Map<Location>(dto);
            entity.AreaId = dto.AreaId;
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = await _locationRepository.CreateLocation(entity);
            if (createdEntity == null)
                return ("Create location failed", new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(createdEntity));
        }

        public async Task<(string, LocationDto.LocationResponseDto)> UpdateLocation(int locationId, LocationDto.LocationRequestDto dto)
        {
            if (dto == null) return ("Location update is null", new LocationDto.LocationResponseDto());

            var locationExists = await _locationRepository.GetLocationById(locationId);
            if (locationExists == null)
                return ("Location not found", new LocationDto.LocationResponseDto());

            if (await _locationRepository.IsDuplicationByIdAndCode(locationId, dto.LocationCode))
                return ("LocationCode already exists", new LocationDto.LocationResponseDto());

            if (ContainsSpecialCharacters(dto.LocationCode))
                return ("LocationCode is invalid", new LocationDto.LocationResponseDto());

            if (string.IsNullOrWhiteSpace(dto.Rack))
                return ("Rack is required", new LocationDto.LocationResponseDto());

            if (dto.AreaId <= 0)
                return ("Valid AreaId is required", new LocationDto.LocationResponseDto());

            // Validate Area FK async
            var areaExists = await _context.Areas.AnyAsync(a => a.AreaId == dto.AreaId && a.Status != CommonStatus.Deleted);
            if (!areaExists)
                return ("Invalid AreaId", new LocationDto.LocationResponseDto());

            if (dto.Row.HasValue && dto.Row < 1)
                return ("Row must be a positive integer", new LocationDto.LocationResponseDto());

            if (dto.Column.HasValue && dto.Column < 1)
                return ("Column must be a positive integer", new LocationDto.LocationResponseDto());

            _mapper.Map(dto, locationExists);
            locationExists.AreaId = dto.AreaId;
            locationExists.Status = dto.Status ?? locationExists.Status;
            locationExists.UpdateAt = DateTime.UtcNow;

            var updatedEntity = await _locationRepository.UpdateLocation(locationExists);
            if (updatedEntity == null)
                return ("Update location failed", new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(updatedEntity));
        }

        public async Task<(string, LocationDto.LocationResponseDto)> DeleteLocation(int locationId)
        {
            if (locationId <= 0)
                return ("Invalid LocationId", new LocationDto.LocationResponseDto());

            var locationExists = await _locationRepository.GetLocationById(locationId);
            if (locationExists == null)
                return ("Location not found", new LocationDto.LocationResponseDto());

            if (await _locationRepository.HasDependentPalletsOrStocktakingsAsync(locationId))
                return ("Cannot delete, location is in use by pallets or stocktakings", new LocationDto.LocationResponseDto());

            locationExists.Status = CommonStatus.Deleted;
            locationExists.UpdateAt = DateTime.UtcNow;

            var deletedEntity = await _locationRepository.UpdateLocation(locationExists);
            if (deletedEntity == null)
                return ("Delete location failed", new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(deletedEntity));
        }

        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }
    }
}