using AutoMapper;
using AutoMapper.QueryableExtensions;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Reflection.Metadata;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingSheetService
    {
        Task<(string, PageResult<StocktakingSheetDto>?)> GetStocktakingSheets(PagedRequest request, string roleName, int? userId);
        Task<(string, StocktakingSheetDetail?)> GetStocktakingSheetDetail(string stocktakingSheetId, int? userId, List<string>? userRole);
        Task<(string, StocktakingSheeteResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId);
        Task<(string, StocktakingSheeteResponse?)> DeleteStocktakingSheet(string stocktakingSheetId, int? userId);
        Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheet(StocktakingSheetUpdate update, int? userId);
        Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheetStatus<T>(T update, int? userId) where T : StocktakingSheetStatusUpdate;
    }
    public class StocktakingSheetService : IStocktakingSheetService
    {
        private readonly IMapper _mapper;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAreaRepository _areaRepository;
        private readonly IStocktakingAreaService _stocktakingAreaService;
        private readonly int _hoursBeforeStartTime = StocktakingSettings.HoursBeforeStartToAllowEdit;
        private readonly IStocktakingLocationService _stocktakingLocationService;
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IStocktakingStatusDomainService _stocktakingStatusDomainService;
        private readonly IStocktakingPalletRepository _stocktakingPalletRepository;
        private readonly IPalletRepository _palletRepository;
        private readonly ILocationRepository _locationRepository;
        private readonly INotificationService _notificationService;

        public StocktakingSheetService(IMapper mapper, IStocktakingSheetRepository stocktakingSheetRepository,
            IStocktakingAreaRepository stocktakingAreaRepository,
            IUnitOfWork unitOfWork, IAreaRepository areaRepository,
            IStocktakingAreaService stocktakingAreaService, IStocktakingLocationService stocktakingLocationService,
            IStocktakingLocationRepository stocktakingLocationRepository, IStocktakingStatusDomainService stocktakingStatusDomainService,
            IStocktakingPalletRepository stocktakingPalletRepository, IPalletRepository palletRepository, ILocationRepository locationRepository,
            INotificationService notificationService)
        {
            _mapper = mapper;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _unitOfWork = unitOfWork;
            _areaRepository = areaRepository;
            _stocktakingAreaService = stocktakingAreaService;
            _stocktakingLocationService = stocktakingLocationService;
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _stocktakingStatusDomainService = stocktakingStatusDomainService;
            _stocktakingPalletRepository = stocktakingPalletRepository;
            _palletRepository = palletRepository;
            _locationRepository = locationRepository;
            _notificationService = notificationService;
        }

        public async Task<(string, PageResult<StocktakingSheetDto>?)> GetStocktakingSheets(PagedRequest request, string roleName, int? userId)
        {
            var stocktakingSheetQuery = _stocktakingSheetRepository.GetStocktakingSheet();

            switch (roleName)
            {
                case RoleNames.WarehouseManager:

                    break;
                case RoleNames.SalesManager:
                    var status = new int[]
                    {
                        StocktakingStatus.Approved,
                        StocktakingStatus.Completed
                    };
                    stocktakingSheetQuery = stocktakingSheetQuery.Where(ss => status.Contains((int)ss.Status));
                    break;
                case RoleNames.WarehouseStaff:
                    var excludedStatus = new int[]
                    {
                        StocktakingStatus.Draft,
                    };
                    stocktakingSheetQuery = stocktakingSheetQuery.Where(ss => ss.StocktakingAreas
                                                .Any(sa => userId.HasValue
                                                && sa.AssignTo == userId)
                                                && !excludedStatus.Contains((int)ss.Status));
                    break;
                default:
                    return ("Bạn không có quyền xem danh sách kiểm kê.".ToMessageForUser(), default);
            }

            //var stocktakingSheetMap = stocktakingSheetQuery.ProjectTo<StocktakingSheetDto>(_mapper.ConfigurationProvider);

            var queryDto = stocktakingSheetQuery.Select(ss => new StocktakingSheetDto
            {
                StocktakingSheetId = ss.StocktakingSheetId,
                Status = ss.Status,
                StartTime = ss.StartTime,
                CreatedAt = ss.CreatedAt,
                CreatedBy = ss.CreatedBy,
                CreateByName = ss.CreatedByNavigation.FullName,

                CanViewStocktakingArea =
                    roleName == RoleNames.WarehouseManager || roleName == RoleNames.SalesManager
                    ? ss.StocktakingAreas.Any(sa => sa.StocktakingLocations.Any())
                    : ss.StocktakingAreas.Any(sa =>
                        sa.AssignTo == userId &&
                        sa.StocktakingLocations.Any()
                    ),

                StockAreaStarted =
                    (ss.StocktakingAreas.Count(sa => sa.AssignTo == userId) == 1
                    && ss.StocktakingAreas.Any(sa => sa.AssignTo == userId && sa.StocktakingLocations.Any() == false))
                        ? StockAreaStarted.NotStarted

                    : (ss.StocktakingAreas.Count(sa => sa.AssignTo == userId) == 1 &&
                    ss.StocktakingAreas.Any(sa => sa.AssignTo == userId && sa.StocktakingLocations.Any()))
                        ? StockAreaStarted.Started

                    : StockAreaStarted.HasSomeAreas
            }).OrderByDescending(ss => ss.CreatedAt);

            var items = await queryDto.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách phiếu kiểm kê trống.".ToMessageForUser(), default);

            return ("", items);
        }

        public async Task<(string, StocktakingSheetDetail?)> GetStocktakingSheetDetail(string stocktakingSheetId, int? userId, List<string>? userRole)
        {
            if (string.IsNullOrEmpty(stocktakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.".ToMessageForUser(), default);

            var stocktakingSheetDetail = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stocktakingSheetDetail == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            var stocktakingSheetMap = _mapper.Map<StocktakingSheetDetail>(stocktakingSheetDetail);

            if (userRole != null &&
                (userRole.Contains(RoleNames.WarehouseManager) || userRole.Contains(RoleNames.SalesManager)))
            {
                stocktakingSheetMap.IsDiableButtonInProgress = false;
            }
            else
            {
                stocktakingSheetMap.IsDiableButtonInProgress =
                    stocktakingSheetMap.StocktakingAreas.Any(sa => sa.AssignTo == userId && sa.Status == StockAreaStatus.Assigned)
                    || !IsBeforeEditDeadline(stocktakingSheetMap.StartTime);
            }

            return ("", stocktakingSheetMap);
        }

        public async Task<(string, StocktakingSheeteResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId)
        {
            if (create == null) return ("Dữ liệu tạo phiếu kiểm kê trống.".ToMessageForUser(), default);

            if (userId == null) return ("Bạn không có quyền tạo phiếu kiểm kê.".ToMessageForUser(), default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (create.StartTime <= DateTimeUtility.Now())
                    throw new Exception("Thời gian bắt đầu phải là thời gian trong tương lai.".ToMessageForUser());

                var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(null, create.StartTime);
                if (isDuplicationStartTime)
                    throw new Exception("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.".ToMessageForUser());

                var stocktakingSheetMap = _mapper.Map<StocktakingSheet>(create);

                stocktakingSheetMap.CreatedBy = userId;

                var resultCreate = await _stocktakingSheetRepository.CreateStocktakingSheet(stocktakingSheetMap);
                if (resultCreate == 0)
                    throw new Exception("Tạo phiếu kiểm kê thất bại.".ToMessageForUser());

                var (msgResultCreateAreas, _) = await _stocktakingAreaService.CreateStocktakingAreaBulk(stocktakingSheetMap.StocktakingSheetId, create.AreaIds);
                if (!string.IsNullOrEmpty(msgResultCreateAreas))
                    throw new Exception(msgResultCreateAreas);

                await _unitOfWork.CommitTransactionAsync();
                return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetMap.StocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheet(StocktakingSheetUpdate update, int? userId)
        {
            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(update.StocktakingSheetId);

            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            if (stocktakingSheetExist.CreatedBy != userId)
                return ("Bạn không có quyền cập nhập phiếu kiểm kê.".ToMessageForUser(), default);

            var currentStatus = stocktakingSheetExist.Status;
            if (currentStatus == StocktakingStatus.Assigned && !IsBeforeEditDeadline(stocktakingSheetExist.StartTime))
                return ($"Không thể cập nhật thông tin. Vui lòng thực hiện chỉnh sửa trong vòng {_hoursBeforeStartTime} tiếng trước thời điểm bắt đầu kiểm kê.".ToMessageForUser(), default);

            if (currentStatus != StocktakingStatus.Draft &&
               currentStatus != StocktakingStatus.Assigned)
                return ("Chỉ được phép cập nhật phiếu kiểm kê khi phiếu kiểm kê ở trạng thái Nháp hoặc Đã phân công.".ToMessageForUser(), default);

            var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(update.StocktakingSheetId, update.StartTime);
            if (isDuplicationStartTime)
                return ("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.".ToMessageForUser(), default);

            Dictionary<int, int?> existingAreaDict = stocktakingSheetExist.StocktakingAreas
                .Where(sa => sa.AreaId.HasValue)
                .ToDictionary(sa => sa.AreaId!.Value, sa => sa.AssignTo);

            var updateAreaIds = update.AreaIds.Select(a => a.AreaId).ToHashSet();

            if (existingAreaDict.Keys.Except(updateAreaIds).Any())
            {
                var hasStartedAreas = stocktakingSheetExist.StocktakingAreas
                    .Where(sa => sa.AreaId.HasValue && sa.AssignTo.HasValue && !updateAreaIds.Contains(sa.AreaId.Value))
                    .Any(sa => sa.Status != StockAreaStatus.Assigned);
                if (hasStartedAreas)
                    return ("Chỉ được xoá khu vực kiểm kê khi khu vực kiểm kê ở trạng thái đã phân công.".ToMessageForUser(), default);
            }

            bool allStocktakingAreaPending = stocktakingSheetExist.StocktakingAreas
                .Where(sa => sa.AreaId.HasValue && updateAreaIds.Contains(sa.AreaId.Value))
                .All(sa => sa.Status == StockAreaStatus.Pending);

            if (allStocktakingAreaPending)
            {
                stocktakingSheetExist.Status = StocktakingStatus.InProgress;
            }

            bool allRemoved = existingAreaDict.Keys.All(areaId => !updateAreaIds.Contains(areaId));

            if (allRemoved)
            {
                stocktakingSheetExist.Status = StocktakingStatus.Draft;
            }

            stocktakingSheetExist.StartTime = update.StartTime;

            if (!string.IsNullOrEmpty(update.Note))
                stocktakingSheetExist.Note = update.Note;

            stocktakingSheetExist.UpdateAt = DateTimeUtility.Now();
            var resultUpdate = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stocktakingSheetExist);
            if (resultUpdate == 0)
                return ("Cập nhật phiếu kiểm kê thất bại.".ToMessageForUser(), default);

            var (msg, _) = await _stocktakingAreaService.UpdateStocktakingAreaBulk(update.StocktakingSheetId, update.AreaIds);
            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            await CheckAndSendNotificationStocktakingArea(stocktakingSheetExist, update.AreaIds);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetExist.StocktakingSheetId });
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheetStatus<T>(T update, int? userId) where T : StocktakingSheetStatusUpdate
        {
            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(update.StocktakingSheetId);

            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            var oldAssignToList = stocktakingSheetExist.StocktakingAreas.Select(sa => sa.AssignTo).Distinct().ToList();
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                StocktakingSheetAssignStatus? assignStatusPayload = null;
                StocktakingSheetReAssignStatus? reAssignStatusPayload = null;
                string errorMessage;

                switch (update)
                {
                    case StocktakingSheetAssignStatus assignStatus:
                        assignStatusPayload = assignStatus;
                        errorMessage = await HandleAssignStatus(stocktakingSheetExist, assignStatus, userId);
                        break;
                    case StocktakingSheetReAssignStatus reAssignStatus:
                        reAssignStatusPayload = reAssignStatus;
                        errorMessage = await HandleReAssignStatus(stocktakingSheetExist, reAssignStatus, userId);
                        break;
                    case StocktakingSheetCancelStatus:
                        errorMessage = await HandleCancelStatus(stocktakingSheetExist, userId);
                        break;
                    case StocktakingSheetInProgressStatus inProgress:
                        errorMessage = await HandleInProgressStatus(stocktakingSheetExist, inProgress, userId);
                        break;
                    case StocktakingSheetCompletedStatus completedStatus:
                        errorMessage = await HandleCompletedStatus(stocktakingSheetExist, completedStatus.Note);
                        break;
                    default:
                        errorMessage = "Loại cập nhật trạng thái không hợp lệ.".ToMessageForUser();
                        break;
                }

                if (!string.IsNullOrEmpty(errorMessage))
                {
                    throw new Exception(errorMessage);
                }

                await _unitOfWork.CommitTransactionAsync();

                await HandleNotificationStatusChange(stocktakingSheetExist, oldAssignToList, assignStatusPayload, reAssignStatusPayload);

                return ("", new StocktakingSheeteResponse { StocktakingSheetId = update.StocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return (ex.Message.ToMessageForUser(), default);
            }
        }

        private async Task<string> HandleCompletedStatus(StocktakingSheet sheet, string noteUpdate)
        {
            if (sheet.Status != StocktakingStatus.Approved)
                return "Chỉ đươc chuyển sang trạng thái Hoàn thành khi phiếu kiểm kê ở trạng thái Đã duyệt.".ToMessageForUser();

            var updateMessage = await _stocktakingStatusDomainService.UpdateSheetStatusAsync(sheet, StocktakingStatus.Completed, noteUpdate);
            if (!string.IsNullOrEmpty(updateMessage))
                return updateMessage;

            var stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(sheet.StocktakingSheetId);
            if (!stocktakingAreas.Any())
                return "Phiếu kiểm kê chưa có khu vực nào được phân công.".ToMessageForUser();

            var areaIds = stocktakingAreas
                .Where(sa => sa.AreaId.HasValue)
                .Select(sa => sa.AreaId.Value)
                .Distinct()
                .ToList();

            if (!areaIds.Any())
                return "Không tìm thấy khu vực nào trong phiếu kiểm kê.".ToMessageForUser();

            var stocktakingLocations = await _stocktakingLocationRepository.GetLocationsByStockSheetIdAreaIdsAsync(
                sheet.StocktakingSheetId,
                areaIds);

            if (!stocktakingLocations.Any())
                return "Không tìm thấy vị trí kiểm kê nào.".ToMessageForUser();

            var stocktakingLocationIds = stocktakingLocations.Select(l => l.StocktakingLocationId).ToList();

            var stocktakingPallets = await _stocktakingPalletRepository.GetStocktakingPalletsByStocktakingLocationIds(stocktakingLocationIds);
            if (stocktakingPallets == null || !stocktakingPallets.Any())
                return "Không tìm thấy pallet kiểm kê nào.".ToMessageForUser();

            foreach (var stocktakingPallet in stocktakingPallets)
            {
                if (string.IsNullOrEmpty(stocktakingPallet.PalletId))
                    continue;

                var pallet = await _palletRepository.GetPalletById(stocktakingPallet.PalletId);
                if (pallet == null)
                    return $"Không tìm thấy pallet với mã {stocktakingPallet.PalletId} trong hệ thống.".ToMessageForUser();

                if (stocktakingPallet.ActualPackageQuantity.HasValue)
                {
                    pallet.PackageQuantity = stocktakingPallet.ActualPackageQuantity.Value;
                    pallet.UpdateAt = DateTimeUtility.Now();

                    if (pallet.PackageQuantity < 0)
                        return $"Số lượng pallet {stocktakingPallet.PalletId} không được âm.".ToMessageForUser();

                    if (pallet.PackageQuantity == 0 && pallet.LocationId.HasValue)
                    {
                        var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(pallet.LocationId, true);
                        if (!updateIsAvail)
                            return ("Cập nhật trạng thái vị trí khi pallet hết hàng thất bại.".ToMessageForUser());
                        pallet.Status = CommonStatus.Deleted;
                    }
                    pallet.UpdateAt = DateTimeUtility.Now();

                    var updatedPallet = await _palletRepository.UpdatePallet(pallet);
                    if (updatedPallet == null)
                        return $"Cập nhật số lượng pallet {stocktakingPallet.PalletId} thất bại.".ToMessageForUser();
                }
            }

            return string.Empty;
        }

        public async Task<(string, StocktakingSheeteResponse?)> DeleteStocktakingSheet(string stocktakingSheetId, int? userId)
        {
            if (string.IsNullOrEmpty(stocktakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.".ToMessageForUser(), default);

            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetForDeleteById(stocktakingSheetId);
            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            if (userId == null || stocktakingSheetExist.CreatedBy != userId)
                return ("Bạn không có quyền thực hiện xoá phiếu kiểm kê này.".ToMessageForUser(), default);

            if (stocktakingSheetExist.Status != StocktakingStatus.Draft)
                return ("Chỉ có thể xoá phiếu kiểm kê khi phiếu ở trạng thái Nháp".ToMessageForUser(), default);

            var resultDelete = await _stocktakingSheetRepository.DeleteStocktakingSheet(stocktakingSheetExist);
            if (resultDelete == 0)
                return ("Xoá phiếu kiểm kê thất bại.".ToMessageForUser(), default);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetId });
        }

        private bool IsBeforeEditDeadline(DateTime? startTime)
        {
            if (!startTime.HasValue) return false;
            return DateTimeUtility.Now() < startTime.Value.AddHours(-_hoursBeforeStartTime);
        }

        private bool IsWarehouseManager(StocktakingSheet sheet, int? userId)
        {
            return userId.HasValue && sheet.CreatedBy == userId;
        }

        private bool IsWarehouseStaff(StocktakingSheet sheet, int? userId)
        {
            return userId.HasValue && sheet.StocktakingAreas.Any(sa => sa.AssignTo == userId);
        }

        private async Task<string> HandleAssignStatus(StocktakingSheet sheet, StocktakingSheetAssignStatus assignStatus, int? userId)
        {
            if (!IsWarehouseManager(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            if (sheet.Status == StocktakingStatus.Cancelled)
            {
                return "Không thể phân công phiếu kiểm kê đã bị huỷ.".ToMessageForUser();
            }

            if (sheet.Status == StocktakingStatus.Assigned)
            {
                var HasAreasUnassigned = sheet.StocktakingAreas.Any(sa => !sa.AssignTo.HasValue);
                if (!HasAreasUnassigned)
                {
                    return "Phiếu kiểm kê đã được phân công đầy đủ.".ToMessageForUser();
                }

            }
            else
            {
                if (sheet.Status != StocktakingStatus.Draft)
                    return "Chỉ đươc chuyển sang trạng thái Đã phân công khi phiếu kiểm kê ở trạng thái Nháp.".ToMessageForUser();
            }

            var (msg, _) = await _stocktakingAreaService.UpdateStocktakingAreaBulk(assignStatus.StocktakingSheetId, assignStatus.StocktakingAreaAssign, "Assign");
            if (!string.IsNullOrEmpty(msg))
                return msg;

            var updateMessage = await _stocktakingStatusDomainService.UpdateSheetStatusAsync(sheet, StocktakingStatus.Assigned);
            if (!string.IsNullOrEmpty(updateMessage))
                return updateMessage;

            return string.Empty;
        }

        private async Task<string> HandleReAssignStatus(StocktakingSheet sheet, StocktakingSheetReAssignStatus reAssingStatus, int? userId)
        {
            if (!IsWarehouseManager(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            if (sheet.Status != StocktakingStatus.Assigned)
                return "Chỉ đươc được phân công lại khi phiếu kiểm kê ở trạng thái Đã phân công.".ToMessageForUser();

            var (msg, _) = await _stocktakingAreaService.UpdateStocktakingAreaBulk(sheet.StocktakingSheetId, reAssingStatus.StocktakingAreaReAssign, "ReAssign");
            if (!string.IsNullOrEmpty(msg))
                return msg;

            return string.Empty;
        }

        private async Task<string> HandleCancelStatus(StocktakingSheet sheet, int? userId)
        {
            if (!IsWarehouseManager(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            //if (sheet.Status == StocktakingStatus.Approved)
            //    return "Không thể Huỷ phiếu kiểm kê khi phiếu kiểm kê Đã được duyệt.".ToMessageForUser();

            if (sheet.Status == StocktakingStatus.Completed)
                return "Không thể Huỷ phiếu kiểm kê khi phiếu kiểm kê Đã hoàn thành.".ToMessageForUser();

            //if (!IsBeforeEditDeadline(sheet.StartTime))
            //    return $"Chỉ được chuyển sang trạng thái Huỷ khi phiếu kiểm kê trước thời gian bắt đầu {_hoursBeforeStartTime} giờ".ToMessageForUser();

            if (sheet.Status == StocktakingStatus.Completed)
                return "Không thể huỷ đơn kiểm kê khi đơn kiểm kê đã hoàn thành".ToMessageForUser();

            if (sheet.Status == StocktakingStatus.Approved)
                return "Không thể huỷ đơn kiểm kê khi đơn kiểm kê đã duyệt".ToMessageForUser();

            var cancelChildMessage = await CancelChildStocktakingEntities(sheet);
            if (!string.IsNullOrEmpty(cancelChildMessage))
                return cancelChildMessage;

            var updateMessage = await _stocktakingStatusDomainService.UpdateSheetStatusAsync(sheet, StocktakingStatus.Cancelled);
            if (!string.IsNullOrEmpty(updateMessage))
                return updateMessage;

            return string.Empty;
        }

        private async Task<string> HandleInProgressStatus(StocktakingSheet sheet, StocktakingSheetInProgressStatus inProgressStatus, int? userId)
        {
            if (!IsWarehouseStaff(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            //if (sheet.StartTime.HasValue && DateTimeUtility.Now() < sheet.StartTime.Value)
            //{
            //    var remaining = sheet.StartTime.Value - DateTimeUtility.Now();
            //    return $"Còn {remaining.Hours} giờ {remaining.Minutes} phút nữa đến thời gian bắt đầu kiểm kê.".ToMessageForUser();
            //}

            if (sheet.Status == StocktakingStatus.Completed || sheet.Status == StocktakingStatus.Cancelled)
                return "Không thể bắt đầu kiểm kê khi phiếu kiểm kê đã Hoàn thành hoặc Đã huỷ.".ToMessageForUser();

            if (inProgressStatus.StocktakingAreaId != Guid.Empty)
            {
                bool hasOtherActiveArea = sheet.StocktakingAreas.Any(sa =>
                    sa.AssignTo == userId &&
                    sa.StocktakingAreaId != inProgressStatus.StocktakingAreaId &&
                    (sa.Status == StockAreaStatus.Pending ||
                     sa.Status == StockAreaStatus.PendingApproval));

                if (hasOtherActiveArea)
                    return "Nhân viên chỉ được phép kiểm kê một khu vực tại một thời điểm."
                            .ToMessageForUser();
            }

            var stocktakingAreaOfAssignedStaff = sheet.StocktakingAreas
                .FirstOrDefault(sa =>
                                    sa.AssignTo == userId &&
                                    (inProgressStatus.StocktakingAreaId == null ||
                                    inProgressStatus.StocktakingAreaId == sa.StocktakingAreaId));

            if (stocktakingAreaOfAssignedStaff == null)
                return "Không tìm thấy khu vực được phân công cho nhân viên này.".ToMessageForUser();

            var (msg, _) = await _stocktakingAreaService.UpdateStocktakingAreaStatus(new StocktakingAreaPendingStatus
            {
                StocktakingAreaId = stocktakingAreaOfAssignedStaff.StocktakingAreaId,
            });

            if (!string.IsNullOrEmpty(msg))
                return "Cập nhật trạng thái kiểm kê khu vực thất bại";

            var stockLocationCreate = _mapper.Map<StocktakingLocationCreate>(stocktakingAreaOfAssignedStaff);

            (msg, _) = await _stocktakingLocationService.CreateStocktakingLocationBulk(stockLocationCreate);
            if (!string.IsNullOrEmpty(msg))
                return msg;

            var stockAreaIds = sheet.StocktakingAreas.Select(sa => sa.StocktakingAreaId).ToList();
            if (!stockAreaIds.Any())
                return "Phiếu kiểm kê chưa có khu vực nào được phân công.".ToMessageForUser();

            var hasAllStarted = await _stocktakingLocationRepository.AreExistStocklocationByAllStockAreaIdsAsync(stockAreaIds);
            var targetStatus = hasAllStarted ? StocktakingStatus.InProgress : StocktakingStatus.Assigned;
            var updateMessage = await _stocktakingStatusDomainService.UpdateSheetStatusAsync(sheet, targetStatus);
            if (!string.IsNullOrEmpty(updateMessage))
                return updateMessage;

            return string.Empty;
        }

        private async Task<string> CancelChildStocktakingEntities(StocktakingSheet sheet)
        {
            var stocktakingAreas = await _stocktakingAreaRepository.GetStocktakingAreasByStocktakingSheetId(sheet.StocktakingSheetId);
            if (stocktakingAreas == null || !stocktakingAreas.Any())
                return string.Empty;

            foreach (var area in stocktakingAreas)
            {
                area.Status = StockAreaStatus.Cancelled;
                area.UpdateAt = DateTimeUtility.Now();
            }

            var updateAreaResult = await _stocktakingAreaRepository.UpdateStocktakingAreaBulk(stocktakingAreas);
            if (updateAreaResult == null || updateAreaResult == 0)
                return "Cập nhật trạng thái khu vực kiểm kê thất bại.".ToMessageForUser();

            var areaIds = stocktakingAreas
                .Where(sa => sa.AreaId.HasValue)
                .Select(sa => sa.AreaId!.Value)
                .Distinct()
                .ToList();

            if (!areaIds.Any())
                return string.Empty;

            var stocktakingLocations = await _stocktakingLocationRepository.GetLocationsByStockSheetIdAreaIdsAsync(
                sheet.StocktakingSheetId,
                areaIds);

            if (stocktakingLocations == null || !stocktakingLocations.Any())
                return string.Empty;

            foreach (var location in stocktakingLocations)
            {
                location.Status = StockLocationStatus.Cancelled;
                location.UpdateAt = DateTimeUtility.Now();
            }

            var updateLocationResult = await _stocktakingLocationRepository.UpdateStocktakingLocationBulk(stocktakingLocations);
            if (updateLocationResult == 0)
                return "Cập nhật trạng thái kiểm kê vị trí thất bại.".ToMessageForUser();

            return string.Empty;
        }

        private async Task HandleNotificationStatusChange(
            StocktakingSheet sheet,
            List<int?> oldAssignToList,
            StocktakingSheetAssignStatus? assignStatus = null,
            StocktakingSheetReAssignStatus? reAssignStatus = null)
        {
            var notificationToCreates = new List<NotificationCreateDto>();
            var staffIds = sheet.StocktakingAreas
                .Where(sa => sa.AssignTo.HasValue)
                .Select(sa => sa.AssignTo.Value)
                .Distinct()
                .ToList();

            switch (sheet.Status)
            {
                case StocktakingStatus.Assigned:
                    var hasOldAssignments = oldAssignToList != null &&
                                            oldAssignToList.Any(assignTo => assignTo.HasValue);

                    if (!hasOldAssignments && assignStatus?.StocktakingAreaAssign != null)
                    {
                        var assignUserIds = assignStatus.StocktakingAreaAssign
                            .Select(sa => sa.AssignTo)
                            .Distinct()
                            .ToList();

                        foreach (var userId in assignUserIds)
                        {
                            notificationToCreates.Add(new NotificationCreateDto
                            {
                                UserId = userId,
                                Title = "Phiếu kiểm kê được phân công",
                                Content = $"Bạn đã được phân công kiểm kê trong phiếu kiểm kê '{sheet.StocktakingSheetId}'. Vui lòng kiểm tra và thực hiện đúng thời gian quy định.",
                                EntityType = NotificationEntityType.StocktakingSheet,
                                EntityId = sheet.StocktakingSheetId,
                            });
                        }
                    }
                    else if (hasOldAssignments && reAssignStatus?.StocktakingAreaReAssign != null)
                    {
                        var reAssignUserIds = reAssignStatus.StocktakingAreaReAssign
                            .Select(sa => sa.AssignTo)
                            .Distinct()
                            .ToList();

                        foreach (var userId in reAssignUserIds)
                        {
                            notificationToCreates.Add(new NotificationCreateDto
                            {
                                UserId = userId,
                                Title = "Phiếu kiểm kê được phân công",
                                Content = $"Bạn đã được phân công kiểm kê trong phiếu kiểm kê '{sheet.StocktakingSheetId}'. Vui lòng kiểm tra và thực hiện đúng thời gian quy định.",
                                EntityType = NotificationEntityType.StocktakingSheet,
                                EntityId = sheet.StocktakingSheetId,
                            });
                        }

                        var previousAssignUserIds = oldAssignToList?
                            .Where(id => id.HasValue)
                            .Select(id => id!.Value)
                            .Distinct()
                            .ToList() ?? new List<int>();

                        var removedUserIds = previousAssignUserIds
                            .Except(reAssignUserIds)
                            .ToList();

                        foreach (var userId in removedUserIds)
                        {
                            notificationToCreates.Add(new NotificationCreateDto
                            {
                                UserId = userId,
                                Title = "Phiếu kiểm kê thay đổi phân công",
                                Content = $"Bạn đã được gỡ khỏi phiếu kiểm kê '{sheet.StocktakingSheetId}'. Vui lòng liên hệ quản lý kho nếu cần thêm thông tin.",
                                EntityType = NotificationEntityType.NoNavigation,
                            });
                        }
                    }
                    break;
                case StocktakingStatus.Cancelled:
                    if (!staffIds.Any()) break;
                    foreach (var staffId in staffIds)
                    {
                        notificationToCreates.Add(new NotificationCreateDto
                        {
                            UserId = staffId,
                            Title = "Phiếu kiểm kê bị huỷ",
                            Content = $"Phiếu kiểm kê '{sheet.StocktakingSheetId}' đã bị huỷ. Vui lòng liên hệ quản lý kho để biết thêm chi tiết.",
                            EntityType = NotificationEntityType.StocktakingSheet,
                            EntityId = sheet.StocktakingSheetId,
                            Category = NotificationCategory.Important
                        });
                    }
                    break;
                case StocktakingStatus.Completed:
                    notificationToCreates.Add(new NotificationCreateDto
                    {
                        UserId = sheet.CreatedBy,
                        Title = "Phiếu kiểm kê đã hoàn thành",
                        Content = $"Phiếu kiểm kê '{sheet.StocktakingSheetId}' đã hoàn thành kiểm kê.",
                        EntityType = NotificationEntityType.StocktakingSheet,
                        EntityId = sheet.StocktakingSheetId,
                    });

                    if (!staffIds.Any()) break;
                    foreach (var staffId in staffIds)
                    {
                        notificationToCreates.Add(new NotificationCreateDto
                        {
                            UserId = staffId,
                            Title = "Phiếu kiểm kê đã hoàn thành",
                            Content = $"Phiếu kiểm kê '{sheet.StocktakingSheetId}' đã hoàn thành kiểm kê. Cảm ơn bạn đã hoàn thành nhiệm vụ được giao.",
                            EntityType = NotificationEntityType.StocktakingSheet,
                            EntityId = sheet.StocktakingSheetId,
                        });
                    }
                    break;
                default:
                    break;
            }

            if (notificationToCreates.Any())
            {
                await _notificationService.CreateNotificationBulk(notificationToCreates);
            }
        }

        private async Task CheckAndSendNotificationStocktakingArea(StocktakingSheet stocktakingSheetExist, List<StocktakingAreaCreateDto> areaIds)
        {
            Dictionary<int, int> areaDict = stocktakingSheetExist.StocktakingAreas
                .Where(sa => sa.AreaId.HasValue && sa.AssignTo.HasValue)
                .ToDictionary(sa => sa.AreaId!.Value, sa => sa.AssignTo!.Value);

            var updateAreaIds = areaIds.Select(a => a.AreaId).ToHashSet();

            foreach (var kv in areaDict)
            {
                var key = kv.Key;
                int? assignedTo = kv.Value;

                if (!assignedTo.HasValue)
                    continue;

                if (updateAreaIds.Contains(key))
                {
                    var notificationToCreate = new NotificationCreateDto
                    {
                        UserId = assignedTo.Value,
                        Title = "Cập nhật khu vực kiểm kê",
                        Content = $"Khu vực kiểm kê của bạn trong phiếu kiểm kê '{stocktakingSheetExist.StocktakingSheetId}' đã được cập nhật. Vui lòng kiểm tra lại thông tin khu vực kiểm kê.",
                        EntityType = NotificationEntityType.StocktakingSheet,
                        EntityId = stocktakingSheetExist.StocktakingSheetId,
                    };
                    await _notificationService.CreateNotification(notificationToCreate);
                    continue;
                }

                var notificationToRemoved = new NotificationCreateDto
                {
                    UserId = assignedTo.Value,
                    Title = "Phiếu kiểm kê thay đổi phân công",
                    Content = $"Bạn đã được gỡ khỏi phiếu kiểm kê '{stocktakingSheetExist.StocktakingSheetId}'. Vui lòng liên hệ quản lý kho nếu cần thêm thông tin.",
                    EntityType = NotificationEntityType.NoNavigation
                };

                await _notificationService.CreateNotification(notificationToRemoved);
            }
        }
    }
}
