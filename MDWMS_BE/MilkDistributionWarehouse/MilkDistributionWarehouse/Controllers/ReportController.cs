using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Services;
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
                return NotFound(new { message });

            return Ok(data);
        }
    }
}