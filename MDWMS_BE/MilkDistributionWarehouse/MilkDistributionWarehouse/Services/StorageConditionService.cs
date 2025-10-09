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
    public interface IStorageConditionService
    {
        Task<(string, PageResult<StorageConditionDto.StorageConditionResponseDto>)> GetStorageConditions(PagedRequest request);
        Task<(string, StorageConditionDto.StorageConditionResponseDto)> CreateStorageCondition(StorageConditionDto.StorageConditionRequestDto dto);
        Task<(string, StorageConditionDto.StorageConditionResponseDto)> UpdateStorageCondition(int storageConditionId, StorageConditionDto.StorageConditionRequestDto dto);
        Task<(string, bool)> DeleteStorageCondition(int storageConditionId);
    }

    public class StorageConditionService : IStorageConditionService
    {
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;
        private readonly IAreaRepository _areaRepository;
        private readonly IGoodsRepository _goodReposotory;

        public StorageConditionService(IStorageConditionRepository storageConditionRepository, IMapper mapper, IAreaRepository areaRepository, IGoodsRepository goodReposotory)
        {
            _storageConditionRepository = storageConditionRepository;
            _mapper = mapper;
            _areaRepository = areaRepository;
            _goodReposotory = goodReposotory;
        }

        public async Task<(string, PageResult<StorageConditionDto.StorageConditionResponseDto>)> GetStorageConditions(PagedRequest request)
        {
            var conditions = _storageConditionRepository.GetStorageConditions();

            if (conditions == null)
                return ("Không có dữ liệu điều kiện lưu trữ nào.".ToMessageForUser(), new PageResult<StorageConditionDto.StorageConditionResponseDto>());

            var conditionDtos = conditions.ProjectTo<StorageConditionDto.StorageConditionResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await conditionDtos.ToPagedResultAsync(request);

            return ("", pagedResult);
        }

        public async Task<(string, StorageConditionDto.StorageConditionResponseDto)> CreateStorageCondition(StorageConditionDto.StorageConditionRequestDto dto)
        {
            if (dto == null) return ("Dữ liệu tạo điều kiện lưu trữ không hợp lệ.".ToMessageForUser(), null);

            if (dto.TemperatureMin.HasValue && dto.TemperatureMax.HasValue && dto.TemperatureMin >= dto.TemperatureMax)
                return ("Nhiệt độ tối thiểu không thể lớn hơn hoặc bằng nhiệt độ tối đa.".ToMessageForUser(), null);

            if (dto.HumidityMin.HasValue && dto.HumidityMax.HasValue && dto.HumidityMin >= dto.HumidityMax)
                return ("Độ ẩm tối thiểu không thể lớn hơn hoặc bằng độ ẩm tối đa.".ToMessageForUser(), null);

            if (string.IsNullOrWhiteSpace(dto.LightLevel))
                return ("Mức độ ánh sáng không được để trống.".ToMessageForUser(), null);

            var validLightLevels = new[]
            {
                LightStorageConditionStatus.Low,
                LightStorageConditionStatus.Normal,
                LightStorageConditionStatus.High
            };

            if (!validLightLevels.Contains(dto.LightLevel))
                return ($"Mức độ ánh sáng phải thuộc: {string.Join(", ", validLightLevels)}".ToMessageForUser(), null);

            // Kiểm tra trùng lặp toàn bộ điều kiện
            var isDuplicate = await _storageConditionRepository.IsDuplicateStorageConditionAsync(
                null,
                dto.TemperatureMin,
                dto.TemperatureMax,
                dto.HumidityMin,
                dto.HumidityMax,
                dto.LightLevel);

            if (isDuplicate)
                return ("Điều kiện lưu trữ này đã tồn tại.".ToMessageForUser(), null);

            var entity = _mapper.Map<StorageCondition>(dto);
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = await _storageConditionRepository.CreateStorageCondition(entity);
            if (createdEntity == null)
                return ("Tạo điều kiện lưu trữ thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(createdEntity));
        }

        public async Task<(string, StorageConditionDto.StorageConditionResponseDto)> UpdateStorageCondition(int storageConditionId, StorageConditionDto.StorageConditionRequestDto dto)
        {
            if (dto == null) return ("Không có dữ liệu để cập nhật điều kiện lưu trữ.".ToMessageForUser(), null);

            if (dto.TemperatureMin.HasValue && dto.TemperatureMax.HasValue && dto.TemperatureMin >= dto.TemperatureMax)
                return ("Nhiệt độ tối thiểu không thể lớn hơn hoặc bằng nhiệt độ tối đa.".ToMessageForUser(), null);

            if (dto.HumidityMin.HasValue && dto.HumidityMax.HasValue && dto.HumidityMin >= dto.HumidityMax)
                return ("Độ ẩm tối thiểu không thể lớn hơn hoặc bằng độ ẩm tối đa.".ToMessageForUser(), null);

            if (string.IsNullOrWhiteSpace(dto.LightLevel))
                return ("Mức độ ánh sáng không được để trống.".ToMessageForUser(), null);

            var validLightLevels = new[]
            {
                LightStorageConditionStatus.Low,
                LightStorageConditionStatus.Normal,
                LightStorageConditionStatus.High
            };

            if (!validLightLevels.Contains(dto.LightLevel))
                return ($"Mức độ ánh sáng phải thuộc: {string.Join(", ", validLightLevels)}".ToMessageForUser(), null);

            var entity = await _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
                return ("Không tìm thấy điều kiện lưu trữ cần cập nhật.".ToMessageForUser(), null);

            // Kiểm tra trùng lặp toàn bộ điều kiện, ngoại trừ bản ghi hiện tại
            var isDuplicate = await _storageConditionRepository.IsDuplicateStorageConditionAsync(
                storageConditionId,
                dto.TemperatureMin,
                dto.TemperatureMax,
                dto.HumidityMin,
                dto.HumidityMax,
                dto.LightLevel);

            if (isDuplicate)
                return ("Điều kiện lưu trữ này đã tồn tại.".ToMessageForUser(), null);

            _mapper.Map(dto, entity);
            entity.Status = dto.Status ?? entity.Status;
            entity.UpdateAt = DateTime.UtcNow;

            var updatedEntity = await _storageConditionRepository.UpdateStorageCondition(entity);
            if (updatedEntity == null)
                return ("Cập nhật điều kiện lưu trữ thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(updatedEntity));
        }

        public async Task<(string, bool)> DeleteStorageCondition(int storageConditionId)
        {
            var entity = await _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
                return ("Không tìm thấy điều kiện lưu trữ để xoá.".ToMessageForUser(), false);

            var isUsedInArea = await _areaRepository.VerifyStorageConditionUsage(storageConditionId);
            var isUsedInGoods = await _goodReposotory.VerifyStorageConditionUsage(storageConditionId);

            if (isUsedInArea || isUsedInGoods)
                return ("Không thể xoá vì điều kiện lưu trữ này đang được sử dụng.".ToMessageForUser(), false);

            var deleted = await _storageConditionRepository.DeleteStorageCondition(storageConditionId);
            if (!deleted)
                return ("Xoá điều kiện lưu trữ thất bại.".ToMessageForUser(), false);

            return ("", true);
        }
    }
}