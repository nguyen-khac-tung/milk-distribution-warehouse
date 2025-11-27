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
    public class DisposalNoteController : ControllerBase
    {
        private readonly IDisposalNoteService _disposalNoteService;

        public DisposalNoteController(IDisposalNoteService disposalNoteService)
        {
            _disposalNoteService = disposalNoteService;
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPost("CreateDisposalNote")]
        public async Task<IActionResult> CreateDisposalNote(DisposalNoteCreateDto createDto)
        {
            var msg = await _disposalNoteService.CreateDisposalNote(createDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Staff, Warehouse Manager")]
        [HttpGet("GetDetailDisposalNote/{disposalRequestId}")]
        public async Task<IActionResult> GetDetailDisposalNote(string? disposalRequestId)
        {
            var (msg, disposalNote) = await _disposalNoteService.GetDetailDisposalNote(disposalRequestId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalNoteDetailDto>.ToResultOk(disposalNote);
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPut("SubmitDisposalNote")]
        public async Task<IActionResult> SubmitDisposalNote(SubmitDisposalNoteDto submitDto)
        {
            var msg = await _disposalNoteService.SubmitDisposalNote(submitDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPut("ApproveDisposalNote")]
        public async Task<IActionResult> ApproveDisposalNote(ApproveDisposalNoteDto approveDto)
        {
            var msg = await _disposalNoteService.ApproveDisposalNote(approveDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Staff, Warehouse Manager")]
        [HttpGet("ExportDisposalNoteWord/{disposalRequestId}")]
        public async Task<IActionResult> ExportDisposalNoteWord(string disposalRequestId)
        {
            var (msg, fileBytes, fileName) = await _disposalNoteService.ExportDisposalNoteWord(disposalRequestId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return File(fileBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
        }
    }
}
