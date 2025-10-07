using AutoMapper;
using AutoMapper.QueryableExtensions;
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

        public async Task<(string, PageResult<GoodsDto>)> GetGoods(Filter filter)
        {
            var goodsQuery = _goodRepository.GetGoods();

            if(!string.IsNullOrEmpty(filter?.Search))
                goodsQuery = goodsQuery.Where(g => g.GoodsCode.Contains(filter.Search) || g.GoodsName.Contains(filter.Search));
            
            if(filter.Status != null) 
                goodsQuery = goodsQuery.Where(g => g.Status == filter.Status);

            var goodsItems = goodsQuery.ProjectTo<GoodsDto>(_mapper.ConfigurationProvider);

            var goodsDtos = await goodsItems.ToPagedResultAsync<GoodsDto>(filter.PageNumber, filter.PageSize);

            return ("", goodsDtos);
        }

        public async Task<(string, PageResult<GoodsDto>)> GetGoods(PagedRequest request)
        {
            var goodsQuery = _goodRepository.GetGoods();

            var goodsItems = goodsQuery.ProjectTo<GoodsDto>(_mapper.ConfigurationProvider);

            var goodsDtos = await goodsItems.ToPagedResultAsync<GoodsDto>(request);

            return ("", goodsDtos);
        }

        public async Task<(string, GoodsDto)> GetGoodsByGoodsId(int goodsId)
        {
            if (goodsId == 0 || goodsId == null)
                return ("GoodsId is invalid", new GoodsDto());

            var goodsQuery = await _goodRepository.GetGoodsById(goodsId);

            if (goodsQuery != null)
                return ("Goods is not exist", new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(goodsQuery));
        }

        public async Task<(string, GoodsDto)> CreateGoods(GoodsCreate goodsCreate)
        {
            if (goodsCreate == null)
                return ("Goods create data is invalid", new GoodsDto());

            var validationMessage = await IsValidationGoods(null, goodsCreate.GoodsCode, goodsCreate.GoodsName);

            if (string.IsNullOrEmpty(validationMessage))
                return (validationMessage, new GoodsDto());

            var goods = _mapper.Map<Good>(goodsCreate);

            var createResult = await _goodRepository.CreateGoods(goods);
            if (createResult == null)
                return ("Goods create is failed", new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(createResult));
        }

        public async Task<(string, GoodsDto)> UpdateGoods(GoodsUpdate update)
        {
            if (update == null)
                return ("Goods update data is invalid", new GoodsDto());

            var goodsExist = await _goodRepository.GetGoodsById(update.GoodsId);

            if (goodsExist == null)
                return ("Goods is not exist", new GoodsDto());

            var validationMessage = await IsValidationGoods(update.GoodsId, update.GoodsCode, update.GoodsName);

            if (string.IsNullOrEmpty(validationMessage))
                return (validationMessage, new GoodsDto()); 

            _mapper.Map(update, goodsExist);

            var updateResult = await _goodRepository.UpdateGoods(goodsExist);

            if (updateResult == null)
                return ("Update goods is failed", new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(goodsExist));

        }

        //public (string, GoodsDto) DeleteGoods(int Goods)
        //{

        //}

        private async Task<string> IsValidationGoods(int? goodsId, string goodsCode, string goodsName)
        {
            if (await _goodRepository.IsDuplicationCode(goodsId, goodsCode))
                return ("Goods code is existed");

            if (ContainsSpecialCharacters(goodsName))
                return ("Goods Name is invalid");

            return "";
        }

        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }
    }
}
