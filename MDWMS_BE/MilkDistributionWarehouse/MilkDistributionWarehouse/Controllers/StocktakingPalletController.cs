using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Net.WebSockets;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StocktakingPalletController : ControllerBase
    {
        private readonly IStocktakingPalletService _stocktakingPalletService;
        public StocktakingPalletController(IStocktakingPalletService stocktakingPalletService)
        {
            _stocktakingPalletService = stocktakingPalletService;
        }

        [HttpGet("GetDetail/{stocktakingLocationId}")]
        [Authorize(Roles = $"{RoleNames.WarehouseManager}, {RoleNames.SalesManager}")]
        public async Task<IActionResult> GetDetailStocktakingPallet(Guid stocktakingLocationId)
        {
            var (msg, stocktakingPallet) = await _stocktakingPalletService.GetStocktakingPalletByStocktakingLocationId(stocktakingLocationId);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingPalletDto>>.ToResultOk(stocktakingPallet);
        }

        [HttpGet("GetDetail/{stocktakingLocationId}/{locationCode}")]
        [Authorize(Roles = $"{RoleNames.WarehouseStaff}")]
        public async Task<IActionResult> GetDetailStocktakingPallet(Guid stocktakingLocationId, string locationCode)
        {
            var (msg, stocktakingPallet) = await _stocktakingPalletService.GetStocktakingPalletByLocationCode(locationCode, stocktakingLocationId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingPalletDto>>.ToResultOk(stocktakingPallet);
        }

        [HttpGet("UndoStocktakingPalletRecord/{stocktakingPalletId}")]
        [Authorize(Roles = $"{RoleNames.WarehouseStaff}")]
        public async Task<IActionResult> UndoStocktakingPallet(Guid stocktakingPalletId)
        {
            var (msg, stocktakingPallet) = await _stocktakingPalletService.UndoStocktakingPallet(stocktakingPalletId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletDto>.ToResultOk(stocktakingPallet);
        }

        [HttpPost("ScannerStocktakingPallet")]
        public async Task<IActionResult> ScannerStocktakingPallet([FromBody] StocktakingPalletScanner scanner)
        {
            var (msg, stoctakingPallet) = await _stocktakingPalletService.ScannerStocktakingPallet(scanner);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletDto>.ToResultOk(stoctakingPallet);
        }

        [HttpPut("MissStocktakingPallet")]
        [Authorize (Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> UpdateStocktakingPalletMissStatus([FromBody] StocktakingPalletMissingStatus update)
        {
            var (msg, stoctakingPallet) = await _stocktakingPalletService.UpdateStocktakingPalletStauts(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletUpdateStatus>.ToResultOk(stoctakingPallet);
        }

        [HttpPut("MatchStocktakingPallet")]
        [Authorize(Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> UpdateStocktakingPalletMatchStatus([FromBody] StocktakingPalletMatchStatus update)
        {
            var (msg, stoctakingPallet) = await _stocktakingPalletService.UpdateStocktakingPalletStauts(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletUpdateStatus>.ToResultOk(stoctakingPallet);
        }

        [HttpPut("SuplusStocktakingPallet")]
        [Authorize(Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> UpdateStocktakingPalletSuplusStatus([FromBody] StocktakingPalletSurplusStatus update)
        {
            var (msg, stoctakingPallet) = await _stocktakingPalletService.UpdateStocktakingPalletStauts(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletUpdateStatus>.ToResultOk(stoctakingPallet);
        }

        [HttpDelete("Delete/{stocktakingPalletId}")]
        public async Task<IActionResult> DeleteStocktakingPallet(Guid stocktakingPalletId)
        {
            var (msg, stoctakingPallet) = await _stocktakingPalletService.DeleteStocktakingPallet(stocktakingPalletId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletResponse>.ToResultOk(stoctakingPallet);
        }
    }
}
