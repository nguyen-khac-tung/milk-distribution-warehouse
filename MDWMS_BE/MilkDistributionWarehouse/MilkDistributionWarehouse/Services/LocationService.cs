using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using static MilkDistributionWarehouse.Models.DTOs.LocationDto;

namespace MilkDistributionWarehouse.Services
{
    public interface ILocationService
    {
        Task<(string, PageResult<LocationResponseDto>)> GetLocations(PagedRequest request);
        Task<(string, LocationResponseDto)> GetLocationDetail(int locationId);
        Task<(string, LocationResponseDto)> CreateLocation(LocationRequestDto dto);
        Task<(string, LocationResponseDto)> UpdateLocation(int locationId, LocationRequestDto dto);
        Task<(string, LocationResponseDto)> DeleteLocation(int locationId);
        Task<(string, LocationResponseDto)> UpdateStatus(int locationId, int status);
        Task<(string, List<LocationActiveDto>)> GetActiveLocations();
        Task<(string, LocationActiveDto)> GetLocationsPallet(string locationcode);
        Task<(string, LocationBulkResponse)> CreateLocationsBulk(LocationBulkCreate create);
    }

    public class LocationService : ILocationService
    {
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;
        private readonly IAreaRepository _areaRepository;
        private readonly IUnitOfWork _unitOfWork;

