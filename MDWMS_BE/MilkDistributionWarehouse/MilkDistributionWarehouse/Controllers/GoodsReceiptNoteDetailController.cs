using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
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
        public async Task<IActionResult> GetGRNDPallet(Guid grnId)
        {
            var (msg, grnds) = await _gcndService.GetListGRNDByGRNId(grnId);

            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<GoodsReceiptNoteDetailPalletDto>>.ToResultOk(grnds);
        }
    }
}
