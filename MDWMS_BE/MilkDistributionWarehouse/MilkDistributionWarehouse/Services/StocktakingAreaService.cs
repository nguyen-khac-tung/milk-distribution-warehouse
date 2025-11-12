using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingAreaService
    {
        Task<(string, StocktakingAreaDetailDto?)> GetStocktakingAreaByStocktakingSheetId(Guid stoctakingSheetId);
        Task<(string, StocktakingSheeteResponse?)> CreateStocktakingAreaBulk(Guid stocktakingSheetId, List<StocktakingAreaCreate> creates);
    }
    public class StocktakingAreaService : IStocktakingAreaService
    {
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IAreaRepository _areaRepository;
        private readonly IMapper _mapper;
        public StocktakingAreaService(IStocktakingAreaRepository stocktakingAreaRepository, IAreaRepository areaRepository, IMapper mapper)
        {
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _areaRepository = areaRepository;
            _mapper = mapper;
        }

        public async Task<(string, StocktakingAreaDetailDto?)> GetStocktakingAreaByStocktakingSheetId(Guid stoctakingSheetId)
        {
            if (stoctakingSheetId == Guid.Empty)
                return ("Mã phiếu kiểm kê không hợp lệ.", default);

            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingSheetId(stoctakingSheetId);
            if (stocktakingArea == null)
                return ("Phiếu kiểm kê khu vực không tồn tại.", default);

            var stocktakingAreaMap = _mapper.Map<StocktakingAreaDetailDto>(stocktakingArea);

            return ("", stocktakingAreaMap);
        }

        public async Task<(string, StocktakingSheeteResponse?)> CreateStocktakingAreaBulk(Guid stocktakingSheetId, List<StocktakingAreaCreate> creates)
        {
            if (await _stocktakingAreaRepository.IsCheckStocktakingAreaExist(stocktakingSheetId))
                return ("Phiểu kiểm kê đã tồn tại phân công nhân viên theo khu vực.", default);

            var validationCreateStocktakingArea = await ValidationListStocktakingAreas(creates);
            if(!string.IsNullOrEmpty(validationCreateStocktakingArea))
                return (validationCreateStocktakingArea.ToMessageForUser(), default);

            var stocktakingAreaMaps = _mapper.Map<List<StocktakingArea>>(creates);

            foreach (var item in stocktakingAreaMaps)
            {
                item.StocktakingSheetId = stocktakingSheetId;
            }

            var createResult = await _stocktakingAreaRepository.CreateStocktakingAreaBulk(stocktakingAreaMaps);
            if (createResult == 0)
                return ("Tạo phiếu kiểm kê khu vục thất bại.", default);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetId });
        }

        private async Task<string> ValidationListStocktakingAreas(List<StocktakingAreaCreate> areaCreates)
        {
            if (HasDuplicateAssigneeInSameSheet(areaCreates))
                return "Không thể phân công 2 nhân viên kho cùng 1 khu vực.";

            if (!(await CheckAllAssignAreaStocktaking(areaCreates)))
                return "Còn khu vực chưa được phân công nhân viên kiểm kê.";

            return "";
        }

        private bool HasDuplicateAssigneeInSameSheet(List<StocktakingAreaCreate> areas)
        {
            return areas.GroupBy(sa => sa.AssignTo)
                        .Any(g => g.Count() > 1);
        }

        private async Task<bool> CheckAllAssignAreaStocktaking(List<StocktakingAreaCreate> areaCreates)
        {
            var areas = await _areaRepository.GetActiveAreasAsync();

            return areas.All(area => areaCreates.Any(ac => ac.AreaId == area.AreaId && ac.AssignTo != null));
        }
    }
}
