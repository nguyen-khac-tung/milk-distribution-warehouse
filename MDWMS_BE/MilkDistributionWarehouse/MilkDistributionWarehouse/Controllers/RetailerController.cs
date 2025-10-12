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
            var(msg, retailers) = await _retailerSevice.GetRetailers(request);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<RetailerDto>>.ToResultOk(retailers);
        }

        [HttpGet("GetRetailerByRetailerId/{retailerId}")]
        public async Task<IResult> GetRetailerByRetailerId(int retailerId)
        {
            var(msg, retailerDetail) = await _retailerSevice.GetRetailerByRetailerId(retailerId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<RetailerDetail>.ToResultOk(retailerDetail);
        }

    }
}
