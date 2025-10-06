using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IUnitMeasureService
    {
        Task<(string, List<UnitMeasureDto>)> GetUnitMeasure(Filter filter);
        Task<string> CreateUnitMeasure(UnitMeasureCreate unitMeasureCreate);
        Task<string> UpdateUnitMeasure(UnitMeasureUpdate unitMeasureUpdate);
        Task<string> DeleteUnitMeasure(int unitMeasureId);
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

        public async Task<string> CreateUnitMeasure(UnitMeasureCreate unitMeasureCreate)
        {
            if (unitMeasureCreate == null)
                return "Unit measure is null.";
            
            if (await _unitMeasureRepository.IsDuplicationUnitMeasureName(unitMeasureCreate.Name))
                return "Unit measure name is existed";

            if (ContainsSpecialCharacters(unitMeasureCreate.Name))
                return "Unit measure name is invalid";

            var unitMeasure = new UnitMeasure
            {
                Name = unitMeasureCreate.Name,
                Description = unitMeasureCreate.Description,
                Status = CommonStatus.Active,
                CreatedAt = DateTime.Now,
                UpdateAt = null
            };

            var createResult = await _unitMeasureRepository.CreateUnitMeasures(unitMeasure);
            if (createResult == 0)
                return "Create unit measure is failed";

            return "";

        }

        public async Task<string> UpdateUnitMeasure(UnitMeasureUpdate unitMeasureUpdate)
        {
            if (unitMeasureUpdate == null) return "Unit Measure update is null";
            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(unitMeasureUpdate.UnitMeasureId);
            if (unitMeasureExist == null)
                return "Unit Measure is not exist";

            if (await _unitMeasureRepository.IsDuplicatioByIdAndName(unitMeasureUpdate.UnitMeasureId, unitMeasureUpdate.Name))
                return "Unit Measure name is exist";

            if (ContainsSpecialCharacters(unitMeasureUpdate.Name))
                return "Unit Measure name is invalid";

            unitMeasureExist.Name = unitMeasureUpdate.Name;
            unitMeasureExist.Description = unitMeasureUpdate.Description;
            unitMeasureExist.Status = unitMeasureUpdate.Status;
            unitMeasureExist.UpdateAt = DateTime.Now;

            var updateResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);
            if (updateResult == 0) return "Update unit measure is failed";

            return "";
        }

        public async Task<string> DeleteUnitMeasure(int unitMeasureId)
        {
            if (unitMeasureId == 0)
                return "UnitMeasureId is invalid";

            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(unitMeasureId);

            if (unitMeasureExist == null)
                return "Unit measure is not exist";

            if (await _unitMeasureRepository.IsUnitMeasureContainingGoods(unitMeasureId))
                return "Cannot delete, unit measure is in use";

            unitMeasureExist.Status = CommonStatus.Deleted;
            unitMeasureExist.UpdateAt = DateTime.Now;

            var deleteResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);
            if (deleteResult == 0)
                return "Delete unit measure is failed";

            return "";
        }


        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }
    }
}
