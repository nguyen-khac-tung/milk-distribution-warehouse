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
    public class DisposalNoteDetailController : ControllerBase
    {
        private readonly IDisposalNoteDetailService _disposalNoteDetailService;

        public DisposalNoteDetailController(IDisposalNoteDetailService disposalNoteDetailService)
        {
            _disposalNoteDetailService = disposalNoteDetailService;
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPut("RePickDisposalNoteDetail")]
        public async Task<IActionResult> RePickDisposalNoteDetail(RePickDisposalNoteDetailDto rePickDto)
        {
            var msg = await _disposalNoteDetailService.RePickDisposalNoteDetail(rePickDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPut("RePickDisposalNoteDetailList")]
        public async Task<IActionResult> RePickDisposalNoteDetailList(List<RePickDisposalNoteDetailDto> rePickList)
        {
            var msg = await _disposalNoteDetailService.RePickDisposalNoteDetailList(rePickList);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
