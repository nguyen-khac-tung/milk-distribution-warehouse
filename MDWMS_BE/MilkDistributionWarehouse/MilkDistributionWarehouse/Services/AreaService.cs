using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IAreaService
    {
        Task<(string, PageResult<AreaDto.AreaResponseDto>)> GetAreas(PagedRequest request);
        Task<(string, AreaDto.AreaDetailDto)> GetAreaById(int areaId);
        Task<(string, List<AreaDto.AreaLocationAvailableDto>)> GetAvailableLocationQty();
        Task<(string, AreaDto.AreaResponseDto)> CreateArea(AreaDto.AreaRequestDto dto);
        Task<(string, AreaDto.AreaResponseDto)> UpdateArea(int areaId, AreaDto.AreaRequestDto dto);
        Task<(string, AreaDto.AreaResponseDto)> DeleteArea(int areaId);
        Task<(string, AreaDto.AreaResponseDto)> UpdateStatus(int areaId, int status);
        Task<(string, List<AreaDto.AreaActiveDto>)> GetAreaDropdown();
        Task<(string, List<AreaDto.StocktakingAreaDto>?)> GetStocktakingArea(string? stocktakingSheetId);
    }

    public class AreaService : IAreaService
    {
        private readonly IAreaRepository _areaRepository;
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IUserRepository _userRepository;

        public AreaService(IAreaRepository areaRepository, IStorageConditionRepository storageConditionRepository, 
            IMapper mapper, IStocktakingAreaRepository stocktakingAreaRepository, IUserRepository userRepository)
        {
            _areaRepository = areaRepository;
            _storageConditionRepository = storageConditionRepository;
            _mapper = mapper;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _userRepository = userRepository;
        }

        public async Task<(string, PageResult<AreaDto.AreaResponseDto>)> GetAreas(PagedRequest request)
        {
            var areas = _areaRepository.GetAreas();
            if (areas == null)
                return ("Không có khu vực nào trong hệ thống.".ToMessageForUser(), new PageResult<AreaDto.AreaResponseDto>());

            var areaDtos = areas.ProjectTo<AreaDto.AreaResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await areaDtos.ToPagedResultAsync(request);

            return ("", pagedResult);
        }

        public async Task<(string, AreaDto.AreaDetailDto)> GetAreaById(int areaId)
        {
            if (areaId <= 0)
                return ("Mã khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaDetailDto());

            var area = await _areaRepository.GetAreaById(areaId);

            if (area == null)
                return ("Không tìm thấy khu vực.".ToMessageForUser(), new AreaDto.AreaDetailDto());

            return ("", _mapper.Map<AreaDto.AreaDetailDto>(area));
        }

        public async Task<(string, List<AreaDto.AreaLocationAvailableDto>)> GetAvailableLocationQty() {
            var data = await _areaRepository.GetAvailableLocationCountByAreaAsync();

            if (data == null || !data.Any())
                return ("Không có dữ liệu khu vực khả dụng.".ToMessageForUser(), new List<AreaDto.AreaLocationAvailableDto>());

            return ("", data);
        }

        public async Task<(string, AreaDto.AreaResponseDto)> CreateArea(AreaDto.AreaRequestDto dto)
        {
            if (dto == null)
                return ("Don't have input data.", new AreaDto.AreaResponseDto());

            if (await _areaRepository.IsDuplicateAreaCode(dto.AreaCode))
                return ("Mã khu vực đã tồn tại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var storageConditionExists = await _storageConditionRepository.GetStorageConditionToCreateArea(dto.StorageConditionId);
            if (storageConditionExists == null)
                return ("Điều kiện bảo quản không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var entity = _mapper.Map<Area>(dto);
            entity.CreatedAt = DateTimeUtility.Now();
            entity.Status = CommonStatus.Active;

            var createdEntity = await _areaRepository.CreateArea(entity);
            if (createdEntity == null)
                return ("Tạo khu vực thất bại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(createdEntity));
        }

        public async Task<(string, AreaDto.AreaResponseDto)> UpdateArea(int areaId, AreaDto.AreaRequestDto dto)
        {
            if (dto == null)
                return ("Don't have input data.", new AreaDto.AreaResponseDto());

            if (areaId <= 0)
                return ("Mã khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var area = await _areaRepository.GetAreaById(areaId);
            if (area == null)
                return ("Không tìm thấy khu vực để cập nhật.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (await _areaRepository.IsDuplicationByIdAndCode(areaId, dto.AreaCode))
                return ("Mã khu vực đã tồn tại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var storageConditionExists = await _storageConditionRepository.GetStorageConditionById(dto.StorageConditionId);
            if (storageConditionExists == null)
                return ("Điều kiện bảo quản không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            _mapper.Map(dto, area);
            area.StorageConditionId = dto.StorageConditionId;
            area.UpdateAt = DateTimeUtility.Now();

            var updatedEntity = await _areaRepository.UpdateArea(area);
            if (updatedEntity == null)
                return ("Cập nhật khu vực thất bại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(updatedEntity));
        }

        public async Task<(string, AreaDto.AreaResponseDto)> DeleteArea(int areaId)
        {
            if (areaId <= 0)
                return ("Mã khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var area = await _areaRepository.GetAreaById(areaId);
            if (area == null)
                return ("Không tìm thấy khu vực để xoá.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (await _areaRepository.HasDependentLocationsOrStocktakingsAsync(areaId))
                return ("Không thể xoá khu vực vì đang được sử dụng trong vị trí hoặc kiểm kê.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            area.Status = CommonStatus.Deleted;
            area.UpdateAt = DateTimeUtility.Now();

            var deletedEntity = await _areaRepository.UpdateArea(area);
            if (deletedEntity == null)
                return ("Xoá khu vực thất bại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(deletedEntity));
        }

        public async Task<(string, AreaDto.AreaResponseDto)> UpdateStatus(int areaId, int status)
        {
            var area = await _areaRepository.GetAreaById(areaId);
            if (area == null)
                return ("Không tìm thấy khu vực để cập nhật trạng thái.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (area.Status == CommonStatus.Deleted)
                return ("Khu vực này đã bị xoá, không thể cập nhật trạng thái.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (status != CommonStatus.Active && status != CommonStatus.Inactive && status != CommonStatus.Deleted)
                return ("Trạng thái không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            bool isUsed = await _areaRepository.HasDependentLocationsOrStocktakingsAsync(areaId);

            if (isUsed && (status == CommonStatus.Inactive || status == CommonStatus.Deleted))
                return ("Không thể cập nhật trạng thái vì khu vực đang được sử dụng trong vị trí hoặc kiểm kê.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (area.Status == status)
                return ("Trạng thái khu vực đã ở trạng thái này.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            area.Status = status;
            area.UpdateAt = DateTimeUtility.Now();

            var updated = await _areaRepository.UpdateArea(area);
            if (updated == null)
                return ("Cập nhật trạng thái khu vực thất bại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(updated));
        }

        public async Task<(string, List<AreaDto.AreaActiveDto>)> GetAreaDropdown()
        {
            var areas = await _areaRepository.GetActiveAreasAsync();

            if (areas == null || !areas.Any())
                return ("Không có khu vực nào đang hoạt động.".ToMessageForUser(), new List<AreaDto.AreaActiveDto>());

            var areaDtos = _mapper.Map<List<AreaDto.AreaActiveDto>>(areas);
            return ("", areaDtos);
        }

        public async Task<(string, List<AreaDto.StocktakingAreaDto>?)> GetStocktakingArea(string? stocktakingSheetId)
        {
            var areas = await _areaRepository.GetActiveAreasByStocktakingId();

            var results = new List<AreaDto.StocktakingAreaDto>();

            if (string.IsNullOrEmpty(stocktakingSheetId))
            {
                var areaMap = _mapper.Map<List<AreaDto.StocktakingAreaDto>>(areas);
                if(!areaMap.Any())
                    return ("Danh sách khu vực để kiểm kê trống.", default);
                return ("", areaMap);
            } 
                
            foreach (var a in areas)
            {
                var assignTo = await _userRepository.GetAssignToStockArea(stocktakingSheetId, a.AreaId);

                results.Add(new AreaDto.StocktakingAreaDto
                {
                    AreaId = a.AreaId,
                    AreaName = a.AreaName,
                    AvailableLocationCount = a.Locations.Count(l => l.IsAvailable == true && l.Status != CommonStatus.Inactive),
                    UnAvailableLocationCount = a.Locations.Count(l => l.IsAvailable == false && l.Status != CommonStatus.Inactive),
                    TemperatureMax = a.StorageCondition.TemperatureMax,
                    TemperatureMin = a.StorageCondition.TemperatureMin,
                    HumidityMax = a.StorageCondition?.HumidityMax,
                    HumidityMin = a.StorageCondition.HumidityMin,
                    LightLevel = a.StorageCondition.LightLevel,
                    AssignTo = assignTo?.UserId,
                    AssignName = assignTo?.FullName
                });
            }

            if (!results.Any())
                return ("Danh sách khu vực để kiểm kê trống.", default);

            return ("", results);
        }

    }
}