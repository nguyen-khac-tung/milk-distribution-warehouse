using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

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
        public async Task<IActionResult> GetPurchaseOrders(PagedRequest request)
        {
            var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderSaleRepresentatives(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PurchaseOrderDtoSaleRepresentative>>.ToResultOk(purchaseOrderDto);
        }

        [HttpPost("GetPurchaseOrderSaleManagers")]
        public async Task<IActionResult> GetPurchaseOrderSaleManagers(PagedRequest request)
        {
            var (msg, purchaseOrderDto) = await _purchaseOrderService.GetPurchaseOrderSaleManagers(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<PurchaseOrderDtoSaleManager>>.ToResultOk(purchaseOrderDto);
        }
    }
}
