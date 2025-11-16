using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IDisposalRequestDetailRepository
    {
        Task Remove(DisposalRequestDetail disposalRequestDetail);
    }

    public class DisposalRequestDetailRepository : IDisposalRequestDetailRepository
    {
        private readonly WarehouseContext _context;
        public DisposalRequestDetailRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task Remove(DisposalRequestDetail disposalRequestDetail)
        {
            _context.DisposalRequestDetails.Remove(disposalRequestDetail);
            await Task.CompletedTask;
        }
    }
}
