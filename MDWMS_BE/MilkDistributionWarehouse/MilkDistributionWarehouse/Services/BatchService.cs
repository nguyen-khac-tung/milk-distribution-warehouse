using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Http.HttpResults;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IBatchService
    {
        Task<(string, PageResult<BatchDto>?)> GetBatchList(PagedRequest request);
        Task<(string, List<BatchDropDownDto>?)> GetBatchDropDown(int goodsId);
        Task<(string, BatchDto?)> CreateBatch(BatchCreateDto createDto);
        Task<(string, BatchDto?)> UpdateBatch(BatchUpdateDto updateDto);
        Task<(string, BatchUpdateStatusDto?)> UpdateBatchStatus(BatchUpdateStatusDto updateDto);
        Task<string> DeleteBatch(Guid batchId);
    }

    public class BatchService : IBatchService
    {
        private readonly IBatchRepository _batchRepository;
        private readonly IGoodsRepository _goodsRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IMapper _mapper;

        public BatchService(IBatchRepository batchRepository,
                            IGoodsRepository goodsRepository,
                            IStocktakingSheetRepository stocktakingSheetRepository,
                            IMapper mapper)
        {
            _batchRepository = batchRepository;
            _goodsRepository = goodsRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<BatchDto>?)> GetBatchList(PagedRequest request)
        {
            var batchs = _batchRepository.GetBatchs();

            if (request.Filters != null && request.Filters.Any())
            {
                var fromDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "fromdate");
                var toDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "todate");
                DateOnly.TryParse(fromDate.Value, out DateOnly startDate);
                DateOnly.TryParse(toDate.Value, out DateOnly endDate);
                batchs = batchs.Where(b => (startDate == default || b.ExpiryDate >= startDate) &&
                                                     (endDate == default || b.ExpiryDate <= endDate));
                if (fromDate.Key != null) request.Filters.Remove(fromDate.Key);
                if (toDate.Key != null) request.Filters.Remove(toDate.Key);
            }

            var batchDtos = batchs.ProjectTo<BatchDto>(_mapper.ConfigurationProvider);

            var batchDtosResult = await batchDtos.ToPagedResultAsync(request);

            if (!batchDtosResult.Items.Any())
                return ("Danh sách lô trống.", null);

            return ("", batchDtosResult);
        }

        public async Task<(string, List<BatchDropDownDto>?)> GetBatchDropDown(int goodsId)
        {
            if (goodsId <= 0)
                return ("Goods Id is not found.", null);

            var batches = await _batchRepository.GetActiveBatchesByGoodsId(goodsId);

            if (!batches.Any())
                return ("Không tìm thấy lô hàng nào cho sản phẩm này.".ToMessageForUser(), null);

            var batchDropDowns = _mapper.Map<List<BatchDropDownDto>>(batches);

            return ("", batchDropDowns);
        }

        public async Task<(string, BatchDto?)> CreateBatch(BatchCreateDto createDto)
        {
            if (createDto == null) return ("Batch create is null.", null);

            var goodsExist = await _goodsRepository.GetGoodsByGoodsId(createDto.GoodsId);
            if (goodsExist == null) return ("Sản phẩm được chọn không tồn tại.".ToMessageForUser(), null);
            if (goodsExist != null && goodsExist.Status == CommonStatus.Inactive) return ("Sản phẩm được chọn đã ngừng phân phối.".ToMessageForUser(), null);

            var (msg, isDuplicate) = await _batchRepository.IsBatchCodeDuplicate(null, createDto.GoodsId, createDto.BatchCode);
            if (msg.Length > 0) return (msg, null);
            if (isDuplicate) return ("Mã lô đã tồn tại trong nhà cung cấp của sản phẩm này.".ToMessageForUser(), null);

            if (createDto.ExpiryDate <= createDto.ManufacturingDate)
                return ("Ngày hết hạn phải sau ngày sản xuất.".ToMessageForUser(), null);

            if (createDto.ManufacturingDate > DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày sản xuất phải là ngày trong quá khứ.".ToMessageForUser(), null);

            if (createDto.ExpiryDate <= DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày hết hạn phải là ngày trong tương lai.".ToMessageForUser(), null);

            var batchEntity = _mapper.Map<Batch>(createDto);
            var message = await _batchRepository.CreateBatch(batchEntity);
            if (message.Length > 0) return ("Tạo mới lô hàng thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<BatchDto>(batchEntity));
        }

        public async Task<(string, BatchDto?)> UpdateBatch(BatchUpdateDto updateDto)
        {
            var message = "";
            if (updateDto == null) return ("Batch update is null.", null);

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể cập nhật lô hàng khi đang có đợt kiểm kê đang diễn ra.".ToMessageForUser(), null);

            var batchExist = await _batchRepository.GetBatchById(updateDto.BatchId);
            if (batchExist == null) return ("Lô hàng không tồn tại.".ToMessageForUser(), null);

            var goodsExist = await _goodsRepository.GetGoodsByGoodsId(updateDto.GoodsId);
            if (goodsExist == null) return ("Sản phẩm được chọn không tồn tại.".ToMessageForUser(), null);
            if (goodsExist != null && goodsExist.Status == CommonStatus.Inactive) return ("Sản phẩm được chọn đã ngừng phân phối.".ToMessageForUser(), null);

            var (msg, isDuplicate) = await _batchRepository.IsBatchCodeDuplicate(updateDto.BatchId, updateDto.GoodsId, updateDto.BatchCode);
            if (msg.Length > 0) return (msg, null);
            if (isDuplicate) return ("Mã lô đã tồn tại trong nhà cung cấp của sản phẩm này.".ToMessageForUser(), null);

            if (await _batchRepository.IsBatchOnPallet(batchExist.BatchId))
            {
                message = await ValidateUpdateBatchCondition(batchExist, updateDto);
                if (message.Length > 0) return (message, null);
            }

            if (updateDto.ExpiryDate <= updateDto.ManufacturingDate)
                return ("Ngày hết hạn phải sau ngày sản xuất.".ToMessageForUser(), null);

            if (updateDto.ManufacturingDate > DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày sản xuất phải là ngày trong quá khứ.".ToMessageForUser(), null);

            if (updateDto.ExpiryDate <= DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày hết hạn phải là ngày trong tương lai.".ToMessageForUser(), null);

            _mapper.Map(updateDto, batchExist);
            message = await _batchRepository.UpdateBatch(batchExist);
            if (message.Length > 0) return ("Cập nhật lô hàng thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<BatchDto>(batchExist));
        }

        public async Task<(string, BatchUpdateStatusDto?)> UpdateBatchStatus(BatchUpdateStatusDto updateDto)
        {
            var batchExist = await _batchRepository.GetBatchById(updateDto.BatchId);
            if (batchExist == null) return ("Batch update is null.", null);

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể cập nhật lô hàng khi đang có đợt kiểm kê đang diễn ra.".ToMessageForUser(), null);

            if (batchExist.Status == CommonStatus.Deleted || updateDto.Status == CommonStatus.Deleted)
                return ("Không thể cập nhật trạng thái của lô đã xóa hoặc chuyển sang trạng thái đã xóa.".ToMessageForUser(), null);

            bool isBatchOnPalletActive = await _batchRepository.IsBatchOnPalletActive(updateDto.BatchId);
            if (updateDto.Status == CommonStatus.Inactive && isBatchOnPalletActive)
                return ("Không thể vô hiệu hóa lô hàng vì đang được sử dụng trên pallet.".ToMessageForUser(), null);

            batchExist.Status = updateDto.Status;
            batchExist.UpdateAt = DateTimeUtility.Now();

            var result = await _batchRepository.UpdateBatch(batchExist);
            if (result == null)
                return ("Cập nhật trạng thái lô hàng thất bại.".ToMessageForUser(), null);

            return ("", updateDto);
        }

        public async Task<string> DeleteBatch(Guid batchId)
        {
            var batchExist = await _batchRepository.GetBatchById(batchId);
            if (batchExist == null) return "Batch update is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể cập nhật lô hàng khi đang có đợt kiểm kê đang diễn ra.".ToMessageForUser();

            if (await _batchRepository.IsBatchOnPallet(batchId))
                return "Không thể xóa lô hàng vì lô đã được sử dụng".ToMessageForUser();

            batchExist.Status = CommonStatus.Deleted;
            batchExist.UpdateAt = DateTimeUtility.Now();

            var result = await _batchRepository.UpdateBatch(batchExist);
            if (result == null)
                return "Xóa lô hàng thất bại.".ToMessageForUser();

            return "";
        }

        private async Task<string> ValidateUpdateBatchCondition(Batch oldBatch, BatchUpdateDto newBatch)
        {
            var today = DateOnly.FromDateTime(DateTimeUtility.Now());

            if (oldBatch.ExpiryDate <= today)
                return "Không thể cập nhật lô hàng đã hết hạn".ToMessageForUser();

            var isBatchInGRN = await _batchRepository.IsBatchInGoodReceiptNote(oldBatch.BatchId);
            var isBatchInGIN = await _batchRepository.IsBatchInGoodIssueNote(oldBatch.BatchId);

            if (oldBatch.BatchCode != newBatch.BatchCode && (isBatchInGRN || isBatchInGIN))
                return "Không thể cập nhật mã lô hàng vì lô hàng đang được sử dụng".ToMessageForUser();

            if (oldBatch.GoodsId != newBatch.GoodsId && (isBatchInGRN || isBatchInGIN))
                return "Không thể cập nhật mã hàng hóa vì lô hàng đang được sử dụng".ToMessageForUser();

            if (oldBatch.ManufacturingDate != newBatch.ManufacturingDate && isBatchInGIN)
                return "Không thể cập nhật ngày sản xuất vì lô hàng đang được sử dụng.".ToMessageForUser();

            if (oldBatch.ExpiryDate != newBatch.ExpiryDate && isBatchInGIN)
                return "Không thể cập nhật ngày hết hạn vì lô hàng đang được sử dụng.".ToMessageForUser();

            return "";
        }
    }
}
