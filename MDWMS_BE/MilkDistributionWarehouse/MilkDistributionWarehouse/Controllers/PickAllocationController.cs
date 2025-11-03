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
    public class PickAllocationController : ControllerBase
    {
        private readonly IPickAllocationService _pickAllocationService;

        public PickAllocationController(IPickAllocationService pickAllocationService)
        {
            _pickAllocationService = pickAllocationService;
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpGet("GetPickAllocationDetail/{pickAllocationId}")]
        public async Task<IActionResult> GetPickAllocationDetailById(int? pickAllocationId)
        {
            var (msg, pickAllocation) = await _pickAllocationService.GetPickAllocationDetailById(pickAllocationId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PickAllocationDetailDto>.ToResultOk(pickAllocation);
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPut("ConfirmPickAllocation")]
        public async Task<IActionResult> ConfirmPickAllocation(ConfirmPickAllocationDto dto)
        {
            var msg = await _pickAllocationService.ConfirmPickAllocation(dto);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
