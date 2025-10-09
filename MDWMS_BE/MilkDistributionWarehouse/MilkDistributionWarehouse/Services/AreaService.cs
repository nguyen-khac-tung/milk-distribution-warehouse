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
    public interface IAreaService
    {
        Task<(string, PageResult<AreaDto.AreaResponseDto>)> GetAreas(PagedRequest request);
        Task<(string, AreaDto.AreaResponseDto)> GetAreaById(int areaId);
        Task<(string, AreaDto.AreaResponseDto)> CreateArea(AreaDto.AreaRequestDto dto);
        Task<(string, AreaDto.AreaResponseDto)> UpdateArea(int areaId, AreaDto.AreaRequestDto dto);
        Task<(string, AreaDto.AreaResponseDto)> DeleteArea(int areaId);
    }

    public class AreaService : IAreaService
    {
        private readonly IAreaRepository _areaRepository;
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;
        private readonly WarehouseContext _context;

        public AreaService(IAreaRepository areaRepository, IStorageConditionRepository storageConditionRepository, IMapper mapper, WarehouseContext context)
        {
            _areaRepository = areaRepository;
            _storageConditionRepository = storageConditionRepository;
            _mapper = mapper;
            _context = context;
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

        public async Task<(string, AreaDto.AreaResponseDto)> GetAreaById(int areaId)
        {
            if (areaId <= 0)
                return ("Mã khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var area = await _areaRepository.GetAreaById(areaId);
            if (area == null)
                return ("Không tìm thấy khu vực.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(area));
        }

        public async Task<(string, AreaDto.AreaResponseDto)> CreateArea(AreaDto.AreaRequestDto dto)
        {
            if (dto == null)
                return ("Dữ liệu khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (string.IsNullOrWhiteSpace(dto.AreaName))
                return ("Tên khu vực không được để trống.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (string.IsNullOrWhiteSpace(dto.AreaCode))
                return ("Mã khu vực không được để trống.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (ContainsSpecialCharacters(dto.AreaCode))
                return ("Mã khu vực không hợp lệ, không được chứa ký tự đặc biệt.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (dto.StorageConditionId <= 0)
                return ("StorageConditionId không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (await _areaRepository.IsDuplicateAreaCode(dto.AreaCode))
                return ("Mã khu vực đã tồn tại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var storageConditionExists = await _context.StorageConditions.AnyAsync(sc => sc.StorageConditionId == dto.StorageConditionId && sc.Status != CommonStatus.Inactive);
            if (!storageConditionExists)
                return ("Điều kiện bảo quản không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var entity = _mapper.Map<Area>(dto);
            entity.CreatedAt = DateTime.UtcNow;
            entity.Status = dto.Status ?? entity.Status;

            var createdEntity = await _areaRepository.CreateArea(entity);
            if (createdEntity == null)
                return ("Tạo khu vực thất bại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(createdEntity));
        }

        public async Task<(string, AreaDto.AreaResponseDto)> UpdateArea(int areaId, AreaDto.AreaRequestDto dto)
        {
            if (dto == null)
                return ("Dữ liệu cập nhật khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (areaId <= 0)
                return ("Mã khu vực không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var area = await _areaRepository.GetAreaById(areaId);
            if (area == null)
                return ("Không tìm thấy khu vực để cập nhật.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (string.IsNullOrWhiteSpace(dto.AreaName))
                return ("Tên khu vực không được để trống.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (string.IsNullOrWhiteSpace(dto.AreaCode))
                return ("Mã khu vực không được để trống.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (ContainsSpecialCharacters(dto.AreaCode))
                return ("Mã khu vực không hợp lệ, không được chứa ký tự đặc biệt.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (dto.StorageConditionId <= 0)
                return ("StorageConditionId không hợp lệ.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            if (await _areaRepository.IsDuplicationByIdAndCode(areaId, dto.AreaCode))
                return ("Mã khu vực đã tồn tại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            var storageConditionExists = await _context.StorageConditions.AnyAsync(sc => sc.StorageConditionId == dto.StorageConditionId && sc.Status != CommonStatus.Inactive);
            if (!storageConditionExists)
                return ("Điều kiện bảo quản không tồn tại hoặc đã bị xoá.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            _mapper.Map(dto, area);
            area.Status = dto.Status ?? area.Status;
            area.UpdateAt = DateTime.UtcNow;

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

            area.Status = CommonStatus.Inactive;
            area.UpdateAt = DateTime.UtcNow;

            var deletedEntity = await _areaRepository.UpdateArea(area);
            if (deletedEntity == null)
                return ("Xoá khu vực thất bại.".ToMessageForUser(), new AreaDto.AreaResponseDto());

            return ("", _mapper.Map<AreaDto.AreaResponseDto>(deletedEntity));
        }

        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }
    }
}