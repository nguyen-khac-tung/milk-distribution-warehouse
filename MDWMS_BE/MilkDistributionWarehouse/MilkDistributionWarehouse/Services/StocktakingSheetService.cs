using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Http.HttpResults;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingSheetService
    {
        Task<(string, PageResult<StocktakingSheetDto>?)> GetStocktakingSheets(PagedRequest request, string roleName, int? userId);
        Task<(string, StocktakingSheetDetail?)> GetStocktakingSheetDetail(Guid stocktakingSheetId);
        Task<(string, StocktakingSheeteResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId);
        Task<(string, StocktakingSheeteResponse?)> DeleteStocktakingSheet(Guid stocktakingSheetId, int? userId);
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
        private readonly int hoursBeforeStartTime = StocktakingSettings.HoursBeforeStartToAllowEdit;
        private readonly IStocktakingLocationService _stocktakingLocationService;
        public StocktakingSheetService(IMapper mapper, IStocktakingSheetRepository stocktakingSheetRepository,
            IStocktakingAreaRepository stocktakingAreaRepository,
            IUnitOfWork unitOfWork, IAreaRepository areaRepository,
            IStocktakingAreaService stocktakingAreaService, IStocktakingLocationService stocktakingLocationService)
        {
            _mapper = mapper;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _unitOfWork = unitOfWork;
            _areaRepository = areaRepository;
            _stocktakingAreaService = stocktakingAreaService;
            _stocktakingLocationService = stocktakingLocationService;
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
                    return ("Bạn không có quyền xem danh sách kiểm kê.", default);
            }

            var stocktakingSheetMap = stocktakingSheetQuery.ProjectTo<StocktakingSheetDto>(_mapper.ConfigurationProvider);

            var items = await stocktakingSheetMap.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách phiếu kiểm kê trống.".ToMessageForUser(), default);

            return ("", items);
        }

        public async Task<(string, StocktakingSheetDetail?)> GetStocktakingSheetDetail(Guid stocktakingSheetId)
        {
            if (stocktakingSheetId == Guid.Empty)
                return ("Mã phiếu kiểm kê không hợp lệ.", default);

            var stocktakingSheetDetail = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stocktakingSheetDetail == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            var stocktakingSheetMap = _mapper.Map<StocktakingSheetDetail>(stocktakingSheetDetail);

            return ("", stocktakingSheetMap);
        }

        public async Task<(string, StocktakingSheeteResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId)
        {
            if (create == null) return ("Dữ liệu tạo phiếu kiểm kê trống.", default);

            if (userId == null) return ("Bạn không có quyền tạo phiếu kiểm kê.", default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (create.StartTime <= DateTime.Now)
                    throw new Exception("Thời gian bắt đầu phải là thời gian trong thương lai.");

                var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(null, create.StartTime);
                if (isDuplicationStartTime)
                    throw new Exception("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.");

                var stocktakingSheetMap = _mapper.Map<StocktakingSheet>(create);

                stocktakingSheetMap.CreatedBy = userId;

                var resultCreate = await _stocktakingSheetRepository.CreateStocktakingSheet(stocktakingSheetMap);
                if (resultCreate == 0)
                    throw new Exception("Tạo phiếu nhập kho thất bại.");

                await _unitOfWork.CommitTransactionAsync();
                return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetMap.StocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}".ToMessageForUser(), default);
            }
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheet(StocktakingSheetUpdate update, int? userId)
        {
            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(update.StocktakingSheetId);

            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            if (stocktakingSheetExist.CreatedBy != userId)
                return ("Bạn không có quyền cập nhập phiếu kiểm kê.", default);

            var timeNow = DateTime.Now;
            var startTime = stocktakingSheetExist.StartTime;

            bool isBefore6Hours = startTime.HasValue && timeNow < startTime.Value.AddHours(-hoursBeforeStartTime);

            var currentStatus = stocktakingSheetExist.Status;

            if (currentStatus == StocktakingStatus.Assigned && !isBefore6Hours)
                return ($"Không thể cập nhật thông tin. Vui lòng thực hiện chỉnh sửa trong vòng {hoursBeforeStartTime} tiếng trước thời điểm bắt đầu kiểm kê.".ToMessageForUser(), default);

            var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(update.StocktakingSheetId, update.StartTime);
            if (isDuplicationStartTime)
                return ("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.", default);

            stocktakingSheetExist.StartTime = startTime;

            if (!string.IsNullOrEmpty(update.Note))
                stocktakingSheetExist.Note = update.Note;

            var resultUpdate = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stocktakingSheetExist);
            if (resultUpdate == 0)
                return ("Cập nhật phiếu kiểm kê thất bại.", default);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetExist.StocktakingSheetId });
        }

        public async Task<(string, StocktakingSheeteResponse?)> UpdateStocktakingSheetStatus<T>(T update, int? userId) where T : StocktakingSheetStatusUpdate
        {
            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(update.StocktakingSheetId);

            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            var currentStatus = stocktakingSheetExist.Status;
            var isPermissionWarehouseManager = userId != null && stocktakingSheetExist.CreatedBy == userId;
            var isPermissionWarehouseStaff = userId != null && stocktakingSheetExist.StocktakingAreas.Any(sa => sa.AssignTo == userId);

            var messagePermission = "Bạn không có quyền thực hiện chức năng cập nhật trạng thái trong phiếu kiểm kê.".ToMessageForUser();

            var timeNow = DateTime.Now;
            var startTime = stocktakingSheetExist.StartTime;

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (update is StocktakingSheetAssignStatus sheetAssignStatus)
                {
                    if (!isPermissionWarehouseManager)
                        throw new Exception(messagePermission);

                    if (currentStatus != StocktakingStatus.Draft)
                        throw new Exception("Chỉ đươc chuyển sang trạng thái Đã phân công khi phiếu kiểm kê ở trạng thái Nháp.".ToMessageForUser());

                    var (msg, stocktakingSheetId) = await _stocktakingAreaService.CreateStocktakingAreaBulk(update.StocktakingSheetId, sheetAssignStatus.StocktakingAreaCreates);
                    if (!string.IsNullOrEmpty(msg))
                        throw new Exception(msg);

                    stocktakingSheetExist.Status = StocktakingStatus.Assigned;
                }

                if (update is StocktakingSheetCancelStatus)
                {
                    if (!isPermissionWarehouseManager)
                        throw new Exception(messagePermission);

                    if (currentStatus != StocktakingStatus.Assigned)
                        throw new Exception("Chỉ được chuyển sang trạng thái Huỷ khi phiếu kiểm kê ở trạng thái Đã phân công.".ToMessageForUser());

                    var isBefore6Hours = startTime.HasValue && timeNow < startTime.Value.AddMilliseconds(-hoursBeforeStartTime);

                    if (!isBefore6Hours)
                        throw new Exception($"Chỉ được chuyển sang trạng thái Huỷ khi phiếu kiểm kê trước thời gian bắt đầu {hoursBeforeStartTime} giờ".ToMessageForUser());

                    stocktakingSheetExist.Status = StocktakingStatus.Cancelled;
                }

                if (update is StocktakingSheetInProgressStatus)
                {
                    if (!isPermissionWarehouseStaff)
                        throw new Exception(messagePermission);

                    if (currentStatus != StocktakingStatus.Assigned)
                        throw new Exception("Chỉ được chuyển sang trạng thái Đang kiểm kê khi phiếu kiểm kê ở trạng thái Đã phân công.".ToMessageForUser());


                    if (startTime.HasValue && timeNow < startTime.Value)
                    {
                        TimeSpan remaining = startTime.Value - timeNow;

                        double totalHours = remaining.TotalHours;
                        double totalMinutes = remaining.TotalMinutes;
                        
                        throw new Exception($"Còn {remaining.Hours} giờ {remaining.Minutes} phút nữa đến thời gian bắt đầu kiểm kê.".ToMessageForUser());
                    }

                    var stockLocationCreate = _mapper.Map<List<StocktakingLocationCreate>>(stocktakingSheetExist.StocktakingAreas);

                    foreach (var stockLocation in stockLocationCreate) {
                        var (msg, stockLocationResult) = await _stocktakingLocationService.CreateStocktakingLocationBulk(stockLocation);
                        if(!string.IsNullOrEmpty(msg)) 
                            throw new Exception(msg);
                    }
                    
                    stocktakingSheetExist.Status = StocktakingStatus.InProgress;
                }

                var updateResult = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stocktakingSheetExist);
                if (updateResult == 0)
                    throw new Exception("Cập nhật trạng thái phiếu kiểm kê thất bại.".ToMessageForUser());

                await _unitOfWork.CommitTransactionAsync();
                return ("", new StocktakingSheeteResponse { StocktakingSheetId = update.StocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }
        public async Task<(string, StocktakingSheeteResponse?)> DeleteStocktakingSheet(Guid stocktakingSheetId, int? userId)
        {
            if (stocktakingSheetId == Guid.Empty)
                return ("Mã phiếu kiểm kê không hợp lệ.", default);

            var stocktakingSheetExist = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stocktakingSheetExist == null)
                return ("Phiếu kiểm kê không tồn tại.".ToMessageForUser(), default);

            if (userId == null || stocktakingSheetExist.CreatedBy != userId)
                return ("Bạn không có quyền thực hiện xoá phiếu kiểm kê này.", default);

            if (stocktakingSheetExist.Status != StocktakingStatus.Draft)
                return ("Chỉ có thể xoá phiếu kiểm kê khi phiếu ở trạng thái Nháp".ToMessageForUser(), default);

            var resultDelete = await _stocktakingSheetRepository.DeleteStocktakingSheet(stocktakingSheetExist);
            if (resultDelete == 0)
                return ("Xoá phiếu kiểm kê thất bại.", default);

            return ("", new StocktakingSheeteResponse { StocktakingSheetId = stocktakingSheetId });
        }
    }
}
