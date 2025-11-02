using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoodsIssueNoteDetailController : ControllerBase
    {
        private readonly IGoodsIssueNoteDetailService _goodsIssueNoteDetailService;

        public GoodsIssueNoteDetailController(IGoodsIssueNoteDetailService goodsIssueNoteDetailService)
        {
            _goodsIssueNoteDetailService = goodsIssueNoteDetailService;
        }

        [Authorize(Roles = "Warehouse Staff, Warehouse Manager")]
        [HttpPut("RePickGoodsIssueNoteDetail")]
        public async Task<IActionResult> RePickGoodsIssueNoteDetail(RePickGoodsIssueNoteDetailDto rePickGoodsIssue)
        {
            var msg = await _goodsIssueNoteDetailService.RePickGoodsIssueNoteDetail(rePickGoodsIssue, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
