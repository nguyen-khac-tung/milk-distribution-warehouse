using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface IAreaService
    {
        string GetAreas(out List<AreaDto.AreaResponseDto> areas);
        string GetAreaById(int areaId, out AreaDto.AreaResponseDto? area);
        string CreateArea(AreaDto.AreaRequestDto dto, out AreaDto.AreaResponseDto? createdArea);
        string UpdateArea(int areaId, AreaDto.AreaRequestDto dto, out AreaDto.AreaResponseDto? updatedArea);
        string DeleteArea(int areaId, out bool deleted);
    }

    public class AreaService : IAreaService
    {
        private readonly IAreaRepository _areaRepository;
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;

        public AreaService(IAreaRepository areaRepository, IStorageConditionRepository storageConditionRepository, IMapper mapper)
        {
            _storageConditionRepository = storageConditionRepository;
            _areaRepository = areaRepository;
            _mapper = mapper;
        }

        public string GetAreas(out List<AreaDto.AreaResponseDto> areas)
        {
            areas = new List<AreaDto.AreaResponseDto>();

            var result = _areaRepository.GetAreas();
            if (result == null || !result.Any())
            {
                return "No areas found.";
            }

            areas = _mapper.Map<List<AreaDto.AreaResponseDto>>(result);
            return "";
        }

        public string GetAreaById(int areaId, out AreaDto.AreaResponseDto? area)
        {
            area = null;

            var result = _areaRepository.GetAreaById(areaId);
            if (result == null)
            {
                return "Area not found.";
            }

            area = _mapper.Map<AreaDto.AreaResponseDto>(result);
            return "";
        }

        public string CreateArea(AreaDto.AreaRequestDto dto, out AreaDto.AreaResponseDto? createdArea)
        {
            createdArea = null;

            if (string.IsNullOrWhiteSpace(dto.AreaName))
            {
                return "AreaName is required.";
            }
            if (string.IsNullOrWhiteSpace(dto.AreaCode))
            {
                return "AreaCode is required.";
            }
            if (dto.StorageConditionId <= 0)
            {
                return "Valid StorageConditionId is required.";
            }

            // Check if AreaCode already exists
            var existingArea = _areaRepository.GetAreas().FirstOrDefault(a => a.AreaCode == dto.AreaCode.Trim());
            if (existingArea != null)
            {
                return "AreaCode already exists.";
            }

            var storageCondition = _storageConditionRepository.GetStorageConditionById(dto.StorageConditionId);
            if (storageCondition == null || storageCondition.Status == CommonStatus.Inactive)
            {
                return "Invalid StorageConditionId.";
            }

            var entity = _mapper.Map<Area>(dto);
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = _areaRepository.CreateArea(entity);
            if (createdEntity == null)
            {
                return "Failed to create area.";
            }

            createdArea = _mapper.Map<AreaDto.AreaResponseDto>(createdEntity);
            return "";
        }

        public string UpdateArea(int areaId, AreaDto.AreaRequestDto dto, out AreaDto.AreaResponseDto? updatedArea)
        {
            updatedArea = null;

            if (string.IsNullOrWhiteSpace(dto.AreaName))
            {
                return "AreaName is required.";
            }
            if (string.IsNullOrWhiteSpace(dto.AreaCode))
            {
                return "AreaCode is required.";
            }
            if (dto.StorageConditionId <= 0)
            {
                return "Valid StorageConditionId is required.";
            }

            var entity = _areaRepository.GetAreaById(areaId);
            if (entity == null)
            {
                return "Area not found.";
            }

            // Check for duplicate AreaCode (excluding current)
            var existingArea = _areaRepository.GetAreas().FirstOrDefault(a => a.AreaCode == dto.AreaCode.Trim() && a.AreaId != areaId);
            if (existingArea != null)
            {
                return "AreaCode already exists.";
            }

            // Validate FK
            var storageCondition = _storageConditionRepository.GetStorageConditionById(dto.StorageConditionId);
            if (storageCondition == null || storageCondition.Status == CommonStatus.Inactive)
            {
                return "Invalid StorageConditionId.";
            }

            _mapper.Map(dto, entity);
            entity.UpdateAt = DateTime.UtcNow;

            var updatedEntity = _areaRepository.UpdateArea(entity);
            if (updatedEntity == null)
            {
                return "Failed to update area.";
            }

            updatedArea = _mapper.Map<AreaDto.AreaResponseDto>(updatedEntity);
            return "";
        }

        public string DeleteArea(int areaId, out bool deleted)
        {
            deleted = false;

            var entity = _areaRepository.GetAreaById(areaId);
            if (entity == null)
            {
                return "Area not found.";
            }

            //Check if Area has dependent Locations or StocktakingAreas
            //if (_context.Locations.Any(l => l.AreaId == areaId) || _context.StocktakingAreas.Any(sa => sa.AreaId == areaId))
            //{
            //    return "Cannot delete area with existing locations or stocktakings.";
            //}

            deleted = _areaRepository.DeleteArea(areaId);
            if (!deleted)
            {
                return "Failed to delete area.";
            }

            return "";
        }
    }
}