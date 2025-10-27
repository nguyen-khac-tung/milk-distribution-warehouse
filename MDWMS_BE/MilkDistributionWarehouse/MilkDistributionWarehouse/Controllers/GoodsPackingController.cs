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
    public class GoodsPackingController : ControllerBase
    {
        private readonly IGoodsPackingService _goodsPackingService;

        public GoodsPackingController(IGoodsPackingService goodsPackingService)
        {
            _goodsPackingService = goodsPackingService;
        }

        [HttpGet("GetGoodsPackingByGoodsId/{goodsId}")]
        public async Task<IActionResult> GetGoodsPackingByGoodsId(int goodsId)
        {
            var(msg, goodsPackings) = await _goodsPackingService.GetGoodsPackingByGoodsId(goodsId);
            if(!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<GoodsPackingDto>>.ToResultOk(goodsPackings);
        }
    }
}
