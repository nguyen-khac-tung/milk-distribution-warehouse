using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IInventoryLedgerRepository
    {
        Task<InventoryLedger?> CreateInventoryLedger(InventoryLedger entity);

        // read helpers previously done in services
        Task<List<DisposalNoteDetail>> GetDisposalNoteDetailsByDisposalNoteId(string disposalNoteId);
        Task<List<GoodsIssueNoteDetail>> GetGoodsIssueNoteDetailsByGoodsIssueNoteId(string goodsIssueNoteId);
        Task<List<GoodsReceiptNoteDetail>> GetGoodsReceiptNoteDetailsByGoodsReceiptNoteId(string goodsReceiptNoteId);
        Task<InventoryLedger?> GetLastInventoryLedgerAsync(int goodsId, int goodsPackingId);
    }

    public class InventoryLedgerRepository : IInventoryLedgerRepository
    {
        private readonly WarehouseContext _context;
        public InventoryLedgerRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<InventoryLedger?> CreateInventoryLedger(InventoryLedger entity)
        {
            try
            {
                await _context.InventoryLedgers.AddAsync(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<DisposalNoteDetail>> GetDisposalNoteDetailsByDisposalNoteId(string disposalNoteId)
        {
            if (string.IsNullOrEmpty(disposalNoteId)) return new List<DisposalNoteDetail>();
            return await _context.DisposalNoteDetails
                .AsNoTracking()
                .Where(d => d.DisposalNoteId == disposalNoteId)
                .ToListAsync();
        }

        public async Task<List<GoodsIssueNoteDetail>> GetGoodsIssueNoteDetailsByGoodsIssueNoteId(string goodsIssueNoteId)
        {
            if (string.IsNullOrEmpty(goodsIssueNoteId)) return new List<GoodsIssueNoteDetail>();
            return await _context.GoodsIssueNoteDetails
                .AsNoTracking()
                .Where(d => d.GoodsIssueNoteId == goodsIssueNoteId)
                .ToListAsync();
        }

        public async Task<List<GoodsReceiptNoteDetail>> GetGoodsReceiptNoteDetailsByGoodsReceiptNoteId(string goodsReceiptNoteId)
        {
            if (string.IsNullOrEmpty(goodsReceiptNoteId)) return new List<GoodsReceiptNoteDetail>();
            return await _context.GoodsReceiptNoteDetails
                .AsNoTracking()
                .Where(d => d.GoodsReceiptNoteId == goodsReceiptNoteId)
                .ToListAsync();
        }

        public async Task<InventoryLedger?> GetLastInventoryLedgerAsync(int goodsId, int goodsPackingId)
        {
            return await _context.InventoryLedgers
                .Where(l => l.GoodsId == goodsId && l.GoodPackingId == goodsPackingId)
                .OrderByDescending(l => l.EventDate)
                .FirstOrDefaultAsync();
        }
    }
}
