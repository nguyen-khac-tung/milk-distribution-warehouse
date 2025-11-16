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
    }
}
