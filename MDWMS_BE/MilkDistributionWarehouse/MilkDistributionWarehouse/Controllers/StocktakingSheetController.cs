using Azure.Core;
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
    public class StocktakingSheetController : ControllerBase
    {
        private readonly IStocktakingSheetService _stocktakingSheetService;
        public StocktakingSheetController(IStocktakingSheetService stocktakingSheetService)
        {
            _stocktakingSheetService = stocktakingSheetService;
        }

        [HttpPost("GetListForWarehouseManager")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> GetStocktakingWarehouseManager([FromBody] PagedRequest request)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.GetStocktakingSheets(request, RoleNames.WarehouseManager, null);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<StocktakingSheetDto>>.ToResultOk(stocktaking);
        }

        [HttpPost("GetListForWarehouseStaff")]
        [Authorize(Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> GetStocktakingWarehouseStaff([FromBody] PagedRequest request)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.GetStocktakingSheets(request, RoleNames.WarehouseStaff, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<StocktakingSheetDto>>.ToResultOk(stocktaking);
        }

        [HttpPost("GetListForSaleManager")]
        [Authorize(Roles = RoleNames.SalesManager)]
        public async Task<IActionResult> GetStocktakingSaleManager([FromBody] PagedRequest request)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.GetStocktakingSheets(request, RoleNames.SalesManager, null);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<StocktakingSheetDto>>.ToResultOk(stocktaking);
        }

        [HttpPost("Create")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> CreateStocktakingSheet([FromBody] StocktakingSheetCreate create)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.CreateStocktakingSheet(create, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheetCreateResponse?>.ToResultOk(stocktaking);
        }
    }
}
