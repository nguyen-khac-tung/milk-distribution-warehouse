using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.Common;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UnitMeasureController : Controller
    {
        private readonly IUnitMeasureService _unitMeasureService;
        public UnitMeasureController(IUnitMeasureService unitMeasureService)
        {
            _unitMeasureService = unitMeasureService;
        }

        [HttpPost("UnitMeasures")]
        public async Task<IActionResult> GetUnitMeasures(Filter filter)
        {
            var (msg, unitMeasures) = await _unitMeasureService.GetUnitMeasure(filter);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<List<UnitMeasureDto>>.ErrorResponse(msg));
            return Ok(unitMeasures);
        }

    }
}
