using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IDisposalRequestRepository
    {
        IQueryable<DisposalRequest> GetAllDisposalRequests();
        Task<DisposalRequest?> GetDisposalRequestById(string? id);
        Task<List<DisposalRequestDetail>> GetCommittedDisposalQuantities();
        Task CreateDisposalRequest(DisposalRequest disposalRequest);
    }

    public class DisposalRequestRepository : IDisposalRequestRepository
    {
        private readonly WarehouseContext _context;
        public DisposalRequestRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<DisposalRequest> GetAllDisposalRequests()
        {
            return _context.DisposalRequests
                .Include(dr => dr.CreatedByNavigation)
                .Include(dr => dr.ApprovalByNavigation)
                .Include(dr => dr.AssignToNavigation)
                .Include(dr => dr.DisposalRequestDetails)
                .OrderByDescending(dr => dr.CreatedAt)
                .AsNoTracking();
        }
        public async Task<DisposalRequest?> GetDisposalRequestById(string? id)
        {
            return await _context.DisposalRequests
                .Include(dr => dr.CreatedByNavigation)
                .Include(dr => dr.ApprovalByNavigation)
                .Include(dr => dr.AssignToNavigation)
                .Include(dr => dr.DisposalRequestDetails)
                    .ThenInclude(d => d.Goods)
                        .ThenInclude(g => g.UnitMeasure)
                .Include(dr => dr.DisposalRequestDetails)
                    .ThenInclude(d => d.GoodsPacking)
                .Where(dr => dr.DisposalRequestId == id).FirstOrDefaultAsync();
        }

        public async Task<List<DisposalRequestDetail>> GetCommittedDisposalQuantities()
        {
            int[] inProgressStatuses = {
                DisposalRequestStatus.Approved,
                DisposalRequestStatus.AssignedForPicking,
                DisposalRequestStatus.Picking
            };

            return await _context.DisposalRequests
                .Where(dr => dr.Status != null && inProgressStatuses.Contains((int)dr.Status))
                .SelectMany(dr => dr.DisposalRequestDetails)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task CreateDisposalRequest(DisposalRequest disposalRequest)
        {
            await _context.DisposalRequests.AddAsync(disposalRequest);
        }
    }
}
