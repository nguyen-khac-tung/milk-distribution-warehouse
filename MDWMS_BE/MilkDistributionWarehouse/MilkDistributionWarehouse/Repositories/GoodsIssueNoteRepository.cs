using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IGoodsIssueNoteRepository
    {

    }

    public class GoodsIssueNoteRepository : IGoodsIssueNoteRepository
    {
        private readonly WarehouseContext _context;

        public GoodsIssueNoteRepository(WarehouseContext context)
        {
            _context = context;
        }
    }
}
