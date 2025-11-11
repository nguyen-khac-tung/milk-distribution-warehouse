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
        Task<PageResult<ReportDto.InventoryReportDto>> GetInventoryReportAsync(PagedRequest request, int? areaId = null, CancellationToken cancellationToken = default);
        Task<ReportDto.LocationReportSummaryDto> GetLocationReportAsync(int? areaId = null, CancellationToken cancellationToken = default);
        Task<List<ReportDto.SaleBySupplierReportDto>> GetSaleBySupplierReportAsync(int? supplierId, CancellationToken cancellationToken = default);
    }

    public class ReportRepository : IReportRepository
    {
        private readonly WarehouseContext _context;

        public ReportRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<PageResult<ReportDto.InventoryReportDto>> GetInventoryReportAsync(PagedRequest request, int? areaId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Batchs
                .Include(b => b.Goods)
                .Include(b => b.Pallets)
                    .ThenInclude(p => p.Location)
                .Where(b => b.Status == CommonStatus.Active && b.Pallets.Any(p => p.Status == CommonStatus.Active));

            if (areaId.HasValue)
            {
                query = query.Where(b => b.Pallets.Any(p => p.Location != null && p.Location.AreaId == areaId.Value));
            }

            // Apply filters from request.Filters (if any)
            if (request.Filters != null && request.Filters.Count > 0)
            {
                if (request.Filters.TryGetValue("batchCode", out var batchCode) && !string.IsNullOrWhiteSpace(batchCode))
                {
                    var v = batchCode.Trim().ToLower();
                    query = query.Where(b => b.BatchCode.ToLower().Contains(v));
                }

                if (request.Filters.TryGetValue("goodsCode", out var goodsCode) && !string.IsNullOrWhiteSpace(goodsCode))
                {
                    var v = goodsCode.Trim().ToLower();
                    query = query.Where(b => b.Goods != null && b.Goods.GoodsCode.ToLower().Contains(v));
                }

                if (request.Filters.TryGetValue("goodsName", out var goodsName) && !string.IsNullOrWhiteSpace(goodsName))
                {
                    var v = goodsName.Trim().ToLower();
                    query = query.Where(b => b.Goods != null && b.Goods.GoodsName.ToLower().Contains(v));
                }
            }

            // Search filter (global)
            if (!string.IsNullOrEmpty(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(b => b.BatchCode.ToLower().Contains(search)
                    || (b.Goods != null && b.Goods.GoodsCode.ToLower().Contains(search))
                    || (b.Goods != null && b.Goods.GoodsName.ToLower().Contains(search)));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            // Sorting
            if (!string.IsNullOrEmpty(request.SortField))
            {
                // Only support a few fields for demo, can expand as needed
                switch (request.SortField)
                {
                    case "BatchCode":
                        query = request.SortAscending ? query.OrderBy(b => b.BatchCode) : query.OrderByDescending(b => b.BatchCode);
                        break;
                    case "ManufacturingDate":
                        query = request.SortAscending ? query.OrderBy(b => b.ManufacturingDate) : query.OrderByDescending(b => b.ManufacturingDate);
                        break;
                    case "ExpiryDate":
                        query = request.SortAscending ? query.OrderBy(b => b.ExpiryDate) : query.OrderByDescending(b => b.ExpiryDate);
                        break;
                    default:
                        query = query.OrderByDescending(b => b.CreateAt);
                        break;
                }
            }
            else
            {
                query = query.OrderByDescending(b => b.CreateAt);
            }

            var skip = (request.PageNumber - 1) * request.PageSize;
            var raw = await query.Skip(skip).Take(request.PageSize)
                .Select(b => new
                {
                    b.BatchId,
                    b.BatchCode,
                    b.ManufacturingDate,
                    b.ExpiryDate,
                    GoodCode = b.Goods != null ? b.Goods.GoodsCode : null,
                    GoodName = b.Goods != null ? b.Goods.GoodsName : null,
                    Pallets = b.Pallets
                        .Where(p => p.Status == CommonStatus.Active
                            && (!areaId.HasValue || (p.Location != null && p.Location.AreaId == areaId.Value)))
                        .Select(p => new
                        {
                            p.PalletId,
                            PackageQuantity = p.PackageQuantity ?? 0,
                            LocationCode = p.Location != null ? p.Location.LocationCode : null
                        })
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var items = raw.Select(b => new ReportDto.InventoryReportDto
            {
                BatchId = b.BatchId,
                BatchCode = b.BatchCode,
                ManufacturingDate = b.ManufacturingDate,
                ExpiryDate = b.ExpiryDate,
                GoodsCode = b.GoodCode,
                GoodName = b.GoodName,
                PalletIds = b.Pallets.Select(p => p.PalletId.ToString()).Where(id => id != null).ToList(),
                TotalPackageQuantity = b.Pallets.Sum(p => p.PackageQuantity),
                LocationCodes = b.Pallets.Select(p => p.LocationCode).Where(l => l != null).Distinct().ToList()
            }).ToList();

            return new PageResult<ReportDto.InventoryReportDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }

        public async Task<ReportDto.LocationReportSummaryDto> GetLocationReportAsync(int? areaId = null, CancellationToken cancellationToken = default)
        {
            // If areaId provided, compute only for that area
            if (areaId.HasValue)
            {
                var area = await _context.Areas
                    .Where(a => a.AreaId == areaId.Value && a.Status == CommonStatus.Active)
                    .Select(a => new ReportDto.LocationReportSummaryDto
                    {
                        TotalLocations = a.Locations.Count(l => l.Status == CommonStatus.Active),
                        AvailableLocationCount = a.Locations.Count(l => l.Status == CommonStatus.Active && l.IsAvailable == true),
                        AreaDetails = new List<ReportDto.LocationReportDto>
                        {
                            new ReportDto.LocationReportDto
                            {
                                AreaId = a.AreaId,
                                AreaName = a.AreaName,
                                TotalLocations = a.Locations.Count(l => l.Status == CommonStatus.Active),
                                AvailableLocationCount = a.Locations.Count(l => l.Status == CommonStatus.Active && l.IsAvailable == true)
                            }
                        }
                    })
                    .AsNoTracking()
                    .FirstOrDefaultAsync(cancellationToken);

                return area ?? new ReportDto.LocationReportSummaryDto();
            }

            // Otherwise compute summary across all active areas
            var areas = await _context.Areas
                .Where(a => a.Status == CommonStatus.Active)
                .Select(a => new ReportDto.LocationReportDto
                {
                    AreaId = a.AreaId,
                    AreaName = a.AreaName,
                    TotalLocations = a.Locations.Count(l => l.Status == CommonStatus.Active),
                    AvailableLocationCount = a.Locations.Count(l => l.Status == CommonStatus.Active && l.IsAvailable == true)
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var summary = new ReportDto.LocationReportSummaryDto
            {
                AreaDetails = areas,
                TotalLocations = areas.Sum(x => x.TotalLocations),
                AvailableLocationCount = areas.Sum(x => x.AvailableLocationCount)
            };

            return summary;
        }

        public async Task<List<ReportDto.SaleBySupplierReportDto>> GetSaleBySupplierReportAsync(int? supplierId, CancellationToken cancellationToken = default)
        {
            var sodQuery = _context.SalesOrderDetails
                .AsNoTracking()
                .AsQueryable();

            if (supplierId.HasValue)
                sodQuery = sodQuery.Where(sod => sod.Goods != null && sod.Goods.SupplierId == supplierId.Value);

            sodQuery = sodQuery.Where(sod => sod.GoodsId != null);

            var grouped = await sodQuery
                .GroupBy(sod => new { GoodId = sod.GoodsId.Value, GoodsPackingId = sod.GoodsPackingId })
                .Select(g => new
                {
                    GoodId = g.Key.GoodId,
                    GoodsPackingId = g.Key.GoodsPackingId,
                    TotalPackages = g.Sum(x => x.PackageQuantity ?? 0)
                })
                .ToListAsync(cancellationToken);

            if (grouped == null || grouped.Count == 0)
                return new List<ReportDto.SaleBySupplierReportDto>();

            var goodsIds = grouped.Select(g => g.GoodId).Distinct().ToList();
            var packingIds = grouped.Where(g => g.GoodsPackingId.HasValue).Select(g => g.GoodsPackingId.Value).Distinct().ToList();

            var goodsDict = await _context.Goods
                .Where(g => goodsIds.Contains(g.GoodsId))
                .Include(g => g.Supplier)
                .ToDictionaryAsync(g => g.GoodsId, cancellationToken);

            var packingDict = packingIds.Any()
                ? await _context.Set<GoodsPacking>().Where(p => packingIds.Contains(p.GoodsPackingId)).ToDictionaryAsync(p => p.GoodsPackingId, cancellationToken)
                : new Dictionary<int, GoodsPacking>();

            var result = grouped.Select(g =>
            {
                goodsDict.TryGetValue(g.GoodId, out var good);
                packingDict.TryGetValue(g.GoodsPackingId ?? 0, out var packing);

                return new ReportDto.SaleBySupplierReportDto
                {
                    SupplierId = good?.SupplierId ?? 0,
                    CompanyName = good?.Supplier?.CompanyName,
                    GoodsId = g.GoodId,
                    GoodCode = good?.GoodsCode,
                    GoodName = good?.GoodsName,
                    GoodsPackingId = g.GoodsPackingId ?? 0,
                    UnitPerPackage = packing?.UnitPerPackage.HasValue == true ? packing.UnitPerPackage.Value.ToString() : null,
                    totalPackagesSold = g.TotalPackages
                };
            }).ToList();

            return result;
        }
    }
}