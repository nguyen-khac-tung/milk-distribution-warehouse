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

        [HttpPost("InventoryReport")]
        public async Task<IActionResult> GetInventoryReport([FromBody] PagedRequest request, [FromQuery] int? areaId)
        {
            var (message, data) = await _reportService.GetInventoryReportAsync(request, areaId);
            if (!string.IsNullOrEmpty(message))
                return ApiResponse<string>.ToResultError(message);
            return ApiResponse<PageResult<ReportDto.InventoryReportDto>>.ToResultOk(data);
        }
    }
}