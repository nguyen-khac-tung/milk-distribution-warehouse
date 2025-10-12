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
    public class SupplierController : Controller
    {
        private readonly ISupplierService _supplierService;
        public SupplierController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpPost("Suppliers")]
        public async Task<IResult> GetSuppliers([FromBody]PagedRequest request)
        {
            var (msg, suppliers) = await _supplierService.GetSuppliers(request);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<SupplierDto>>.ToResultOk(suppliers);
        }

        [HttpGet("GetSupplierBySupplierId/{supplierId}")]
        public async Task<IResult> GetSupplierBySupplierId(int supplierId)
        {
            var(msg, supplierDetail) = await _supplierService.GetSupplierBySupplierId(supplierId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }

        [HttpPost("Create")]
        public async Task<IResult> CreateSupplier([FromBody]SupplierCreate create)
        {
            var(msg, supplierDetail) = await _supplierService.CreateSupplier(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }

        [HttpPut("Update")]
        public async Task<IResult> UpdateSupplier([FromBody]SupplierUpdate update)
        {
            var(msg, supplierDetail) = await _supplierService.UpdateSupplier(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }

        [HttpDelete("Delete/{supplierId}")]
        public async Task<IResult> DeleteSupplier(int supplierId)
        {
            var(msg, supplierDetail) = await _supplierService.DeleteSupplier(supplierId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<SupplierDetail>.ToResultOk(supplierDetail);
        }
    }
}
