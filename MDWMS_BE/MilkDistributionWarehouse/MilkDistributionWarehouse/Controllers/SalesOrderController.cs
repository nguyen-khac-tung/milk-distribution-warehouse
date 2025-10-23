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

        //[Authorize(Roles = "Sales Representative")]
        [HttpPost("GetSalesOrderListSaleRepresentatives")]
        public async Task<IActionResult> GetSalesOrderListSaleRepresentatives(PagedRequest request)
        {
            var (msg, salesOrders) = await _salesOrderService.GetSalesOrderListSaleRepresentatives(request, User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<SalesOrderDtoSaleRepresentative>>.ToResultOk(salesOrders);
        }


    }
}
