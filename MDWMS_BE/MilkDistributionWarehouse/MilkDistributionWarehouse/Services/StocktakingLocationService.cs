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
            var locations = await _locationRepository.GetUnavailableLocationByAreaIdAsync(create.AreaId);

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
    }
}
