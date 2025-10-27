using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Http.HttpResults;
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
        Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int? userId);
        Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(Guid palletId, PalletDto.PalletRequestDto dto);
        Task<(string, PalletDto.PalletResponseDto)> DeletePallet(Guid palletId);
        Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown();
        Task<(string, PalletDto.PalletUpdateStatusDto)> UpdatePalletStatus(PalletDto.PalletUpdateStatusDto update);
    }

    public class PalletService : IPalletService
    {
        private readonly IPalletRepository _palletRepository;
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;

        public PalletService(IPalletRepository palletRepository, IMapper mapper, ILocationRepository locationRepository)
        {
            _palletRepository = palletRepository;
            _mapper = mapper;
            _locationRepository = locationRepository;
        }

        public async Task<(string, PageResult<PalletDto.PalletResponseDto>)> GetPallets(PagedRequest request)
        {
            var pallets = _palletRepository.GetPallets();
            if (pallets == null)
                return ("Không có pallet nào.".ToMessageForUser(), new PageResult<PalletDto.PalletResponseDto>());

            var palletDtos = pallets.ProjectTo<PalletDto.PalletResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await palletDtos.ToPagedResultAsync(request);
            return ("", pagedResult);
        }

        public async Task<(string, PalletDto.PalletDetailDto)> GetPalletById(Guid palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet.".ToMessageForUser(), new PalletDto.PalletDetailDto());

            var dto = _mapper.Map<PalletDto.PalletDetailDto>(pallet);
            return ("", dto);
        }

        public async Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int? userId)
        {
            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (dto.LocationId.HasValue)
            {
                if (!await _palletRepository.ExistsLocation(dto.LocationId))
                    return ("Vị trí không tồn tại.".ToMessageForUser(), new());

                if (!await _palletRepository.IsLocationAvailable(dto.LocationId))
                    return ("Vị trí này đã có pallet khác.".ToMessageForUser(), new());
            }

            if (dto.GoodsReceiptNoteId.HasValue && !await _palletRepository.ExistsGoodRecieveNote(dto.GoodsReceiptNoteId))
                return ("GoodsReceiptNoteId do not exist.", new PalletDto.PalletResponseDto());

            if (!await _palletRepository.ExistsBatch(dto.BatchId))
                return ("Batch do not exist.", new PalletDto.PalletResponseDto());

            var entity = _mapper.Map<Pallet>(dto);
            entity.PalletId = Guid.NewGuid();
            entity.CreateBy = userId;
            entity.CreateAt = DateTime.Now;
            entity.Status = CommonStatus.Inactive;
            
            // Only update location availability when a location is provided
            if (dto.LocationId.HasValue)
            {
                entity.Status = CommonStatus.Active;
                var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);
                if (!updateIsAvail)
                    return ("Cập nhật trạng thái vị trí thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            var created = await _palletRepository.CreatePallet(entity);
            if (created == null)
                return ("Create pallet failed.", new PalletDto.PalletResponseDto());

            var createdResponse = await _palletRepository.GetPalletById(created.PalletId);
            if (createdResponse == null)
                return ("Create pallet failed (cannot load created record).", new PalletDto.PalletResponseDto());

            var createdDto = _mapper.Map<PalletDto.PalletResponseDto>(createdResponse);
            return ("", createdDto);
        }

        public async Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(Guid palletId, PalletDto.PalletRequestDto dto)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Pallet do not exist.", new PalletDto.PalletResponseDto());

            if (dto.LocationId.HasValue)
            {
                if (!await _palletRepository.ExistsLocation(dto.LocationId))
                    return ("Vị trí không tồn tại.".ToMessageForUser(), new());
                if (dto.LocationId != pallet.LocationId)
                {
                    if (!await _palletRepository.IsLocationAvailable(dto.LocationId))
                        return ("Vị trí mới đã có pallet khác.".ToMessageForUser(), new());
                }
            }

            if (dto.GoodsReceiptNoteId.HasValue && !await _palletRepository.ExistsGoodRecieveNote(dto.GoodsReceiptNoteId))
                return ("GoodsReceiptNoteId do not exist.", new PalletDto.PalletResponseDto());

            if (!await _palletRepository.ExistsBatch(dto.BatchId))
                return ("Batch do not exist.", new PalletDto.PalletResponseDto());

            var oldLocationId = pallet.LocationId;

            _mapper.Map(dto, pallet);

            // Free old location if it existed and location changed
            if (oldLocationId.HasValue && oldLocationId != dto.LocationId)
            {
                var updateIsAvailOld = await _locationRepository.UpdateIsAvailableAsync(oldLocationId, true);
                if (!updateIsAvailOld)
                    return ("Cập nhật trạng thái vị trí cũ thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            pallet.UpdateAt = DateTime.Now;

            if (dto.LocationId.HasValue)
                pallet.Status = CommonStatus.Active;
            else
                pallet.Status = CommonStatus.Inactive;

            // Occupy new location if provided and changed
            if (dto.LocationId.HasValue && oldLocationId != dto.LocationId)
            {
                var updateIsAvailNew = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);
                if (!updateIsAvailNew)
                    return ("Cập nhật trạng thái vị trí mới thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            var updated = await _palletRepository.UpdatePallet(pallet);
            if (updated == null)
                return ("Update pallet failed.", new PalletDto.PalletResponseDto());

            var updateResponse = await _palletRepository.GetPalletById(updated.PalletId);
            if (updateResponse == null)
                return ("Update pallet failed (cannot load updated record).", new PalletDto.PalletResponseDto());

            var updatedDto = _mapper.Map<PalletDto.PalletResponseDto>(updateResponse);
            return ("", updatedDto);
        }

        public async Task<(string, PalletDto.PalletResponseDto)> DeletePallet(Guid palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Pallet do not exist.", new PalletDto.PalletResponseDto());

            pallet.Status = CommonStatus.Deleted;
            pallet.UpdateAt = DateTime.Now;

            if (pallet.LocationId.HasValue)
            {
                var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(pallet.LocationId, true);
                if (!updateIsAvail)
                    return ("Cập nhật trạng thái vị trí khi xóa pallet thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            var deleted = await _palletRepository.UpdatePallet(pallet);
            if (deleted == null)
                return ("Delete pallet failed.", new PalletDto.PalletResponseDto());

            var deletedDto = _mapper.Map<PalletDto.PalletResponseDto>(deleted);
            return ("", deletedDto);
        }

        public async Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown()
        {
            var pallets = await _palletRepository.GetActivePalletsAsync();
            if (!pallets.Any())
                return ("Không có pallet hoạt động.", new List<PalletDto.PalletActiveDto>());

            var dto = _mapper.Map<List<PalletDto.PalletActiveDto>>(pallets);
            return ("", dto);
        }

        public async Task<(string, PalletDto.PalletUpdateStatusDto)> UpdatePalletStatus(PalletDto.PalletUpdateStatusDto update)
        {
            var palletExist = await _palletRepository.GetPalletById(update.PalletId);
            if (palletExist == null)
            {
                return ("Pallet do not exist.", new PalletDto.PalletUpdateStatusDto());
            }

            if (palletExist.Status == update.Status)
            {
                return ("Trạng thái hiện tại và trạng thái update đang giống nhau.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            }

            if (update.Status == CommonStatus.Deleted && palletExist.LocationId.HasValue)
            {
                var updateIsAvailOld = await _locationRepository.UpdateIsAvailableAsync(palletExist.LocationId, true);
                if (!updateIsAvailOld)
                    return ("Cập nhật trạng thái vị trí cũ thất bại.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            }

            palletExist.Status = update.Status;
            palletExist.UpdateAt = DateTime.Now;

            var updatedPallet = await _palletRepository.UpdatePallet(palletExist);
            if (updatedPallet == null)
            {
                return ("Update pallet status failed.", new PalletDto.PalletUpdateStatusDto());
            }

            var resultDto = _mapper.Map<PalletDto.PalletUpdateStatusDto>(updatedPallet);
            return ("", resultDto);
        }
    }
}