        public LocationService(ILocationRepository locationRepository, IMapper mapper, IAreaRepository areaRepository, IUnitOfWork unitOfWork)
        {
            _locationRepository = locationRepository;
            _mapper = mapper;
            _areaRepository = areaRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<(string, PageResult<LocationResponseDto>)> GetLocations(PagedRequest request)
        {
            var locations = _locationRepository.GetLocations();

            if (locations == null)
                return ("Không có vị trí nào trong hệ thống.".ToMessageForUser(), new PageResult<LocationResponseDto>());

            var locationDtos = locations.ProjectTo<LocationResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await locationDtos.ToPagedResultAsync(request);

            return ("", pagedResult);
        }

        public async Task<(string, LocationResponseDto)> GetLocationDetail(int locationId)
        {
            if (locationId <= 0)
                return ("Mã vị trí không hợp lệ.".ToMessageForUser(), new LocationResponseDto());

            var location = await _locationRepository.GetLocationById(locationId);
            if (location == null || location.Status == CommonStatus.Deleted)
                return ("Không tìm thấy vị trí hoặc vị trí đã bị xóa.".ToMessageForUser(), new LocationResponseDto());

            var dto = _mapper.Map<LocationResponseDto>(location);
            return ("", dto);
        }

        public async Task<(string, LocationResponseDto)> CreateLocation(LocationRequestDto dto)
        {
            if (dto == null)
                return ("Dữ liệu vị trí không hợp lệ.".ToMessageForUser(), new LocationResponseDto());

            var areaExists = await _areaRepository.GetAreaById(dto.AreaId);
            if (areaExists == null)
                return ("Khu vực được chọn không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new LocationResponseDto());

            var locationCode = $"{areaExists.AreaCode}-{dto.Rack}-R{dto.Row:D2}-C{dto.Column:D2}";
            if (await _locationRepository.IsDuplicateLocationCodeInAreaAsync(locationCode, dto.AreaId))
                return ("Đã tồn tại vị trí có cùng mã trong khu vực này.".ToMessageForUser(), new LocationResponseDto());

            var entity = _mapper.Map<Location>(dto);
            entity.LocationCode = locationCode;
            entity.CreatedAt = DateTime.Now;
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = await _locationRepository.CreateLocation(entity);
            if (createdEntity == null)
                return ("Tạo vị trí thất bại.".ToMessageForUser(), new LocationResponseDto());

            var createdWithArea = await _locationRepository.GetLocationById(createdEntity.LocationId);
            return ("", _mapper.Map<LocationResponseDto>(createdWithArea));
        }


        public async Task<(string, LocationResponseDto)> UpdateLocation(int locationId, LocationRequestDto dto)
        {
            if (dto == null)
                return ("Dữ liệu cập nhật vị trí không hợp lệ.".ToMessageForUser(), new LocationResponseDto());

            var locationExists = await _locationRepository.GetLocationById(locationId);
            if (locationExists == null)
                return ("Không tìm thấy vị trí cần cập nhật.".ToMessageForUser(), new LocationResponseDto());

            if (locationExists.Status == CommonStatus.Deleted)
                return ("Vị trí này đã bị xóa, không thể cập nhật thông tin.".ToMessageForUser(), new LocationResponseDto());

            var areaExists = await _areaRepository.GetAreaById(dto.AreaId);
            if (areaExists == null)
                return ("Khu vực được chọn không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new LocationResponseDto());

            var locationCode = $"{areaExists.AreaCode}-{dto.Rack}-R{dto.Row:D2}-C{dto.Column:D2}";
            if (await _locationRepository.IsDuplicateLocationCodeInAreaAsync(locationCode, dto.AreaId, locationId))
                return ("Đã tồn tại vị trí có cùng mã trong khu vực này.".ToMessageForUser(), new LocationResponseDto());

            _mapper.Map(dto, locationExists);
            locationExists.LocationCode = locationCode;
            locationExists.UpdateAt = DateTime.Now;

            var updatedEntity = await _locationRepository.UpdateLocation(locationExists);
            if (updatedEntity == null)
                return ("Cập nhật vị trí thất bại.".ToMessageForUser(), new LocationResponseDto());

            var updatedWithArea = await _locationRepository.GetLocationById(updatedEntity.LocationId);
            return ("", _mapper.Map<LocationResponseDto>(updatedWithArea));
        }
        public async Task<(string, LocationResponseDto)> DeleteLocation(int locationId)
        {
            if (locationId <= 0)
                return ("Mã vị trí không hợp lệ.".ToMessageForUser(), new LocationResponseDto());

            var locationExists = await _locationRepository.GetLocationById(locationId);
            if (locationExists == null)
                return ("Không tìm thấy vị trí để xoá.".ToMessageForUser(), new LocationResponseDto());

            if (await _locationRepository.HasDependentPalletsAsync(locationId))
                return ("Không thể xoá vì vị trí này đang được sử dụng.".ToMessageForUser(), new LocationResponseDto());

            if (await _locationRepository.InUsed(locationId))
                return ("Không thể xóa vì vị trí này đang được sử dụng.".ToMessageForUser(), new LocationResponseDto());

            locationExists.Status = CommonStatus.Deleted;
            locationExists.UpdateAt = DateTime.Now;

            var deletedEntity = await _locationRepository.UpdateLocation(locationExists);
            if (deletedEntity == null)
                return ("Xoá vị trí thất bại.".ToMessageForUser(), new LocationResponseDto());
            var deletedWithArea = await _locationRepository.GetLocationById(deletedEntity.LocationId);
            return ("", _mapper.Map<LocationResponseDto>(deletedWithArea));
        }

        public async Task<(string, LocationResponseDto)> UpdateStatus(int locationId, int status)
        {
            if (locationId <= 0)
                return ("Mã vị trí không hợp lệ.".ToMessageForUser(), new LocationResponseDto());

            var location = await _locationRepository.GetLocationById(locationId);
            if (location == null)
                return ("Không tìm thấy vị trí cần cập nhật trạng thái.".ToMessageForUser(), new LocationResponseDto());

            if (location.Status == CommonStatus.Deleted)
                return ("Vị trí này đã bị xóa, không thể cập nhật trạng thái.".ToMessageForUser(), new LocationResponseDto());

            if (status != CommonStatus.Active && status != CommonStatus.Inactive && status != CommonStatus.Deleted)
                return ("Trạng thái không hợp lệ.".ToMessageForUser(), new LocationResponseDto());

            if (await _locationRepository.HasDependentPalletsAsync(locationId))
                return ("Không thể cập nhật trạng thái vì vị trí này đang được sử dụng cho pallet.".ToMessageForUser(), new LocationResponseDto());
            
            if (await _locationRepository.InUsed(locationId))
                return ("Không thể cập nhật trạng thái vì vị trí này hiện đang được sử dụng.".ToMessageForUser(), new LocationResponseDto());

            location.Status = status;
            location.UpdateAt = DateTime.Now;

            var updatedEntity = await _locationRepository.UpdateLocation(location);
            if (updatedEntity == null)
                return ("Cập nhật trạng thái thất bại.".ToMessageForUser(), new LocationResponseDto());
            var updatedWithArea = await _locationRepository.GetLocationById(updatedEntity.LocationId);
            return ("", _mapper.Map<LocationResponseDto>(updatedWithArea));
        }

        public async Task<(string, List<LocationActiveDto>)> GetActiveLocations()
        {
            var locations = await _locationRepository.GetActiveLocationsAsync();

            if (locations == null || !locations.Any())
                return ("Không có vị trí nào đang hoạt động.".ToMessageForUser(), new List<LocationActiveDto>());

            var dtoList = _mapper.Map<List<LocationActiveDto>>(locations);
            return ("", dtoList);
        }

        public async Task<(string, LocationActiveDto)> GetLocationsPallet(string locationcode)
        {
            var location = await _locationRepository.GetLocationPallet(locationcode);

            if (location == null)
                return ("Không có vị trí này trong hệ thống hoặc vị trí này đã bị dỡ bỏ!".ToMessageForUser(), new LocationActiveDto());

            var dtoList = _mapper.Map<LocationActiveDto>(location);
            return ("", dtoList);
        }

        public async Task<(string, LocationBulkResponse)> CreateLocationsBulk(LocationBulkCreate create)
        {
            var result = new LocationBulkResponse();
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var areaIds = create.Locations.Select(l => l.AreaId).Distinct().ToList();
                var existingKeys = await _locationRepository.GetExistingLocationKeys(areaIds);
                var existingSet = new HashSet<string>(existingKeys);

                var validLocations = new List<Location>();

                for (int i = 0; i < create.Locations.Count; i++)
                {
                    var dto = create.Locations[i];
                    var key = $"{dto.AreaId}:{dto.Rack?.ToLower().Trim()}:{dto.Row}:{dto.Column}";

                    var validation = ValidationLocation(dto, existingSet);
                    if (validation != null)
                    {
                        result.FailedItems.Add(new LocationDto.FailedItem
                        {
                            Index = i,
                            Code = $"{dto.Rack}-R{dto.Row:D2}-C{dto.Column:D2}",
                            Error = validation.ToMessageForUser()
                        });
                        result.TotalFailed++;
                        continue;
                    }

                    var areaExists = await _areaRepository.GetAreaById(dto.AreaId);
                    if (areaExists == null)
                    {
                        result.FailedItems.Add(new LocationDto.FailedItem
                        {
                            Index = i,
                            Code = $"{dto.Rack}-R{dto.Row:D2}-C{dto.Column:D2}",
                            Error = "Khu vực được chọn không tồn tại hoặc đã bị xoá.".ToMessageForUser()
                        });
                        result.TotalFailed++;
                        continue;
                    }

                    var entity = _mapper.Map<Location>(dto);
                    entity.LocationCode = $"{dto.Rack}-R{dto.Row:D2}-C{dto.Column:D2}";
                    entity.AreaId = dto.AreaId;
                    entity.CreatedAt = DateTime.Now;
                    entity.Status = (int)CommonStatus.Active;

                    validLocations.Add(entity);
                    existingSet.Add(key); 
                }

                if (validLocations.Any())
                {
                    var insertedCount = await _locationRepository.CreateLocationsBulk(validLocations);
                    if (insertedCount == 0)
                    {
                        throw new Exception("Insert bulk failed");
                    }
                    result.TotalInserted = insertedCount;
                }

                await _unitOfWork.CommitTransactionAsync();

                return ("", result);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        private string? ValidationLocation(LocationRequestDto dto, HashSet<string> existingSet)
        {
            if (dto.AreaId <= 0)
                return "Khu vực không hợp lệ!";

            if (string.IsNullOrWhiteSpace(dto.Rack))
                return "Rack không được để trống";

            if (dto.Rack.Length > 20)
                return "Rack không được vượt quá 20 ký tự!";

            if (dto.Row < 1 || dto.Row >= 1000)
                return "Số hàng (Row) phải >= 1 và < 1000";

            if (dto.Column < 1 || dto.Column >= 1000)
                return "Số cột (Column) phải >= 1 và < 1000";

            var key = $"{dto.AreaId}:{dto.Rack.ToLower().Trim()}:{dto.Row}:{dto.Column}";
            if (existingSet.Contains(key))
                return "Vị trí đã tồn tại (trùng Rack, Row, Column trong Area)";

            return null;
        }
    }
}
