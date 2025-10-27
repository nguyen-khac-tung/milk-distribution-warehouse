using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesOrderController : ControllerBase
    {
        private readonly ISalesOrderService _salesOrderService;

        public SalesOrderController(ISalesOrderService salesOrderService)
        {
            _salesOrderService = salesOrderService;
        }

        [Authorize(Roles = "Sales Representative")]
        [HttpPost("GetSalesOrderListSalesRepresentatives")]
        public async Task<IActionResult> GetSalesOrderListSalesRepresentatives(PagedRequest request)
        {
            var (msg, salesOrders) = await _salesOrderService.GetSalesOrderList<SalesOrderDtoSalesRepresentative>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<SalesOrderDtoSalesRepresentative>>.ToResultOk(salesOrders);
        }

        [Authorize(Roles = "Sale Manager")]
        [HttpPost("GetSalesOrderListSaleManager")]
        public async Task<IActionResult> GetSalesOrderListSaleManager(PagedRequest request)
        {
            var (msg, salesOrders) = await _salesOrderService.GetSalesOrderList<SalesOrderDtoSaleManager>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<SalesOrderDtoSaleManager>>.ToResultOk(salesOrders);
        }

        [Authorize(Roles = "Warehouse Manager")]
        [HttpPost("GetSalesOrderListWarehouseManager")]
        public async Task<IActionResult> GetSalesOrderListWarehouseManager(PagedRequest request)
        {
            var (msg, salesOrders) = await _salesOrderService.GetSalesOrderList<SalesOrderDtoWarehouseManager>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<SalesOrderDtoWarehouseManager>>.ToResultOk(salesOrders);
        }

        [Authorize(Roles = "Warehouse Staff")]
        [HttpPost("GetSalesOrderListWarehouseStaff")]
        public async Task<IActionResult> GetSalesOrderListWarehouseStaff(PagedRequest request)
        {
            var (msg, salesOrders) = await _salesOrderService.GetSalesOrderList<SalesOrderDtoWarehouseStaff>(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<SalesOrderDtoWarehouseStaff>>.ToResultOk(salesOrders);
        }

        [Authorize(Roles = "Sale Manager, Sales Representative, Warehouse Staff, Warehouse Manager")]
        [HttpGet("GetSalesOrderDetail/{salesOrderId}")]
        public async Task<IActionResult> GetSalesOrderDetail(Guid? salesOrderId)
        {
            var (msg, salesOrder) = await _salesOrderService.GetSalesOrderDetail(salesOrderId);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<SalesOrderDetailDto>.ToResultOk(salesOrder);
        }
    }
}
