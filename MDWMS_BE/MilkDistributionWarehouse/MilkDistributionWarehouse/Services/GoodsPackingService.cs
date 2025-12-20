using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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
        private readonly IInventoryLedgerRepository _inventoryLedgerRepository;
        public GoodsPackingService(IGoodsPackingRepository goodPackingRepository, IMapper mapper, IInventoryLedgerRepository inventoryLedgerRepository)
        {
            _goodPackingRepository = goodPackingRepository;
            _mapper = mapper;
            _inventoryLedgerRepository = inventoryLedgerRepository;
        }

        public async Task<(string, List<GoodsPackingDto>?)> GetGoodsPackingByGoodsId(int goodsId)
        {
            var goodsPackings = await _goodPackingRepository.GetGoodsPackingsByGoodsId(goodsId);
            if (goodsPackings == null)
                return ("Danh sách số lượng đóng gói hàng hoá trống.", default);

            return ("", _mapper.Map<List<GoodsPackingDto>>(goodsPackings));
        }

        public async Task<(string, List<GoodsPackingUpdate>?)> UpdateGoodsPacking(
            int goodsId,
            List<GoodsPackingUpdate> updates)
        {
            try
            {
                var goodsPackingsExist =
                    await _goodPackingRepository.GetGoodsPackingsByGoodsId(goodsId);

                if (goodsPackingsExist == null || !goodsPackingsExist.Any())
                    return ("", updates);

                var existingByUnit = goodsPackingsExist
                    .GroupBy(x => x.UnitPerPackage)
                    .ToDictionary(g => g.Key, g => g.First());

                var updateByUnit = updates
                    .GroupBy(x => x.UnitPerPackage)
                    .ToDictionary(g => g.Key, g => g.First());
                
                var packingsToRemove = goodsPackingsExist
                    .Where(p =>
                        !updateByUnit.ContainsKey((int)p.UnitPerPackage) // FE không còn unit này
                    )
                    .ToList();

                foreach (var p in packingsToRemove)
                {
                    var hasTransaction = await HasAnyTransaction(p.GoodsPackingId, goodsId);
                    if (!string.IsNullOrEmpty(hasTransaction))
                    {
                        continue;
                    }

                    var resultLedgers =
                        await _inventoryLedgerRepository.DeleteInventoryLedger(
                            p.GoodsPackingId, goodsId);

                    if (resultLedgers == 0)
                        throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại.");

                    var resultRemove =
                        await _goodPackingRepository.DeleteGoodsPacking(p);

                    if (resultRemove == null)
                        throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại.");
                }
                foreach (var u in updates)
                {
                    if (existingByUnit.TryGetValue(u.UnitPerPackage, out var existPacking))
                    {
                        continue;
                    }

                    if (u.GoodsPackingId > 0)
                    {
                        var packing =
                            goodsPackingsExist.FirstOrDefault(
                                x => x.GoodsPackingId == u.GoodsPackingId);

                        if (packing != null &&
                            packing.UnitPerPackage != u.UnitPerPackage)
                        {
                            var hasRelated =
                                await HasRelatedTransaction(
                                    packing.GoodsPackingId, goodsId);

                            if (!string.IsNullOrEmpty(hasRelated))
                                throw new Exception(
                                    "Cập nhật số lượng đóng gói hàng hoá thất bại." +
                                    hasRelated);

                            packing.UnitPerPackage = u.UnitPerPackage;

                            var result =
                                await _goodPackingRepository.UpdateGoodsPacking(packing);

                            if (result == 0)
                                throw new Exception("Cập nhật quy cách đóng gói thất bại.");
                        }

                        continue;
                    }
                    var newPacking = new GoodsPacking
                    {
                        GoodsId = goodsId,
                        UnitPerPackage = u.UnitPerPackage,
                        Status = CommonStatus.Active
                    };

                    var resultCreate =
                        await _goodPackingRepository.CreateGoodsPacking(newPacking);

                    if (resultCreate == null)
                        throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại.");

                    var inventoryLedger =
                        new InventoryLedger
                        {
                            GoodsId = goodsId,
                            GoodPackingId = newPacking.GoodsPackingId,
                            EventDate = DateTimeUtility.Now(),
                            InQty = 0,
                            OutQty = 0,
                            BalanceAfter = 0,
                            TypeChange = null
                        };

                    var resultCreateInventory = 
                        await _inventoryLedgerRepository.CreateInventoryLedger(inventoryLedger);

                    if (resultCreateInventory == null)
                        throw new Exception("Cập nhật số lượng đóng gói hàng hoá thất bại.");
                }

                return ("", updates);
            }
            catch (Exception ex)
            {
                return (ex.Message.ToMessageForUser(), default);
            }
        }


        private async Task<string> HasRelatedTransaction(int goodsPackingId, int goodsId)
        {
            var hasRelatedPO = await _goodPackingRepository.HasActivePurchaseOrder(goodsPackingId);
            if (hasRelatedPO) return "Có đơn đặt hàng đang sử dụng.";

            var hasRelatedSO = await _goodPackingRepository.HasActiveSaleOrder(goodsPackingId);
            if (hasRelatedSO) return "Có đơn mua hàng đang sử dụng.";

            var hasDisposalRequest = await _goodPackingRepository.HasActiveDisposalRequest(goodsPackingId);
            if (hasDisposalRequest) return "Có đơn đề nghị xuất huỷ đang được sử dụng.";

            var hasRelatedGRN = await _goodPackingRepository.HasActiveGoodsReceiptNote(goodsPackingId);
            if (hasRelatedGRN) return "Có đơn nhập hàng đang được sử dụng.";

            var hasRelatedGIN = await _goodPackingRepository.HasActiveGoodsIssueNote(goodsPackingId);
            if (hasRelatedGIN) return "Có đơn xuất hàng đang được sử dụng.";

            var hasRelatedDisposalNote = await _goodPackingRepository.HasActiveDisposalNote(goodsPackingId);
            if (hasRelatedDisposalNote) return "Có phiếu xuất hủy đang được sử dụng.";

            var hasRelatedPallet = await _goodPackingRepository.HasActiveAndDeletedPallet(goodsPackingId);
            if (hasRelatedPallet) return "Có pallet đang được sử dụng.";

            var hasInventoryLedger = await _goodPackingRepository.HasInventoryLedgers(goodsPackingId, goodsId);
            if (hasInventoryLedger) return "Có sổ cái tồn kho đang liên kết.";

            var hasBackOrder = await _goodPackingRepository.HasBackOrder(goodsPackingId);
            if (hasBackOrder) return "Có phiếu bổ sung đang liên kết.";

            return "";
        }

        private async Task<string> HasAnyTransaction(int goodsPackingId, int goodsId)
        {
            var isPO = await _goodPackingRepository.IsPurchaseOrderByGoodsPackingId(goodsPackingId);
            if (isPO) return "Có đơn đặt hàng đang liên kết.";

            var isSO = await _goodPackingRepository.IsSalesOrderByGoodsPackingId(goodsPackingId);
            if (isSO) return "Có đơn mua hàng đang liên kết.";

            var isDisposalRequest = await _goodPackingRepository.IsDisposalRequestByGoodsPackingId(goodsPackingId);
            if (isDisposalRequest) return "Có đơn đề nghị xuất huỷ đang liên kết.";

            var isGRN = await _goodPackingRepository.IsGoodsReceiptNoteByGoodsPackingId(goodsPackingId);
            if (isGRN) return "Có đơn nhập hàng đang liên kết.";

            var isGIN = await _goodPackingRepository.IsGoodsIssueNoteByGoodsPackingId(goodsPackingId);
            if (isGIN) return "Có đơn xuất hàng liên kết.";

            var isDisposalNote = await _goodPackingRepository.IsDisposalNoteByGoodsPackingId(goodsPackingId);
            if (isDisposalNote) return "Có phiếu xuất hủy đang liên kết.";

            var isPallet = await _goodPackingRepository.IsPalletByGoodsPackingId(goodsPackingId);
            if (isPallet) return "Có pallet đang liên kết.";

            var isInventoryLedger = await _goodPackingRepository.IsInventoryLedgers(goodsPackingId, goodsId);
            if (isInventoryLedger) return "Có sổ cái tồn kho đang liên kết.";

            var isBackOrder = await _goodPackingRepository.IsExistBackOrder(goodsPackingId);
            if (isBackOrder) return "Có phiếu bổ sung đang liên kết.";

            return "";
        }
    }
}
