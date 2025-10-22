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
        Task<(string, PalletDto.PalletResponseDto)> GetPalletById(Guid palletId);
        Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int? userId);
        Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(Guid palletId, PalletDto.PalletRequestDto dto);
        Task<(string, PalletDto.PalletResponseDto)> DeletePallet(Guid palletId);
        Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown();
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

        public async Task<(string, PalletDto.PalletResponseDto)> GetPalletById(Guid palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            return ("", _mapper.Map<PalletDto.PalletResponseDto>(pallet));
        }

        public async Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int? userId)
        {
            if (userId == null)
                return ("Bạn phải đăng nhập để có thể tạo pallet.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (!await _palletRepository.ExistsBatch(dto.BatchId))
                return ("Lô này không tồn tại trong hệ thống.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (!await _palletRepository.ExistsLocation(dto.LocationId))
                return ("Vị trí này không tồn tại trong hệ thống hoặc .".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (!await _palletRepository.ExistsPurchaseOrder(dto.PurchaseOrderId))
                return ("Đơn mua này không tồn tại trong hệ thống.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (await _palletRepository.ExistsAsync(dto.LocationId))
                return ("Đã tồn tại pallet ở vị trí này.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            
            var entity = _mapper.Map<Pallet>(dto);
            entity.PalletId = Guid.NewGuid();
            entity.CreateBy = userId;
            entity.CreateAt = DateTime.Now;
            entity.Status = CommonStatus.Active;
            var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);

            if (!updateIsAvail)
                return ("Cập nhật trạng thái vị trí thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            var created = await _palletRepository.CreatePallet(entity);
            var createdResponse =await _palletRepository.GetPalletById(created.PalletId);
            return ("", _mapper.Map<PalletDto.PalletResponseDto>(createdResponse));
        }

        public async Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(Guid palletId, PalletDto.PalletRequestDto dto)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet bạn đã chọn trên hệ thống.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (await _palletRepository.ExistsAsync(dto.LocationId, palletId))
                return ("Có pallet khác đã sử dụng vị trí này.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            _mapper.Map(dto, pallet);
            pallet.UpdateAt = DateTime.Now;

            var updated = await _palletRepository.UpdatePallet(pallet);
            var updateResponse = await _palletRepository.GetPalletById(updated.PalletId);
            return ("", _mapper.Map<PalletDto.PalletResponseDto>(updated));
        }

        public async Task<(string, PalletDto.PalletResponseDto)> DeletePallet(Guid palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet bạn đã chọn trên hệ thống.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            //if (await _palletRepository.HasDependencies(palletId))
            //    return ("Không thể xoá pallet do đang được sử dụng.".ToMessageForUser(), new PalletDto.PalletResponseDto());

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
