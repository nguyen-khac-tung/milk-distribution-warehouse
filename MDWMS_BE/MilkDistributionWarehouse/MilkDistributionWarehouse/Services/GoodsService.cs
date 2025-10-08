using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsService
    {
        Task<(string, PageResult<GoodsDto>)> GetGoods(PagedRequest request);
        Task<(string, GoodsDetail)> GetGoodsByGoodsId(int goodsId);
        Task<(string, GoodsDto)> CreateGoods(GoodsCreate goodsCreate);
    }
    public class GoodsService : IGoodsService
    {
        private readonly IGoodsRepository _goodRepository;
        private readonly IMapper _mapper;
        public GoodsService(IGoodsRepository goodRepository, IMapper mapper)
        {
            _goodRepository = goodRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<GoodsDto>)> GetGoods(PagedRequest request)
        {
            var goodsQuery = _goodRepository.GetGoods().OrderBy(g => g.CreatedAt);

            var goodsItems = goodsQuery.ProjectTo<GoodsDto>(_mapper.ConfigurationProvider);

            var goodsDtos = await goodsItems.ToPagedResultAsync<GoodsDto>(request);

            if (!goodsDtos.Items.Any())
                return ("Danh sách sản phẩm trống.".ToMessageForUser(), new PageResult<GoodsDto> { });

            return ("", goodsDtos);
        }

        public async Task<(string, GoodsDetail)> GetGoodsByGoodsId(int goodsId)
        {
            if (goodsId <= 0)
                return ("GoodsId is invalid", new GoodsDetail());

            var goodsQuery = _goodRepository.GetGoodsById(goodsId);

            var goodsDetails = goodsQuery.ProjectTo<GoodsDetail>(_mapper.ConfigurationProvider);

            var goodsDetail = await goodsDetails.FirstOrDefaultAsync();

            if (goodsDetail == null)
                return ("Danh sách sản phấm không tồn tại trong hệ thống".ToMessageForUser(), new GoodsDetail());

            return ("", goodsDetail);
        }

        public async Task<(string, GoodsDto)> CreateGoods(GoodsCreate goodsCreate)
        {
            if (goodsCreate == null)
                return ("Goods create data is invalid", new GoodsDto());

            if (await _goodRepository.IsDuplicationCode(null, goodsCreate.GoodsCode))
                return ("Mã sản phẩm đã tồn tại trong hệ thống", new GoodsDto());

            var goods = _mapper.Map<Good>(goodsCreate);

            var createResult = await _goodRepository.CreateGoods(goods);

            if (createResult == null)
                return ("Tạo mới sản phẩm thất bại.".ToMessageForUser(), new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(createResult));
        }

        public async Task<(string, GoodsDto)> UpdateGoods(GoodsUpdate update)
        {
            if (update == null)
                return ("Goods update data is invalid", new GoodsDto());

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(update.GoodsId);

            if (goodsExist == null)
                return ("Goods is not exist", new GoodsDto());

            if (await _goodRepository.IsDuplicationCode(update.GoodsId, update.GoodsCode))
                return ("Mã sản phẩm đã tồn tại trong hệ thống", new GoodsDto());

            _mapper.Map(update, goodsExist);

            var updateResult = await _goodRepository.UpdateGoods(goodsExist);

            if (updateResult == null)
                return ("Cập nhật sản phẩm thất bại.".ToMessageForUser(), new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(goodsExist));

        }

        //public (string, GoodsDto) DeleteGoods(int Goods)
        //{

        //}
    }
}
