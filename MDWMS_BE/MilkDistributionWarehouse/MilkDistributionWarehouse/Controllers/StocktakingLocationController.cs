using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

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
    }
}
