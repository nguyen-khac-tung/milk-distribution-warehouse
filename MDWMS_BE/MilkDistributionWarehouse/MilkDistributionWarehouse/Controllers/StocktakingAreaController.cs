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
    public class StocktakingAreaController : ControllerBase
    {
        private readonly IStocktakingAreaService _stocktakingAreaService;
        public StocktakingAreaController(IStocktakingAreaService stocktakingAreaService)
        {
            _stocktakingAreaService = stocktakingAreaService;
        }

        [HttpGet("GetDetailForWarehouseStaffByStocktakingSheetId/{stoctakingSheetId}")]
        [Authorize(Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> GetDetailStocktakingAreaByStocktakingSheetId(string stoctakingSheetId)
        {
            var (msg, stocktakingAreaDetail) = await _stocktakingAreaService.GetStocktakingAreaByStocktakingSheetId(stoctakingSheetId, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingAreaDetailDto>.ToResultOk(stocktakingAreaDetail);
        }

        [HttpGet("GetDetailForOtherRoleByStocktakingSheetId/{stoctakingSheetId}")]
        [Authorize(Roles = $"{RoleNames.WarehouseManager}, {RoleNames.SalesManager}")]
        public async Task<IActionResult> GetDetailOtherRoleStocktakingAreaByStocktakingSheetId(string stoctakingSheetId)
        {
            var (msg, stocktakingAreaDetail) = await _stocktakingAreaService.GetStocktakingAreaByStocktakingSheetId(stoctakingSheetId, null);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingAreaDetailDto>.ToResultOk(stocktakingAreaDetail);
        }
    }
}
