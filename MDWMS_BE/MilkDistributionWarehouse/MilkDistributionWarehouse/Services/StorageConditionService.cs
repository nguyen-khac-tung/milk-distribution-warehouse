using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System.Security.Claims;

namespace MilkDistributionWarehouse.Services
{
    public interface IStorageConditionService
    {
        string GetStorageConditions(out List<StorageConditionDto.StorageConditionResponseDto> storageConditions);
        string GetStorageConditionById(int storageConditionId, out StorageConditionDto.StorageConditionResponseDto? storageCondition);
        string CreateStorageCondition(StorageConditionDto.StorageConditionRequestDto dto, out StorageConditionDto.StorageConditionResponseDto? createdStorageCondition);
        string UpdateStorageCondition(int storageConditionId, StorageConditionDto.StorageConditionRequestDto dto, out StorageConditionDto.StorageConditionResponseDto? updatedStorageCondition);
        string DeleteStorageCondition(int storageConditionId, out bool deleted);
    }

    public class StorageConditionService : IStorageConditionService
    {
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;

        public StorageConditionService(IStorageConditionRepository storageConditionRepository, IMapper mapper)
        {
            _storageConditionRepository = storageConditionRepository;
            _mapper = mapper;
        }

        public string GetStorageConditions(out List<StorageConditionDto.StorageConditionResponseDto> storageConditions)
        {
            storageConditions = new List<StorageConditionDto.StorageConditionResponseDto>();

            var result = _storageConditionRepository.GetStorageConditions();
            if (result == null || !result.Any())
            {
                return "No storage conditions found.";
            }

            storageConditions = _mapper.Map<List<StorageConditionDto.StorageConditionResponseDto>>(result);
            return "";
        }

        public string GetStorageConditionById(int storageConditionId, out StorageConditionDto.StorageConditionResponseDto? storageCondition)
        {
            storageCondition = null;

            var result = _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (result == null)
            {
                return "Storage condition not found.";
            }

            storageCondition = _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(result);
            return "";
        }

        public string CreateStorageCondition(StorageConditionDto.StorageConditionRequestDto dto, out StorageConditionDto.StorageConditionResponseDto? createdStorageCondition)
        {
            createdStorageCondition = null;

            if (dto.TemperatureMin.HasValue && dto.TemperatureMax.HasValue && dto.TemperatureMin > dto.TemperatureMax)
            {
                return "TemperatureMin cannot be greater than TemperatureMax";
            }
            if (dto.HumidityMin.HasValue && dto.HumidityMax.HasValue && dto.HumidityMin > dto.HumidityMax)
            {
                return "HumidityMin cannot be greater than HumidityMax";
            }
            if (string.IsNullOrWhiteSpace(dto.LightLevel))
            {
                return "LightLevel is required";
            }

            var entity = _mapper.Map<StorageCondition>(dto);
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = 1;

            var createdEntity = _storageConditionRepository.CreateStorageCondition(entity);
            if (createdEntity == null)
            {
                return "Failed to create storage condition.";
            }

            createdStorageCondition = _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(createdEntity);
            return "";
        }

        public string UpdateStorageCondition(int storageConditionId, StorageConditionDto.StorageConditionRequestDto dto, out StorageConditionDto.StorageConditionResponseDto? updatedStorageCondition)
        {
            updatedStorageCondition = null;

            if (dto.TemperatureMin.HasValue && dto.TemperatureMax.HasValue && dto.TemperatureMin > dto.TemperatureMax)
            {
                return "TemperatureMin cannot be greater than TemperatureMax";
            }
            if (dto.HumidityMin.HasValue && dto.HumidityMax.HasValue && dto.HumidityMin > dto.HumidityMax)
            {
                return "HumidityMin cannot be greater than HumidityMax";
            }
            if (string.IsNullOrWhiteSpace(dto.LightLevel))
            {
                return "LightLevel is required";
            }

            var entity = _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
            {
                return "Storage condition not found.";
            }

            _mapper.Map(dto, entity);
            entity.UpdateAt = DateTime.UtcNow;

            var updatedEntity = _storageConditionRepository.UpdateStorageCondition(entity);
            if (updatedEntity == null)
            {
                return "Failed to update storage condition.";
            }

            updatedStorageCondition = _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(updatedEntity);
            return "";
        }

        public string DeleteStorageCondition(int storageConditionId, out bool deleted)
        {
            deleted = false;

            var entity = _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
            {
                return "Storage condition not found.";
            }

            deleted = _storageConditionRepository.DeleteStorageCondition(storageConditionId);
            if (!deleted)
            {
                return "Failed to delete storage condition.";
            }

            return "";
        }
    }
}