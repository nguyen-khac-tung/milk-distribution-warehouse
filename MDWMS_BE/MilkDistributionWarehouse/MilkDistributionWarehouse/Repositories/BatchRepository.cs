using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IBatchRepository
    {
        IQueryable<Batch> GetBatchs();
        Task<Batch?> GetBatchById(Guid batchId);
        Task<List<Batch>> GetActiveBatchesByGoodsId(int goodsId);
        Task<(string, bool)> IsBatchCodeDuplicate(Guid? batchId, int goodsId, string batchCode);
        Task<string> CreateBatch(Batch batch);
        Task<string> UpdateBatch(Batch batch);
        Task<bool> IsBatchOnPalletActive(Guid batchId);
        Task<bool> IsBatchOnPallet(Guid batchId);
    }

    public class BatchRepository : IBatchRepository
    {
        private readonly WarehouseContext _context;

        public BatchRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Batch> GetBatchs()
        {
            return _context.Batchs
                .Include(b => b.Goods)
                .OrderByDescending(b => b.CreateAt)
                .AsNoTracking();
        }

        public async Task<Batch?> GetBatchById(Guid batchId)
        {
            return await _context.Batchs
                .Include(b => b.Goods)
                .Where(b => b.Status != CommonStatus.Deleted)
                .FirstOrDefaultAsync(b => b.BatchId == batchId);
        }

        public async Task<List<Batch>> GetActiveBatchesByGoodsId(int goodsId)
        {
            return await _context.Batchs
                .Where(b => b.GoodsId == goodsId && b.Status == CommonStatus.Active)
                .OrderByDescending(b => b.CreateAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<(string, bool)> IsBatchCodeDuplicate(Guid? batchId, int goodsId, string batchCode)
        {
            var supplier = await _context.Suppliers
                            .Include(s => s.Goods)
                            .ThenInclude(g => g.Batches)
                            .Where(s => s.Goods.Any(g => g.GoodsId == goodsId && g.Status != CommonStatus.Deleted))
                            .FirstOrDefaultAsync();

            if (supplier == null) return ("Supplier is null", false);

            var batchCodeOfSupplier = supplier.Goods
                                        .SelectMany(g => g.Batches)
                                        .Where(b => b.Status != CommonStatus.Deleted)
                                        .ToList();

            var isDuplicate = batchCodeOfSupplier.Any(b =>
                (batchId == null || b.BatchId != batchId) &&
                b.BatchCode.ToLower().Trim() == batchCode.ToLower().Trim());

            return ("", isDuplicate);
        }

        public async Task<bool> IsBatchOnPalletActive(Guid batchId)
        {
            return await _context.Pallets.AnyAsync(p => p.BatchId == batchId && p.Status == CommonStatus.Active);
        }

        public async Task<bool> IsBatchOnPallet(Guid batchId)
        {
            return await _context.Pallets.AnyAsync(p => p.BatchId == batchId && p.Status != CommonStatus.Deleted);
        }

        public async Task<string> CreateBatch(Batch batch)
        {
            try
            {
                await _context.Batchs.AddAsync(batch);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        public async Task<string> UpdateBatch(Batch batch)
        {
            try
            {
                _context.Batchs.Update(batch);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }
    }
}
