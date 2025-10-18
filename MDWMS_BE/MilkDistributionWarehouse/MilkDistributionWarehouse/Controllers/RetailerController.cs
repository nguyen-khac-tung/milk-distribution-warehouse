using Azure.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RetailerController : ControllerBase
    {
        private readonly IRetailerService _retailerSevice;
        public RetailerController(IRetailerService retailerSevice)
        {
            _retailerSevice = retailerSevice;
        }

        [HttpPost("Retailers")]
        [Authorize(Roles = "Sale Manager, Sales Representative")]
        public async Task<IActionResult> GetRetailer(PagedRequest request)
        {
            var (msg, retailers) = await _retailerSevice.GetRetailers(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<RetailerDto>>.ToResultOk(retailers);
        }

        [HttpGet("GetRetailerDropDown")]
        public async Task<IActionResult> GetRetailerDropDown()
        {
            var (msg, retailers) = await _retailerSevice.GetRetailerDropDown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<RetailerDropDown>>.ToResultOk(retailers);
        }

        [HttpGet("GetRetailerByRetailerId/{retailerId}")]
        [Authorize(Roles = "Sale Manager, Sales Representative")]
        public async Task<IActionResult> GetRetailerByRetailerId(int retailerId)
        {
            var (msg, retailerDetail) = await _retailerSevice.GetRetailerByRetailerId(retailerId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

        [HttpPost("Create")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> CreateRetailer(RetailerCreate create)
        {
            var (msg, retailerDetail) = await _retailerSevice.CreateRetailer(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

        [HttpPut("Update")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> UpdateRetailer(RetailerUpdate update)
        {
            var (msg, retailerDetail) = await _retailerSevice.UpdateRetailer(update); 
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

        [HttpPut("UpdateStatus")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> UpdateRetailerStatus(RetailerUpdateStatus update)
        {
            var (msg, retailerStatus) = await _retailerSevice.UpdateRetailerStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerUpdateStatus>.ToResultOk(retailerStatus);
        }

        [HttpDelete("Delete/{retailerId}")]
        [Authorize(Roles = "Sale Manager")]
        public async Task<IActionResult> DeleteRetailer(int retailerId)
        {
            var (msg, retailerDetail) = await _retailerSevice.DeleteRetailer(retailerId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }
    }
}
