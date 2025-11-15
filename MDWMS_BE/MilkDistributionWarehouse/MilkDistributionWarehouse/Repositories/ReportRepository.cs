using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
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
        Task<PageResult<ReportDto.GoodsReceiptReportDto>> GetGoodsReceiptReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
        Task<PageResult<ReportDto.GoodIssueReportDto>> GetGoodsIssueReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    }

    public class ReportRepository : IReportRepository
    {
        private readonly WarehouseContext _context;
        private readonly IMapper _mapper;

        public ReportRepository(WarehouseContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PageResult<ReportDto.InventoryReportDto>> GetInventoryReportAsync(PagedRequest request, int? areaId = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Batchs
                .Include(b => b.Goods)
                    .ThenInclude(g => g.UnitMeasure) // <- ensure UnitMeasure is loaded
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
                        query = request.SortAscending ? query.OrderBy(b => b.ExpiryDate) : request.SortAscending ? query.OrderBy(b => b.ExpiryDate) : query.OrderByDescending(b => b.ExpiryDate);
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
                    UnitMeasureName = b.Goods != null && b.Goods.UnitMeasure != null ? b.Goods.UnitMeasure.Name : null,
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
                UnitOfMeasure = b.UnitMeasureName,
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
            
        // NEW: Goods receipt report with paging, filtering & sorting support
        public async Task<PageResult<ReportDto.GoodsReceiptReportDto>> GetGoodsReceiptReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            // Build base query
            var query = _context.GoodsReceiptNoteDetails
                .AsNoTracking()
                .Include(d => d.Goods)
                    .ThenInclude(g => g.UnitMeasure) // <- ensure UnitMeasure is loaded for mapping
                .Include(d => d.GoodsPacking)
                .Include(d => d.GoodsReceiptNote)
                    .ThenInclude(grn => grn.PurchaseOder)
                        .ThenInclude(po => po.Supplier)
                .AsQueryable();

            query = query.Where(d => d.GoodsReceiptNote != null && d.GoodsReceiptNote.Status == GoodsReceiptNoteStatus.Completed);

            if (fromDate.HasValue)
            {
                var from = fromDate.Value.Date;
                query = query.Where(d => d.GoodsReceiptNote.CreatedAt >= from);
            }

            if (toDate.HasValue)
            {
                var to = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(d => d.GoodsReceiptNote.CreatedAt <= to);
            }

            var details = await query.ToListAsync(cancellationToken);

            var mapped = _mapper.Map<List<ReportDto.GoodsReceiptReportDto>>(details);

            if (mapped == null || mapped.Count == 0)
                return new PageResult<ReportDto.GoodsReceiptReportDto>
                {
                    Items = new List<ReportDto.GoodsReceiptReportDto>(),
                    TotalCount = 0,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

            // group by Supplier + Goods + Packing + ReceiptDate.Date
            var grouped = mapped
                .GroupBy(d => new { d.SupplierId, d.GoodsId, d.GoodsPackingId, ReceiptDate = d.ReceiptDate?.Date })
                .Select(g => new ReportDto.GoodsReceiptReportDto
                {
                    SupplierId = g.Key.SupplierId,
                    SupplierName = g.Select(x => x.SupplierName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    GoodsId = g.Key.GoodsId,
                    GoodsCode = g.Select(x => x.GoodsCode).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    GoodsName = g.Select(x => x.GoodsName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    GoodsPackingId = Convert.ToInt32(g.Key.GoodsPackingId),
                    UnitPerPackage = g.Select(x => x.UnitPerPackage).FirstOrDefault(p => p.HasValue),
                    ReceiptDate = g.Key.ReceiptDate,
                    TotalPackageQuantity = g.Sum(x => x.TotalPackageQuantity),
                    TotalUnitQuantity = g.Sum(x => x.TotalUnitQuantity),
                    UnitOfMeasure = g.Select(x => x.UnitOfMeasure).FirstOrDefault(u => !string.IsNullOrEmpty(u))
                })
                .ToList();

            if (request.Filters != null && request.Filters.Count > 0)
            {
                foreach (var f in request.Filters)
                {
                    var key = f.Key?.Trim();
                    var val = f.Value?.Trim();
                    if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(val))
                        continue;

                    switch (key.ToLowerInvariant())
                    {
                        case "supplierid":
                            if (int.TryParse(val, out var supId))
                                grouped = grouped.Where(r => r.SupplierId == supId).ToList();
                            break;
                        case "goodsid":
                            if (int.TryParse(val, out var gId))
                                grouped = grouped.Where(r => r.GoodsId == gId).ToList();
                            break;
                        case "goodscode":
                            grouped = grouped.Where(r => !string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(val, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                            break;
                        case "goodsname":
                            grouped = grouped.Where(r => !string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(val, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                            break;
                        case "goodspackingid":
                            if (int.TryParse(val, out var packId))
                                grouped = grouped.Where(r => r.GoodsPackingId == packId).ToList();
                            break;
                        case "receiptdate":
                            if (val.Contains("~"))
                            {
                                var parts = val.Split('~', StringSplitOptions.RemoveEmptyEntries);
                                if (parts.Length == 2 && DateTime.TryParse(parts[0], out var sdt) && DateTime.TryParse(parts[1], out var edt))
                                {
                                    var sd = sdt.Date;
                                    var ed = edt.Date;
                                    grouped = grouped.Where(r => r.ReceiptDate.HasValue && r.ReceiptDate.Value.Date >= sd && r.ReceiptDate.Value.Date <= ed).ToList();
                                }
                            }
                            else if (DateTime.TryParse(val, out var singleDate))
                            {
                                var sd = singleDate.Date;
                                grouped = grouped.Where(r => r.ReceiptDate.HasValue && r.ReceiptDate.Value.Date == sd).ToList();
                            }
                            break;
                    }
                }
            }

            // Global search
            if (!string.IsNullOrEmpty(request.Search))
            {
                var s = request.Search.Trim();
                grouped = grouped.Where(r =>
                    (!string.IsNullOrEmpty(r.SupplierName) && r.SupplierName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                ).ToList();
            }

            // Sorting - support common fields
            if (!string.IsNullOrEmpty(request.SortField))
            {
                var sf = request.SortField.Trim();
                var asc = request.SortAscending;
                grouped = sf switch
                {
                    "ReceiptDate" => asc ? grouped.OrderBy(r => r.ReceiptDate).ToList() : grouped.OrderByDescending(r => r.ReceiptDate).ToList(),
                    "SupplierName" => asc ? grouped.OrderBy(r => r.SupplierName).ToList() : grouped.OrderByDescending(r => r.SupplierName).ToList(),
                    "GoodsCode" => asc ? grouped.OrderBy(r => r.GoodsCode).ToList() : grouped.OrderByDescending(r => r.GoodsCode).ToList(),
                    "TotalPackageQuantity" => asc ? grouped.OrderBy(r => r.TotalPackageQuantity).ToList() : grouped.OrderByDescending(r => r.TotalPackageQuantity).ToList(),
                    _ => grouped.OrderBy(r => r.ReceiptDate).ThenBy(r => r.SupplierId).ThenBy(r => r.GoodsId).ToList()
                };
            }
            else
            {
                grouped = grouped.OrderBy(r => r.ReceiptDate).ThenBy(r => r.SupplierId).ThenBy(r => r.GoodsId).ToList();
            }

            var totalCount = grouped.Count;
            var pageNumber = Math.Max(1, request.PageNumber);
            var pageSize = Math.Max(1, request.PageSize);
            var skip = (pageNumber - 1) * pageSize;
            var items = grouped.Skip(skip).Take(pageSize).ToList();

            return new PageResult<ReportDto.GoodsReceiptReportDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        // NEW: Goods Issue report implementation
        public async Task<PageResult<ReportDto.GoodIssueReportDto>> GetGoodsIssueReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            var query = _context.GoodsIssueNoteDetails
                .AsNoTracking()
                .Include(d => d.Goods)
                    .ThenInclude(g => g.Supplier)
                .Include(d => d.Goods)
                    .ThenInclude(g => g.UnitMeasure) // <- ensure UnitMeasure is loaded for issue report
                .Include(d => d.GoodsPacking)
                .Include(d => d.GoodsIssueNote)
                    .ThenInclude(gin => gin.SalesOder)
                        .ThenInclude(so => so.Retailer)
                .AsQueryable();

            // Only completed issue notes
            query = query.Where(d => d.GoodsIssueNote != null && d.GoodsIssueNote.Status == GoodsIssueNoteStatus.Completed);

            if (fromDate.HasValue)
            {
                var from = fromDate.Value.Date;
                query = query.Where(d => d.GoodsIssueNote.CreatedAt >= from);
            }

            if (toDate.HasValue)
            {
                var to = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(d => d.GoodsIssueNote.CreatedAt <= to);
            }

            var details = await query.ToListAsync(cancellationToken);

            if (details == null || details.Count == 0)
            {
                return new PageResult<ReportDto.GoodIssueReportDto>
                {
                    Items = new List<ReportDto.GoodIssueReportDto>(),
                    TotalCount = 0,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };
            }

            // Map to DTO list
            var mapped = details.Select(d =>
            {
                var unitPerPackage = d.GoodsPacking?.UnitPerPackage;
                var issuedPackageQty = 0;

                // prefer IssuedQuantity if present; fallback to PackageQuantity or 0
                var prop = d.GetType().GetProperty("IssuedQuantity");
                if (prop != null)
                {
                    var v = prop.GetValue(d);
                    if (v != null)
                    {
                        if (v is int iv) issuedPackageQty = iv;
                        else
                        {
                            try
                            {
                                issuedPackageQty = Convert.ToInt32(v);
                            }
                            catch
                            {
                                issuedPackageQty = 0;
                            }
                        }
                    }
                }
                else
                {
                    // fallback: try PackageQuantity if model has it
                    var pprop = d.GetType().GetProperty("PackageQuantity");
                    if (pprop != null)
                    {
                        var pv = pprop.GetValue(d);
                        if (pv != null)
                        {
                            if (pv is int piv) issuedPackageQty = piv;
                            else
                            {
                                try
                                {
                                    issuedPackageQty = Convert.ToInt32(pv);
                                }
                                catch
                                {
                                    issuedPackageQty = 0;
                                }
                            }
                        }
                    }
                }

                var totalUnits = issuedPackageQty * (unitPerPackage ?? 1);

                return new ReportDto.GoodIssueReportDto
                {
                    SupplierId = d.Goods?.SupplierId ?? 0,
                    SupplierName = d.Goods?.Supplier?.CompanyName,
                    RetailerId = d.GoodsIssueNote?.SalesOder?.RetailerId ?? 0,
                    RetailerName = d.GoodsIssueNote?.SalesOder?.Retailer?.RetailerName,
                    GoodsId = (int)d.GoodsId,
                    GoodsCode = d.Goods?.GoodsCode,
                    GoodsName = d.Goods?.GoodsName,
                    UnitOfMeasure = d.Goods?.UnitMeasure?.Name,
                    GoodsPackingId = d.GoodsPackingId ?? 0,
                    UnitPerPackage = d.GoodsPacking?.UnitPerPackage,
                    IssueDate = d.GoodsIssueNote?.CreatedAt,
                    TotalPackageQuantity = issuedPackageQty,
                    TotalUnitQuantity = totalUnits
                };
            }).ToList();

            // Group by Retailer + Supplier + Goods + Packing + IssueDate.Date
            var grouped = mapped
                .GroupBy(d => new { d.RetailerId, d.SupplierId, d.GoodsId, d.GoodsPackingId, IssueDate = d.IssueDate?.Date })
                .Select(g => new ReportDto.GoodIssueReportDto
                {
                    RetailerId = g.Key.RetailerId,
                    RetailerName = g.Select(x => x.RetailerName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    SupplierId = g.Key.SupplierId,
                    SupplierName = g.Select(x => x.SupplierName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    GoodsId = g.Key.GoodsId,
                    GoodsCode = g.Select(x => x.GoodsCode).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    GoodsName = g.Select(x => x.GoodsName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    GoodsPackingId = Convert.ToInt32(g.Key.GoodsPackingId),
                    UnitPerPackage = g.Select(x => x.UnitPerPackage).FirstOrDefault(p => p.HasValue),
                    UnitOfMeasure = g.Select(x => x.UnitOfMeasure).FirstOrDefault(u => !string.IsNullOrEmpty(u)),
                    IssueDate = g.Key.IssueDate,
                    TotalPackageQuantity = g.Sum(x => x.TotalPackageQuantity),
                    TotalUnitQuantity = g.Sum(x => x.TotalUnitQuantity)
                })
                .ToList();

            // Apply filters (supports retailerid, supplierid, goodsid, goodscode, goodsname, goodspackingid, issuedate range)
            if (request.Filters != null && request.Filters.Count > 0)
            {
                foreach (var f in request.Filters)
                {
                    var key = f.Key?.Trim();
                    var val = f.Value?.Trim();
                    if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(val))
                        continue;

                    switch (key.ToLowerInvariant())
                    {
                        case "retailerid":
                            if (int.TryParse(val, out var retId))
                                grouped = grouped.Where(r => r.RetailerId == retId).ToList();
                            break;
                        case "supplierid":
                            if (int.TryParse(val, out var supId))
                                grouped = grouped.Where(r => r.SupplierId == supId).ToList();
                            break;
                        case "goodsid":
                            if (int.TryParse(val, out var gId))
                                grouped = grouped.Where(r => r.GoodsId == gId).ToList();
                            break;
                        case "goodscode":
                            grouped = grouped.Where(r => !string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(val, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                            break;
                        case "goodsname":
                            grouped = grouped.Where(r => !string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(val, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                            break;
                        case "goodspackingid":
                            if (int.TryParse(val, out var packId))
                                grouped = grouped.Where(r => r.GoodsPackingId == packId).ToList();
                            break;
                        case "issuedate":
                            if (val.Contains("~"))
                            {
                                var parts = val.Split('~', StringSplitOptions.RemoveEmptyEntries);
                                if (parts.Length == 2 && DateTime.TryParse(parts[0], out var sdt) && DateTime.TryParse(parts[1], out var edt))
                                {
                                    var sd = sdt.Date;
                                    var ed = edt.Date;
                                    grouped = grouped.Where(r => r.IssueDate.HasValue && r.IssueDate.Value.Date >= sd && r.IssueDate.Value.Date <= ed).ToList();
                                }
                            }
                            else if (DateTime.TryParse(val, out var singleDate))
                            {
                                var sd = singleDate.Date;
                                grouped = grouped.Where(r => r.IssueDate.HasValue && r.IssueDate.Value.Date == sd).ToList();
                            }
                            break;
                    }
                }
            }

            // Global search
            if (!string.IsNullOrEmpty(request.Search))
            {
                var s = request.Search.Trim();
                grouped = grouped.Where(r =>
                    (!string.IsNullOrEmpty(r.RetailerName) && r.RetailerName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.SupplierName) && r.SupplierName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                ).ToList();
            }

            // Sorting support (IssueDate, RetailerName, SupplierName, GoodsCode, TotalPackageQuantity)
            if (!string.IsNullOrEmpty(request.SortField))
            {
                var sf = request.SortField.Trim();
                var asc = request.SortAscending;
                grouped = sf switch
                {
                    "IssueDate" => asc ? grouped.OrderBy(r => r.IssueDate).ToList() : grouped.OrderByDescending(r => r.IssueDate).ToList(),
                    "RetailerName" => asc ? grouped.OrderBy(r => r.RetailerName).ToList() : grouped.OrderByDescending(r => r.RetailerName).ToList(),
                    "SupplierName" => asc ? grouped.OrderBy(r => r.SupplierName).ToList() : grouped.OrderByDescending(r => r.SupplierName).ToList(),
                    "GoodsCode" => asc ? grouped.OrderBy(r => r.GoodsCode).ToList() : grouped.OrderByDescending(r => r.GoodsCode).ToList(),
                    "TotalPackageQuantity" => asc ? grouped.OrderBy(r => r.TotalPackageQuantity).ToList() : grouped.OrderByDescending(r => r.TotalPackageQuantity).ToList(),
                    _ => grouped.OrderBy(r => r.IssueDate).ThenBy(r => r.RetailerId).ThenBy(r => r.GoodsId).ToList()
                };
            }
            else
            {
                grouped = grouped.OrderBy(r => r.IssueDate).ThenBy(r => r.RetailerId).ThenBy(r => r.GoodsId).ToList();
            }

            var totalCount = grouped.Count;
            var pageNumber = Math.Max(1, request.PageNumber);
            var pageSize = Math.Max(1, request.PageSize);
            var skip2 = (pageNumber - 1) * pageSize;
            var items = grouped.Skip(skip2).Take(pageSize).ToList();

            return new PageResult<ReportDto.GoodIssueReportDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
    }
}