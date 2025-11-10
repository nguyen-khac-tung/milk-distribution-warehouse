using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

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

        [HttpGet("InventoryReport")]
        public async Task<IActionResult> GetInventoryReport()
        {
            var (message, data) = await _reportService.GetInventoryReportAsync();
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);

            return ApiResponse<List<ReportDto.InventoryReportDto>>.ToResultOk(data);
        }
    }
}