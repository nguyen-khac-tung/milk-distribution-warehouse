using AutoMapper;
using DocumentFormat.OpenXml.VariantTypes;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore.ChangeTracking;
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
        Task<(string, List<StocktakingAreaDetail>?)> GetStocktakingAreaByStocktakingSheetIdSync(string stoctakingSheetId, int? userId);
        Task<(string, List<StocktakingAreaDetailDto>?)> GetStocktakingAreaByStocktakingSheetId(string stoctakingSheetId, Guid? stocktakingAreaId, int? userId);
        Task<(string, StocktakingSheeteResponse?)> CreateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaCreateDto> creates);
        Task<(string, StocktakingSheeteResponse?)> CreateStoctakingAreaBulk_1(string stocktakingSheetId, List<StocktakingAreaCreate> stocktakingAreaCreates);
        Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaUpdate> updates, string updateType);
        Task<(string, StocktakingAreaReAssignStatus?)> UpdateStocktakingReAssignTo(StocktakingAreaReAssignStatus update);
        Task<(string, StocktakingAreaResponse?)> UpdateStocktakingAreaStatus<T>(T update) where T : StocktakingAreaUpdateStatus;
        Task<(string, StocktakingAreaApprovalResponse?)> UpdateStocktakingAreaApprovalStatus(StocktakingAreaApprovalStatus update);
        Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaCreateDto> updates);
        Task<(string, byte[]?, string?)> ExportStocktakingAreaWord(Guid stocktakingAreaId);
    }
    public class StocktakingAreaService : IStocktakingAreaService
    {
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IAreaRepository _areaRepository;
        private readonly IMapper _mapper;
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IStocktakingPalletRepository _stocktakingPalletRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStocktakingStatusDomainService _stocktakingStatusDomainService;
        private readonly IPalletRepository _palletRepository;
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;
        private readonly IWebHostEnvironment _env;
        public StocktakingAreaService(IStocktakingAreaRepository stocktakingAreaRepository, IAreaRepository areaRepository, IMapper mapper,
            IStocktakingLocationRepository stocktakingLocationRepository, IStocktakingPalletRepository stocktakingPalletRepository,
            IStocktakingSheetRepository stocktakingSheetRepository, IUnitOfWork unitOfWork,
            IStocktakingStatusDomainService stocktakingStatusDomainService, IPalletRepository palletRepository,
            INotificationService notificationService, IUserRepository userRepository, IWebHostEnvironment env)
        {
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _areaRepository = areaRepository;
            _mapper = mapper;
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _stocktakingPalletRepository = stocktakingPalletRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _unitOfWork = unitOfWork;
            _stocktakingStatusDomainService = stocktakingStatusDomainService;
            _palletRepository = palletRepository;
            _notificationService = notificationService;
            _userRepository = userRepository;
            _env = env;
        }

        public async Task<(string, List<StocktakingAreaDetailDto>?)> GetStocktakingAreaByStocktakingSheetId(string stoctakingSheetId, Guid? stocktakingAreaId, int? userId)
        {
            if (string.IsNullOrEmpty(stoctakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.", default);

            var stocktakingAreas = new List<StocktakingArea>();

            if (userId.HasValue && stocktakingAreaId != Guid.NewGuid())
                stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingSheetIdAndAssignTo(stoctakingSheetId, stocktakingAreaId, userId.Value);
            else
                stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingSheetIdAndAssignTo(stoctakingSheetId, null, null);

            if (!stocktakingAreas.Any())
                return ("Phiếu kiểm kê khu vực không tồn tại.".ToMessageForUser(), default);

            var stocktakingAreaMap = _mapper.Map<List<StocktakingAreaDetailDto>>(stocktakingAreas);

            return ("", stocktakingAreaMap);
        }

        public async Task<(string, List<StocktakingAreaDetail>?)> GetStocktakingAreaByStocktakingSheetIdSync(string stoctakingSheetId, int? userId)
        {
            if (string.IsNullOrEmpty(stoctakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.", default);
            var stocktakingArea = new List<StocktakingArea>();
            if (userId.HasValue)
                stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingSheetIdAndAssignTo(stoctakingSheetId, null, userId.Value);
            else
                return ("Mã nhân viên không hợp lệ.", default);

            if (stocktakingArea == null)
                return ("Phiếu kiểm kê khu vực không tồn tại.", default);
            var stocktakingAreaMap = _mapper.Map<List<StocktakingAreaDetail>>(stocktakingArea);
            return ("", stocktakingAreaMap);
        }

        public async Task<(string, StocktakingSheeteResponse?)> CreateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaCreateDto> creates)
        {
            if (await _stocktakingAreaRepository.IsCheckStocktakingAreaExist(stocktakingSheetId))
                return ("Phiểu kiểm kê đã tồn tại phân công nhân viên theo khu vực.", default);

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

        public async Task<(string, StocktakingSheeteResponse?)> CreateStoctakingAreaBulk_1(string stocktakingSheetId, List<StocktakingAreaCreate> stocktakingAreaCreates)
        {
            if (await _stocktakingAreaRepository.IsCheckStocktakingAreaExist(stocktakingSheetId))
                return ("Phiểu kiểm kê đã tồn tại phân công nhân viên theo khu vực.".ToMessageForUser(), default);

            var areaIds = stocktakingAreaCreates.Select(sa => sa.AreaId).Distinct().ToList();
            if (areaIds.Count > 0)
                return ("Phiếu kiểm kê tồn tại các khu vực kiểm kê giống nhau.".ToMessageForUser(), default);

            var stocktakingAreaMaps = _mapper.Map<List<StocktakingArea>>(stocktakingAreaCreates);

            foreach (var item in stocktakingAreaMaps)
            {
                item.StocktakingSheetId = stocktakingSheetId;
            }

            var createResult = await _stocktakingAreaRepository.CreateStocktakingAreaBulk(stocktakingAreaMaps);
            if (createResult == 0)
                return ("Tạo phiếu kiểm kê khu vục thất bại.", default);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetId });
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaCreateDto> updates)
        {
            if (updates == null || !updates.Any())
                return ("Danh sách khu vực cập nhật không được để trống.".ToMessageForUser(), default);

            var stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(stocktakingSheetId);
            var existingAreaIds = stocktakingAreas
                .Where(sa => sa.AreaId.HasValue)
                .Select(sa => sa.AreaId!.Value)
                .ToHashSet();

            var requestedAreaIds = updates
                .Select(u => u.AreaId)
                .Distinct()
                .ToList();

            var areasToRemove = stocktakingAreas
                .Where(sa => sa.AreaId.HasValue && !requestedAreaIds.Contains(sa.AreaId.Value))
                .ToList();

            var areaIdsToCreate = requestedAreaIds
                .Where(areaId => !existingAreaIds.Contains(areaId))
                .ToList();

            if (!areasToRemove.Any() && !areaIdsToCreate.Any())
                return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetId });

            var stocktakingAreasToCreate = areaIdsToCreate
                .Select(areaId =>
                {
                    var dto = new StocktakingAreaCreateDto { AreaId = areaId };
                    var entity = _mapper.Map<StocktakingArea>(dto);
                    entity.StocktakingSheetId = stocktakingSheetId;
                    return entity;
                })
                .ToList();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (areasToRemove.Any())
                {
                    var deleteResult = await _stocktakingAreaRepository.DeleteStocktakingAreasAsync(areasToRemove);
                    if (deleteResult == 0)
                        throw new Exception("Xoá khu vực kiểm kê thất bại.".ToMessageForUser());
                }

                if (stocktakingAreasToCreate.Any())
                {
                    var createResult = await _stocktakingAreaRepository.CreateStocktakingAreaBulk(stocktakingAreasToCreate);
                    if (createResult == 0)
                        throw new Exception("Thêm mới khu vực kiểm kê thất bại.".ToMessageForUser());
                }

                await _unitOfWork.CommitTransactionAsync();
                return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return (ex.Message, default);
            }
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingAreaBulk(string stocktakingSheetId, List<StocktakingAreaUpdate> updates, string updateType)
        {
            var stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(stocktakingSheetId);

            if (!stocktakingAreas.Any())
                return ("Danh sách kiểm kê khu vực không tồn tại.".ToMessageForUser(), default);

            if (updateType.Equals("ReAssign"))
            {
                var validationReAssignStocktakingArea = await ValidationReAssignStocktakingArea(stocktakingAreas, updates);
                if (!string.IsNullOrEmpty(validationReAssignStocktakingArea))
                    return (validationReAssignStocktakingArea.ToMessageForUser(), default);
            }

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

                var targetStatus = stocktakingArea.Status;
                var msg = await _stocktakingStatusDomainService.UpdateAreaStatusAsync(stocktakingArea.StocktakingAreaId, (int)targetStatus);
                if (!string.IsNullOrEmpty(msg)) return (msg, default);

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
                await _unitOfWork.BeginTransactionAsync();

                var hasNoPendingApprovalLocations = await _stocktakingLocationRepository.HasLocationsNotPendingApprovalAsync(stocktakingArea.StocktakingAreaId);

                if (stocktakingArea.Status != StockAreaStatus.PendingApproval)
                    throw new Exception("Chỉ có thể chuyển trạng thái sang Đã duyệt khi kiểm kê khu vực ở trạng thái Chờ duyệt.".ToMessageForUser());

                if (hasNoPendingApprovalLocations)
                    throw new Exception("Chỉ có thể chuyển trạng thái sang Đã duyệt khi kiểm kê vị trí ở trạng thái Chờ duyệt.".ToMessageForUser());

                var stocktakingLocations = await _stocktakingLocationRepository.GetLocationsByStockSheetIdAreaIdsAsync(stocktakingArea.StocktakingSheetId, new List<int> { (int)stocktakingArea.AreaId });
                if (!stocktakingLocations.Any())
                    throw new Exception("Danh sách kiểm kê vị trí trống.");

                var validationStocktakingLocationsToApproval = await ValidationListStocktakingLocationToApproval(stocktakingLocations);
                if (validationStocktakingLocationsToApproval.StocktakingLocationFails.Any())
                    return ("", validationStocktakingLocationsToApproval);

                stocktakingArea.Status = StockAreaStatus.Completed;

                HandleUpdateStockLocation(stocktakingArea.StocktakingLocations);

                var msg = await _stocktakingStatusDomainService.UpdateAreaStatusAsync(stocktakingArea, StockAreaStatus.Completed);
                if (!string.IsNullOrEmpty(msg))
                    return (msg, default(StocktakingAreaApprovalResponse?));

                await HandleUpdateStockSheetApproval(update.StocktakingAreaId, stocktakingArea.StocktakingSheetId);

                await _unitOfWork.CommitTransactionAsync();

                await HandleStockAreaNotificationStatusChange(stocktakingArea);

                return ("", validationStocktakingLocationsToApproval);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return (ex.Message, default);
            }
        }

        public async Task<(string, byte[]?, string?)> ExportStocktakingAreaWord(Guid stocktakingAreaId)
        {
            var stocktakingLocations = await _stocktakingLocationRepository.GetStocktakingLocationsByAreaId(stocktakingAreaId);

            if (stocktakingLocations == null) return ("Không tìm thấy phiếu kiểm kê.".ToMessageForUser(), null, null);

            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStockAreaId(stocktakingAreaId);
            if (stocktakingArea == null) return ("Không tìm thấy phiếu kiểm kê.".ToMessageForUser(), null, null);

            var simpleData = new Dictionary<string, string>
            {
                { "$Gio_Kiem_Ke", stocktakingArea.CreatedAt?.Hour.ToString("00") ?? "..." },
                { "$Phut_Kiem_Ke", stocktakingArea.CreatedAt?.Minute.ToString("00") ?? "..." },
                { "$Ngay_Kiem_Ke", stocktakingArea.CreatedAt?.Day.ToString("00") ?? "..." },
                { "$Thang_Kiem_Ke", stocktakingArea.CreatedAt?.Month.ToString("00") ?? "..." },
                { "$Nam_Kiem_Ke", stocktakingArea.CreatedAt?.Year.ToString() ?? "..." },
                { "$So_Phieu", stocktakingArea.StocktakingAreaId.ToString() ?? "..." },
                { "$Ten_Quan_Ly_Kho", stocktakingArea.StocktakingSheet.CreatedByNavigation.FullName?? "" },
                { "$Ten_Nhan_Vien_Kho", stocktakingLocations.FirstOrDefault().StocktakingArea.AssignToNavigation.FullName ?? ""}
            };

            var tableData = new List<Dictionary<string, string>>();
            int stt = 1;
            if (stocktakingLocations != null)
            {
                foreach (var sl in stocktakingLocations)
                {
                    var stockPallets = sl.StocktakingPallets;
                    if (stockPallets.Any())
                    {
                        foreach (var sp in stockPallets)
                        {
                            tableData.Add(new Dictionary<string, string>
                            {
                                { "$STT", stt++.ToString() },
                                { "$Ma_Vi_Tri", sl.Location.LocationCode ?? "" },
                                {"$Ma_Pallet", sp.PalletId ?? "" },
                                {"$So_Luong_Ky_Vong", sp.ExpectedPackageQuantity?.ToString() ?? "0" },
                            });
                        }
                        continue;
                    }
                    else
                    {
                        tableData.Add(new Dictionary<string, string>
                        {
                        { "$STT", stt++.ToString() },
                        { "$Ma_Vi_Tri", sl.Location.LocationCode ?? "" },
                        {"$Ma_Pallet", "" },
                        {"$So_Luong_Ky_Vong", "0" },
                        });
                    }

                }
            }

            string templatePath = Path.Combine(_env.ContentRootPath, "Templates", "bien-ban-kiem-ke.docx");

            try
            {
                var fileBytes = WordExportUtility.FillTemplate(templatePath, simpleData, tableData);
                string fileName = $"Bien_Ban_Kiem_Ke_{stocktakingAreaId}.docx";

                return ("", fileBytes, fileName);
            }
            catch (Exception ex)
            {
                return ($"Xảy ra lỗi khi xuất file.".ToMessageForUser(), null, null);
            }
        }

        private void HandleUpdateStockLocation(ICollection<StocktakingLocation> stocktakingLocations)
        {
            foreach (var location in stocktakingLocations)
            {
                location.Status = StockLocationStatus.Completed;
                location.UpdateAt = DateTimeUtility.Now();
            }
        }

        private async Task HandleUpdateStockSheetApproval(Guid stocktakingAreaId, string stocktakingSheetId)
        {
            var checkAllStockAreaCompleted = await _stocktakingAreaRepository.IsCheckStockAreasCompleted(stocktakingAreaId, stocktakingSheetId);
            if (!checkAllStockAreaCompleted)
                return;

            var stockSheet = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stockSheet == null) return;

            if (stockSheet.Status != StocktakingStatus.PendingApproval)
                return;

            await _stocktakingStatusDomainService.UpdateSheetStatusAsync(stockSheet, StocktakingStatus.Approved);
        }

        public async Task<(string, StocktakingAreaReAssignStatus?)> UpdateStocktakingReAssignTo(StocktakingAreaReAssignStatus update)
        {
            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingAreaId(update.StocktakingAreaId);
            if (stocktakingArea == null) return ("Kiểm kê khu vực không tồn tại.", default);

            var oldAssignTo = stocktakingArea.AssignTo;

            if (stocktakingArea.StocktakingLocations.Any())
                return ("Nhân viên đang tiến hành kiểm kê. Không thể phân công lại.", default);

            //var isStockAreAssignTo = await _stocktakingAreaRepository.IsStocktakingAreaAssignTo(stocktakingArea.AreaId, stocktakingArea.StocktakingSheetId, update.AssignTo);
            //if (isStockAreAssignTo)
            //    return ("Nhân viên này đã được phân công kiểm kê ở khu vực khác.".ToMessageForUser(), default);

            stocktakingArea.AssignTo = update.AssignTo;
            stocktakingArea.UpdateAt = DateTimeUtility.Now();

            var updateResult = await _stocktakingAreaRepository.UpdateStocktakingArea(stocktakingArea);
            if (updateResult == 0) return ("Cập nhật kiểm kê khu vực thất bại.", default);

            await HandleStockSheetNotificationStatusChange(stocktakingArea, (int)oldAssignTo);

            return ("", update);
        }

        private async Task<string> ValidationReAssignStocktakingArea(List<StocktakingArea> stocktakingAreas, List<StocktakingAreaUpdate> updates)
        {
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

        private async Task<StocktakingAreaApprovalResponse> ValidationListStocktakingLocationToApproval(
            List<StocktakingLocation> stocktakingLocations)
        {
            var stockLocationFail = new List<StocktakingLocationFail>();
            var stockLocationWarning = new List<StocktakingLocationWarming>();

            var locationIds = stocktakingLocations
                .Where(l => l.LocationId.HasValue)
                .Select(l => l.LocationId.Value)
                .Distinct()
                .ToList();

            var expectedPallets = await _palletRepository.GetActivePalletIdsByLocationId(locationIds);

            var expectedPalletMap = expectedPallets
                .Where(p => p.LocationId.HasValue)
                .GroupBy(p => p.LocationId.Value)
                .ToDictionary(g => g.Key, g => g.Select(p => p.PalletId).ToHashSet());

            var palletToCorrectLocationMap = expectedPallets
                .Where(p => p.LocationId.HasValue)
                .ToDictionary(p => p.PalletId, p => p.LocationId.Value);

            var locationCodeMap = stocktakingLocations
                .Where(l => l.LocationId.HasValue && l.Location != null)
                .ToDictionary(l => l.LocationId.Value, l => l.Location.LocationCode ?? $"Vị trí {l.LocationId}");

            var currentLocationCodeMap = stocktakingLocations
                .Where(l => l.Location != null)
                .ToDictionary(l => l.StocktakingLocationId, l => l.Location.LocationCode ?? $"Vị trí {l.LocationId}");

            var allStocktakingLocationIds = stocktakingLocations.Select(l => l.StocktakingLocationId).ToList();
            var allScannedPallets = new List<StocktakingPallet>();
            foreach (var locationId in allStocktakingLocationIds)
            {
                var pallets = await _stocktakingPalletRepository
                    .GetStocktakingPalletByStocktakingLocationId(locationId);
                if (pallets != null && pallets.Count > 0)
                {
                    allScannedPallets.AddRange(pallets);
                }
            }

            var palletToScannedLocationInfo = allScannedPallets
                .Where(sp => sp.StocktakingLocationId.HasValue &&
                            (sp.Status == StockPalletStatus.Matched ||
                             sp.Status == StockPalletStatus.Surplus ||
                             sp.Status == StockPalletStatus.Mislocated))
                .GroupBy(sp => sp.PalletId)
                .ToDictionary(g => g.Key, g =>
                {
                    var pallet = g.First();
                    var location = stocktakingLocations.FirstOrDefault(l => l.StocktakingLocationId == pallet.StocktakingLocationId);
                    return new { Pallet = pallet, Location = location };
                });

            foreach (var location in stocktakingLocations)
            {
                if (!location.LocationId.HasValue)
                    continue;

                var currentLocationCode = currentLocationCodeMap.ContainsKey(location.StocktakingLocationId)
                    ? currentLocationCodeMap[location.StocktakingLocationId]
                    : $"Vị trí {location.LocationId}";

                var scannedPallets = await _stocktakingPalletRepository
                    .GetStocktakingPalletByStocktakingLocationId(location.StocktakingLocationId);

                if (scannedPallets == null || scannedPallets.Count == 0)
                    continue;

                var expectedPalletIds = expectedPalletMap.ContainsKey(location.LocationId.Value)
                    ? expectedPalletMap[location.LocationId.Value]
                    : new HashSet<string>();

                foreach (var scannedPallet in scannedPallets)
                {
                    var palletId = scannedPallet.PalletId;
                    var status = scannedPallet.Status;

                    if (status == StockPalletStatus.Mislocated)
                    {
                        var correctLocationId = palletToCorrectLocationMap.ContainsKey(palletId)
                            ? palletToCorrectLocationMap[palletId]
                            : (int?)null;

                        string message;
                        if (correctLocationId.HasValue && locationCodeMap.ContainsKey(correctLocationId.Value))
                        {
                            var correctLocationCode = locationCodeMap[correctLocationId.Value];
                            message = $"Pallet {palletId} được quét tại vị trí {currentLocationCode} nhưng vị trí đúng của pallet này là {correctLocationCode}.";
                        }
                        else
                        {
                            message = $"Pallet {palletId} được quét tại vị trí {currentLocationCode} nhưng đây không phải vị trí dự kiến của pallet này.";
                        }

                        stockLocationFail.Add(new StocktakingLocationFail
                        {
                            StocktakingLocationId = location.StocktakingLocationId,
                            PalletId = palletId,
                            Message = message
                        });
                    }

                    if (status == StockPalletStatus.Missing)
                    {
                        if (expectedPalletIds.Contains(palletId))
                        {
                            string message;
                            if (palletToScannedLocationInfo.ContainsKey(palletId))
                            {
                                var scannedInfo = palletToScannedLocationInfo[palletId];
                                var scannedAtLocation = scannedInfo.Location;
                                var scannedAtLocationCode = scannedAtLocation != null && scannedAtLocation.Location != null
                                    ? scannedAtLocation.Location.LocationCode ?? $"Vị trí {scannedAtLocation.LocationId}"
                                    : "vị trí khác";

                                message = $"Vị trí {currentLocationCode}: Pallet {palletId} được đánh dấu là thiếu nhưng thực tế đang được quét tại vị trí {scannedAtLocationCode}.";
                            }
                            else
                            {
                                message = $"Vị trí {currentLocationCode}: Pallet {palletId} được hệ thống ghi nhận tại vị trí này nhưng thực tế không có pallet.";
                            }

                            stockLocationFail.Add(new StocktakingLocationFail
                            {
                                StocktakingLocationId = location.StocktakingLocationId,
                                PalletId = palletId,
                                Message = message
                            });
                        }
                    }

                    if (status == StockPalletStatus.Surplus)
                    {
                        if (!expectedPalletIds.Contains(palletId))
                        {
                            stockLocationFail.Add(new StocktakingLocationFail
                            {
                                StocktakingLocationId = location.StocktakingLocationId,
                                PalletId = palletId,
                                Message = $"Vị trí {currentLocationCode}: Pallet {palletId} được quét tại vị trí này nhưng không được kỳ vọng. Pallet này có thể đến từ khu vực khác."
                            });
                        }
                    }

                    if (status == StockPalletStatus.Matched)
                    {
                        var expectedQty = scannedPallet.ExpectedPackageQuantity ?? 0;
                        var actualQty = scannedPallet.ActualPackageQuantity ?? 0;

                        if (expectedQty != actualQty)
                        {
                            stockLocationWarning.Add(new StocktakingLocationWarming
                            {
                                StocktakingLocationId = location.StocktakingLocationId,
                                PalletId = palletId,
                                Message = $"Vị trí {currentLocationCode}: Pallet {palletId} đúng vị trí nhưng số lượng thực tế ({actualQty}) không khớp với số lượng kỳ vọng ({expectedQty})."
                            });
                        }
                    }
                }
            }

            return new StocktakingAreaApprovalResponse
            {
                StocktakingLocationFails = stockLocationFail,
                StocktakingLocationWarmings = stockLocationWarning
            };
        }

        private async Task<string> HandleStocktakingAreaPendingApproval(StocktakingArea stocktakingArea)
        {
            try
            {
                await _unitOfWork.BeginTransactionAsync();

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

                var stockSheet = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingArea.StocktakingSheetId);
                if (stockSheet == null) return "Dữ liệu phiếu kiểm kê không tồn tại.";

                //if (stockSheet.Status != StocktakingStatus.InProgress)
                //    return "Chỉ cập nhật sang trạng thái Chờ duyệt khi phiếu kiêm kê đang ở trạng thái Đang kiểm kê.";

                var updateMessage = await _stocktakingStatusDomainService.UpdateSheetStatusAsync(stockSheet, StocktakingStatus.PendingApproval);
                if (!string.IsNullOrEmpty(updateMessage))
                    return updateMessage;
                await _unitOfWork.CommitTransactionAsync();

                await HandleStockAreaNotificationStatusChange(stocktakingArea);
                return "";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ex.Message;
            }
        }

        private async Task<string> HandleStocktakingAreaPending(StocktakingArea stocktakingArea)
        {
            stocktakingArea.Status = StockAreaStatus.Pending;
            var notificationtoCreate = new NotificationCreateDto
            {
                UserId = stocktakingArea.StocktakingSheet.CreatedBy,
                Title = $"Phiếu kiểm kê đang được tiến hành",
                Content = $"Khu vực kiểm kê '{stocktakingArea.Area.AreaName}' trong phiếu kiểm kê '{stocktakingArea.StocktakingSheetId}' đang tiến hành kiểm kê.",
                EntityType = NotificationEntityType.StocktakingSheet,
                EntityId = stocktakingArea.StocktakingSheetId
            };

            await _notificationService.CreateNotificationNoTransaction(notificationtoCreate);

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
                stockLocation.UpdateAt = DateTimeUtility.Now();
            }

            return message;
        }

        private async Task HandleStockAreaNotificationStatusChange(StocktakingArea stocktakingArea)
        {
            var notificationToCreateList = new List<NotificationCreateDto>();

            switch (stocktakingArea.Status)
            {
                case StockAreaStatus.PendingApproval:
                    notificationToCreateList.Add(new NotificationCreateDto
                    {
                        UserId = stocktakingArea.StocktakingSheet.CreatedBy,
                        Title = $"Yêu cầu duyệt phân công khu vực kiểm kê.",
                        Content = $"Khu vực '{stocktakingArea.Area.AreaName}' trong phiếu kiểm kê '{stocktakingArea.StocktakingSheetId}' đã được gửi để duyệt. Vui lòng xem xét và phê duyệt.",
                        EntityType = NotificationEntityType.StocktakingAreaManager,
                        EntityId = stocktakingArea.StocktakingSheetId
                    });
                    break;
                case StockAreaStatus.Completed:
                    notificationToCreateList.Add(new NotificationCreateDto
                    {
                        UserId = stocktakingArea.AssignTo,
                        Title = $"Khu vực đã hoàn thành kiểm kê",
                        Content = $"Khu vực '{stocktakingArea.Area.AreaName}' trong phiếu kiểm kê '{stocktakingArea.StocktakingSheetId}' đã được hoàn thành kiểm kê.",
                        EntityType = NotificationEntityType.StocktakingAreaStaff,
                        EntityId = stocktakingArea.StocktakingSheetId
                    });
                    if (stocktakingArea.StocktakingSheet.Status == StocktakingStatus.Approved)
                    {
                        var stocktakingSheet = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingArea.StocktakingSheetId);
                        var staffIds = stocktakingSheet.StocktakingAreas.Select(sa => sa.AssignTo).Distinct().ToList();

                        foreach (var staffId in staffIds)
                        {
                            notificationToCreateList.Add(new NotificationCreateDto
                            {
                                UserId = staffId,
                                Title = $"Phiếu kiểm kê đã được duyệt",
                                Content = $"Các khu vực trong phiếu kiểm kê '{stocktakingArea.StocktakingSheetId}' đã được duyệt.",
                                EntityType = NotificationEntityType.StocktakingAreaStaff,
                                EntityId = stocktakingArea.StocktakingSheetId
                            });
                        }
                        var salesManagers = await _userRepository.GetUsersByRoleId(RoleType.SaleManager);
                        foreach (var salesManager in salesManagers)
                        {
                            notificationToCreateList.Add(new NotificationCreateDto
                            {
                                UserId = salesManager.UserId,
                                Title = $"Phiếu kiểm kê đã được duyệt",
                                Content = $"Phiếu '{stocktakingArea.StocktakingSheetId}' đã được duyệt. Vui lòng hoàn tất.",
                                EntityType = NotificationEntityType.StocktakingAreaManager,
                                EntityId = stocktakingArea.StocktakingSheetId
                            });
                        }
                    }
                    break;
                default:
                    break;
            }
            if (notificationToCreateList.Any())
            {
                await _notificationService.CreateNotificationBulk(notificationToCreateList);
            }
        }

        private async Task HandleStockSheetNotificationStatusChange(StocktakingArea stocktakingArea, int oldAssignTo)
        {
            var notificationToCreateList = new List<NotificationCreateDto>();
            notificationToCreateList.Add(new NotificationCreateDto()
            {
                UserId = stocktakingArea.AssignTo,
                Title = $"Bạn có nhiệm vụ kiểm kê khu vực.",
                Content = $"Khu vực '{stocktakingArea.Area.AreaName}' trong phiếu kiểm kê '{stocktakingArea.StocktakingSheetId}' đã được phân công cho bạn.",
                EntityType = NotificationEntityType.StocktakingSheet,
                EntityId = stocktakingArea.StocktakingSheetId,
            });

            notificationToCreateList.Add(new NotificationCreateDto
            {
                UserId = oldAssignTo,
                Title = $"Bạn đã được rời khỏi nhiệm vụ kiểm kê khu vực.",
                Content = $"Khu vực '{stocktakingArea.Area.AreaName}' trong phiếu kiểm kê '{stocktakingArea.StocktakingSheetId}' đã được giao cho nhân sự khác. Bạn không còn phụ trách khu vực này.",
                EntityType = NotificationEntityType.NoNavigation
            });

            await _notificationService.CreateNotificationBulk(notificationToCreateList);
        }
    }
}
