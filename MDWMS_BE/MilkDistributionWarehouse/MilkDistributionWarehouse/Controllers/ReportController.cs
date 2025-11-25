using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost("InventoryReport")]
        public async Task<IActionResult> GetInventoryReport([FromBody] PagedRequest request, [FromQuery] int? areaId)
        {
            var (message, data) = await _reportService.GetInventoryReportAsync(request, areaId);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<PageResult<ReportDto.InventoryReportDto>>.ToResultOk(data);
        }

        [HttpPost("LocationReport")]
        public async Task<IActionResult> GetLocationReport([FromBody] PagedRequest request, [FromQuery] int? areaId)
        {
            // Note: request body is not used for location counts, kept for compatibility with front-end callers
            var (message, data) = await _reportService.GetLocationReportAsync(areaId);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<ReportDto.LocationReportSummaryDto>.ToResultOk(data);
        }

        [HttpPost("SaleBySupplierReport")]
        public async Task<IActionResult> SaleBySupplierReport([FromQuery] int? supplierId)
        {
            var (message, data) = await _reportService.GetSaleBySupplierReportAsync(supplierId);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<List<ReportDto.SaleBySupplierReportDto>>.ToResultOk(data);
        }

        [HttpPost("GoodsReceiptReport")]
        public async Task<IActionResult> GetGoodsReceiptReport([FromBody] PagedRequest request, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var (message, data) = await _reportService.GetGoodsReceiptReportAsync(request, fromDate, toDate);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<PageResult<ReportDto.GoodsReceiptReportDto>>.ToResultOk(data);
        }

        [HttpPost("GoodsIssueReport")]
        public async Task<IActionResult> GetGoodsIssueReport([FromBody] PagedRequest request, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var (message, data) = await _reportService.GetGoodsIssueReportAsync(request, fromDate, toDate);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<PageResult<ReportDto.GoodIssueReportDto>>.ToResultOk(data);
        }

        [HttpPost("InventoryLedgerReport")]
        public async Task<IActionResult> GetInventoryLedgerReport([FromBody] PagedRequest request, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var (message, data) = await _reportService.GetInventoryLedgerReportAsync(request, fromDate, toDate);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<PageResult<ReportDto.InventoryLedgerReportDto>>.ToResultOk(data);
        }
    }
}