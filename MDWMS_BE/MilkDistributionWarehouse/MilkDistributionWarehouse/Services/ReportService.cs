using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IReportService
    {
        Task<(string, List<ReportDto.InventoryReportDto>)> GetInventoryReportAsync(CancellationToken cancellationToken = default);
    }

    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;

        public ReportService(IReportRepository reportRepository)
        {
            _reportRepository = reportRepository;
        }

        public async Task<(string, List<ReportDto.InventoryReportDto>)> GetInventoryReportAsync(CancellationToken cancellationToken = default)
        {
            var data = await _reportRepository.GetInventoryReportAsync(cancellationToken);

            if (data == null || !data.Any())
                return ("No inventory data found.".ToMessageForUser(), new List<ReportDto.InventoryReportDto>());

            return ("", data);
        }
    }
}