﻿using Azure.Core;
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
    public class GoodsController : ControllerBase
    {
        private readonly IGoodsService _goodsService;
        public GoodsController(IGoodsService goodsService)
        {
            _goodsService = goodsService;
        }

        [HttpGet("GetGoodsDropDown")]
        public async Task<IActionResult> GetGoodsDropDown()
        {
            var (msg, goodss) = await _goodsService.GetGoodsDropDown();
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<List<GoodsDropDown>>.ToResultOk(goodss);
        }

        [HttpPost("Goods")]
        public async Task<IActionResult> GetGoodss([FromBody]PagedRequest request)
        {
            var(msg, goodss) = await _goodsService.GetGoods(request);
            if(!string.IsNullOrEmpty(msg)) 
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<PageResult<GoodsDto>>.ToResultOk(goodss);
        }

        [HttpGet("GoodsByGoodsId/{goodsId}")]
        public  async Task<IActionResult> GoodsByGoodsId(int goodsId)
        {
            var(msg, goodsDetail) = await _goodsService.GetGoodsByGoodsId(goodsId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsDetail>.ToResultOk(goodsDetail);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateGoods([FromBody]GoodsCreate create)
        {
            var(msg, goods) = await _goodsService.CreateGoods(create);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsDto>.ToResultOk(goods);
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateGoods([FromBody] GoodsUpdate update)
        {
            var(msg, goods) = await _goodsService.UpdateGoods_1(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsDto>.ToResultOk(goods);
        }

        [HttpDelete("Delete/{goodsId}")]
        public async Task<IActionResult> DeleteGoods(int goodsId)
        {
            var (msg, goods) = await _goodsService.DeleteGoods(goodsId);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsDto>.ToResultOk(goods);
        }

        [HttpPut("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(GoodsUpdateStatus update)
        {
            var (msg, goods) = await _goodsService.UpdateGoodsStatus(update);
            if (!string.IsNullOrEmpty(msg))
                return ApiResponse<string>.ToResultError(msg);
            return ApiResponse<GoodsUpdateStatus>.ToResultOk(goods);
        }
    }
}
