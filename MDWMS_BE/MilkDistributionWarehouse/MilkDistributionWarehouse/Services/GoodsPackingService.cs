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
        Task<(string, List<GoodsPackingUpdate>?)> UpdateGoodsPacking(int goodsId, List<GoodsPackingUpdate> updates);
        Task<(string, List<GoodsPackingDto>?)> GetGoodsPackingByGoodsId(int goodsId);
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

        public async Task<(string, List<GoodsPackingDto>?)> GetGoodsPackingByGoodsId(int goodsId)
        {
            var goodsPackings = await _goodPackingRepository.GetGoodsPackingsByGoodsId(goodsId);
            if (goodsPackings == null)
                return ("Danh sách số lượng đóng gói hàng hoá trống.", default);

            return ("", _mapper.Map<List<GoodsPackingDto>>(goodsPackings));
        }

        public async Task<(string, List<GoodsPackingUpdate>?)> UpdateGoodsPacking(int goodsId, List<GoodsPackingUpdate> updates)
        {
            try
            {

                var goodsPackingsExist = await _goodPackingRepository.GetGoodsPackingsByGoodsId(goodsId);

                if (goodsPackingsExist == null)
                    throw new Exception("Danh sách số lượng đóng gói hàng hoá trống.");

                var updateIds = updates
                    .Where(gp => gp.GoodsPackingId > 0)
                    .Select(gp => gp.GoodsPackingId);

                var packingToRemove = goodsPackingsExist
                    .Where(gp => !updateIds.Contains(gp.GoodsPackingId))
                    .ToList();

                foreach (var p in packingToRemove)
                {
                    var hasAnyTransaction = await HasAnyTransaction(p.GoodsPackingId);
                    if (!string.IsNullOrEmpty(hasAnyTransaction))
                        throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại." + hasAnyTransaction);

                    var resultRemove = await _goodPackingRepository.DeleteGoodsPacking(p);
                    if (resultRemove == null)
                        throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại.");
                }

                foreach (var p in updates)
                {
                    if (p.GoodsPackingId > 0)
                    {
                        var existingGoodsPacking = goodsPackingsExist
                            .FirstOrDefault(gp => gp.GoodsPackingId == p.GoodsPackingId);

                        if (existingGoodsPacking != null)
                        {
                            var hasRelatedTransaction = await HasRelatedTransaction(p.GoodsPackingId);
                            if (!string.IsNullOrEmpty(hasRelatedTransaction))
                                throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại." + hasRelatedTransaction);

                            existingGoodsPacking.UnitPerPackage = p.UnitPerPackage;
                        }
                    }
                    else
                    {
                        var newGoodsPackingCreate = new GoodsPackingCreateDto()
                        {
                            UnitPerPackage = p.UnitPerPackage,
                            GoodsId = goodsId
                        };

                        var newGoodsPacking = _mapper.Map<GoodsPacking>(newGoodsPackingCreate);

                        var resultCreate = await _goodPackingRepository.CreateGoodsPacking(newGoodsPacking);
                        if (resultCreate == null)
                            throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại.");
                    }
                }

                return ("", updates);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }

        }

        private async Task<string> HasRelatedTransaction(int goodsPackingId)
        {
            var hasRelatedPO = await _goodPackingRepository.HasActivePurchaseOrder(goodsPackingId);
            if (hasRelatedPO) return "Có đơn đặt hàng đang sử dụng.";

            var hasRelatedSO = await _goodPackingRepository.HasActiveSaleOrder(goodsPackingId);
            if (hasRelatedSO) return "Có đơn mua hàng đang sử dụng.";

            var hasRelatedGRN = await _goodPackingRepository.HasActiveGoodsReceiptNote(goodsPackingId);
            if (hasRelatedGRN) return "Có đơn nhập hàng đang được sử dụng.";

            var hasRelatedGIN = await _goodPackingRepository.HasActiveGoodsIssueNote(goodsPackingId);
            if (hasRelatedGIN) return "Có đơn xuất hàng đang được sử dụng.";

            return "";
        }

        private async Task<string> HasAnyTransaction(int goodsPackingId)
        {
            var isPO = await _goodPackingRepository.IsPurchaseOrderByGoodsPackingId(goodsPackingId);
            if (isPO) return "Có đơn đặt hàng đang liên kết.";

            var isSO = await _goodPackingRepository.IsSalesOrderByGoodsPackingId(goodsPackingId);
            if (isSO) return "Có đơn mua hàng đang liên kết.";

            var isGRN = await _goodPackingRepository.IsGoodsReceiptNoteByGoodsPackingId(goodsPackingId);
            if (isGRN) return "Có đơn nhập hàng đang liên kết.";

            var isGIN = await _goodPackingRepository.IsGoodsIssueNoteByGoodsPackingId(goodsPackingId);
            if (isGIN) return "Có đơn xuất hàng liên kết.";

            return "";
        }
    }
}
