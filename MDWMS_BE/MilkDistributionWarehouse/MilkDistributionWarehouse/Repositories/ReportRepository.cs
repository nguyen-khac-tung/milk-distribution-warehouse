using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IReportRepository
    {
        Task<List<ReportDto.InventoryReportDto>> GetInventoryReportAsync(CancellationToken cancellationToken = default);
    }

    public class ReportRepository : IReportRepository
    {
        private readonly WarehouseContext _context;

        public ReportRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<List<ReportDto.InventoryReportDto>> GetInventoryReportAsync(CancellationToken cancellationToken = default)
        {
            var raw = await _context.Batchs
                .Include(b => b.Goods)
                .Include(b => b.Pallets)
                    .ThenInclude(p => p.Location)
                .Where(b => b.Status == CommonStatus.Active && b.Pallets.Any(p => p.Status == CommonStatus.Active))
                .Select(b => new
                {
                    b.BatchId,
                    b.BatchCode,
                    b.ManufacturingDate,
                    b.ExpiryDate,
                    GoodName = b.Goods != null ? b.Goods.GoodsName : null,
                    Pallets = b.Pallets
                        .Where(p => p.Status == CommonStatus.Active)
                        .Select(p => new
                        {
                            p.PalletId,
                            PackageQuantity = p.PackageQuantity ?? 0,
                            LocationCode = p.Location != null ? p.Location.LocationCode : null
                        })
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return raw.Select(b => new ReportDto.InventoryReportDto
            {
                BatchId = b.BatchId,
                BatchCode = b.BatchCode,
                ManufacturingDate = b.ManufacturingDate,
                ExpiryDate = b.ExpiryDate,
                GoodName = b.GoodName,
                PalletIds = b.Pallets.Select(p => p.PalletId).Where(id => id != null).ToList(),
                TotalPackageQuantity = b.Pallets.Sum(p => p.PackageQuantity),
                LocationCodes = b.Pallets.Select(p => p.LocationCode).Where(l => l != null).Distinct().ToList()
            }).ToList();
        }
    }
}