using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static MilkDistributionWarehouse.Models.DTOs.GoodsReceiptNoteDetailDto;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoodsReceiptNoteDetailController : ControllerBase
    {
        private readonly IGoodsReceiptNoteDetailService _gcndService;

        public GoodsReceiptNoteDetailController(IGoodsReceiptNoteDetailService grndService)
        {
            _gcndService = grndService;
        }

        [HttpGet("GoodRNDPallet/{grnId}")]
        public async Task<IActionResult> GetGRNDPallet(string grnId)
        {
            var (msg, grnds) = await _gcndService.GetListGRNDByGRNId(grnId);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<GoodsReceiptNoteDetailPalletDto>>.ToResultOk(grnds);
        }

        [HttpPut("VerifyRecord")]
        [Authorize(Roles = "Warehouse Staff")]
        public async Task<IActionResult> VerifyGRNDetail([FromBody] GoodsReceiptNoteDetailInspectedDto update)
        {
            var(msg, grnUpdate) = await _gcndService.UpdateGRNDetail(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsReceiptNoteDetailInspectedDto>.ToResultOk(update);
        }

        [HttpPut("CancelRecord")]
        [Authorize(Roles = "Warehouse Staff")]
        public async Task<IActionResult> CancelGRNDetail([FromBody] GoodsReceiptNoteDetailCancelDto update)
        {
            var (msg, grnUpdate) = await _gcndService.UpdateGRNDetail(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsReceiptNoteDetailCancelDto>.ToResultOk(update);
        }

        [HttpPut("RejectRecord")]
        [Authorize(Roles = "Warehouse Manager")]
        public async Task<IActionResult> RejectGRNDetail([FromBody] GoodsReceiptNoteDetailRejectDto update)
        {
            var (msg, grnUpdate) = await _gcndService.UpdateGRNDetail(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsReceiptNoteDetailRejectDto>.ToResultOk(update);
        }

        [HttpPut("RejectRecordList")]
        [Authorize(Roles = "Warehouse Manager")]
        public async Task<IActionResult> RejectListGRNDetail([FromBody] List<GoodsReceiptNoteDetailRejectDto> update)
        {
            var (msg, grnUpdate) = await _gcndService.UpdateGRNReject(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<GoodsReceiptNoteDetailRejectDto>>.ToResultOk(update);
        }
    }
}
