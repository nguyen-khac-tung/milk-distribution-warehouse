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
    public class RetailerController : Controller
    {
        private readonly IRetailerService _retailerSevice;
        public RetailerController(IRetailerService retailerSevice)
        {
            _retailerSevice = retailerSevice;
        }

        [HttpPost("Retailers")]
        public async Task<IResult> GetRetailer(PagedRequest request)
        {
            var (msg, retailers) = await _retailerSevice.GetRetailers(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<RetailerDto>>.ToResultOk(retailers);
        }

        [HttpGet("GetRetailerByRetailerId/{retailerId}")]
        public async Task<IResult> GetRetailerByRetailerId(int retailerId)
        {
            var (msg, retailerDetail) = await _retailerSevice.GetRetailerByRetailerId(retailerId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

        [HttpPost("Create")]
        public async Task<IResult> CreateRetailer(RetailerCreate create)
        {
            var (msg, retailerDetail) = await _retailerSevice.CreateRetailer(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

        [HttpPut("Update")]
        public async Task<IResult> UpdateRetailer(RetailerUpdate update)
        {
            var (msg, retailerDetail) = await _retailerSevice.UpdateRetailer(update); 
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

        [HttpDelete("Delete/{retailerId}")]
        public async Task<IResult> DeleteRetailer(int retailerId)
        {
            var (msg, retailerDetail) = await _retailerSevice.DeleteRetailer(retailerId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }
    }
}
