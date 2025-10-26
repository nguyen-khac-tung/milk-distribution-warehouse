using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using static MilkDistributionWarehouse.Models.DTOs.PalletDto;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PalletController : ControllerBase
    {
        private readonly IPalletService _palletService;

        public PalletController(IPalletService palletService)
        {
            _palletService = palletService;
        }

        [HttpPost("Pallets")]
        public async Task<IActionResult> GetPallets([FromBody] PagedRequest request)
        {
            var (msg, result) = await _palletService.GetPallets(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PalletDto.PalletResponseDto>>.ToResultOk(result);
        }

        [HttpGet("PalletDetail/{id}")]
        public async Task<IActionResult> GetPallet(Guid id)
        {
            var (msg, pallet) = await _palletService.GetPalletById(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletDto.PalletDetailDto>.ToResultOk(pallet);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreatePallet([FromBody] PalletDto.PalletRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            int? userId = User.GetUserId();
            var (msg, created) = await _palletService.CreatePallet(dto, userId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletDto.PalletResponseDto>.ToResultOk(created);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdatePallet(Guid id, [FromBody] PalletDto.PalletRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            var (msg, updated) = await _palletService.UpdatePallet(id, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletDto.PalletResponseDto>.ToResultOk(updated);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeletePallet(Guid id)
        {
            var (msg, deleted) = await _palletService.DeletePallet(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletDto.PalletResponseDto>.ToResultOk(deleted);
        }

        [HttpGet("GetPalletDropdown")]
        public async Task<IActionResult> GetPalletDropdown()
        {
            var (msg, pallets) = await _palletService.GetPalletDropdown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<PalletDto.PalletActiveDto>>.ToResultOk(pallets);
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(PalletDto.PalletUpdateStatusDto update)
        {
            var (msg, pallets) = await _palletService.UpdatePalletStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletUpdateStatusDto>.ToResultOk(pallets);
        }
    }
}
