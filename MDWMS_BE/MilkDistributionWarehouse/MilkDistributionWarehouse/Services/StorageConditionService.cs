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
        private readonly WarehouseContext _context;  // Added for potential FK validation if needed

        public StorageConditionService(IStorageConditionRepository storageConditionRepository, IMapper mapper, WarehouseContext context)
        {
            _storageConditionRepository = storageConditionRepository;
            _mapper = mapper;
            _context = context;
        }

        public async Task<(string, PageResult<StorageConditionDto.StorageConditionResponseDto>)> GetStorageConditions(PagedRequest request)
        {
            var conditions = _storageConditionRepository.GetStorageConditions();

            if (conditions == null)
                return ("No storage conditions available", new PageResult<StorageConditionDto.StorageConditionResponseDto>());

            var conditionDtos = conditions.ProjectTo<StorageConditionDto.StorageConditionResponseDto>(_mapper.ConfigurationProvider);

            var pagedResult = await conditionDtos.ToPagedResultAsync(request);

            return ("", pagedResult);
        }

        public async Task<(string, StorageConditionDto.StorageConditionResponseDto)> CreateStorageCondition(StorageConditionDto.StorageConditionRequestDto dto)
        {
            if (dto == null) return ("Storage condition create is null", null);

            if (dto.TemperatureMin.HasValue && dto.TemperatureMax.HasValue && dto.TemperatureMin > dto.TemperatureMax)
                return ("TemperatureMin cannot be greater than TemperatureMax", null);

            if (dto.HumidityMin.HasValue && dto.HumidityMax.HasValue && dto.HumidityMin > dto.HumidityMax)
                return ("HumidityMin cannot be greater than HumidityMax", null);

            if (string.IsNullOrWhiteSpace(dto.LightLevel))
                return ("LightLevel is required", null);

            var entity = _mapper.Map<StorageCondition>(dto);
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = (int)CommonStatus.Active;  // Changed from 1 to enum for clarity

            var createdEntity = await _storageConditionRepository.CreateStorageCondition(entity);
            if (createdEntity == null)
                return ("Failed to create storage condition", null);

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(createdEntity));
        }

        public async Task<(string, StorageConditionDto.StorageConditionResponseDto)> UpdateStorageCondition(int storageConditionId, StorageConditionDto.StorageConditionRequestDto dto)
        {
            if (dto == null) return ("Storage condition update is null", null);

            if (dto.TemperatureMin.HasValue && dto.TemperatureMax.HasValue && dto.TemperatureMin > dto.TemperatureMax)
                return ("TemperatureMin cannot be greater than TemperatureMax", null);

            if (dto.HumidityMin.HasValue && dto.HumidityMax.HasValue && dto.HumidityMin > dto.HumidityMax)
                return ("HumidityMin cannot be greater than HumidityMax", null);

            if (string.IsNullOrWhiteSpace(dto.LightLevel))
                return ("LightLevel is required", null);

            var entity = await _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
                return ("Storage condition not found", null);

            _mapper.Map(dto, entity);
            entity.UpdateAt = DateTime.UtcNow;

            var updatedEntity = await _storageConditionRepository.UpdateStorageCondition(entity);
            if (updatedEntity == null)
                return ("Failed to update storage condition", null);

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(updatedEntity));
        }

        public async Task<(string, bool)> DeleteStorageCondition(int storageConditionId)
        {
            var entity = await _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
                return ("Storage condition not found", false);

            // Check for dependent Areas or Goods (assuming FK relationships)
            if (await _context.Areas.AnyAsync(a => a.StorageConditionId == storageConditionId && a.Status != CommonStatus.Inactive) ||
                await _context.Goods.AnyAsync(g => g.StorageConditionId == storageConditionId && g.Status != CommonStatus.Inactive))
            {
                return ("Cannot delete, storage condition is in use", false);
            }

            var deleted = await Task.FromResult(_storageConditionRepository.DeleteStorageCondition(storageConditionId));
            if (!await deleted)
            return ("Failed to delete storage condition", false);

            return ("", true);
        }
    }
}