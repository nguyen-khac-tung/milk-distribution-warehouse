using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingSheetService
    {
        Task<(string, PageResult<StocktakingSheetDto>?)> GetStocktakingSheets(PagedRequest request, string roleName, int? userId);
        Task<(string, StocktakingSheetDetail?)> GetStocktakingSheetDetail(string stocktakingSheetId);
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

        public StocktakingSheetService(IMapper mapper, IStocktakingSheetRepository stocktakingSheetRepository,
            IStocktakingAreaRepository stocktakingAreaRepository,
            IUnitOfWork unitOfWork, IAreaRepository areaRepository,
            IStocktakingAreaService stocktakingAreaService, IStocktakingLocationService stocktakingLocationService,
            IStocktakingLocationRepository stocktakingLocationRepository)
        {
            _mapper = mapper;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _unitOfWork = unitOfWork;
            _areaRepository = areaRepository;
            _stocktakingAreaService = stocktakingAreaService;
            _stocktakingLocationService = stocktakingLocationService;
            _stocktakingLocationRepository = stocktakingLocationRepository;
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
                        StocktakingStatus.Cancelled
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
                CanViewStocktakingArea = roleName == RoleNames.WarehouseManager || roleName == RoleNames.SalesManager
            ? ss.StocktakingAreas.Any(sa => sa.StocktakingLocations.Any())
            : ss.StocktakingAreas.Any(sa => sa.AssignTo == userId && sa.StocktakingLocations.Any())
            });

            var items = await queryDto.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách phiếu kiểm kê trống.".ToMessageForUser(), default);

            return ("", items);
        }

        public async Task<(string, StocktakingSheetDetail?)> GetStocktakingSheetDetail(string stocktakingSheetId)
        {
            if (string.IsNullOrEmpty(stocktakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.".ToMessageForUser(), default);

            var stocktakingSheetDetail = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stocktakingSheetDetail == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            var stocktakingSheetMap = _mapper.Map<StocktakingSheetDetail>(stocktakingSheetDetail);

            return ("", stocktakingSheetMap);
        }

        public async Task<(string, StocktakingSheeteResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId)
        {
            if (create == null) return ("Dữ liệu tạo phiếu kiểm kê trống.".ToMessageForUser(), default);

            if (userId == null) return ("Bạn không có quyền tạo phiếu kiểm kê.".ToMessageForUser(), default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (create.StartTime <= DateTime.Now)
                    throw new Exception("Thời gian bắt đầu phải là thời gian trong tương lai.".ToMessageForUser());

                var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(null, create.StartTime);
                if (isDuplicationStartTime)
                    throw new Exception("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.".ToMessageForUser());

                var stocktakingSheetMap = _mapper.Map<StocktakingSheet>(create);

                stocktakingSheetMap.CreatedBy = userId;

                var resultCreate = await _stocktakingSheetRepository.CreateStocktakingSheet(stocktakingSheetMap);
                if (resultCreate == 0)
                    throw new Exception("Tạo phiếu kiểm kê thất bại.".ToMessageForUser());

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

            var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(update.StocktakingSheetId, update.StartTime);
            if (isDuplicationStartTime)
                return ("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.".ToMessageForUser(), default);

            stocktakingSheetExist.StartTime = update.StartTime;

            if (!string.IsNullOrEmpty(update.Note))
                stocktakingSheetExist.Note = update.Note;

            stocktakingSheetExist.UpdateAt = DateTime.Now;
            var resultUpdate = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stocktakingSheetExist);
            if (resultUpdate == 0)
                return ("Cập nhật phiếu kiểm kê thất bại.".ToMessageForUser(), default);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetExist.StocktakingSheetId });
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheetStatus<T>(T update, int? userId) where T : StocktakingSheetStatusUpdate
        {
            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(update.StocktakingSheetId);

            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                string errorMessage = update switch
                {
                    StocktakingSheetAssignStatus assignStatus => await HandleAssignStatus(stocktakingSheetExist, assignStatus, userId),
                    StocktakingSheetReAssignStatus reAssingStatus => await HandleReAssignStatus(stocktakingSheetExist, reAssingStatus, userId),
                    StocktakingSheetCancelStatus => HandleCancelStatus(stocktakingSheetExist, userId),
                    StocktakingSheetInProgressStatus => await HandleInProgressStatus(stocktakingSheetExist, userId),
                    _ => "Loại cập nhật trạng thái không hợp lệ.".ToMessageForUser()
                };

                if (!string.IsNullOrEmpty(errorMessage))
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return (errorMessage, default);
                }

                var updateResult = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stocktakingSheetExist);
                if (updateResult == 0)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return ("Cập nhật trạng thái phiếu kiểm kê thất bại.".ToMessageForUser(), default);
                }

                await _unitOfWork.CommitTransactionAsync();
                return ("", new StocktakingSheeteResponse { StocktakingSheetId = update.StocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return (ex.Message.ToMessageForUser(), default);
            }
        }

        public async Task<(string, StocktakingSheeteResponse?)> DeleteStocktakingSheet(string stocktakingSheetId, int? userId)
        {
            if (string.IsNullOrEmpty(stocktakingSheetId))
                return ("Mã phiếu kiểm kê không hợp lệ.".ToMessageForUser(), default);

            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
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
            return DateTime.Now < startTime.Value.AddHours(-_hoursBeforeStartTime);
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

            if (sheet.Status != StocktakingStatus.Draft)
                return "Chỉ đươc chuyển sang trạng thái Đã phân công khi phiếu kiểm kê ở trạng thái Nháp.".ToMessageForUser();

            var (msg, _) = await _stocktakingAreaService.CreateStocktakingAreaBulk(assignStatus.StocktakingSheetId, assignStatus.StocktakingAreaAssign);
            if (!string.IsNullOrEmpty(msg))
                return msg;

            sheet.Status = StocktakingStatus.Assigned;

            return string.Empty;
        }

        private async Task<string> HandleReAssignStatus(StocktakingSheet sheet, StocktakingSheetReAssignStatus reAssingStatus, int? userId)
        {
            if (!IsWarehouseManager(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            if (sheet.Status != StocktakingStatus.Assigned)
                return "Chỉ đươc được phân công lại khi phiếu kiểm kê ở trạng thái Đã phân công.".ToMessageForUser();

            var (msg, _) = await _stocktakingAreaService.UpdateStocktakingAreaBulk(sheet.StocktakingSheetId, reAssingStatus.StocktakingAreaReAssign);
            if (!string.IsNullOrEmpty(msg))
                return msg;

            return string.Empty;
        }

        private string HandleCancelStatus(StocktakingSheet sheet, int? userId)
        {
            if (!IsWarehouseManager(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            if (sheet.Status != StocktakingStatus.Assigned)
                return "Chỉ được chuyển sang trạng thái Huỷ khi phiếu kiểm kê ở trạng thái Đã phân công.".ToMessageForUser();

            if (!IsBeforeEditDeadline(sheet.StartTime))
                return $"Chỉ được chuyển sang trạng thái Huỷ khi phiếu kiểm kê trước thời gian bắt đầu {_hoursBeforeStartTime} giờ".ToMessageForUser();

            sheet.Status = StocktakingStatus.Cancelled;
            return string.Empty;
        }

        private async Task<string> HandleInProgressStatus(StocktakingSheet sheet, int? userId)
        {
            if (!IsWarehouseStaff(sheet, userId))
                return "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            if (sheet.Status != StocktakingStatus.Assigned)
                return "Chỉ được chuyển sang trạng thái Đang kiểm kê khi phiếu kiểm kê ở trạng thái Đã phân công.".ToMessageForUser();

            //if (sheet.StartTime.HasValue && DateTime.Now < sheet.StartTime.Value)
            //{
            //    var remaining = sheet.StartTime.Value - DateTime.Now;
            //    return $"Còn {remaining.Hours} giờ {remaining.Minutes} phút nữa đến thời gian bắt đầu kiểm kê.".ToMessageForUser();
            //}

            var stocktakingAreaOfAssignedStaff = sheet.StocktakingAreas.FirstOrDefault(sa => sa.AssignTo == userId);
            if (stocktakingAreaOfAssignedStaff == null)
                return "Không tìm thấy khu vực được phân công cho nhân viên này.".ToMessageForUser();

            var (msg, _) = await _stocktakingAreaService.UpdateStocktakingAreaStatus(new StocktakingAreaUpdateStatus
            {
                StocktakingAreaId = stocktakingAreaOfAssignedStaff.StocktakingAreaId,
                Status = StockAreaStatus.Pending,
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
            sheet.Status = hasAllStarted ? StocktakingStatus.InProgress : StocktakingStatus.Assigned;
            sheet.UpdateAt = DateTime.Now;

            return string.Empty;
        }
    }
}
