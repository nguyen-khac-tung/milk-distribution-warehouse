using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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

        [HttpGet("GetDetail/{stocktakingSheetId}")]
        [Authorize(Roles = RoleNames.WarehouseManager + "," + RoleNames.WarehouseStaff + "," + RoleNames.SalesManager)]
        public async Task<IActionResult> GetStocktakingSheetDetail(string stocktakingSheetId)
        {
            var (msg, stocktakingDetail) = await _stocktakingSheetService.GetStocktakingSheetDetail(stocktakingSheetId, User.GetUserId(), User.GetUserRole());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheetDetail>.ToResultOk(stocktakingDetail);
        }

        [HttpPost("GetListForWarehouseManager")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> GetStocktakingWarehouseManager([FromBody] PagedRequest request)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.GetStocktakingSheets(request, RoleNames.WarehouseManager, null);
            if (!string.IsNullOrEmpty(msg))
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
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPost("Create_1")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> CreateStocktakingSheet_1([FromBody] StocktakingSheetCreateDto create)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.CreateStoctakingSheet_1(create, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPut("Update")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> UpdateStocktakingSheet([FromBody] StocktakingSheetUpdate update)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.UpdateStocktakingSheet(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPut("AssignAreaConfirm")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> AssignAreaConfirmStocktakingSheet([FromBody] StocktakingSheetAssignStatus update)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.UpdateStocktakingSheetStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPut("ReAssignAreaConfirm")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> ReAssignAreaConfirmStocktakingSheet([FromBody] StocktakingSheetReAssignStatus update)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.UpdateStocktakingSheetStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPut("Cancel")]
        [Authorize(Roles = RoleNames.WarehouseManager + "," + RoleNames.SalesManager)]
        public async Task<IActionResult> CancelStocktakingSheet([FromBody] StocktakingSheetCancelStatus update)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.UpdateStocktakingSheetStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPut("InProgress")]
        [Authorize(Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> InProgressStocktakingSheet([FromBody] StocktakingSheetInProgressStatus update)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.UpdateStocktakingSheetStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpPut("Completed")]
        [Authorize(Roles = RoleNames.SalesManager)]
        public async Task<IActionResult> CompletedStocktakingSheet([FromBody] StocktakingSheetCompletedStatus update)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.UpdateStocktakingSheetStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }

        [HttpDelete("Delete/{stocktakingSheetId}")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> DeleteStocktakingSheet(string stocktakingSheetId)
        {
            var (msg, stocktaking) = await _stocktakingSheetService.DeleteStocktakingSheet(stocktakingSheetId, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingSheeteResponse?>.ToResultOk(stocktaking);
        }
    }
}
