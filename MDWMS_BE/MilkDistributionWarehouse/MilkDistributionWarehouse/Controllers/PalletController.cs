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
            return ApiResponse<PageResult<PalletResponseDto>>.ToResultOk(result);
        }

        [HttpGet("PalletDetail/{id}")]
        public async Task<IActionResult> GetPallet(string id)
        {
            var (msg, pallet) = await _palletService.GetPalletById(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletDetailDto>.ToResultOk(pallet);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreatePallet([FromBody] PalletRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            int? userId = User.GetUserId();
            var (msg, created) = await _palletService.CreatePallet(dto, userId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletResponseDto>.ToResultOk(created);
        }

        // New endpoint: create one or many pallets depending on list provided
        [HttpPost("CreateBulk")]
        public async Task<IActionResult> CreatePalletsBulk([FromBody] PalletBulkCreate create)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            int? userId = User.GetUserId();
            var (msg, result) = await _palletService.CreatePalletBulk(create, userId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletBulkResponse>.ToResultOk(result);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdatePallet(string id, [FromBody] PalletRequestDto dto)
        {
            if (!ModelState.IsValid)
                return ApiResponse<string>.ToResultError("Dữ liệu không hợp lệ.");
            var (msg, updated) = await _palletService.UpdatePallet(id, dto);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletResponseDto>.ToResultOk(updated);
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeletePallet(string id)
        {
            var (msg, deleted) = await _palletService.DeletePallet(id);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletResponseDto>.ToResultOk(deleted);
        }

        [HttpGet("GetPalletDropdown")]
        public async Task<IActionResult> GetPalletDropdown()
        {
            var (msg, pallets) = await _palletService.GetPalletDropdown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<PalletActiveDto>>.ToResultOk(pallets);
        }

        [HttpGet("GetPalletByGRNID")]
        public async Task<IActionResult> GetPalletByGRNID(Guid grnid)
        {
            var (msg, pallets) = await _palletService.GetPalletByGRNID(grnid);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<PalletResponseDto>>.ToResultOk(pallets);
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(PalletUpdateStatusDto update)
        {
            var (msg, pallets) = await _palletService.UpdatePalletStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletUpdateStatusDto>.ToResultOk(pallets);
        }

        [HttpPut("UpdatePackageQuantity")]
        public async Task<IActionResult> UpdatePackageQuantity(PalletUpdatePQuantityDto update)
        {
            var (msg, pallets) = await _palletService.UpdatePalletQuantity(update.PalletId, update.takeOutQuantity);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PalletUpdateStatusDto>.ToResultOk(pallets);
        }
    }
}
