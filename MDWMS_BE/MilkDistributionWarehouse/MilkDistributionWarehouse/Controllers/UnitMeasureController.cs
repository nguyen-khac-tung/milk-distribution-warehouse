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
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<List<UnitMeasureDto>>.SuccessResponse(unitMeasures));
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateUnitMeasure([FromBody]UnitMeasureCreate create)
        {
            var(msg, unitMeasure) = await _unitMeasureService.CreateUnitMeasure(create);
            if (!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<UnitMeasureDto>.SuccessResponse(unitMeasure));
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateUnitMeasure([FromBody] UnitMeasureUpdate update)
        {
            var (msg, unitMeasure) = await _unitMeasureService.UpdateUnitMeasure(update);
            if(!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<UnitMeasureDto>.SuccessResponse(unitMeasure));
        }

        [HttpDelete("Delete/{unitMeasureId}")]
        public async Task<IActionResult> DeleteUnitMeasure(int unitMeasureId)
        {
            var (msg, unitMeasure) = await _unitMeasureService.DeleteUnitMeasure(unitMeasureId);
            if(!string.IsNullOrEmpty(msg))
                return BadRequest(ApiResponse<string>.ErrorResponse(msg));
            return Ok(ApiResponse<UnitMeasureDto>.SuccessResponse(unitMeasure));
        }
    }
}
