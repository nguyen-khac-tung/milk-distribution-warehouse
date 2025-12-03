using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingStatusDomainService
    {
        Task<string> UpdateLocationStatusAsync(Guid stocktakingLocationId, int statusChange);
        Task<string> UpdateAreaStatusAsync(Guid stocktakingAreaId, int statusChange);
        Task<string> UpdateAreaStatusAsync(StocktakingArea stocktakingArea, int statusChange);
        Task<string> UpdateSheetStatusAsync(StocktakingSheet stocktakingSheet, int statusChange, string? note = null);
    }

    public class StocktakingStatusDomainService : IStocktakingStatusDomainService
    {
        private readonly IStocktakingLocationRepository _stocktakingLocationRepository;
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;

        public StocktakingStatusDomainService(IStocktakingLocationRepository stocktakingLocationRepository,
            IStocktakingAreaRepository stocktakingAreaRepository,
            IStocktakingSheetRepository stocktakingSheetRepository)
        {
            _stocktakingLocationRepository = stocktakingLocationRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
        }

        public async Task<string> UpdateLocationStatusAsync(Guid stocktakingLocationId, int statusChange)
        {
            if (stocktakingLocationId == Guid.Empty)
                return "Mã kiểm kê vị trí không hợp lệ.";

            var stocktakingLocationExist = await _stocktakingLocationRepository.GetStocktakingLocationById(stocktakingLocationId);
            if (stocktakingLocationExist == null)
                return "Kiểm kê vị trí không tồn tại trong hệ thống.";

            if (stocktakingLocationExist.Status == statusChange)
                return string.Empty;

            stocktakingLocationExist.Status = statusChange;
            stocktakingLocationExist.UpdateAt = DateTimeUtility.Now();

            var updateResult = await _stocktakingLocationRepository.UpdateStocktakingLocation(stocktakingLocationExist);
            if (updateResult == 0)
                return "Cập nhật trạng thái kiểm kê vị trí thất bại.";

            return string.Empty;
        }

        public async Task<string> UpdateAreaStatusAsync(Guid stocktakingAreaId, int statusChange)
        {
            var stocktakingArea = await _stocktakingAreaRepository.GetStocktakingAreaByStocktakingAreaId(stocktakingAreaId);
            if (stocktakingArea == null)
                return "Kiểm kê khu vực trống.";

            stocktakingArea.Status = statusChange;
            stocktakingArea.UpdateAt = DateTimeUtility.Now();

            var updateResult = await _stocktakingAreaRepository.UpdateStocktakingArea(stocktakingArea);
            if (updateResult == 0)
                return "Cập nhật trạng thái của kiểm kê khu vực thất bại.";

            await TryUpdateStockSheetStatusAsync(stocktakingArea.StocktakingSheetId);

            return string.Empty;
        }

        public async Task<string> UpdateAreaStatusAsync(StocktakingArea stocktakingArea, int statusChange)
        {
            if (stocktakingArea == null)
                return "Kiểm kê khu vực trống.";

            if (stocktakingArea.Status != statusChange)
                stocktakingArea.Status = statusChange;

            stocktakingArea.UpdateAt = DateTimeUtility.Now();

            var updateResult = await _stocktakingAreaRepository.UpdateStocktakingArea(stocktakingArea);
            if (updateResult == 0)
                return "Cập nhật trạng thái của kiểm kê khu vực thất bại.";

            await TryUpdateStockSheetStatusAsync(stocktakingArea.StocktakingSheetId);

            return string.Empty;
        }

        public async Task<string> UpdateSheetStatusAsync(StocktakingSheet stocktakingSheet, int statusChange, string? note = null)
        {
            if (stocktakingSheet == null)
                return "Phiếu kiểm kê không tồn tại.";

            stocktakingSheet.Status = statusChange;

            if (!string.IsNullOrEmpty(note))
                stocktakingSheet.Note = note;

            stocktakingSheet.UpdateAt = DateTimeUtility.Now();

            var updateResult = await _stocktakingSheetRepository.UpdateStockingtakingSheet(stocktakingSheet);
            if (updateResult == 0)
                return "Cập nhật trạng thái phiếu kiểm kê thất bại.";

            return string.Empty;
        }

        private async Task TryUpdateStockSheetStatusAsync(string stocktakingSheetId)
        {
            if (string.IsNullOrEmpty(stocktakingSheetId))
                return;

            var isAllStockAreaPending = await _stocktakingAreaRepository.AllStockAreaPending(stocktakingSheetId);
            if (!isAllStockAreaPending)
                return;

            var stockSheet = await _stocktakingSheetRepository.GetStocktakingSheetById(stocktakingSheetId);
            if (stockSheet == null)
                return;

            if (stockSheet.Status == StocktakingStatus.InProgress)
                return;

            stockSheet.Status = StocktakingStatus.InProgress;
            stockSheet.UpdateAt = DateTimeUtility.Now();

            await _stocktakingSheetRepository.UpdateStockingtakingSheet(stockSheet);
        }
    }
}

