using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface IInventoryLedgerService
    {
        Task<(string, InventoryLedgerRequestDto)> CreateInventoryLedger(InventoryLedgerRequestDto dto);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByGINID(string GoodsIssueNoteId);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByGRNID(string GoodsReceiptNoteId);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByDPNID(string DisposalNoteId);
    }

    public class InventoryLedgerService : IInventoryLedgerService
    {
        private readonly IInventoryLedgerRepository _inventoryLedgerRepository;
        private readonly IMapper _mapper;

        public InventoryLedgerService(IInventoryLedgerRepository inventoryLedgerRepository, IMapper mapper)
        {
            _inventoryLedgerRepository = inventoryLedgerRepository;
            _mapper = mapper;
        }

        public async Task<(string, InventoryLedgerRequestDto)> CreateInventoryLedger(InventoryLedgerRequestDto dto)
        {
            try
            {
                var entity = new InventoryLedger
                {
                    GoodsId = dto.GoodsId,
                    GoodPackingId = dto.GoodPackingId,
                    EventDate = dto.EventDate ?? DateTime.Now,
                    InQty = 0,
                    OutQty = 0,
                    BalanceAfter = 0,
                    TypeChange = null
                };

                var result = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                if (result == null) return ("Failed to create inventory ledger.", dto);

                return ("", dto);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", dto);
            }
        }

        public async Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByDPNID(string DisposalNoteId)
        {
            if (string.IsNullOrEmpty(DisposalNoteId)) return ("DisposalNoteId is invalid.", default);

            try
            {
                var details = await _inventoryLedgerRepository.GetDisposalNoteDetailsByDisposalNoteId(DisposalNoteId);
                if (details == null || !details.Any()) return ("No disposal note details found.", default);

                InventoryLedgerResponseDto lastDto = null;

                foreach (var d in details)
                {
                    var last = await _inventoryLedgerRepository.GetLastInventoryLedgerAsync(d.GoodsId ?? 0, d.GoodsPackingId ?? 0);

                    var balanceBefore = last?.BalanceAfter ?? 0;
                    var outQty = d.PackageQuantity ?? 0;
                    var balanceAfter = balanceBefore - outQty;

                    var entity = new InventoryLedger
                    {
                        GoodsId = d.GoodsId ?? 0,
                        GoodPackingId = d.GoodsPackingId ?? 0,
                        EventDate = DateTime.Now,
                        InQty = 0,
                        OutQty = outQty,
                        BalanceAfter = balanceAfter,
                        TypeChange = InventoryLegerTypeChange.Disposal
                    };

                    var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                    if (created == null) return ("Failed to create inventory ledger for disposal detail.", default);

                    lastDto = _mapper.Map<InventoryLedgerResponseDto>(created);
                }

                return ("", lastDto);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByGINID(string GoodsIssueNoteId)
        {
            if (string.IsNullOrEmpty(GoodsIssueNoteId)) return ("GoodsIssueNoteId is invalid.", default);

            try
            {
                var details = await _inventoryLedgerRepository.GetGoodsIssueNoteDetailsByGoodsIssueNoteId(GoodsIssueNoteId);
                if (details == null || !details.Any()) return ("No goods issue note details found.", default);

                InventoryLedgerResponseDto lastDto = null;

                foreach (var d in details)
                {
                    var last = await _inventoryLedgerRepository.GetLastInventoryLedgerAsync(d.GoodsId ?? 0, d.GoodsPackingId ?? 0);

                    var balanceBefore = last?.BalanceAfter ?? 0;
                    var outQty = d.PackageQuantity ?? 0;
                    var balanceAfter = balanceBefore - outQty;

                    var entity = new InventoryLedger
                    {
                        GoodsId = d.GoodsId ?? 0,
                        GoodPackingId = d.GoodsPackingId ?? 0,
                        EventDate = DateTime.Now,
                        InQty = 0,
                        OutQty = outQty,
                        BalanceAfter = balanceAfter,
                        TypeChange = InventoryLegerTypeChange.Issue
                    };

                    var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                    if (created == null) return ("Failed to create inventory ledger for goods issue detail.", default);

                    lastDto = _mapper.Map<InventoryLedgerResponseDto>(created);
                }

                return ("", lastDto);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByGRNID(string GoodsReceiptNoteId)
        {
            if (string.IsNullOrEmpty(GoodsReceiptNoteId)) return ("GoodsReceiptNoteId is invalid.", default);

            try
            {
                var details = await _inventoryLedgerRepository.GetGoodsReceiptNoteDetailsByGoodsReceiptNoteId(GoodsReceiptNoteId);
                if (details == null || !details.Any()) return ("No goods receipt note details found.", default);

                InventoryLedgerResponseDto lastDto = null;

                foreach (var d in details)
                {
                    var last = await _inventoryLedgerRepository.GetLastInventoryLedgerAsync(d.GoodsId, d.GoodsPackingId ?? 0);

                    var balanceBefore = last?.BalanceAfter ?? 0;
                    var inQty = d.ActualPackageQuantity ?? ((d.DeliveredPackageQuantity ?? 0) - (d.RejectPackageQuantity ?? 0));
                    var balanceAfter = balanceBefore + inQty;

                    var entity = new InventoryLedger
                    {
                        GoodsId = d.GoodsId,
                        GoodPackingId = d.GoodsPackingId ?? 0,
                        EventDate = DateTime.Now,
                        InQty = inQty,
                        OutQty = 0,
                        BalanceAfter = balanceAfter,
                        TypeChange = InventoryLegerTypeChange.Receipt
                    };

                    var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                    if (created == null) return ("Failed to create inventory ledger for goods receipt detail.", default);

                    lastDto = _mapper.Map<InventoryLedgerResponseDto>(created);
                }

                return ("", lastDto);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }
    }
}
