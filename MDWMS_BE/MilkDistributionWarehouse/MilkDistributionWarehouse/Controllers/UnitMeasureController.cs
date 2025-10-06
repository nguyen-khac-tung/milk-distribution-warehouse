using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.Common;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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
            return Ok(ApiResponse<List<UnitMeasureDto>>.SuccessResponse(unitMeasures));
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateUnitMeasure([FromBody]UnitMeasureCreate create)
        {
            string msg = await _unitMeasureService.CreateUnitMeasure(create);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<UnitMeasureCreate>.ErrorResponse(msg));
            return Ok(ApiResponse<UnitMeasureCreate>.SuccessResponse(create));
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateUnitMeasure([FromBody] UnitMeasureUpdate update)
        {
            string msg = await _unitMeasureService.UpdateUnitMeasure(update);
            if(!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<UnitMeasureUpdate>.ErrorResponse(msg));
            return Ok(ApiResponse<UnitMeasureUpdate>.SuccessResponse(update));
        }

        [HttpDelete("Delete/{unitMeasureId}")]
        public async Task<IActionResult> DeleteUnitMeasure(int unitMeasureId)
        {
            string msg = await _unitMeasureService.DeleteUnitMeasure(unitMeasureId);
            if(!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<int>.ErrorResponse(msg));
            return Ok(ApiResponse<int>.SuccessResponse(unitMeasureId));
        }
    }
}
