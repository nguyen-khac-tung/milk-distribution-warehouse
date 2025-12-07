using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
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
        public async Task<IActionResult> GetDetailStocktakingAreaByStocktakingSheetId(string stoctakingSheetId,[FromQuery] Guid? stocktakingAreaId)
        {
            var (msg, stocktakingAreaDetail) = await _stocktakingAreaService.GetStocktakingAreaByStocktakingSheetId(stoctakingSheetId, stocktakingAreaId, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingAreaDetailDto>>.ToResultOk(stocktakingAreaDetail);
        }

        [HttpGet("GetDetailForOtherRoleByStocktakingSheetId/{stoctakingSheetId}")]
        [Authorize(Roles = $"{RoleNames.WarehouseManager}, {RoleNames.SalesManager}")]
        public async Task<IActionResult> GetDetailOtherRoleStocktakingAreaByStocktakingSheetId(string stoctakingSheetId)
        {
            var (msg, stocktakingAreaDetail) = await _stocktakingAreaService.GetStocktakingAreaByStocktakingSheetId(stoctakingSheetId, null, null);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingAreaDetailDto>>.ToResultOk(stocktakingAreaDetail);
        }

        [HttpGet("GetStocktakingAreaById/{stocktakingSheetId}")]
        [Authorize(Roles = RoleNames.WarehouseStaff)]
        public async Task<IActionResult> GetStocktakingAreaById(string stocktakingSheetId)
        {
            var (msg, stocktakingArea) = await _stocktakingAreaService.GetStocktakingAreaByStocktakingSheetIdSync(stocktakingSheetId, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingAreaDetail>>.ToResultOk(stocktakingArea);
        }

        [HttpGet("GetStocktakingAreaForAssignToByStocktakingSheetId/{stocktakingSheetId}")]
        //[Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> GetStocktakingAreaForAssignToByStocktakingSheetId(string stocktakingSheetId)
        {
            var (msg, stocktakingArea) = await _stocktakingAreaService.GetStocktakingAreaForAssignToByStocktakingSheetIdSync(stocktakingSheetId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<StocktakingAreaDetail>>.ToResultOk(stocktakingArea);
        }

        [HttpPut("ReAssignStocktakingArea")]
        [Authorize(Roles = RoleNames.WarehouseManager)]
        public async Task<IActionResult> UpdateStocktakingAreaReAssignStatus([FromBody] StocktakingAreaReAssignStatus update)
        {
            var(msg, stocktakingArea) = await _stocktakingAreaService.UpdateStocktakingReAssignTo(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingAreaReAssignStatus>.ToResultOk(stocktakingArea);
        }

        [HttpPut("Submit")]
        public async Task<IActionResult> SubmitStocktakingArea([FromBody] StocktakingAreaPendingAprrovalStatus update)
        {
            var (msg, stocktakingArea) = await _stocktakingAreaService.UpdateStocktakingAreaStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingAreaResponse>.ToResultOk(stocktakingArea);
        }

        [HttpPut("Approval")]
        public async Task<IActionResult> ApprovalStocktakingArea([FromBody] StocktakingAreaApprovalStatus update)
        {
            var (msg, stocktakingArea) = await _stocktakingAreaService.UpdateStocktakingAreaApprovalStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<StocktakingAreaApprovalResponse>.ToResultOk(stocktakingArea);
        }

        [HttpGet("ExportStocktakingAreaWord/{stocktakingAreaId}")]
        public async Task<IActionResult> ExportStocktakingAreaWord(Guid stocktakingAreaId)
        {
            var (msg, fileBytes, fileName) = await _stocktakingAreaService.ExportStocktakingAreaWord(stocktakingAreaId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
        }
    }
}
