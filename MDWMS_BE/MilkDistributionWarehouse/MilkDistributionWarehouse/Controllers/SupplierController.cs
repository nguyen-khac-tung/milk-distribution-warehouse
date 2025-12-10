using Azure.Core;
using Microsoft.AspNetCore.Authorization;
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
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierService _supplierService;
        public SupplierController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet("GetSupplierDropDown")]
        public async Task<IActionResult> GetSupplierDropDownAsync()
        {
            var (msg, suppliersDropDown) = await _supplierService.GetSupplierDropDown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<SupplierDropDown>>.ToResultOk(suppliersDropDown);
        }

        [HttpGet("GetSupplierWithGoodsDropDown")]
        public async Task<IActionResult> GetSupplierWithGoodsDropDown()
        {
            var (msg, suppliersDropDown) = await _supplierService.GetSupplierWithGoodsDropDown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<SupplierDropDown>>.ToResultOk(suppliersDropDown);
        }

        [HttpPost("Suppliers")]
        [Authorize(Roles = "Sale Manager, Sales Representative")]
        public async Task<IActionResult> GetSuppliers([FromBody]PagedRequest request)
        {
            var (msg, suppliers) = await _supplierService.GetSuppliers(request);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<SupplierDto>>.ToResultOk(suppliers);
        }

        [HttpGet("GetSupplierBySupplierId/{supplierId}")]
        [Authorize(Roles = "Sale Manager, Sales Representative")]
        public async Task<IActionResult> GetSupplierBySupplierId(int supplierId)
        {
            var(msg, supplierDetail) = await _supplierService.GetSupplierBySupplierId(supplierId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }

        [HttpPost("Create")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> CreateSupplier([FromBody]SupplierCreate create)
        {
            var(msg, supplierDetail) = await _supplierService.CreateSupplier(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }

        [HttpPut("Update")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> UpdateSupplier([FromBody]SupplierUpdate update)
        {
            var(msg, supplierDetail) = await _supplierService.UpdateSupplier(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }

        [HttpPut("UpdateStatus")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> UpdateSupplierStatus([FromBody] SupplierUpdateStatusDto update)
        {
            var (msg, supplierUpdateStatusDto) = await _supplierService.UpdateSupplierStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierUpdateStatusDto>.ToResultOk(supplierUpdateStatusDto);
        }

        [HttpDelete("Delete/{supplierId}")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> DeleteSupplier(int supplierId)
        {
            var(msg, supplierDetail) = await _supplierService.DeleteSupplier(supplierId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }
    }
}
