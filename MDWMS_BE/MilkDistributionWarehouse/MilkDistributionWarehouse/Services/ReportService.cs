using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IReportService
    {
        Task<(string, PageResult<ReportDto.InventoryReportDto>)> GetInventoryReportAsync(PagedRequest request, int? areaId = null, CancellationToken cancellationToken = default);
        Task<(string, ReportDto.LocationReportSummaryDto)> GetLocationReportAsync(int? areaId = null, CancellationToken cancellationToken = default);
        Task<(string, List<ReportDto.SaleBySupplierReportDto>)> GetSaleBySupplierReportAsync(int? supplierId, CancellationToken cancellationToken = default);
        Task<(string, List<ReportDto.GoodsReceiptReportDto>)> GetGoodsReceiptReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default);
    }

    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;

        public ReportService(IReportRepository reportRepository)
        {
            _reportRepository = reportRepository;
        }

        public async Task<(string, PageResult<ReportDto.InventoryReportDto>)> GetInventoryReportAsync(PagedRequest request, int? areaId = null, CancellationToken cancellationToken = default)
        {
            var data = await _reportRepository.GetInventoryReportAsync(request, areaId, cancellationToken);

            if (data == null || data.Items == null || data.Items.Count == 0)
                return ("No inventory data found.".ToMessageForUser(), new PageResult<ReportDto.InventoryReportDto> { Items = new(), TotalCount = 0, PageNumber = request.PageNumber, PageSize = request.PageSize });

            return ("", data);
        }

        public async Task<(string, ReportDto.LocationReportSummaryDto)> GetLocationReportAsync(int? areaId = null, CancellationToken cancellationToken = default)
        {
            var data = await _reportRepository.GetLocationReportAsync(areaId, cancellationToken);
            if (data == null)
                return ("No location data found.".ToMessageForUser(), new ReportDto.LocationReportSummaryDto());
            return ("", data);
        }

        public async Task<(string, List<ReportDto.SaleBySupplierReportDto>)> GetSaleBySupplierReportAsync(int? supplierId, CancellationToken cancellationToken = default)
        {
            var data = await _reportRepository.GetSaleBySupplierReportAsync(supplierId, cancellationToken);

            if (data == null || data.Count == 0)
                return ("No sales data found.".ToMessageForUser(), new List<ReportDto.SaleBySupplierReportDto>());

            return ("", data);
        }

        public async Task<(string, List<ReportDto.GoodsReceiptReportDto>)> GetGoodsReceiptReportAsync(DateTime? fromDate, DateTime? toDate, CancellationToken cancellationToken = default)
        {
            // Default: current month if neither date provided
            if (!fromDate.HasValue && !toDate.HasValue)
            {
                var now = DateTime.Now;
                fromDate = new DateTime(now.Year, now.Month, 1);
                toDate = now;
            }

            var data = await _reportRepository.GetGoodsReceiptReportAsync(fromDate, toDate, cancellationToken);

            if (data == null || data.Count == 0)
                return ("No goods receipt data found.".ToMessageForUser(), new List<ReportDto.GoodsReceiptReportDto>());

            return ("", data);
        }
    }
}