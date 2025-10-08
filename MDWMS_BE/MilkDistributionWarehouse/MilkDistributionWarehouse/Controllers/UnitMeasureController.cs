using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Utilities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;

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
        public async Task<IResult> GetUnitMeasures([FromBody]PagedRequest request)
        {
            var (msg, unitMeasures) = await _unitMeasureService.GetUnitMeasure(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<UnitMeasureDto>>.ToResultOk(unitMeasures);
        }

        [HttpPost("Create")]
        public async Task<IResult> CreateUnitMeasure([FromBody]UnitMeasureCreate create)
        {
            var(msg, unitMeasure) = await _unitMeasureService.CreateUnitMeasure(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureDto>.ToResultOk(unitMeasure);
        }

        [HttpPut("Update")]
        public async Task<IResult> UpdateUnitMeasure([FromBody] UnitMeasureUpdate update)
        {
            var (msg, unitMeasure) = await _unitMeasureService.UpdateUnitMeasure(update);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureDto>.ToResultOk(unitMeasure);
        }

        [HttpDelete("Delete/{unitMeasureId}")]
        public async Task<IResult> DeleteUnitMeasure(int unitMeasureId)
        {
            var (msg, unitMeasure) = await _unitMeasureService.DeleteUnitMeasure(unitMeasureId);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<UnitMeasureDto>.ToResultOk(unitMeasure);
        }
    }
}
