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
        [HttpGet("GetDetailGoodsIssueNote/{goodsIssueNoteId}")]
        public async Task<IActionResult> GetDetailGoodsIssueNote(Guid? goodsIssueNoteId)
        {
            var (msg, goodsIssueNote) = await _goodsIssueNoteService.GetDetailGoodsIssueNote(goodsIssueNoteId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<GoodsIssueNoteDetailDto>.ToResultOk(goodsIssueNote);
        }
    }
}
