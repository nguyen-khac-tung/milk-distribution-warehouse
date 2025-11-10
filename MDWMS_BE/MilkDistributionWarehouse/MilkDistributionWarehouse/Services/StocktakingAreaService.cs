using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingAreaService
    {

    }
    public class StocktakingAreaService : IStocktakingAreaService
    {
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        public StocktakingAreaService(IStocktakingAreaRepository stocktakingAreaRepository)
        {
            _stocktakingAreaRepository = stocktakingAreaRepository;
        }

    }
}
