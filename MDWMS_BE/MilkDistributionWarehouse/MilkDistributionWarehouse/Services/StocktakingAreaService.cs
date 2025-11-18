using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingAreaService
    {
        Task<(string, List<StocktakingAreaDetailDto>?)> GetStocktakingAreaByStocktakingSheetId(string stoctakingSheetId, int? userId);
        Task<(string, StocktakingSheeteResponse?)> CreateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaCreate> creates);
        Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaUpdate> updates);
        Task<(string, StocktakingAreaReAssignStatus?)> UpdateStocktakingReAssignTo(StocktakingAreaReAssignStatus update);
        Task<(string, StocktakingAreaResponse?)> UpdateStocktakingAreaStatus<T>(T update) where T : StocktakingAreaUpdateStatus;
        Task<(string, StocktakingAreaApprovalResponse?)> UpdateStocktakingAreaApprovalStatus(StocktakingAreaApprovalStatus update);
    }
    public class StocktakingAreaService : IStocktakingAreaService
    {
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IAreaRepository _areaRepository;
        private readonly IMapper _mapper;
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IStocktakingPalletRepository _stocktakingPalletRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        public StocktakingAreaService(IStocktakingAreaRepository stocktakingAreaRepository, IAreaRepository areaRepository, IMapper mapper,
            IStocktakingLocationRepository stocktakingLocationRepository, IStocktakingPalletRepository stocktakingPalletRepository,
            IStocktakingSheetRepository stocktakingSheetRepository)
        {
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _areaRepository = areaRepository;
            _mapper = mapper;
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _stocktakingPalletRepository = stocktakingPalletRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
        }

        public async Task<(string, List<StocktakingAreaDetailDto>?)> GetStocktakingAreaByStocktakingSheetId(string stoctakingSheetId, int? userId)
        {
            if (string.IsNullOrEmpty(stoctakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.", default);

            var stocktakingArea = new List<StocktakingArea>();

            if (userId.HasValue)
                stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingSheetIdAndAssignTo(stoctakingSheetId, userId.Value);
            else
                stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingSheetIdAndAssignTo(stoctakingSheetId, null);

            if (stocktakingArea == null)
                return ("Phiếu kiểm kê khu vực không tồn tại.", default);

            var stocktakingAreaMap = _mapper.Map<List<StocktakingAreaDetailDto>>(stocktakingArea);

            return ("", stocktakingAreaMap);
        }

        public async Task<(string, StocktakingSheeteResponse?)> CreateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaCreate> creates)
        {
            if (await _stocktakingAreaRepository.IsCheckStocktakingAreaExist(stocktakingSheetId))
                return ("Phiểu kiểm kê đã tồn tại phân công nhân viên theo khu vực.", default);

            var validationCreateStocktakingArea = await ValidationListStocktakingAreas(creates);
            if (!string.IsNullOrEmpty(validationCreateStocktakingArea))
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

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaUpdate> updates)
        {
            //if (await _stocktakingAreaRepository.IsCheckStocktakingAreaExist(stocktakingSheetId))
            //    return ("Phiểu kiểm kê đã tồn tại phân công nhân viên theo khu vực.", default);

            var stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(stocktakingSheetId);

            if (!stocktakingAreas.Any())
                return ("Danh sách kiểm kê khu vực không tồn tại.".ToMessageForUser(), default);

            var validationReAssignStocktakingArea = await ValidationReAssignStocktakingArea(stocktakingAreas, updates);
            if (!string.IsNullOrEmpty(validationReAssignStocktakingArea))
                return (validationReAssignStocktakingArea.ToMessageForUser(), default);

            var areaIdToStocktakingArea = stocktakingAreas
                .GroupBy(sa => sa.AreaId)
                .ToDictionary(g => g.Key, g => g.First());

            foreach (var update in updates)
            {
                if (!areaIdToStocktakingArea.TryGetValue(update.AreaId, out var existingEntity))
                    continue;

                _mapper.Map(update, existingEntity);
            }

            var updateBulkResult = await _stocktakingAreaRepository.UpdateStocktakingAreaBulk(stocktakingAreas);
            if (updateBulkResult == 0)
                return ("Cập nhật danh sách kiểm kê khu vực thất bại.", default);

            return ("", default);
        }

        public async Task<(string, StocktakingAreaResponse?)> UpdateStocktakingAreaStatus<T>(T update) where T : StocktakingAreaUpdateStatus
        {
            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingAreaId(update.StocktakingAreaId);
            if (stocktakingArea == null) return ("Kiểm kê khu vực không tồn tại.", default);

            try
            {
                var errorMessage = update switch
                {
                    StocktakingAreaPendingStatus => await HandleStocktakingAreaPending(stocktakingArea),
                    StocktakingAreaPendingAprrovalStatus => await HandleStocktakingAreaPendingApproval(stocktakingArea),
                    _ => "Cập nhật trạng thái của kiểm kê khu vực thất bại."
                };

                if (!string.IsNullOrEmpty(errorMessage))
                    throw new Exception(errorMessage);

                stocktakingArea.UpdateAt = DateTime.Now;

                var updateResult = await _stocktakingAreaRepository.UpdateStocktakingArea(stocktakingArea);
                if (updateResult == 0) return ("Cập nhật kiểm kê khu vực thất bại.", default);

                return ("", new StocktakingAreaResponse { StocktakingAreaId = update.StocktakingAreaId });
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, StocktakingAreaApprovalResponse?)> UpdateStocktakingAreaApprovalStatus(StocktakingAreaApprovalStatus update)
        {
            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingAreaId(update.StocktakingAreaId);
            if (stocktakingArea == null) return ("Kiểm kê khu vực không tồn tại.", default);

            try
            {
                var hasNoPendingApprovalLocations = await _stocktakingLocationRepository.HasLocationsNotPendingApprovalAsync(stocktakingArea.StocktakingAreaId);

                if (stocktakingArea.Status != StockAreaStatus.PendingApproval)
                    return ("Chỉ có thể chuyển trạng thái sang Đã duyệt khi kiểm kê khu vực ở trạng thái Chờ duyệt.".ToMessageForUser(), default);

                if (hasNoPendingApprovalLocations)
                    return ("Chỉ có thể chuyển trạng thái sang Đã duyệt khi kiểm kê vị trí ở trạng thái Chờ duyệt.".ToMessageForUser(), default);

                var stocktakingLocations = await _stocktakingLocationRepository.GetLocationsByStockSheetIdAreaIdsAsync(stocktakingArea.StocktakingSheetId, new List<int> { (int)stocktakingArea.AreaId });
                if (!stocktakingLocations.Any())
                    return ("Danh sách kiểm kê vị trí trống.", default);

                var validationStocktakingLocationsToApproval = await ValidationListStocktakingLocationToApproval(stocktakingLocations);
                if (validationStocktakingLocationsToApproval.Any())
                    return ("", new StocktakingAreaApprovalResponse { StocktakingLocationWarmings = validationStocktakingLocationsToApproval });

                stocktakingArea.Status = StockAreaStatus.Completed;
                stocktakingArea.UpdateAt = DateTime.Now;

                var updateResult = await _stocktakingAreaRepository.UpdateStocktakingArea(stocktakingArea);
                if (updateResult == 0) return ("Cập nhật kiểm kê khu vực thất bại.".ToMessageForUser(), default);

                await HandleUpdateStockSheetApproval(stocktakingArea.StocktakingSheetId);

                return ("", new StocktakingAreaApprovalResponse { StocktakingLocationWarmings = new List<StocktakingLocationWarming>() });
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        private async Task HandleUpdateStockSheetApproval(string stocktakingSheetId)
        {
            var checkAllStockAreaCompleted = await _stocktakingAreaRepository.IsCheckStockAreasCompleted(stocktakingSheetId);
            if (!checkAllStockAreaCompleted)
                return;

            var stockSheet = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stockSheet == null) return;

            if(stockSheet.Status != StocktakingStatus.PendingApproval)
                return;

            stockSheet.Status = StocktakingStatus.Approved;
            stockSheet.UpdateAt = DateTime.Now;

            var updateResult = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stockSheet);
        }

        public async Task<(string, StocktakingAreaReAssignStatus?)> UpdateStocktakingReAssignTo(StocktakingAreaReAssignStatus update)
        {
            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingAreaId(update.StocktakingAreaId);
            if (stocktakingArea == null) return ("Kiểm kê khu vực không tồn tại.", default);

            if (stocktakingArea.StocktakingLocations.Any())
                return ("Nhân viên đang tiến hành kiểm kê. Không thể phân công lại.", default);

            var isStockAreAssignTo = await _stocktakingAreaRepository.IsStocktakingAreaAssignTo(stocktakingArea.AreaId, stocktakingArea.StocktakingSheetId, update.AssignTo);
            if (isStockAreAssignTo)
                return ("Nhân viên này đã được phân công kiểm kê ở khu vực khác.".ToMessageForUser(), default);

            stocktakingArea.AssignTo = update.AssignTo;
            stocktakingArea.UpdateAt = DateTime.Now;

            var updateResult = await _stocktakingAreaRepository.UpdateStocktakingArea(stocktakingArea);
            if (updateResult == 0) return ("Cập nhật kiểm kê khu vực thất bại.", default);

            return ("", update);
        }

        private async Task<string> ValidationReAssignStocktakingArea(List<StocktakingArea> stocktakingAreas, List<StocktakingAreaUpdate> updates)
        {
            var msg = await ValidationListStocktakingAreas(updates);
            if (!string.IsNullOrEmpty(msg))
                return msg;

            var stocktakingAreasDictionary = stocktakingAreas
                .ToDictionary(sa => (sa.StocktakingSheetId, sa.AreaId), sa => sa.AssignTo);

            var stockSheetId = stocktakingAreas.FirstOrDefault()?.StocktakingSheetId;

            var areaIds = updates.Select(u => u.AreaId).ToList();

            var locationsByAreaIds = await _stocktakingLocationRepository.GetLocationsByStockSheetIdAreaIdsAsync(stockSheetId, areaIds);

            var assignToIds = updates.Select(u => u.AssignTo).Distinct().ToList();

            var allLocationInSheet = await _stocktakingLocationRepository.GetLocationsBySheetAndAssignToAsync(stockSheetId, assignToIds);

            foreach (var update in updates)
            {
                if (!stocktakingAreasDictionary.TryGetValue((stockSheetId, update.AreaId), out var oldAssignTo))
                    continue;

                if (locationsByAreaIds.Any(l => l.StocktakingArea.AreaId == update.AreaId))
                    return "Khu vực này đang thực hiện kiểm kê và không thể phân công sang nhân viên khác.";

                if (oldAssignTo != update.AssignTo)
                {
                    bool hasOtherStockLocation = allLocationInSheet.Any(l =>
                                                l.StocktakingArea.StocktakingSheetId == stockSheetId &&
                                                l.StocktakingArea.AreaId != update.AreaId &&
                                                l.StocktakingArea.AssignTo == update.AssignTo);

                    if (hasOtherStockLocation)
                        return "Nhân viên được phân công lại đã tiến hành kiểm kê ở khu vực khác.";
                }
            }

            return string.Empty;
        }

        private async Task<List<StocktakingLocationWarming>> ValidationListStocktakingLocationToApproval(List<StocktakingLocation> stocktakingLocations)
        {
            var stockPalletMap = new Dictionary<string, List<StocktakingPallet>>();

            var stockLocationWarming = new List<StocktakingLocationWarming>();

            foreach (var stockLocation in stocktakingLocations)
            {
                var stockPallets = await _stocktakingPalletRepository
                    .GetStocktakingPalletByStocktakingLocationId(stockLocation.StocktakingLocationId);

                if (stockPallets == null || stockPallets.Count == 0)
                    continue;

                foreach (var stockPallet in stockPallets)
                {
                    if (!stockPalletMap.ContainsKey(stockPallet.PalletId))
                        stockPalletMap[stockPallet.PalletId] = new List<StocktakingPallet>();

                    stockPalletMap[stockPallet.PalletId].Add(stockPallet);
                }
            }

            foreach (var group in stockPalletMap)
            {
                var palletId = group.Key;
                var stockPallets = group.Value;

                var missingStockPallet = stockPallets.FirstOrDefault(sp => sp.Status == StockPalletStatus.Missing);
                var surplusStockPallet = stockPallets.FirstOrDefault(sp => sp.Status == StockPalletStatus.Surplus);

                if (missingStockPallet != null && surplusStockPallet == null)
                {
                    stockLocationWarming.Add(new StocktakingLocationWarming
                    {
                        StocktakingLocationId = (Guid)missingStockPallet.StocktakingLocationId,
                        PalletId = palletId,
                        Message = "Tồn tại kệ kê hàng thiếu nhưng không tồn tại kệ kê hàng thừa tương ứng."
                    });
                }

                if (surplusStockPallet != null && missingStockPallet == null)
                {
                    stockLocationWarming.Add(new StocktakingLocationWarming
                    {
                        StocktakingLocationId = (Guid)surplusStockPallet.StocktakingLocationId,
                        PalletId = palletId,
                        Message = "Tồn tại kệ kê hàng thừa nhưng không tồn tại kệ kê hàng thiếu tương ứng."
                    });
                }

                if (missingStockPallet != null && surplusStockPallet != null)
                {
                    if (surplusStockPallet.ActualPackageQuantity != surplusStockPallet.ExpectedPackageQuantity)
                    {
                        stockLocationWarming.Add(new StocktakingLocationWarming
                        {
                            StocktakingLocationId = (Guid)surplusStockPallet.StocktakingLocationId,
                            PalletId = palletId,
                            Message = "Tồn tại kệ kê hàng thừa nhưng số lượng thực tế khác với số lượng kỳ vọng."
                        });
                    }

                    if (missingStockPallet.ActualPackageQuantity != 0)
                    {
                        stockLocationWarming.Add(new StocktakingLocationWarming
                        {
                            StocktakingLocationId = (Guid)missingStockPallet.StocktakingLocationId,
                            PalletId = palletId,
                            Message = "Tồn tại kệ kê hàng thiếu nhưng số lượng thực tế phải bằng 0."
                        });
                    }
                }

                var matchedStockPallet = stockPallets.FirstOrDefault(x => x.Status == StockPalletStatus.Matched);

                if (matchedStockPallet != null && matchedStockPallet.ExpectedPackageQuantity != matchedStockPallet.ActualPackageQuantity)
                {
                    stockLocationWarming.Add(new StocktakingLocationWarming
                    {
                        StocktakingLocationId = (Guid)matchedStockPallet.StocktakingLocationId,
                        PalletId = palletId,
                        Message = "Số lượng thực tế khác với số lượng kỳ vọng."
                    });
                }

            }

            return stockLocationWarming;
        }

        private async Task<string> ValidationListStocktakingAreas<T>(List<T> areas)
            where T : StocktakingAreaCreate
        {
            if (HasDuplicateAssigneeInSameSheet(areas))
                return "Không thể phân công 1 nhân viên kho các khu vực khác nhau.";

            if (!(await CheckAllAssignAreaStocktaking(areas)))
                return "Còn khu vực chưa được phân công nhân viên kiểm kê.";

            return "";
        }

        private bool HasDuplicateAssigneeInSameSheet<T>(List<T> areas)
            where T : StocktakingAreaCreate
        {
            return areas.GroupBy(sa => sa.AssignTo)
                        .Any(g => g.Count() > 1);
        }

        private async Task<bool> CheckAllAssignAreaStocktaking<T>(List<T> areaCreates)
            where T : StocktakingAreaCreate
        {
            var areas = await _areaRepository.GetActiveAreasAsync();
            return areas.All(area => areaCreates.Any(ac => ac.AreaId == area.AreaId && ac.AssignTo != 0));
        }

        private async Task<string> HandleStocktakingAreaPendingApproval(StocktakingArea stocktakingArea)
        {
            if (stocktakingArea.StocktakingAreaId == Guid.Empty)
                return "Mã kiểm kê khu vực không hợp lệ.";

            if (stocktakingArea.Status != StockAreaStatus.Pending)
                return "Chỉ được chuyển sang trạng thái Chờ duyệt khi trạng thái của kiểm kê khu vực là Đang chờ kiểm kê.";

            var anyStockLocationPending = await _stocktakingLocationRepository.AnyStocktakingLocationPendingStatus((Guid)stocktakingArea.StocktakingAreaId);

            if (anyStockLocationPending)
                return "Chỉ được chuyển trạng thái Chờ duyệt khi toàn bộ các vị trị ở trạng thái Đã kiểm kê.".ToMessageForUser();

            if (!stocktakingArea.StocktakingLocations.Any())
                return "Danh sách kiểm kê vị trí của khu vực này trống.";

            var message = UpdateStocktakingLocationStatusPendingApproval((List<StocktakingLocation>)stocktakingArea.StocktakingLocations, stocktakingArea.StocktakingAreaId);
            if (!string.IsNullOrEmpty(message))
                return message;

            stocktakingArea.Status = StockAreaStatus.PendingApproval;
            return "";
        }

        private async Task<string> HandleStocktakingAreaPending(StocktakingArea stocktakingArea)
        {
            stocktakingArea.Status = StockAreaStatus.Pending;
            return "";
        }

        private string UpdateStocktakingLocationStatusPendingApproval(List<StocktakingLocation> stocktakingLocations, Guid stocktakingAreaId)
        {
            string message = "";
            foreach (var stockLocation in stocktakingLocations)
            {
                if (stockLocation.Status == StockLocationStatus.PendingApproval)
                    continue;

                if (stockLocation.Status != StockLocationStatus.Counted)
                    return $"Kiểm kê vị trí [{stockLocation.LocationId}] đang ở trạng thái khác trạng thái đã kiểm tra.";

                stockLocation.Status = StockLocationStatus.PendingApproval;
                stockLocation.UpdateAt = DateTime.Now;
            }

            return message;
        }
    }
}
