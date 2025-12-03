using AutoMapper;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingPalletService
    {
        Task<(string, List<StocktakingPalletDto>?)> GetStocktakingPalletByStocktakingLocationId(Guid stocktakingLocationId);
        Task<(string, List<StocktakingPalletDto>?)> GetStocktakingPalletByLocationCode(string locationCode, Guid stocktakingLocationId);
        Task<(string, List<StocktakingPalletCreate>?)> CreateStocktakingPalletBulk(List<StocktakingPalletCreate> creates);
        Task<(string, StocktakingPalletUpdateStatus?)> UpdateStocktakingPalletStauts<T>(T update) where T : StocktakingPalletUpdateStatus;
        Task<(string, StocktakingPalletResponse?)> DeleteStocktakingPallet(Guid stocktakingPalletId);
        Task<(string, StocktakingPalletDto?)> ScannerStocktakingPallet(StocktakingPalletScanner scanner);
        Task<(string, StocktakingPalletDto?)> UndoStocktakingPallet(Guid stocktakingPalletId);
    }
    public class StocktakingPalletService : IStocktakingPalletService
    {
        private readonly IMapper _mapper;
        private readonly IStocktakingPalletRepository _stocktakingPalletRepository;
        private readonly IPalletRepository _palletRepository;
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IStocktakingStatusDomainService _stocktakingStatusDomainService;
        public StocktakingPalletService(IMapper mapper, IStocktakingPalletRepository stocktakingPalletRepository,
            IPalletRepository palletRepository, IStocktakingLocationRepository stocktakingLocationRepository,
            IStocktakingStatusDomainService stocktakingStatusDomainService)
        {
            _mapper = mapper;
            _stocktakingPalletRepository = stocktakingPalletRepository;
            _palletRepository = palletRepository;
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _stocktakingStatusDomainService = stocktakingStatusDomainService;
        }

        public async Task<(string, List<StocktakingPalletDto>?)> GetStocktakingPalletByStocktakingLocationId(Guid stocktakingLocationId)
        {
            if (stocktakingLocationId == Guid.Empty)
                return ("Mã kiểm kê kệ kê hàng không hợp lệ.", default);

            var (msg, stocktakingPalletMap) = await GetStockPalletByStocktakingLocationId(stocktakingLocationId);
            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            return ("", stocktakingPalletMap);
        }

        public async Task<(string, List<StocktakingPalletDto>?)> GetStocktakingPalletByLocationCode(string locationCode, Guid stocktakingLocationId)
        {
            if (string.IsNullOrEmpty(locationCode))
                return ("Mã vị trí không hợp lệ.", default);

            if (stocktakingLocationId == Guid.Empty)
                return ("Mã kiểm kê vị trí không hợp lệ.", default);

            var isExistStocktakingLocation = await _stocktakingLocationRepository.IsExistStocktakingLocationByStockLocationIdAndLocationCode(stocktakingLocationId, locationCode);
            if (!isExistStocktakingLocation)
                return ($"Không tồn tại kiểm kê vị trí có mã vị trí [{locationCode}].".ToMessageForUser(), null);

            var (msg, stocktakingPalletMap) = await GetStockPalletByStocktakingLocationId(stocktakingLocationId);
            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            return ("", stocktakingPalletMap);
        }

        public async Task<(string, StocktakingPalletDto?)> ScannerStocktakingPallet(StocktakingPalletScanner scanner)
        {
            var stocktakingPalletExist = await _stocktakingPalletRepository.GetStocktakingPalletByStockLocationIdAndPalletId(scanner.StocktakingLocationId, scanner.PalletId);
            if (stocktakingPalletExist == null)
            {
                var stocktakingLocation = await _stocktakingLocationRepository.GetStocktakingLocationById(scanner.StocktakingLocationId);
                if (stocktakingLocation == null)
                    return ("Dữ liệu kiểm kê vị trí trống.", default);

                var palletInOther = await _stocktakingPalletRepository.GetScannedPalletInOtherLocationAsync(scanner.PalletId, scanner.StocktakingLocationId, (Guid)stocktakingLocation.StocktakingAreaId);
                if (palletInOther != null)
                    return ($"Kệ kê hàng đã được quét ở vị trí có mã vị trí {palletInOther.StocktakingLocation.Location.LocationCode.ToString()}".ToMessageForUser(), default);

                var palletExist = await _palletRepository.GetPalletById(scanner.PalletId);
                if (palletExist == null)
                    return ($"Không tìm thấy kệ kê hàng với mã kệ kê hàng [{scanner.PalletId}]", default);

                if (palletExist.Status != CommonStatus.Active)
                    return ($"Kệ kê hàng có mã [{scanner.PalletId}] hiện đang không sử dụng.", default);
                
                var stocktakingPalletCreate = _mapper.Map<StocktakingPallet>(palletExist);
                stocktakingPalletCreate.StocktakingLocationId = scanner.StocktakingLocationId;

                var hasUnscannedPalletInOtherLocationAsync = await _stocktakingPalletRepository.HasUnscannedPalletInOtherLocationAsync(scanner.PalletId, scanner.StocktakingLocationId, (Guid)stocktakingLocation.StocktakingAreaId);
                if(hasUnscannedPalletInOtherLocationAsync) 
                    stocktakingPalletCreate.Status = StockPalletStatus.Mislocated;
                else
                    stocktakingPalletCreate.Status = StockPalletStatus.Surplus;

                var createResult = await _stocktakingPalletRepository.CreateStocktakingPallet(stocktakingPalletCreate);
                if (createResult == null) return ("Tạo kệ kê hàng thất bại.", default);

                var stocktakingPalletMap = _mapper.Map<StocktakingPalletDto>(createResult);

                return ("", stocktakingPalletMap);
            }
            else
            {
                var stocktakingLocation = await _stocktakingLocationRepository.GetStocktakingLocationById(scanner.StocktakingLocationId);
                if (stocktakingLocation == null)
                    return ("Dữ liệu kiểm kê vị trí trống.", default);

                var palletInOther = await _stocktakingPalletRepository
                    .GetScannedPalletInOtherLocationAsync(scanner.PalletId, scanner.StocktakingLocationId,
                        (Guid)stocktakingLocation.StocktakingAreaId);

                if (palletInOther != null)
                    return ($"Kệ kê hàng đã được quét ở vị trí có mã vị trí {palletInOther.StocktakingLocation.Location.LocationCode}".ToMessageForUser(), default);

                stocktakingPalletExist.Status = StockPalletStatus.Matched;
                stocktakingPalletExist.UpdateAt = DateTimeUtility.Now();

                var updateResult = await _stocktakingPalletRepository.UpdateStocktakingPallet(stocktakingPalletExist);
                if (updateResult == 0)
                    return ("Cập nhật kiểm kê kệ kê hàng thất bại.", default);

                var stocktakingPalletMap = _mapper.Map<StocktakingPalletDto>(stocktakingPalletExist);

                return ("", stocktakingPalletMap);
            }
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
                .ToDictionary(g => g.Key, g => g.First().StocktakingLocationId);

            foreach (var pallet in pallets)
            {
                if (pallet.LocationId.HasValue && locationToStocktaking.TryGetValue(pallet.LocationId.Value, out var stocktakingLocationId))
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

        public async Task<(string, StocktakingPalletUpdateStatus?)> UpdateStocktakingPalletStauts<T>(T update) where T : StocktakingPalletUpdateStatus
        {
            if (update.StocktakingPalletId == Guid.NewGuid())
                return ("Mã kiểm kệ kê hàng không hợp lệ.", default);

            var stocktakingPalletExist = await _stocktakingPalletRepository.GetStocktakingPalletByStocktakingPalletId(update.StocktakingPalletId);

            if (stocktakingPalletExist == null)
                return ("Dư liệu kiểm kê kệ hàng không tồn tại.", default);

            string errorMessage = update switch
            {
                StocktakingPalletMissingStatus missingStatus => await HandleStocktakingPalletMissing(stocktakingPalletExist, missingStatus),
                StocktakingPalletMatchStatus matchStatus => await HandleStocktakingPalletMathch(stocktakingPalletExist, matchStatus),
                StocktakingPalletSurplusStatus suplusStatus => await HandleStocktakingPalletSuplus(stocktakingPalletExist, suplusStatus),
                StocktakingPalletMislocatedStatus mislocatedStatus => await HandleStocktakingPalletMislocated(stocktakingPalletExist, mislocatedStatus),
                _ => "Cập nhật kiểm kê kệ kê hàng thất bại."
            };

            if (!string.IsNullOrEmpty(errorMessage))
                return (errorMessage.ToMessageForUser(), default);

            var updateResult = await _stocktakingPalletRepository.UpdateStocktakingPallet(stocktakingPalletExist);
            if (updateResult == 0)
                return ("Cập nhật kiểm kê kệ kê hàng thất bại.", default);

            return ("", update);
        }



        public async Task<(string, StocktakingPalletResponse?)> DeleteStocktakingPallet(Guid stocktakingPalletId)
        {
            if (stocktakingPalletId == Guid.Empty) return ("Mã kiểm kê kệ kê hàng không hợp lệ.", default);

            var stocktakingPalletExist = await _stocktakingPalletRepository.GetStocktakingPalletByStocktakingPalletId(stocktakingPalletId);
            if (stocktakingPalletExist == null)
                return ("Không tồn tại kiểm kê kệ kê hàng.".ToMessageForUser(), default);

            var deleteResult = await _stocktakingPalletRepository.DeleteStockPallet(stocktakingPalletExist);
            if (deleteResult == 0) return ("Xoá kiểm kê kệ kê hàng thất bại.".ToMessageForUser(), default);

            if (stocktakingPalletExist.StocktakingLocationId == Guid.Empty)
                return ("Mã kiểm kê vị trí không hợp lệ.", default);

            var msg = await _stocktakingStatusDomainService.UpdateLocationStatusAsync((Guid)stocktakingPalletExist.StocktakingLocationId, StockLocationStatus.Pending);
            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            return ("", new StocktakingPalletResponse { StocktakingPalletId = stocktakingPalletId });
        }

        public async Task<(string, StocktakingPalletDto?)> UndoStocktakingPallet(Guid stocktakingPalletId)
        {
            var stocktakingPalletExist = await _stocktakingPalletRepository.GetStocktakingPalletByStocktakingPalletId(stocktakingPalletId);
            if (stocktakingPalletExist == null)
                return ("Kiểm kê kệ kê hàng không tồn tại trong hệ thống.", default);

            stocktakingPalletExist.ActualPackageQuantity = null;
            stocktakingPalletExist.Note = null;
            stocktakingPalletExist.Status = StockPalletStatus.Unscanned;
            stocktakingPalletExist.UpdateAt = null;

            var updateResult = await _stocktakingPalletRepository.UpdateStocktakingPallet(stocktakingPalletExist);
            if (updateResult == 0) return ("Cập nhật kiểm kê kệ kê hàng thất bại.", default);

            if (stocktakingPalletExist.StocktakingLocationId == Guid.Empty)
                return ("Mã kiểm kê vị trí không hợp lệ.", default);

            var msg = await _stocktakingStatusDomainService.UpdateLocationStatusAsync((Guid)stocktakingPalletExist.StocktakingLocationId, StockLocationStatus.Pending);
            if (!string.IsNullOrEmpty(msg))
                return (msg, default);

            var stocktakingPalletMap = _mapper.Map<StocktakingPalletDto>(stocktakingPalletExist);
            return ("", stocktakingPalletMap);
        }

        private async Task<string> HandleStocktakingPalletMislocated(StocktakingPallet stocktakingPalletExist, StocktakingPalletMislocatedStatus mislocatedStatus)
        {
            if (mislocatedStatus.ActualPackageQuantity < 0)
                return "Số lượng thực tế hàng hoá trong kệ kê hàng không được nhỏ hơn 0.";

            _mapper.Map(mislocatedStatus, stocktakingPalletExist);
            stocktakingPalletExist.UpdateAt = DateTimeUtility.Now();

            return await MarkLocationAsCounted(stocktakingPalletExist);
        }

        private async Task<string> HandleStocktakingPalletSuplus(StocktakingPallet stocktakingPalletExist, StocktakingPalletSurplusStatus suplusStatus)
        {
            if (suplusStatus.ActualPackageQuantity < 0)
                return "Số lượng thực tế hàng hoá trong kệ kê hàng không được nhỏ hơn 0.";

            _mapper.Map(suplusStatus, stocktakingPalletExist);
            stocktakingPalletExist.UpdateAt = DateTimeUtility.Now();

            return await MarkLocationAsCounted(stocktakingPalletExist);
        }

        private async Task<string> HandleStocktakingPalletMathch(StocktakingPallet stocktakingPalletExist, StocktakingPalletMatchStatus matchStatus)
        {
            if (matchStatus.ActualPackageQuantity < 0)
                return "Số lượng thực tế hàng hoá trong kệ kê hàng không được nhỏ hơn 0.";

            _mapper.Map(matchStatus, stocktakingPalletExist);
            stocktakingPalletExist.UpdateAt = DateTimeUtility.Now();

            return await MarkLocationAsCounted(stocktakingPalletExist);
        }

        private async Task<string> HandleStocktakingPalletMissing(StocktakingPallet stocktakingPalletExist, StocktakingPalletMissingStatus missingStatus)
        {
            _mapper.Map(missingStatus, stocktakingPalletExist);
            stocktakingPalletExist.UpdateAt = DateTimeUtility.Now();

            return await MarkLocationAsCounted(stocktakingPalletExist);
        }

        private async Task<(string, List<StocktakingPalletDto>?)> GetStockPalletByStocktakingLocationId(Guid stocktakingLocationId)
        {
            var stocktakingPallet = await _stocktakingPalletRepository.GetStocktakingPalletByStocktakingLocationId(stocktakingLocationId);
            if (stocktakingPallet == null)
                return ("Dữ liệu kiểm kê kệ hàng không tồn tại.".ToMessageForUser(), default);

            var stocktakingPalletMap = _mapper.Map<List<StocktakingPalletDto>>(stocktakingPallet);
            return ("", stocktakingPalletMap);
        }

        private async Task<string> MarkLocationAsCounted(StocktakingPallet stocktakingPalletExist)
        {
            if (stocktakingPalletExist.StocktakingLocationId == Guid.Empty)
                return "Mã kiểm kê vị trí không hợp lệ.";

            return await _stocktakingStatusDomainService.UpdateLocationStatusAsync(
                (Guid)stocktakingPalletExist.StocktakingLocationId,
                StockLocationStatus.Counted);
        }
    }
}
