using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IUnitMeasureService
    {
        Task<(string, List<UnitMeasureDto>)> GetUnitMeasure(Filter filter);
    }
    public class UnitMeasureService : IUnitMeasureService
    {
        private readonly IUnitMeasureRepository _unitMeasureRepository;
        public UnitMeasureService(IUnitMeasureRepository unitMeasureRepository)
        {
            _unitMeasureRepository = unitMeasureRepository;
        }

        public async Task<(string, List<UnitMeasureDto>)> GetUnitMeasure(Filter filter)
        {
            var unitMeasures = await _unitMeasureRepository.GetUnitMeasures();

            if (unitMeasures == null || !unitMeasures.Any())
                return ("The list unit measure is null", new List<UnitMeasureDto>());

            var search = filter?.Search?.Trim().ToLower();

            if (!string.IsNullOrEmpty(search))
                unitMeasures = unitMeasures.Where(um => um.Name.ToLower().Trim().Contains(search)
                                                || um.Description.ToLower().Trim().Contains(search)).ToList();
            if (filter?.Status != null)
                unitMeasures = unitMeasures.Where(um => um.Status == filter.Status).ToList();


            var resultUnitMeasures = unitMeasures.Select(um => new UnitMeasureDto
            {
                Name = um.Name,
                Description = um.Description,
                Status = um.Status ?? 0
            }).ToList();

            return ("", resultUnitMeasures);
        }


    }
}
