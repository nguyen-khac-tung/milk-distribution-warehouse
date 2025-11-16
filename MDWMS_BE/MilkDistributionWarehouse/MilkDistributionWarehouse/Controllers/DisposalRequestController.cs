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
    public class DisposalRequestController : ControllerBase
    {
        private readonly IDisposalRequestService _disposalRequestService;

        public DisposalRequestController(IDisposalRequestService disposalRequestService)
        {
            _disposalRequestService = disposalRequestService;
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPost("GetDisposalRequestListWarehouseManager")]
        public async Task<IActionResult> GetDisposalRequestListWarehouseManager(PagedRequest request)
        {
            var (msg, disposalRequests) = await _disposalRequestService.GetDisposalRequestList<DisposalRequestDtoWarehouseManager>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<DisposalRequestDtoWarehouseManager>>.ToResultOk(disposalRequests);
        }

        [Authorize(Roles = "Sale Manager")]
        [HttpPost("GetDisposalRequestListSaleManager")]
        public async Task<IActionResult> GetDisposalRequestListSaleManager(PagedRequest request)
        {
            var (msg, disposalRequests) = await _disposalRequestService.GetDisposalRequestList<DisposalRequestDtoSaleManager>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<DisposalRequestDtoSaleManager>>.ToResultOk(disposalRequests);
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPost("GetDisposalRequestListWarehouseStaff")]
        public async Task<IActionResult> GetDisposalRequestListWarehouseStaff(PagedRequest request)
        {
            var (msg, disposalRequests) = await _disposalRequestService.GetDisposalRequestList<DisposalRequestDtoWarehouseStaff>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<DisposalRequestDtoWarehouseStaff>>.ToResultOk(disposalRequests);
        }

        [Authorize(Roles = "Sale Manager, Warehouse Staff, Warehouse Manager")]
        [HttpGet("GetDisposalRequestDetail/{disposalRequestId}")]
        public async Task<IActionResult> GetDisposalRequestDetail(string? disposalRequestId)
        {
            var (msg, disposalRequest) = await _disposalRequestService.GetDisposalRequestDetail(disposalRequestId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestDetailDto>.ToResultOk(disposalRequest);
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpGet("GetExpiredGoodsForDisposal")]
        public async Task<IActionResult> GetExpiredGoodsForDisposal()
        {
            var (msg, goodsList) = await _disposalRequestService.GetExpiredGoodsForDisposal();
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<ExpiredGoodsDisposalDto>>.ToResultOk(goodsList);
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPost("CreateDisposalRequest")]
        public async Task<IActionResult> CreateDisposalRequest(DisposalRequestCreateDto createDto)
        {
            var (msg, createdRequest) = await _disposalRequestService.CreateDisposalRequest(createDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestCreateDto>.ToResultOk(createdRequest);
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPut("UpdateDisposalRequest")]
        public async Task<IActionResult> UpdateDisposalRequest(DisposalRequestUpdateDto updateDto)
        {
            var (msg, updatedRequest) = await _disposalRequestService.UpdateDisposalRequest(updateDto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestUpdateDto>.ToResultOk(updatedRequest);
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpDelete("DeleteDisposalRequest/{disposalRequestId}")]
        public async Task<IActionResult> DeleteDisposalRequest(string? disposalRequestId)
        {
            var msg = await _disposalRequestService.DeleteDisposalRequest(disposalRequestId, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPut("UpdateStatusPendingApproval")]
        public async Task<IActionResult> UpdateStatusPendingApproval(DisposalRequestPendingApprovalDto dto)
        {
            var (msg, result) = await _disposalRequestService.UpdateStatusDisposalRequest(dto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestPendingApprovalDto>.ToResultOk(result);
        }

        [Authorize(Roles = "Sale Manager")]
        [HttpPut("UpdateStatusReject")]
        public async Task<IActionResult> UpdateStatusReject(DisposalRequestRejectDto dto)
        {
            var (msg, result) = await _disposalRequestService.UpdateStatusDisposalRequest(dto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestRejectDto>.ToResultOk(result);
        }

        [Authorize(Roles = "Sale Manager")]
        [HttpPut("UpdateStatusApproval")]
        public async Task<IActionResult> UpdateStatusApproval(DisposalRequestApprovalDto dto)
        {
            var (msg, result) = await _disposalRequestService.UpdateStatusDisposalRequest(dto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestApprovalDto>.ToResultOk(result);
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPut("UpdateStatusAssignedForPicking")]
        public async Task<IActionResult> UpdateStatusAssignedForPicking(DisposalRequestAssignedForPickingDto dto)
        {
            var (msg, result) = await _disposalRequestService.UpdateStatusDisposalRequest(dto, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<DisposalRequestAssignedForPickingDto>.ToResultOk(result);
        }
    }
}
