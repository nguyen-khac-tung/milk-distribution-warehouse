using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingLocationService
    {
        Task<(string, StocktakingLocationCreate?)> CreateStocktakingLocationBulk(StocktakingLocationCreate create);
        Task<(string, StocktakingLocationResponse?)> UpdateStocktakingLocationStatus<T>(T update) where T : StocktakingLocationUpdateStatus;
        Task<(string, List<StocktakingLocationRejectStatus>?)> RejectStocktakingLocationBulk(List<StocktakingLocationRejectStatus> update);
        Task<(string, List<StocktakingLocationCancelStatus>?)> CancelStocktakingLocationBulk(List<StocktakingLocationCancelStatus> update);
        Task<(string, StocktakingLocationResponse?)> UpdateStocktakingLocation(StocktakingLocationUpdate update);
    }

    public class StocktakingLocationService : IStocktakingLocationService
    {
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IMapper _mapper;
        private readonly ILocationRepository _locationRepository;
        private readonly IStocktakingPalletService _stocktakingPalletService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IStocktakingPalletRepository _stocktakingPalletRepository;
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IStocktakingStatusDomainService _stocktakingStatusDomainService;
        private readonly INotificationService _notificationService;
        public StocktakingLocationService(IStocktakingLocationRepository stocktakingLocationRepository, IMapper mapper,
            ILocationRepository locationRepository, IStocktakingPalletService stocktakingPalletService, IUnitOfWork unitOfWork,
            IStocktakingPalletRepository stocktakingPalletRepository, IStocktakingAreaRepository stocktakingAreaRepository,
            IStocktakingStatusDomainService stocktakingStatusDomainService, 
            INotificationService notificationService)
        {
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _mapper = mapper;
            _locationRepository = locationRepository;
            _stocktakingPalletService = stocktakingPalletService;
            _unitOfWork = unitOfWork;
            _stocktakingPalletRepository = stocktakingPalletRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _stocktakingStatusDomainService = stocktakingStatusDomainService;
            _notificationService = notificationService;
        }

        public async Task<(string, StocktakingLocationCreate?)> CreateStocktakingLocationBulk(StocktakingLocationCreate create)
        {
            var locations = await _locationRepository.GetActiveLocationByAreaIdAsync(create.AreaId);

            if (!locations.Any())
                return ("Danh sách vị trí theo khu vực trống.", default);

            var anyStocktakingLocation = await _stocktakingLocationRepository.AnyStocktakingLocationByStockAreaId(create.StocktakingAreaId);
            if (anyStocktakingLocation)
                return ("Đã tồn tại các vị trí kiểm kê theo khu vực được phân công.".ToMessageForUser(), default);

            List<StocktakingLocation> stocktakingLocations = new List<StocktakingLocation>();
            List<StocktakingPalletCreate> stocktakingPalletCreates = new List<StocktakingPalletCreate>();

            foreach (var location in locations)
            {
                var stocktakingLocation = _mapper.Map<StocktakingLocation>(location);
                stocktakingLocation.StocktakingAreaId = create.StocktakingAreaId;

                stocktakingLocations.Add(stocktakingLocation);
                stocktakingPalletCreates.Add(new StocktakingPalletCreate
                {
                    StocktakingLocationId = stocktakingLocation.StocktakingLocationId,
                    LocationId = location.LocationId
                });
            }

            var createBulkStockLocationResult = await _stocktakingLocationRepository.CreateStocktakingLocationBulk(stocktakingLocations);

            if (createBulkStockLocationResult == 0)
                return ("Tạo vị trí kiểm kê thất bại.", default);

            var (msg, createBulkStockPallet) = await _stocktakingPalletService.CreateStocktakingPalletBulk(stocktakingPalletCreates);
            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            return ("", create);
        }

        public async Task<(string, StocktakingLocationResponse?)> UpdateStocktakingLocation(StocktakingLocationUpdate update)
        {
            if (update == null)
                return ("Dữ liệu cập nhật kiểm kê vị trí không hợp lệ.", default);

            var stocktakingLocationExist = await _stocktakingLocationRepository.GetStocktakingLocationById(update.StocktakingLocationId);
            if (stocktakingLocationExist == null)
                return ("Kiểm kê vị trí không tồn tại trong hệ thống.", default);

            stocktakingLocationExist.Note = update.Note;
            stocktakingLocationExist.UpdateAt = DateTimeUtility.Now();

            var updateResult = await _stocktakingLocationRepository.UpdateStocktakingLocation(stocktakingLocationExist);
            if (updateResult == 0)
                return ("Cập nhật trạng thái kiểm kê vị trí thất bại.", default);

            return ("", default);
        }

        public async Task<(string, StocktakingLocationResponse?)> UpdateStocktakingLocationStatus<T>(T update) where T : StocktakingLocationUpdateStatus
        {
            if (update == null)
                return ("Dữ liệu cập nhật kiểm kê vị trí không hợp lệ.", default);

            var stocktakingLocationExist = await _stocktakingLocationRepository.GetStocktakingLocationById(update.StocktakingLocationId);
            if (stocktakingLocationExist == null)
                return ("Kiểm kê vị trí không tồn tại trong hệ thống.", default);

            try
            {
                var errorMessage = update switch
                {
                    StocktakingLocationPendingStatus => HandleStocktakingLocationPending(stocktakingLocationExist),
                    StocktakingLocationCountedStatus => HandleStocktakingLocationCounted(stocktakingLocationExist),
                    StocktakingLocationPendingApprovalStatus => await HandleStocktakingLocationPendingApproval(stocktakingLocationExist),
                    _ => "Cập nhật kiểm kê vị trí thất bại."
                };

                var updateResult = await _stocktakingLocationRepository.UpdateStocktakingLocation(stocktakingLocationExist);
                if (updateResult == 0)
                    throw new Exception("Cập nhật trạng thái kiểm kê vị trí thất bại.", default);

                return ("", new StocktakingLocationResponse { StocktakingLocationId = update.StocktakingLocationId });
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, List<StocktakingLocationRejectStatus>?)> RejectStocktakingLocationBulk(List<StocktakingLocationRejectStatus> update)
        {
            if (!update.Any())
                return ("Danh sách từ chối kiểm kê trống.", default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var (msg, stocktakingLocations) = await ValidationStocktakingLocationUpdateBulk(update, StockLocationStatus.PendingApproval);
                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                (msg, _) = await DeleteStocktakingPalletBulk(update);
                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                var stocktakingPalletCreates = update.Select(sl => new StocktakingPalletCreate
                {
                    StocktakingLocationId = sl.StocktakingLocationId,
                    LocationId = sl.LocationId
                }).ToList();

                (msg, _) = await _stocktakingPalletService.CreateStocktakingPalletBulk(stocktakingPalletCreates);
                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                var rejectMap = update.ToDictionary(x => x.StocktakingLocationId, x => x.RejectReason);

                foreach (var itemLocation in stocktakingLocations)
                {
                    if (rejectMap.TryGetValue(itemLocation.StocktakingLocationId, out var reason))
                    {
                        itemLocation.RejectReason = reason;
                    }
                }

                var updateStocktakingLocationBulksResult = await _stocktakingLocationRepository.UpdateStocktakingLocationBulk(stocktakingLocations);

                if (updateStocktakingLocationBulksResult == 0)
                    throw new Exception("Cập nhật trạng thái của kiểm kể vị trí thất bại.");

                var stocktakingAreaId = stocktakingLocations.FirstOrDefault().StocktakingAreaId;


                msg = await UpdateStocktakingAreaStatus((Guid)stocktakingAreaId, StockAreaStatus.Pending);
                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                await _unitOfWork.CommitTransactionAsync();

                var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingAreaId((Guid)stocktakingAreaId);

                await HandleStocktakingLocationNotificationStatusChange(stocktakingArea);

                return ("", update);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        private Task<string> UpdateStocktakingAreaStatus(Guid stocktakingAreaId, int statusChange)
        {
            return _stocktakingStatusDomainService.UpdateAreaStatusAsync(stocktakingAreaId, statusChange);
        }

        public async Task<(string, List<StocktakingLocationCancelStatus>?)> CancelStocktakingLocationBulk(List<StocktakingLocationCancelStatus> update)
        {
            if (!update.Any())
                return ("Danh sách từ chối kiểm kê trống.", default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var (msg, stocktakingLocations) = await ValidationStocktakingLocationUpdateBulk(update, StockLocationStatus.Counted);
                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                (msg, _) = await DeleteStocktakingPalletBulk(update);
                if (!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                var stocktakingPalletCreates = update.Select(sl => new StocktakingPalletCreate
                {
                    StocktakingLocationId = sl.StocktakingLocationId,
                    LocationId = sl.LocationId
                }).ToList();

                (msg, _) = await _stocktakingPalletService.CreateStocktakingPalletBulk(stocktakingPalletCreates);
                //if (!string.IsNullOrEmpty(msg))
                //    throw new Exception(msg);

                var updateStocktakingLocationBulksResult = await _stocktakingLocationRepository.UpdateStocktakingLocationBulk(stocktakingLocations);

                if (updateStocktakingLocationBulksResult == 0)
                    throw new Exception("Cập nhật trạng thái của kiểm kể vị trí thất bại.");

                await _unitOfWork.CommitTransactionAsync();
                return ("", update);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        private async Task<(string, int?)> DeleteStocktakingPalletBulk<T>(List<T> rejectStatuses) where T : StocktakingLocationUpdateStatus
        {
            var stocktakingLocationIds = rejectStatuses.Select(sl => sl.StocktakingLocationId).ToList();

            var stocktakingPallets = await _stocktakingPalletRepository.GetStocktakingPalletsByStocktakingLocationIds(stocktakingLocationIds);

            if (!stocktakingPallets.Any())
                return ("", default);

            var deleteStocktakingPalletBulkResult = await _stocktakingPalletRepository.DeleteStocktakingPalletBulk(stocktakingPallets);
            if (deleteStocktakingPalletBulkResult == 0)
                return ("Xoá danh sách kiểm kê kệ kê hàng thất bại.", default);

            return ("", deleteStocktakingPalletBulkResult);
        }

        private async Task<(string, List<StocktakingLocation>?)> ValidationStocktakingLocationUpdateBulk<T>(List<T> rejectStatuses, int statusCheck) where T : StocktakingLocationUpdateStatus
        {
            var stocktakingLocations = new List<StocktakingLocation>();

            foreach (var item in rejectStatuses)
            {
                var stocktakingLocation = await _stocktakingLocationRepository.GetStocktakingLocationById(item.StocktakingLocationId);
                if (stocktakingLocation == null)
                    return ($"Kiểm kê vị trí có mã [{item.StocktakingLocationId}] không tồn tại trong hệ thống.", default);

                if (statusCheck == StockLocationStatus.PendingApproval && stocktakingLocation.Status != StockLocationStatus.PendingApproval)
                    return ("Chỉ được từ chối kiểm kê vị trí khi kiểm kê vị trí ở trạng thái Chờ duyệt.".ToMessageForUser(), default);

                if (statusCheck == StockLocationStatus.Counted && stocktakingLocation.Status != StockLocationStatus.Counted)
                    return ("Chỉ được kiểm kê lại vị trí khi kiểm kê vị trí ở trạng thái Đã kiểm.".ToMessageForUser(), default);

                stocktakingLocation.Status = StockLocationStatus.Pending;
                stocktakingLocation.UpdateAt = DateTimeUtility.Now();
                stocktakingLocations.Add(stocktakingLocation);
            }
            return ("", stocktakingLocations);
        }

        private async Task<string> HandleStocktakingLocationPendingApproval(StocktakingLocation update)
        {
            update.Status = StockLocationStatus.PendingApproval;
            return "";
        }

        private string HandleStocktakingLocationPending(StocktakingLocation update)
        {
            update.Status = StockLocationStatus.Pending;
            return "";
        }

        private string HandleStocktakingLocationCounted(StocktakingLocation update)
        {
            update.Status = StockLocationStatus.Counted;
            return "";
        }

        private async Task HandleStocktakingLocationNotificationStatusChange(StocktakingArea stocktakingArea)
        {
            var notificationToCreate = new NotificationCreateDto();

            if (stocktakingArea.Status == StockAreaStatus.Pending)
            {
                notificationToCreate.UserId = stocktakingArea.AssignTo;
                notificationToCreate.Title = $"Khu vực kiểm kê '{stocktakingArea.Area.AreaName}' đã bị từ chối";
                notificationToCreate.Content = $"Khu vực kiểm kê '{stocktakingArea.Area.AreaName}' của bạn đã bị từ chối do có sai lệch hoặc yêu cầu điều chỉnh. Vui lòng kiểm tra và thực hiện lại.";
                notificationToCreate.EntityType = NotificationEntityType.StocktakingAreaStaff;
                notificationToCreate.EntityId = stocktakingArea.StocktakingSheetId;
                notificationToCreate.Category = NotificationCategory.Important;
            }

            if (notificationToCreate.UserId != null)
            {
                await _notificationService.CreateNotification(notificationToCreate);
            }
        }
    }
}
