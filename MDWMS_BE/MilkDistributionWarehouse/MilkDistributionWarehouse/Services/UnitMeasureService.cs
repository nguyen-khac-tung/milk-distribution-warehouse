using AutoMapper;
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
        Task<(string, UnitMeasureDto)> CreateUnitMeasure(UnitMeasureCreate unitMeasureCreate);
        Task<(string, UnitMeasureDto)> UpdateUnitMeasure(UnitMeasureUpdate unitMeasureUpdate);
        Task<(string, UnitMeasureDto)> DeleteUnitMeasure(int unitMeasureId);
    }
    public class UnitMeasureService : IUnitMeasureService
    {
        private readonly IUnitMeasureRepository _unitMeasureRepository;
        private readonly IMapper _mapper;
        public UnitMeasureService(IUnitMeasureRepository unitMeasureRepository, IMapper mapper)
        {
            _unitMeasureRepository = unitMeasureRepository;
            _mapper = mapper;
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


            var resultUnitMeasures = _mapper.Map<List<UnitMeasureDto>>(unitMeasures);


            return ("", resultUnitMeasures);
        }

        public async Task<(string, UnitMeasureDto)> CreateUnitMeasure(UnitMeasureCreate unitMeasureCreate)
        {
            if (unitMeasureCreate == null)
                return ("Unit measure is null.", new UnitMeasureDto());
            
            if (await _unitMeasureRepository.IsDuplicationUnitMeasureName(unitMeasureCreate.Name))
                return ("Unit measure name is existed", new UnitMeasureDto());

            if (ContainsSpecialCharacters(unitMeasureCreate.Name))
                return ("Unit measure name is invalid", new UnitMeasureDto());

            var unitMeasure = _mapper.Map<UnitMeasure>(unitMeasureCreate);

            var createResult = await _unitMeasureRepository.CreateUnitMeasures(unitMeasure);
            if (createResult == null)
                return ("Create unit measure is failed", new UnitMeasureDto());

            return ("", _mapper.Map<UnitMeasureDto>(unitMeasure));

        }

        public async Task<(string, UnitMeasureDto)> UpdateUnitMeasure(UnitMeasureUpdate unitMeasureUpdate)
        {
            if (unitMeasureUpdate == null) return ("Unit Measure update is null", new UnitMeasureDto());
            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(unitMeasureUpdate.UnitMeasureId);
            if (unitMeasureExist == null)
                return ("Unit Measure is not exist", new UnitMeasureDto());

            if (await _unitMeasureRepository.IsDuplicatioByIdAndName(unitMeasureUpdate.UnitMeasureId, unitMeasureUpdate.Name))
                return ("Unit Measure name is exist", new UnitMeasureDto());

            if (ContainsSpecialCharacters(unitMeasureUpdate.Name))
                return ("Unit Measure name is invalid", new UnitMeasureDto());

            _mapper.Map(unitMeasureUpdate, unitMeasureExist);

            var updateResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);
            if (updateResult == null) 
                return ("Update unit measure is failed", new UnitMeasureDto());

            return ("", _mapper.Map<UnitMeasureDto>(unitMeasureExist));
        }

        public async Task<(string, UnitMeasureDto)> DeleteUnitMeasure(int unitMeasureId)
        {
            if (unitMeasureId == 0)
                return ("UnitMeasureId is invalid", new UnitMeasureDto());

            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(unitMeasureId);

            if (unitMeasureExist == null)
                return ("Unit measure is not exist", new UnitMeasureDto());

            if (await _unitMeasureRepository.IsUnitMeasureContainingGoods(unitMeasureId))
                return ("Cannot delete, unit measure is in use", new UnitMeasureDto());

            unitMeasureExist.Status = CommonStatus.Deleted;
            unitMeasureExist.UpdateAt = DateTime.Now;

            var deleteResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);
            if (deleteResult == null)
                return ("Delete unit measure is failed", new UnitMeasureDto());

            return ("", _mapper.Map<UnitMeasureDto>(deleteResult));
        }


        private bool ContainsSpecialCharacters(string input)
        {
            return input.Any(ch => !char.IsLetterOrDigit(ch) && !char.IsWhiteSpace(ch));
        }
    }
}
