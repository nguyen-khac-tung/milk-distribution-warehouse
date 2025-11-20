using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StocktakingLocationController : ControllerBase
    {
        private readonly IStocktakingLocationService _stocktakingLocationService;
        public StocktakingLocationController(IStocktakingLocationService stocktakingLocationService)
        {
            _stocktakingLocationService = stocktakingLocationService;
        }

        [HttpPost("ConfirmCounted")]
        public async Task<IActionResult> ConfirmStocktakingLocationCounted([FromBody] StocktakingLocationCountedStatus update)
        {
            var (msg, stocktakingLocation) = await _stocktakingLocationService.UpdateStocktakingLocationStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingLocationResponse>.ToResultOk(stocktakingLocation);
        }

        [HttpPut("UpdateRecords")]
        public async Task<IActionResult> UpdatteStocktakingLocation([FromBody] StocktakingLocationUpdate update)
        {
            var (msg, stocktakingLocation) = await _stocktakingLocationService.UpdateStocktakingLocation(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingLocationResponse>.ToResultOk(stocktakingLocation);
        }

        [HttpPut("RejectRecords")]
        public async Task<IActionResult> RejectStocktakingLocationBulk([FromBody] List<StocktakingLocationRejectStatus> update)
        {
            var (msg, stocktakingLocation) = await _stocktakingLocationService.RejectStocktakingLocationBulk(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingLocationRejectStatus>>.ToResultOk(stocktakingLocation);
        }

        [HttpPut("CancelRecord")]
        public async Task<IActionResult> CancelStocktakingLocationBulk([FromBody] List<StocktakingLocationCancelStatus> update)
        {
            var (msg, stocktakingLocation) = await _stocktakingLocationService.CancelStocktakingLocationBulk(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingLocationCancelStatus>>.ToResultOk(stocktakingLocation);
        }
    }
}
