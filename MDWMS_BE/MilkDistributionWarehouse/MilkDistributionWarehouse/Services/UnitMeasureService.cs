using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IUnitMeasureService
    {
        Task<(string, PageResult<UnitMeasureDto>)> GetUnitMeasure(PagedRequest request);
        Task<(string, UnitMeasureDto)> CreateUnitMeasure(UnitMeasureCreate unitMeasureCreate);
        Task<(string, UnitMeasureDto)> UpdateUnitMeasure(UnitMeasureUpdate unitMeasureUpdate);
        Task<(string, UnitMeasureDto)> DeleteUnitMeasure(int unitMeasureId);
        Task<(string, List<UnitMeasureDropDown>)> GetUnitMeasureDropDown();
        Task<(string, UnitMeasureUpdateStatusDto)> UpdateUnitMeasureStatus(UnitMeasureUpdateStatusDto update);
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

        public async Task<(string, List<UnitMeasureDropDown>)> GetUnitMeasureDropDown()
        {
            var unitMeasures = await _unitMeasureRepository.GetUnitMeasures()
                .Where(u => u.Status == CommonStatus.Active).ToListAsync();

            var unitMeasuresDropDown = _mapper.Map<List<UnitMeasureDropDown>>(unitMeasures);

            if (!unitMeasures.Any())
                return ("Danh sách đơn vị trống.".ToMessageForUser(), new List<UnitMeasureDropDown>());

            return ("", unitMeasuresDropDown);
        }

        public async Task<(string, PageResult<UnitMeasureDto>)> GetUnitMeasure(PagedRequest request)
        {
            var unitMeasures = _unitMeasureRepository.GetUnitMeasures();

            var unitMeasureDtos = unitMeasures.ProjectTo<UnitMeasureDto>(_mapper.ConfigurationProvider);

            var items  = await unitMeasureDtos.ToPagedResultAsync(request);

            if(!items.Items.Any()) 
                return ("Danh sách đơn vị trống.".ToMessageForUser(), new PageResult<UnitMeasureDto> { });

            return ("", items);
        }

        public async Task<(string, UnitMeasureDto)> CreateUnitMeasure(UnitMeasureCreate unitMeasureCreate)
        {
            if (unitMeasureCreate == null)
                return ("Unit measure is null.", new UnitMeasureDto());
            
            if (await _unitMeasureRepository.IsDuplicationUnitMeasureName(null, unitMeasureCreate.Name))
                return ("Tên đơn vị đã tồn tại trong hệ thống".ToMessageForUser(), new UnitMeasureDto());

            var unitMeasure = _mapper.Map<UnitMeasure>(unitMeasureCreate);

            var createResult = await _unitMeasureRepository.CreateUnitMeasures(unitMeasure);
            if (createResult == null)
                return ("Thêm đơn vị mới thất bại".ToMessageForUser(), new UnitMeasureDto());

            return ("", _mapper.Map<UnitMeasureDto>(unitMeasure));
        }

        public async Task<(string, UnitMeasureDto)> UpdateUnitMeasure(UnitMeasureUpdate unitMeasureUpdate)
        {
            if (unitMeasureUpdate == null) return ("Unit Measure update is null", new UnitMeasureDto());

            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(unitMeasureUpdate.UnitMeasureId);

            if (unitMeasureExist == null)
                return ("Unit Measure is not exist", new UnitMeasureDto());

            if (await _unitMeasureRepository.IsDuplicationUnitMeasureName(unitMeasureUpdate.UnitMeasureId, unitMeasureUpdate.Name))
                return ("Tên đơn vị đã tồn tại trong hệ thống".ToMessageForUser(), new UnitMeasureDto()); 

            var checkUnitMeasureInUse = await _unitMeasureRepository.HasUnitMeasureInUse(unitMeasureUpdate.UnitMeasureId);
            if (checkUnitMeasureInUse)
            {
                if (unitMeasureExist.Name != unitMeasureUpdate.Name)
                    return ("Đơn vị đang được sử dụng, không thể thay đổi tên đơn vị.".ToMessageForUser(), new UnitMeasureDto());
            }

            _mapper.Map(unitMeasureUpdate, unitMeasureExist);

            var updateResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);

            if (updateResult == null) 
                return ("Cập nhật đơn vị thất bại".ToMessageForUser(), new UnitMeasureDto());

            return ("", _mapper.Map<UnitMeasureDto>(unitMeasureExist));
        }

        public async Task<(string, UnitMeasureUpdateStatusDto)> UpdateUnitMeasureStatus(UnitMeasureUpdateStatusDto update)
        {
            if(update.UnitMeasureId <= 0) 
                return ("UnitMeasureId is invalid", new UnitMeasureUpdateStatusDto());

            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(update.UnitMeasureId);

            if (unitMeasureExist == null)
                return ("Unit Measure is not exist", new UnitMeasureUpdateStatusDto());

            if (unitMeasureExist.Status == CommonStatus.Deleted || update.Status == CommonStatus.Deleted)
                return ("Đơn vị đã bị xoá hoặc không thể trạng thái xoá đơn vị".ToMessageForUser(), new UnitMeasureUpdateStatusDto());

            bool isChangingToInactive = unitMeasureExist.Status == CommonStatus.Active
                                    && update.Status == CommonStatus.Inactive;

            if (isChangingToInactive)
            {
                var allGoodsInactive = await _unitMeasureRepository.IsUnitMeasureContainGooddAllInActice(update.UnitMeasureId);

                if (!allGoodsInactive)
                    return ("Đơn vị không thể vô hiệu hoá vì có sản phẩm đang liên kết với đơn vị.".ToMessageForUser(), new UnitMeasureUpdateStatusDto());
            }

            unitMeasureExist.Status = update.Status;
            unitMeasureExist.UpdateAt = DateTimeUtility.Now();
            
            var updateResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);

            if (updateResult == null)
                return ("Cập nhật đơn vị thất bại.".ToMessageForUser(), new UnitMeasureUpdateStatusDto());

            return ("", update);
        }

        public async Task<(string, UnitMeasureDto)> DeleteUnitMeasure(int unitMeasureId)
        {
            if (unitMeasureId == 0)
                return ("UnitMeasureId is invalid", new UnitMeasureDto());

            var unitMeasureExist = await _unitMeasureRepository.GetUnitMeasureById(unitMeasureId);

            if (unitMeasureExist == null)
                return ("Unit measure is not exist", new UnitMeasureDto());

            if (unitMeasureExist.Status == CommonStatus.Deleted)
                return ("Đơn vị đã được xoá trước đó".ToMessageForUser(), new UnitMeasureDto());          

            if (await _unitMeasureRepository.IsUnitMeasureContainingGoods(unitMeasureId))
                return ("Không thể xoá đơn vị này vì đang được liên kết với sản phẩm được sử dụng".ToMessageForUser(), new UnitMeasureDto());

            unitMeasureExist.Status = CommonStatus.Deleted;
            unitMeasureExist.UpdateAt = DateTimeUtility.Now();

            var deleteResult = await _unitMeasureRepository.UpdateUnitMeasure(unitMeasureExist);
            if (deleteResult == null)
                return ("Xoá đơn vị thất bại".ToMessageForUser(), new UnitMeasureDto());

            return ("", _mapper.Map<UnitMeasureDto>(deleteResult));
        }

    }
}
