using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
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

        [HttpGet("GetUnitMeasureDropDown")]
        public async Task<IActionResult> GetUnitMeasureDropDown()
        {
            var (msg, unitMeasureDropDown) = await _unitMeasureService.GetUnitMeasureDropDown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<UnitMeasureDropDown>>.ToResultOk(unitMeasureDropDown);
        }

        [HttpPost("UnitMeasures")]
        public async Task<IActionResult> GetUnitMeasures([FromBody]PagedRequest request)
        {
            var (msg, unitMeasures) = await _unitMeasureService.GetUnitMeasure(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<UnitMeasureDto>>.ToResultOk(unitMeasures);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateUnitMeasure([FromBody]UnitMeasureCreate create)
        {
            var(msg, unitMeasure) = await _unitMeasureService.CreateUnitMeasure(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureDto>.ToResultOk(unitMeasure);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateUnitMeasure([FromBody] UnitMeasureUpdate update)
        {
            var (msg, unitMeasure) = await _unitMeasureService.UpdateUnitMeasure(update);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureDto>.ToResultOk(unitMeasure);
        }

        [HttpPost("UpdateUnitMeasureStatus")]
        public async Task<IActionResult> UpdateUnitMeasureStatus([FromBody] UnitMeasureUpdateStatusDto update)
        {
            var (msg, unitMeasureStatus) = await _unitMeasureService.UpdateUnitMeasureStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureUpdateStatusDto>.ToResultOk(unitMeasureStatus);
        }

        [HttpDelete("Delete/{unitMeasureId}")]
        public async Task<IActionResult> DeleteUnitMeasure(int unitMeasureId)
        {
            var (msg, unitMeasure) = await _unitMeasureService.DeleteUnitMeasure(unitMeasureId);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureDto>.ToResultOk(unitMeasure);
        }
    }
}
