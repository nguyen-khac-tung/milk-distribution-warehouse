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
    public class GoodsIssueNoteController : ControllerBase
    {
        private readonly IGoodsIssueNoteService _goodsIssueNoteService;

        public GoodsIssueNoteController(IGoodsIssueNoteService goodsIssueNoteService)
        {
            _goodsIssueNoteService = goodsIssueNoteService;
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPost("CreateGoodsIssueNote")]
        public async Task<IActionResult> CreateGoodsIssueNote(GoodsIssueNoteCreateDto goodsIssueNoteCreate)
        {
            var msg = await _goodsIssueNoteService.CreateGoodsIssueNote(goodsIssueNoteCreate, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Staff, Warehouse Manager")]
        [HttpGet("GetDetailGoodsIssueNote/{salesOrderId}")]
        public async Task<IActionResult> GetDetailGoodsIssueNote(string? salesOrderId)
        {
            var (msg, goodsIssueNote) = await _goodsIssueNoteService.GetDetailGoodsIssueNote(salesOrderId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<GoodsIssueNoteDetailDto>.ToResultOk(goodsIssueNote);
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPut("SubmitGoodsIssueNote")]
        public async Task<IActionResult> SubmitGoodsIssueNote(SubmitGoodsIssueNoteDto submitGoodsIssueDto)
        {
            var msg = await _goodsIssueNoteService.SubmitGoodsIssueNote(submitGoodsIssueDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPut("ApproveGoodsIssueNote")]
        public async Task<IActionResult> ApproveGoodsIssueNote(ApproveGoodsIssueNoteDto approveGoodsIssueDto)
        {
            var msg = await _goodsIssueNoteService.ApproveGoodsIssueNote(approveGoodsIssueDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
