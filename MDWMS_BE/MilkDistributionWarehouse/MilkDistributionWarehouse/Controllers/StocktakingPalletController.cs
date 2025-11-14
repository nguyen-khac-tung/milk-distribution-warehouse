using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

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
        [Authorize(Roles = $"{RoleNames.WarehouseStaff}, {RoleNames.WarehouseManager}, {RoleNames.SalesManager}")]
        public async Task<IActionResult> GetDetailStocktakingPalletByStocktakingLocationId(Guid stocktakingLocationId)
        {
            var (msg, stocktakingPallet) = await _stocktakingPalletService.GetStocktakingPalletByStocktakingLocationId(stocktakingLocationId);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingPalletDto>.ToResultOk(stocktakingPallet);
        }
    }
}
