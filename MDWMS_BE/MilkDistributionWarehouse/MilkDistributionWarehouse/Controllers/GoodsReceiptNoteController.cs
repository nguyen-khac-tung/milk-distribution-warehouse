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
        public async Task<IActionResult> GetGRNByPurchaseOrderId(string purchaseOrderId)
        {
            var(msg, grn) = await _goodsReceiptNoteService.GetGRNByPurchaseOrderId(purchaseOrderId);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<GoodsReceiptNoteDto>.ToResultOk(grn);
        }

        [HttpPut("Submit")]
        [Authorize(Roles = "Warehouse Staff")]
        public async Task<IActionResult> SubmitGoodsReceiptNote([FromBody] GoodsReceiptNoteSubmitDto update)
        {
            var (msg, grnUpdate) = await _goodsReceiptNoteService.UpdateGRNStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<GoodsReceiptNoteSubmitDto>.ToResultOk(grnUpdate);
        }

        [HttpPut("Approve")]
        [Authorize(Roles = "Warehouse Manager")]
        public async Task<IActionResult> ApprovalGoodsReceiptNote([FromBody] GoodsReceiptNoteCompletedDto update)
        {
            var (msg, grnUpdate) = await _goodsReceiptNoteService.UpdateGRNStatus(update, User.GetUserId());
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<GoodsReceiptNoteCompletedDto>.ToResultOk(grnUpdate);
        }
    }
}
