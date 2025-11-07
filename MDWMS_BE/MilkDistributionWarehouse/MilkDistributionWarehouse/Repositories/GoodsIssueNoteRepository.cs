using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsIssueNoteRepository
    {
        Task<GoodsIssueNote?> GetGINBySalesOrderId(Guid? salesOrderId);
        Task<GoodsIssueNote?> GetGINDetailBySalesOrderId(Guid? salesOrderId);
        Task<GoodsIssueNote?> GetGINByGoodsIssueNoteId(Guid? goodsIssueNoteId);
        Task CreateGoodsIssueNote(GoodsIssueNote goodsIssueNote);
        Task UpdateGoodsIssueNote(GoodsIssueNote goodsIssueNote);
    }

    public class GoodsIssueNoteRepository : IGoodsIssueNoteRepository
    {
        private readonly WarehouseContext _context;

        public GoodsIssueNoteRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<GoodsIssueNote?> GetGINBySalesOrderId(Guid? salesOrderId)
        {
            return await _context.GoodsIssueNotes.FirstOrDefaultAsync(g => g.SalesOderId == salesOrderId);
        }

        public async Task<GoodsIssueNote?> GetGINDetailBySalesOrderId(Guid? salesOrderId)
        {
            return await _context.GoodsIssueNotes
                .Where(g => g.SalesOderId == salesOrderId)
                .Include(gin => gin.SalesOder)
                    .ThenInclude(s => s.Retailer)
                .Include(gin => gin.SalesOder)
                    .ThenInclude(s => s.AssignToNavigation)
                .Include(gin => gin.CreatedByNavigation)
                .Include(gin => gin.ApprovalByNavigation)
                .Include(gin => gin.GoodsIssueNoteDetails)
                    .ThenInclude(d => d.Goods)
                .Include(gin => gin.GoodsIssueNoteDetails)
                    .ThenInclude(d => d.GoodsPacking)
                .Include(gin => gin.GoodsIssueNoteDetails)
                    .ThenInclude(d => d.PickAllocations)
                        .ThenInclude(pa => pa.Pallet)
                            .ThenInclude(p => p.Location)
                                .ThenInclude(l => l.Area)
                .FirstOrDefaultAsync();
        }

        public async Task<GoodsIssueNote?> GetGINByGoodsIssueNoteId(Guid? goodsIssueNoteId)
        {
            return await _context.GoodsIssueNotes
                .Include(gin => gin.SalesOder)
                .Include(gin => gin.GoodsIssueNoteDetails)
                    .ThenInclude(gd => gd.PickAllocations)
                        .ThenInclude(p => p.Pallet)
                            .ThenInclude(l => l.Location)
                .FirstOrDefaultAsync(gin => gin.GoodsIssueNoteId == goodsIssueNoteId);
        }

        public async Task CreateGoodsIssueNote(GoodsIssueNote goodsIssueNote)
        {
            await _context.GoodsIssueNotes.AddAsync(goodsIssueNote);
        }

        public async Task UpdateGoodsIssueNote(GoodsIssueNote goodsIssueNote)
        {
            _context.GoodsIssueNotes.Update(goodsIssueNote);
            await Task.CompletedTask;
        }
    }
}
