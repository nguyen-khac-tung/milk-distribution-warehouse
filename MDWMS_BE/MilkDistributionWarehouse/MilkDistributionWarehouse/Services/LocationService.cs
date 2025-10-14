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
        Task<(string, LocationDto.LocationResponseDto)> UpdateStatus(int locationId, int status);
    }

    public class LocationService : ILocationService
    {
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;
        private readonly IAreaRepository _areaRepository;

        public LocationService(ILocationRepository locationRepository, IMapper mapper, IAreaRepository areaRepository)
        {
            _locationRepository = locationRepository;
            _mapper = mapper;
            _areaRepository = areaRepository;
        }

        public async Task<(string, PageResult<LocationDto.LocationResponseDto>)> GetLocations(PagedRequest request)
        {
            var locations = _locationRepository.GetLocations();

            if (locations == null)
                return ("Không có vị trí nào trong hệ thống.".ToMessageForUser(), new PageResult<LocationDto.LocationResponseDto>());

            var locationDtos = locations.ProjectTo<LocationDto.LocationResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await locationDtos.ToPagedResultAsync(request);

            return ("", pagedResult);
        }

        public async Task<(string, LocationDto.LocationResponseDto)> CreateLocation(LocationDto.LocationRequestDto dto)
        {
            if (dto == null) return ("Dữ liệu vị trí không hợp lệ.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (await _locationRepository.IsDuplicateLocationCode(dto.LocationCode))
                return ("Mã vị trí đã tồn tại.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (await _locationRepository.IsDuplicateLocationAsync(dto.LocationCode, dto.Row, dto.Column, dto.AreaId))
                return ("Đã tồn tại vị trí có cùng mã hoặc trùng hàng và cột trong khu vực này.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (ContainsSpecialCharacters(dto.LocationCode))
                return ("Mã vị trí không hợp lệ, không được chứa ký tự đặc biệt.".ToMessageForUser(), new LocationDto.LocationResponseDto());
            // Validate Area FK async
            var areaExists = await _areaRepository.GetAreaById(dto.AreaId);
            if (areaExists == null)
                return ("Khu vực được chọn không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            var entity = _mapper.Map<Location>(dto);
            entity.AreaId = dto.AreaId;
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = await _locationRepository.CreateLocation(entity);
            if (createdEntity == null)
                return ("Tạo vị trí thất bại.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(createdEntity));
        }

        public async Task<(string, LocationDto.LocationResponseDto)> UpdateLocation(int locationId, LocationDto.LocationRequestDto dto)
        {
            if (dto == null) return ("Dữ liệu cập nhật vị trí không hợp lệ.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            var locationExists = await _locationRepository.GetLocationById(locationId);
            if (locationExists == null)
                return ("Không tìm thấy vị trí cần cập nhật.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if(locationExists.Status == CommonStatus.Deleted)
                return ("Vị trí này đã bị xóa, không thể cập nhật thông tin.".ToMessageForUser(),new LocationDto.LocationResponseDto());

            if (await _locationRepository.IsDuplicationByIdAndCode(locationId, dto.LocationCode))
                return ("Mã vị trí đã tồn tại.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (await _locationRepository.IsDuplicateLocationAsync(dto.LocationCode, dto.Row, dto.Column, dto.AreaId, locationId))
                return ("Đã tồn tại vị trí có cùng mã hoặc trùng hàng và cột trong khu vực này.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (ContainsSpecialCharacters(dto.LocationCode))
                return ("Mã vị trí không hợp lệ, không được chứa ký tự đặc biệt.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            // Validate Area FK async
            var areaExists = await _areaRepository.GetAreaById(dto.AreaId);
            if (areaExists == null)
                return ("Khu vực được chọn không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            _mapper.Map(dto, locationExists);
            locationExists.UpdateAt = DateTime.UtcNow;

            var updatedEntity = await _locationRepository.UpdateLocation(locationExists);
            if (updatedEntity == null)
                return ("Cập nhật vị trí thất bại.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(updatedEntity));
        }

        public async Task<(string, LocationDto.LocationResponseDto)> DeleteLocation(int locationId)
        {
            if (locationId <= 0)
                return ("Mã vị trí không hợp lệ.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            var locationExists = await _locationRepository.GetLocationById(locationId);
            if (locationExists == null)
                return ("Không tìm thấy vị trí để xoá.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (await _locationRepository.HasDependentPalletsOrStocktakingsAsync(locationId))
                return ("Không thể xoá vì vị trí này đang được sử dụng cho pallet hoặc kiểm kê hàng.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            locationExists.Status = CommonStatus.Deleted;
            locationExists.UpdateAt = DateTime.UtcNow;

            var deletedEntity = await _locationRepository.UpdateLocation(locationExists);
            if (deletedEntity == null)
                return ("Xoá vị trí thất bại.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(deletedEntity));
        }

        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }

        public async Task<(string, LocationDto.LocationResponseDto)> UpdateStatus(int locationId, int status)
        {
            if (locationId <= 0)
                return ("Mã vị trí không hợp lệ.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            var location = await _locationRepository.GetLocationById(locationId);
            if (location == null)
                return ("Không tìm thấy vị trí cần cập nhật trạng thái.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (location.Status == CommonStatus.Deleted)
                return ("Vị trí này đã bị xóa, không thể cập nhật trạng thái.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (status != CommonStatus.Active && status != CommonStatus.Inactive && status != CommonStatus.Deleted)
                return ("Trạng thái không hợp lệ.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            if (await _locationRepository.HasDependentPalletsOrStocktakingsAsync(locationId))
                return ("Không thể cập nhật trạng thái vì vị trí này đang được sử dụng cho pallet hoặc kiểm kê hàng.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            location.Status = status;
            location.UpdateAt = DateTime.UtcNow;

            var updatedEntity = await _locationRepository.UpdateLocation(location);
            if (updatedEntity == null)
                return ("Cập nhật trạng thái thất bại.".ToMessageForUser(), new LocationDto.LocationResponseDto());

            return ("", _mapper.Map<LocationDto.LocationResponseDto>(updatedEntity));
        }

    }
}
