using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsPackingService
    {
        
    }

    public class GoodsPackingService : IGoodsPackingService
    {
        private readonly IGoodsPackingRepository _goodPackingRepository;
        private readonly IMapper _mapper;
        public GoodsPackingService(IGoodsPackingRepository goodPackingRepository, IMapper mapper)
        {
            _goodPackingRepository = goodPackingRepository;
            _mapper = mapper;
        }

        //public async Task<(string, List<GoodsPackingUpdate>?)> UpdateGoodsPacking(int goodsId, List<GoodsPackingUpdate> updates)
        //{
        //    var goodsPackingsExist = await _goodPackingRepository.GetGoodsPackingsByGoodsId(goodsId);

        //    if (goodsPackingsExist == null)
        //        return ("Danh sách số lượng đóng gói hàng hoá trống.".ToMessageForUser(), default);

        //    var updateIds = updates
        //        .Where(gp => gp.GoodsPackingId > 0)
        //        .Select(gp => gp.GoodsPackingId);

        //    var packingToRemove = goodsPackingsExist
        //        .Where(gp => !updateIds.Contains(gp.GoodsPackingId))
        //        .ToList();


        //}

        //public string IsValidateGoodsPackingUpdate(int goodsId, List<GoodsPacking> goodsPackings)
        //{

        //}
    }
}
