using AutoMapper;
using System.Linq;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IInventoryLedgerService
    {
        Task<(string, InventoryLedgerRequestDto)> CreateInventoryLedger(InventoryLedgerRequestDto dto);
        Task<(string, List<InventoryLedgerResponseDto>?)> CreateInventoryLedgerBulk(List<InventoryLedgerRequestDto> dtos);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByGINID(string GoodsIssueNoteId);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByGRNID(string GoodsReceiptNoteId);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerByDPNID(string DisposalNoteId);
        Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerStocktakingChange(Pallet pallet, int OldQty,int ActQty);
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
                // If there is already any ledger record for this goods + packing, skip creating an initial zero-entry ledger
                var existing = await _inventoryLedgerRepository.GetLastInventoryLedgerAsync(dto.GoodsId, dto.GoodPackingId);
                if (existing != null)
                {
                    // nothing to create, return success (no-op)
                    return ("", dto);
                }

                var entity = new InventoryLedger
                {
                    GoodsId = dto.GoodsId,
                    GoodPackingId = dto.GoodPackingId,
                    EventDate = dto.EventDate ?? DateTimeUtility.Now(),
                    InQty = dto.InQty ?? 0,
                    OutQty = dto.OutQty ?? 0,
                    StocktakingChange = dto.StockTakingChange ?? 0,
                    BalanceAfter = dto.BalanceAfter ?? 0,
                    TypeChange = dto.TypeChange
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

        public async Task<(string, List<InventoryLedgerResponseDto>?)> CreateInventoryLedgerBulk(List<InventoryLedgerRequestDto> dtos)
        {
            if (dtos == null || !dtos.Any()) return ("Inventory ledger dtos is invalid or empty.", default);

            try
            {
                var createdDtos = new List<InventoryLedgerResponseDto>();
                var errors = new List<string>();

                foreach (var dto in dtos)
                {
                    try
                    {
                        // Skip if ledger already exists for this goods+packing (avoid duplicate initial entries)
                        var existing = await _inventoryLedgerRepository.GetLastInventoryLedgerAsync(dto.GoodsId, dto.GoodPackingId);
                        if (existing != null)
                        {
                            // skip creation for this dto
                            continue;
                        }

                        var entity = new InventoryLedger
                        {
                            GoodsId = dto.GoodsId,
                            GoodPackingId = dto.GoodPackingId,
                            EventDate = dto.EventDate ?? DateTimeUtility.Now(),
                            InQty = dto.InQty ?? 0,
                            OutQty = dto.OutQty ?? 0,
                            StocktakingChange = dto.StockTakingChange ?? 0,
                            BalanceAfter = dto.BalanceAfter ?? 0,
                            TypeChange = dto.TypeChange
                        };

                        var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                        if (created == null)
                        {
                            errors.Add($"Failed to create ledger for GoodsId={dto.GoodsId}, GoodPackingId={dto.GoodPackingId}");
                            continue;
                        }

                        createdDtos.Add(_mapper.Map<InventoryLedgerResponseDto>(created));
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Exception for GoodsId={dto.GoodsId}, GoodPackingId={dto.GoodPackingId}: {ex.Message}");
                        // continue to next dto
                    }
                }

                if (errors.Any())
                {
                    var msg = $"Created {createdDtos.Count} ledger(s), failed {errors.Count}.";
                    msg += " " + string.Join(" | ", errors.Take(10));
                    return (msg, createdDtos);
                }

                return ("", createdDtos);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
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
                        EventDate = DateTimeUtility.Now(),
                        InQty = 0,
                        OutQty = outQty,
                        StocktakingChange = 0,
                        BalanceAfter = balanceAfter,
                        TypeChange = InventoryLegerTypeChange.Disposal
                    };

                    var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                    if (created == null) return ("Failed to create inventory ledger for disposal detail.", default);

                    lastDto = _mapper.Map<InventoryLedger, InventoryLedgerResponseDto>(created);
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
                        EventDate = DateTimeUtility.Now(),
                        InQty = 0,
                        OutQty = outQty,
                        StocktakingChange = 0,
                        BalanceAfter = balanceAfter,
                        TypeChange = InventoryLegerTypeChange.Issue
                    };

                    var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                    if (created == null) return ("Failed to create inventory ledger for goods issue detail.", default);

                    lastDto = _mapper.Map<InventoryLedger, InventoryLedgerResponseDto>(created);
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
                        EventDate = DateTimeUtility.Now(),
                        InQty = inQty,
                        OutQty = 0,
                        StocktakingChange = 0,
                        BalanceAfter = balanceAfter,
                        TypeChange = InventoryLegerTypeChange.Receipt
                    };

                    var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                    if (created == null) return ("Failed to create inventory ledger for goods receipt detail.", default);

                    lastDto = _mapper.Map<InventoryLedger, InventoryLedgerResponseDto>(created);
                }

                return ("", lastDto);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, InventoryLedgerResponseDto)> CreateInventoryLedgerStocktakingChange(Pallet pallet, int OldQty, int ActQty)
        {
            if (pallet == null)
                return ("Pallet is null.", default);

            try
            {
                if (!pallet.GoodsPackingId.HasValue)
                    return ("Pallet GoodPackingId is invalid.", default);

                var goodsId = pallet.Batch?.GoodsId ?? 0;
                if (goodsId == 0)
                    return ("Pallet batch or goods information is invalid.", default);

                var goodsPackingId = pallet.GoodsPackingId.Value;

                // get last ledger to determine current balance
                var last = await _inventoryLedgerRepository.GetLastInventoryLedgerAsync(goodsId, goodsPackingId);
                var balanceBefore = last?.BalanceAfter ?? 0;

                var stocktakingChange = ActQty - OldQty;
                var balanceAfter = balanceBefore + stocktakingChange;

                var entity = new InventoryLedger
                {
                    GoodsId = goodsId,
                    GoodPackingId = goodsPackingId,
                    EventDate = DateTimeUtility.Now(),
                    InQty = 0,
                    OutQty = 0,
                    StocktakingChange = stocktakingChange,
                    BalanceAfter = balanceAfter,
                    TypeChange = InventoryLegerTypeChange.Stocktaking
                };

                var created = await _inventoryLedgerRepository.CreateInventoryLedger(entity);
                if (created == null) return ("Failed to create inventory ledger for stocktaking change.", default);

                var dto = _mapper.Map<InventoryLedgerResponseDto>(created);
                return ("", dto);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }
    }
}
