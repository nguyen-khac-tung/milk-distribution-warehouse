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
    public interface IPalletService
    {
        Task<(string, PageResult<PalletDto.PalletResponseDto>)> GetPallets(PagedRequest request);
        Task<(string, PalletDto.PalletDetailDto)> GetPalletById(Guid palletId);
        Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int userId);
        Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(Guid palletId, PalletDto.PalletRequestDto dto);
        Task<(string, PalletDto.PalletResponseDto)> DeletePallet(Guid palletId);
        Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown();
    }

    public class PalletService : IPalletService
    {
        private readonly IPalletRepository _palletRepository;
        private readonly IMapper _mapper;

        public PalletService(IPalletRepository palletRepository, IMapper mapper)
        {
            _palletRepository = palletRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<PalletDto.PalletResponseDto>)> GetPallets(PagedRequest request)
        {
            var pallets = _palletRepository.GetPallets();
            if (pallets == null)
                return ("Không có pallet nào.", new PageResult<PalletDto.PalletResponseDto>());

            var palletDtos = pallets.ProjectTo<PalletDto.PalletResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await palletDtos.ToPagedResultAsync(request);
            return ("", pagedResult);
        }

        public async Task<(string, PalletDto.PalletDetailDto)> GetPalletById(Guid palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet.", new PalletDto.PalletDetailDto());

            return ("", _mapper.Map<PalletDto.PalletDetailDto>(pallet));
        }

        public async Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int userId)
        {
            if (await _palletRepository.ExistsAsync(dto.BatchId, dto.LocationId))
                return ("Đã tồn tại pallet với Batch và Location này.", new PalletDto.PalletResponseDto());

            var entity = _mapper.Map<Pallet>(dto);
            entity.PalletId = Guid.NewGuid();
            entity.CreateBy = userId;
            entity.CreateAt = DateTime.Now;
            entity.Status = CommonStatus.Active;

            var created = await _palletRepository.CreatePallet(entity);
            return ("", _mapper.Map<PalletDto.PalletResponseDto>(created));
        }

        public async Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(Guid palletId, PalletDto.PalletRequestDto dto)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet.", new PalletDto.PalletResponseDto());

            if (await _palletRepository.ExistsAsync(dto.BatchId, dto.LocationId, palletId))
                return ("Có pallet khác đã sử dụng Batch và Location này.", new PalletDto.PalletResponseDto());

            _mapper.Map(dto, pallet);
            pallet.UpdateAt = DateTime.Now;

            var updated = await _palletRepository.UpdatePallet(pallet);
            return ("", _mapper.Map<PalletDto.PalletResponseDto>(updated));
        }

        public async Task<(string, PalletDto.PalletResponseDto)> DeletePallet(Guid palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet.", new PalletDto.PalletResponseDto());

            if (await _palletRepository.HasDependencies(palletId))
                return ("Không thể xoá pallet do đang được sử dụng.", new PalletDto.PalletResponseDto());

            pallet.Status = CommonStatus.Deleted;
            pallet.UpdateAt = DateTime.Now;

            var deleted = await _palletRepository.UpdatePallet(pallet);
            return ("", _mapper.Map<PalletDto.PalletResponseDto>(deleted));
        }

        public async Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown()
        {
            var pallets = await _palletRepository.GetActivePalletsAsync();
            if (!pallets.Any())
                return ("Không có pallet hoạt động.", new List<PalletDto.PalletActiveDto>());

            var dto = _mapper.Map<List<PalletDto.PalletActiveDto>>(pallets);
            return ("", dto);
        }
    }
}
