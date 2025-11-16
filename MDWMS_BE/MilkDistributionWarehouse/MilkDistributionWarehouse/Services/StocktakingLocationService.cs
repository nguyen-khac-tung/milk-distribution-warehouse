using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingLocationService
    {
        Task<(string, StocktakingLocationCreate?)> CreateStocktakingLocationBulk(StocktakingLocationCreate create);
        Task<(string, StocktakingLocationResponse?)> UpdateStocktakingLocationStatus<T>(T update) where T : StocktakingLocationUpdateStatus;
    }

    public class StocktakingLocationService : IStocktakingLocationService
    {
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IMapper _mapper;
        private readonly ILocationRepository _locationRepository;
        private readonly IStocktakingPalletService _stocktakingPalletService;
        public StocktakingLocationService(IStocktakingLocationRepository stocktakingLocationRepository, IMapper mapper,
            ILocationRepository locationRepository, IStocktakingPalletService stocktakingPalletService)
        {
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _mapper = mapper;
            _locationRepository = locationRepository;
            _stocktakingPalletService = stocktakingPalletService;
        }

        public async Task<(string, StocktakingLocationCreate?)> CreateStocktakingLocationBulk(StocktakingLocationCreate create)
        {
            var locations = await _locationRepository.GetActiveLocationByAreaIdAsync(create.AreaId);

            if (!locations.Any())
                return ("Danh sách vị trí theo khu vực trống.", default);

            var anyStocktakingLocation = await _stocktakingLocationRepository.AnyStocktakingLocationByStockAreaId(create.StocktakingAreaId);
            if (anyStocktakingLocation)
                return ("Đã tồn tại các vị trí kiểm kê theo khu vực được phân công.", default);

            List<StocktakingLocation> stocktakingLocations = new List<StocktakingLocation>();
            List<StocktakingPalletCreate> stocktakingPalletCreates = new List<StocktakingPalletCreate>();

            foreach (var location in locations)
            {
                var stocktakingLocation = _mapper.Map<StocktakingLocation>(location);
                stocktakingLocation.StocktakingAreaId = create.StocktakingAreaId;

                stocktakingLocations.Add(stocktakingLocation);
                stocktakingPalletCreates.Add(new StocktakingPalletCreate
                {
                    StocktakingLocationid = stocktakingLocation.StocktakingLocationId,
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

        public async Task<(string, StocktakingLocationResponse?)> UpdateStocktakingLocationStatus<T> (T update) where T : StocktakingLocationUpdateStatus
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

                return ("", new StocktakingLocationResponse { StocktakingLocationId = update.StocktakingLocationId});
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
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

    }
}
