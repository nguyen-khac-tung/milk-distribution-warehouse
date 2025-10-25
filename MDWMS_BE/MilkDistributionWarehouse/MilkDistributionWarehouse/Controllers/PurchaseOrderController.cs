using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseOrderController : ControllerBase
    {
        private readonly IPurchaseOrderService _purchaseOrderService;
        public PurchaseOrderController(IPurchaseOrderService purchaseOrderService)
        {
            _purchaseOrderService = purchaseOrderService;
        }

        [HttpPost("GetPurchaseOrderSaleRepresentatives")]
        [Authorize(Roles = "Sales Representative")]
        public async Task<IActionResult> GetPurchaseOrderSaleRepresentatives([FromBody] PagedRequest request)
        {
            //var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderSaleRepresentatives(request, User.GetUserId(), User.GetUserRole());
            var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderSaleRepresentatives(request, 5);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PurchaseOrderDtoSaleRepresentative>>.ToResultOk(purchaseOrderDto);
        }

        [HttpPost("GetPurchaseOrderSaleManagers")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> GetPurchaseOrderSaleManagers([FromBody] PagedRequest request)
        {
            //var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderSaleManagers(request, User.GetUserId());
            var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderSaleManagers(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PurchaseOrderDtoSaleManager>>.ToResultOk(purchaseOrderDto);
        }

        [HttpPost("GetPurchaseOrderWarehouseManagers")]
        [Authorize(Roles = "Warehouse Manager")]
        public async Task<IActionResult> GetPurchaseOrderWarehouseManagers([FromBody] PagedRequest request)
        {
            var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderWarehouseManager(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PurchaseOrderDtoWarehouseManager>>.ToResultOk(purchaseOrderDto);
        }

        [HttpPost("GetPurchaseOrderWarehouseStaff")]
        [Authorize(Roles = "Warehouse Staff")]
        public async Task<IActionResult> GetPurchaseOrderWarehouseStaff([FromBody] PagedRequest request)
        {
            var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderWarehouseStaff(request, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PurchaseOrderDtoWarehouseStaff>>.ToResultOk(purchaseOrderDto);
        }

        [HttpGet("GetPurchaseOrder/{purchaseOrderId}")]
        [Authorize(Roles = "Sale Manager, Sales Representative, Warehouse Staff, Warehouse Manager")]
        public async Task<IActionResult> GetPurchaseOrderByPurchaseOrderId(Guid purchaseOrderId)
        {
            var (msg, purchaseOrderDetail) = await _purchaseOrderService.GetPurchaseOrderDetailById(purchaseOrderId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PurchaseOrdersDetail>.ToResultOk(purchaseOrderDetail);
        }

        [HttpPost("CreatePurchaseOrder")]
        [Authorize(Roles = "Sales Representative")]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderCreate create)
        {
            var (msg, purchaseOrderCreate) = await _purchaseOrderService.CreatePurchaseOrder(create, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PurchaseOrderCreate>.ToResultOk(purchaseOrderCreate);
        }

        [HttpPut("UpdatePurchaseOrder")]
        [Authorize(Roles = "Sales Representative")]
        public async Task<IActionResult> UpdatePurchaseOrder([FromBody] PurchaseOrderUpdate update)
        {
            var (msg, purchaseOrderUpdate) = await _purchaseOrderService.UpdatePurchaseOrder(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PurchaseOrderUpdate>.ToResultOk(purchaseOrderUpdate);
        }

        [HttpDelete("DeletePurchaseOrder/{purchaseOrderId}")]
        [Authorize(Roles = "Sales Representative")]
        public async Task<IActionResult> DeletePurchaseOrder(Guid purchaseOrderId)
        {
            var (msg, purchaseOrderDelete) = await _purchaseOrderService.DeletePurchaseOrder(purchaseOrderId, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PurchaseOrder>.ToResultOk(purchaseOrderDelete);
        }
    }
}
