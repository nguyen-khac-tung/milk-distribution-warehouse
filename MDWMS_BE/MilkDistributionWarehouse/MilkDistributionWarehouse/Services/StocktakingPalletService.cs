using AutoMapper;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingPalletService
    {
        Task<(string, List<StocktakingPalletCreate>?)> CreateStocktakingPalletBulk(List<StocktakingPalletCreate> creates);
    }
    public class StocktakingPalletService : IStocktakingPalletService
    {
        private readonly IMapper _mapper;
        private readonly IStocktakingPalletRepository _stocktakingPalletRepository;
        private readonly IPalletRepository _palletRepository;
        public StocktakingPalletService(IMapper mapper, IStocktakingPalletRepository stocktakingPalletRepository, IPalletRepository palletRepository)
        {
            _mapper = mapper;
            _stocktakingPalletRepository = stocktakingPalletRepository;
            _palletRepository = palletRepository;
        }

        public async Task<(string, List<StocktakingPalletCreate>?)> CreateStocktakingPalletBulk(List<StocktakingPalletCreate> creates)
        {
            if (!creates.Any())
                return ("Dữ liệu tạo kiểm kê kệ hàng không hợp lệ.", default);

            var locationIds = creates.Select(c => c.LocationId).ToList();

            var pallets = await _palletRepository.GetActivePalletIdsByLocationId(locationIds);

            if (!pallets.Any())
                return ("Dữ liệu kệ kê hàng trống.", default);

            List<StocktakingPallet> stocktakingPallets = new List<StocktakingPallet>();

            var locationToStocktaking = creates
                .GroupBy(g => g.LocationId)
                .ToDictionary(g => g.Key, g => g.First().StocktakingLocationid);

            foreach (var pallet in pallets)
            {
                if(pallet.LocationId.HasValue && locationToStocktaking.TryGetValue(pallet.LocationId.Value, out var stocktakingLocationId))
                {
                    var stocktakingPallet = _mapper.Map<StocktakingPallet>(pallet);
                    stocktakingPallet.StocktakingLocationId = stocktakingLocationId;
                    stocktakingPallets.Add(stocktakingPallet);
                }
            }

            var createResult = await _stocktakingPalletRepository.CreateStocktakingPalletBulk(stocktakingPallets);
            if (createResult == 0)
                return ("Tạo kiểm kê kệ kê hàng thất bại.", default);

            return ("", creates);
        }
    }
}
