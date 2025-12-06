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
        Task<(string, StorageConditionDto.StorageConditionResponseDto)> UpdateStatus(int storageConditionId, int status);
        Task<(string, List<StorageConditionDto.StorageConditionActiveDto>)> GetActiveStorageConditions();
    }

    public class StorageConditionService : IStorageConditionService
    {
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;
        private readonly IAreaRepository _areaRepository;
        private readonly IGoodsRepository _goodReposotory;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;

        public StorageConditionService(IStorageConditionRepository storageConditionRepository, IMapper mapper, IAreaRepository areaRepository, IGoodsRepository goodReposotory, IStocktakingSheetRepository stocktakingSheetRepository)
        {
            _storageConditionRepository = storageConditionRepository;
            _mapper = mapper;
            _areaRepository = areaRepository;
            _goodReposotory = goodReposotory;
            _stocktakingSheetRepository = stocktakingSheetRepository;
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

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

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
            entity.CreatedAt = DateTimeUtility.Now();
            entity.Status = (int)CommonStatus.Active;

            var createdEntity = await _storageConditionRepository.CreateStorageCondition(entity);
            if (createdEntity == null)
                return ("Tạo điều kiện lưu trữ thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(createdEntity));
        }

        public async Task<(string, StorageConditionDto.StorageConditionResponseDto)> UpdateStorageCondition(int storageConditionId, StorageConditionDto.StorageConditionRequestDto dto)
        {
            if (dto == null) return ("Không có dữ liệu để cập nhật điều kiện lưu trữ.".ToMessageForUser(), null);

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

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
            entity.UpdateAt = DateTimeUtility.Now();

            var updatedEntity = await _storageConditionRepository.UpdateStorageCondition(entity);
            if (updatedEntity == null)
                return ("Cập nhật điều kiện lưu trữ thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(updatedEntity));
        }

        public async Task<(string, bool)> DeleteStorageCondition(int storageConditionId)
        {
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), false);

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

        public async Task<(string, StorageConditionDto.StorageConditionResponseDto)> UpdateStatus(int storageConditionId, int status)
        {
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

            var entity = await _storageConditionRepository.GetStorageConditionById(storageConditionId);
            if (entity == null)
                return ("Không tìm thấy điều kiện lưu trữ cần cập nhật.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

            if (entity.Status == CommonStatus.Deleted)
                return ("Điều kiện lưu trữ này đã bị xoá, không thể cập nhật trạng thái.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

            if (status != CommonStatus.Active && status != CommonStatus.Inactive && status != CommonStatus.Deleted)
                return ("Trạng thái không hợp lệ.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

            var isUsedInArea = await _areaRepository.VerifyStorageConditionUsage(storageConditionId);
            var isUsedInGoods = await _goodReposotory.VerifyStorageConditionUsage(storageConditionId);

            if (isUsedInArea || isUsedInGoods)
                return ("Không thể cập nhật trạng thái vì điều kiện lưu trữ này đang được sử dụng.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

            entity.Status = status;
            entity.UpdateAt = DateTimeUtility.Now();

            var updated = await _storageConditionRepository.UpdateStorageCondition(entity);
            if (updated == null)
                return ("Cập nhật trạng thái thất bại.".ToMessageForUser(), new StorageConditionDto.StorageConditionResponseDto());

            return ("", _mapper.Map<StorageConditionDto.StorageConditionResponseDto>(updated));
        }

        public async Task<(string, List<StorageConditionDto.StorageConditionActiveDto>)> GetActiveStorageConditions()
        {
            var activeConditions = await _storageConditionRepository.GetActiveStorageConditionsAsync();

            if (activeConditions == null || !activeConditions.Any())
                return ("Không có điều kiện lưu trữ nào đang hoạt động.".ToMessageForUser(), new List<StorageConditionDto.StorageConditionActiveDto>());

            var result = _mapper.Map<List<StorageConditionDto.StorageConditionActiveDto>>(activeConditions);
            return ("", result);
        }
    }
}