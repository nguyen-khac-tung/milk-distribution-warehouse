using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoodsReceiptNoteController : ControllerBase
    {
        private readonly IGoodsReceiptNoteService _goodsReceiptNoteService;
        public GoodsReceiptNoteController(IGoodsReceiptNoteService service)
        {
            _goodsReceiptNoteService = service;
        }

        [HttpGet("GetGRNByPurchaseOrderId/{purchaseOrderId}")]
        [Authorize(Roles = "Sale Manager, Warehouse Staff, Warehouse Manager")]
        public async Task<IActionResult> GetGRNByPurchaseOrderId(Guid purchaseOrderId)
        {
            var(msg, grn) = await _goodsReceiptNoteService.GetGRNByPurchaseOrderId(purchaseOrderId);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<GoodsReceiptNoteDto>.ToResultOk(grn);
        }
    }
}
