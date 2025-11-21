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
using static MilkDistributionWarehouse.Models.DTOs.PalletDto;
using static MilkDistributionWarehouse.Models.DTOs.LocationDto;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IReportRepository
    {
        Task<PageResult<ReportDto.InventoryReportDto>> GetInventoryReportAsync(PagedRequest request, int? areaId = null, CancellationToken cancellationToken = default);
        Task<ReportDto.LocationReportSummaryDto> GetLocationReportAsync(int? areaId = null, CancellationToken cancellationToken = default);
        Task<List<ReportDto.SaleBySupplierReportDto>> GetSaleBySupplierReportAsync(int? supplierId, CancellationToken cancellationToken = default);
        Task<PageResult<ReportDto.GoodsReceiptReportDto>> GetGoodsReceiptReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
        Task<PageResult<ReportDto.GoodIssueReportDto>> GetGoodsIssueReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
        Task<PageResult<ReportDto.InventoryLedgerReportDto>> GetInventoryLedgerReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
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
                    .ThenInclude(g => g.UnitMeasure)
                .Include(b => b.Goods)
                    .ThenInclude(g => g.Supplier)
                .Include(b => b.Pallets)
                    .ThenInclude(p => p.Location)
                        .ThenInclude(l => l.Area)
                .Include(b => b.Pallets)
                    .ThenInclude(p => p.GoodsPacking)
                .Where(b => b.Status == CommonStatus.Active && b.Pallets.Any(p => p.Status == CommonStatus.Active));

            if (areaId.HasValue)
            {
                query = query.Where(b => b.Pallets.Any(p => p.Location != null && p.Location.AreaId == areaId.Value));
            }

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

                // New: filter by supplierId when provided in filters
                if (request.Filters.TryGetValue("supplierId", out var supplierId) && !string.IsNullOrWhiteSpace(supplierId))
                {
                    if (int.TryParse(supplierId.Trim(), out var sid))
                    {
                        query = query.Where(b => b.Goods != null && b.Goods.Supplier != null && b.Goods.Supplier.SupplierId == sid);
                    }
                }
            }

            if (!string.IsNullOrEmpty(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(b => b.BatchCode.ToLower().Contains(search)
                    || (b.Goods != null && b.Goods.GoodsCode.ToLower().Contains(search))
                    || (b.Goods != null && b.Goods.GoodsName.ToLower().Contains(search)));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            if (!string.IsNullOrEmpty(request.SortField))
            {
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
                    GoodsId = b.Goods != null ? b.Goods.GoodsId : 0,
                    GoodCode = b.Goods != null ? b.Goods.GoodsCode : null,
                    GoodName = b.Goods != null ? b.Goods.GoodsName : null,
                    UnitMeasureName = b.Goods != null && b.Goods.UnitMeasure != null ? b.Goods.UnitMeasure.Name : null,
                    SupplierId = b.Goods != null && b.Goods.Supplier != null ? b.Goods.Supplier.SupplierId : 0,
                    CompanyName = b.Goods != null && b.Goods.Supplier != null ? b.Goods.Supplier.CompanyName : null,
                    Pallets = b.Pallets
                        .Where(p => p.Status == CommonStatus.Active
                            && (!areaId.HasValue || (p.Location != null && p.Location.AreaId == areaId.Value)))
                        .Select(p => new
                        {
                            p.PalletId,
                            p.GoodsReceiptNoteId,
                            GoodsPackingId = p.GoodsPacking != null ? (int?)p.GoodsPacking.GoodsPackingId : null,
                            UnitPerPackage = p.GoodsPacking != null ? p.GoodsPacking.UnitPerPackage : (int?)null,
                            PackageQuantity = p.PackageQuantity ?? 0,
                            CreateBy = p.CreateBy,
                            CreateByName = p.CreateByNavigation != null ? p.CreateByNavigation.FullName : null,
                            BatchId = p.BatchId,
                            BatchCode = b.BatchCode,
                            GoodsId = p.Batch != null && p.Batch.Goods != null ? p.Batch.Goods.GoodsId : (int?)null,
                            GoodsCode = p.Batch != null && p.Batch.Goods != null ? p.Batch.Goods.GoodsCode : null,
                            GoodsName = p.Batch != null && p.Batch.Goods != null ? p.Batch.Goods.GoodsName : null,
                            LocationId = p.Location != null ? (int?)p.Location.LocationId : null,
                            LocationCode = p.Location != null ? p.Location.LocationCode : null,
                            AreaId = p.Location != null && p.Location.Area != null ? (int?)p.Location.Area.AreaId : null,
                            AreaName = p.Location != null && p.Location.Area != null ? p.Location.Area.AreaName : null,
                            AreaCode = p.Location != null && p.Location.Area != null ? p.Location.Area.AreaCode : null,
                            Rack = p.Location != null ? p.Location.Rack : null,
                            Row = p.Location != null && p.Location.Row.HasValue ? p.Location.Row : (int?)null,
                            Column = p.Location != null && p.Location.Column.HasValue ? p.Location.Column : (int?)null,
                            IsAvailable = p.Location != null && p.Location.IsAvailable.HasValue ? p.Location.IsAvailable : (bool?)null,
                            LocationStatus = p.Location != null ? p.Location.Status : (int?)null,
                            LocationCreatedAt = p.Location != null ? p.Location.CreatedAt : (DateTime?)null,
                            LocationUpdateAt = p.Location != null ? p.Location.UpdateAt : (DateTime?)null,
                            PalletStatus = p.Status
                        })
                })
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var expanded = raw
                .SelectMany(b => b.Pallets.Select(p => new
                {
                    b.BatchId,
                    b.BatchCode,
                    b.ManufacturingDate,
                    b.ExpiryDate,
                    b.GoodsId,
                    b.GoodCode,
                    b.GoodName,
                    b.UnitMeasureName,
                    b.SupplierId,
                    b.CompanyName,
                    PalletId = p.PalletId,
                    p.GoodsReceiptNoteId,
                    GoodsPackingId = p.GoodsPackingId ?? 0,
                    UnitPerPackage = p.UnitPerPackage,
                    p.PackageQuantity,
                    CreateBy = p.CreateBy ?? 0,
                    CreateByName = p.CreateByName,
                    GoodsCode = p.GoodsCode,
                    GoodsName = p.GoodsName,
                    LocationId = p.LocationId ?? 0,
                    LocationCode = p.LocationCode,
                    AreaId = p.AreaId ?? 0,
                    AreaName = p.AreaName,
                    AreaCode = p.AreaCode,
                    Rack = p.Rack,
                    Row = p.Row ?? 0,
                    Column = p.Column ?? 0,
                    IsAvailable = p.IsAvailable ?? false,
                    LocationStatus = p.LocationStatus ?? 0,
                    LocationCreatedAt = p.LocationCreatedAt,
                    LocationUpdateAt = p.LocationUpdateAt,
                    PalletStatus = p.PalletStatus
                }))
                .ToList();

            var grouped = expanded
                .GroupBy(x => new { x.BatchId, x.GoodsPackingId })
                .Select(g => new ReportDto.InventoryReportDto
                {
                    BatchId = g.Key.BatchId,
                    BatchCode = g.Select(x => x.BatchCode).FirstOrDefault(),
                    ManufacturingDate = g.Select(x => x.ManufacturingDate).FirstOrDefault(),
                    ExpiryDate = g.Select(x => x.ExpiryDate).FirstOrDefault(),
                    GoodsCode = g.Select(x => x.GoodCode).FirstOrDefault(),
                    GoodName = g.Select(x => x.GoodName).FirstOrDefault(),
                    UnitOfMeasure = g.Select(x => x.UnitMeasureName).FirstOrDefault(),
                    GoodsPackingId = g.Key.GoodsPackingId,
                    UnitPerPackage = g.Select(x => x.UnitPerPackage.HasValue ? x.UnitPerPackage.ToString() : null).FirstOrDefault(u => u != null),
                    SupplierId = g.Select(x => x.SupplierId).FirstOrDefault(),
                    CompanyName = g.Select(x => x.CompanyName).FirstOrDefault(),
                    Pallets = g.Select(p => new PalletResponseDto
                    {
                        PalletId = p.PalletId,
                        GoodsReceiptNoteId = p.GoodsReceiptNoteId,
                        GoodsPackingId = p.GoodsPackingId,
                        UnitPerPackage = p.UnitPerPackage,
                        PackageQuantity = p.PackageQuantity,
                        CreateBy = p.CreateBy,
                        CreateByName = p.CreateByName,
                        BatchId = p.BatchId,
                        BatchCode = p.BatchCode,
                        GoodId = p.GoodsId,
                        GoodName = p.GoodsName,
                        GoodCode = p.GoodsCode,
                        LocationId = p.LocationId,
                        LocationCode = p.LocationCode,
                    }).ToList(),
                    TotalPackageQuantity = g.Sum(x => x.PackageQuantity),
                    Locations = g.Select(x => new LocationResponseDto
                    {
                        LocationId = x.LocationId,
                        LocationCode = x.LocationCode,
                        AreaId = x.AreaId,
                        AreaName = x.AreaName,
                        AreaCode = x.AreaCode,
                        Rack = x.Rack,
                        Row = x.Row,
                        Column = x.Column,
                        IsAvailable = x.IsAvailable,
                        Status = x.LocationStatus,
                        CreatedAt = x.LocationCreatedAt,
                        UpdateAt = x.LocationUpdateAt
                    }).Where(l => !string.IsNullOrEmpty(l.LocationCode)).GroupBy(l => l.LocationCode).Select(gl => gl.First()).ToList()
                })
                .ToList();

            return new PageResult<ReportDto.InventoryReportDto>
            {
                Items = grouped,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }

        public async Task<ReportDto.LocationReportSummaryDto> GetLocationReportAsync(int? areaId = null, CancellationToken cancellationToken = default)
        {
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

        public async Task<PageResult<ReportDto.GoodsReceiptReportDto>> GetGoodsReceiptReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            var query = _context.GoodsReceiptNoteDetails
                .AsNoTracking()
                .Include(d => d.Goods)
                    .ThenInclude(g => g.UnitMeasure)
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

            // Ensure PurchaseOderId is populated from related entities when AutoMapper didn't map it
            if (mapped != null && mapped.Count > 0 && details != null && details.Count == mapped.Count)
            {
                for (int i = 0; i < mapped.Count; i++)
                {
                    if (string.IsNullOrEmpty(mapped[i].PurchaseOderId))
                    {
                        mapped[i].PurchaseOderId = details[i].GoodsReceiptNote?.PurchaseOder?.PurchaseOderId;
                    }

                    // Also ensure SupplierId/SupplierName are populated when possible
                    if ((mapped[i].SupplierId == 0 || string.IsNullOrEmpty(mapped[i].SupplierName)) && details[i].GoodsReceiptNote?.PurchaseOder?.Supplier != null)
                    {
                        mapped[i].SupplierId = details[i].GoodsReceiptNote.PurchaseOder.Supplier.SupplierId;
                        mapped[i].SupplierName = details[i].GoodsReceiptNote.PurchaseOder.Supplier.CompanyName;
                    }
                }
            }

            if (mapped == null || mapped.Count == 0)
                return new PageResult<ReportDto.GoodsReceiptReportDto>
                {
                    Items = new List<ReportDto.GoodsReceiptReportDto>(),
                    TotalCount = 0,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

            var grouped = mapped
                .GroupBy(d => new { d.SupplierId, d.GoodsId, d.GoodsPackingId, ReceiptDate = d.ReceiptDate?.Date })
                .Select(g => new ReportDto.GoodsReceiptReportDto
                {
                    SupplierId = g.Key.SupplierId,
                    SupplierName = g.Select(x => x.SupplierName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    PurchaseOderId = g.Select(x => x.PurchaseOderId).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
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

            if (!string.IsNullOrEmpty(request.Search))
            {
                var s = request.Search.Trim();
                grouped = grouped.Where(r =>
                    (!string.IsNullOrEmpty(r.SupplierName) && r.SupplierName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                    || (!string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                ).ToList();
            }

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

        public async Task<PageResult<ReportDto.GoodIssueReportDto>> GetGoodsIssueReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            var query = _context.GoodsIssueNoteDetails
                .AsNoTracking()
                .Include(d => d.Goods)
                    .ThenInclude(g => g.Supplier)
                .Include(d => d.Goods)
                    .ThenInclude(g => g.UnitMeasure)
                .Include(d => d.GoodsPacking)
                .Include(d => d.GoodsIssueNote)
                    .ThenInclude(gin => gin.SalesOder)
                        .ThenInclude(so => so.Retailer)
                .AsQueryable();

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

            var mapped = details.Select(d =>
            {
                var unitPerPackage = d.GoodsPacking?.UnitPerPackage;
                var issuedPackageQty = 0;

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
                    // include SalesOderId so grouping can pick it up
                    SalesOderId = d.GoodsIssueNote?.SalesOder?.SalesOrderId,
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

            var grouped = mapped
                .GroupBy(d => new { d.RetailerId, d.SupplierId, d.GoodsId, d.GoodsPackingId, IssueDate = d.IssueDate?.Date })
                .Select(g => new ReportDto.GoodIssueReportDto
                {
                    RetailerId = g.Key.RetailerId,
                    RetailerName = g.Select(x => x.RetailerName).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
                    SalesOderId = g.Select(x => x.SalesOderId).FirstOrDefault(s => !string.IsNullOrEmpty(s)),
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

        public async Task<PageResult<ReportDto.InventoryLedgerReportDto>> GetInventoryLedgerReportAsync(PagedRequest request, DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            // normalize dates
            if (!fromDate.HasValue && !toDate.HasValue)
            {
                var now = DateTime.Now;
                fromDate = new DateTime(now.Year, now.Month, 1);
                toDate = now;
            }

            var from = fromDate.Value.Date;
            var to = toDate.Value.Date.AddDays(1).AddTicks(-1);

            // load relevant ledger records (including related goods and packing for labels)
            var ledgers = await _context.InventoryLedgers
                .AsNoTracking()
                .Include(l => l.Goods)
                    .ThenInclude(g => g.UnitMeasure)
                .Include(l => l.GoodPacking)
                .ToListAsync(cancellationToken);

            var grouped = ledgers
                .GroupBy(l => new { l.GoodsId, l.GoodPackingId })
                .Select(g =>
                {
                    var goods = g.Select(x => x.Goods).FirstOrDefault();
                    var packing = g.Select(x => x.GoodPacking).FirstOrDefault();

                    var before = g.Where(x => x.EventDate.HasValue && x.EventDate.Value < from)
                                  .OrderByDescending(x => x.EventDate)
                                  .FirstOrDefault();
                    var beginning = before?.BalanceAfter ?? 0;

                    var inSum = g.Where(x => x.EventDate.HasValue && x.EventDate.Value >= from && x.EventDate.Value <= to)
                                 .Sum(x => x.InQty ?? 0);

                    var outSum = g.Where(x => x.EventDate.HasValue && x.EventDate.Value >= from && x.EventDate.Value <= to)
                                  .Sum(x => x.OutQty ?? 0);

                    var endingRec = g.Where(x => x.EventDate.HasValue && x.EventDate.Value <= to)
                                     .OrderByDescending(x => x.EventDate)
                                     .FirstOrDefault();
                    var ending = endingRec?.BalanceAfter ?? (beginning + inSum - outSum);

                    return new ReportDto.InventoryLedgerReportDto
                    {
                        GoodsId = g.Key.GoodsId,
                        GoodsCode = goods?.GoodsCode,
                        GoodsName = goods?.GoodsName,
                        UnitOfMeasure = goods?.UnitMeasure?.Name,
                        GoodPackingId = g.Key.GoodPackingId,
                        UnitPerPackage = packing?.UnitPerPackage,
                        BeginningInventoryPackages = beginning,
                        InQuantityPackages = inSum,
                        OutQuantityPackages = outSum,
                        EndingInventoryPackages = ending
                    };
                })
                .ToList();

            // Apply filters from request
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
                            if (int.TryParse(val, out var sid))
                                grouped = grouped.Where(r => r != null && r.GoodsId != 0 && (_context.Goods.Any(g => g.GoodsId == r.GoodsId && g.SupplierId == sid))).ToList();
                            break;
                        case "goodsid":
                            if (int.TryParse(val, out var gid))
                                grouped = grouped.Where(r => r.GoodsId == gid).ToList();
                            break;
                        case "goodscode":
                            grouped = grouped.Where(r => !string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(val, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                            break;
                        case "goodsname":
                            grouped = grouped.Where(r => !string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(val, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
                            break;
                        case "goodspackingid":
                            if (int.TryParse(val, out var packId))
                                grouped = grouped.Where(r => r.GoodPackingId == packId).ToList();
                            break;
                    }
                }
            }

            if (!string.IsNullOrEmpty(request.Search))
            {
                var s = request.Search.Trim();
                grouped = grouped.Where(r => (!string.IsNullOrEmpty(r.GoodsCode) && r.GoodsCode.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)
                                             || (!string.IsNullOrEmpty(r.GoodsName) && r.GoodsName.IndexOf(s, StringComparison.OrdinalIgnoreCase) >= 0)).ToList();
            }

            // Sorting
            if (!string.IsNullOrEmpty(request.SortField))
            {
                var sf = request.SortField.Trim();
                var asc = request.SortAscending;
                grouped = sf switch
                {
                    "GoodsCode" => asc ? grouped.OrderBy(r => r.GoodsCode).ToList() : grouped.OrderByDescending(r => r.GoodsCode).ToList(),
                    "GoodsName" => asc ? grouped.OrderBy(r => r.GoodsName).ToList() : grouped.OrderByDescending(r => r.GoodsName).ToList(),
                    "BeginningInventoryPackages" => asc ? grouped.OrderBy(r => r.BeginningInventoryPackages).ToList() : grouped.OrderByDescending(r => r.BeginningInventoryPackages).ToList(),
                    "InQuantityPackages" => asc ? grouped.OrderBy(r => r.InQuantityPackages).ToList() : grouped.OrderByDescending(r => r.InQuantityPackages).ToList(),
                    "OutQuantityPackages" => asc ? grouped.OrderBy(r => r.OutQuantityPackages).ToList() : grouped.OrderByDescending(r => r.OutQuantityPackages).ToList(),
                    "EndingInventoryPackages" => asc ? grouped.OrderBy(r => r.EndingInventoryPackages).ToList() : grouped.OrderByDescending(r => r.EndingInventoryPackages).ToList(),
                    _ => grouped.OrderBy(r => r.GoodsId).ToList()
                };
            }
            else
            {
                grouped = grouped.OrderBy(r => r.GoodsId).ToList();
            }

            var total = grouped.Count;
            var pageNumber = Math.Max(1, request.PageNumber);
            var pageSize = Math.Max(1, request.PageSize);
            var skip2 = (pageNumber - 1) * pageSize;
            var items = grouped.Skip(skip2).Take(pageSize).ToList();

            return new PageResult<ReportDto.InventoryLedgerReportDto>
            {
                Items = items,
                TotalCount = total,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
    }
}