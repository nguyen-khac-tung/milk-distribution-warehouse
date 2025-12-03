using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

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
        private readonly IMapper _mapper;

        public BatchService(IBatchRepository batchRepository,
                            IGoodsRepository goodsRepository,
                            IMapper mapper)
        {
            _batchRepository = batchRepository;
            _goodsRepository = goodsRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<BatchDto>?)> GetBatchList(PagedRequest request)
        {
            var batchs = _batchRepository.GetBatchs();

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
            if (createDto == null)
                return ("Batch create is null.", null);

            if (createDto.ExpiryDate <= createDto.ManufacturingDate)
                return ("Ngày hết hạn phải sau ngày sản xuất.".ToMessageForUser(), null);

            if (createDto.ManufacturingDate > DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày sản xuất phải là ngày trong quá khứ.".ToMessageForUser(), null);

            if (createDto.ExpiryDate <= DateOnly.FromDateTime(DateTimeUtility.Now()))
                return ("Ngày hết hạn phải là ngày trong tương lai.".ToMessageForUser(), null);

            var goodsExist = await _goodsRepository.GetGoodsByGoodsId(createDto.GoodsId);
            if (goodsExist == null)
                return ("Sản phẩm được chọn không tồn tại.".ToMessageForUser(), null);

            var (msg, isDuplicate) = await _batchRepository.IsBatchCodeDuplicate(null, createDto.GoodsId, createDto.BatchCode);
            if (msg.Length > 0) return (msg, null);
            if (isDuplicate) return ("Mã lô đã tồn tại trong nhà cung cấp của sản phẩm này.".ToMessageForUser(), null);

            var batchEntity = _mapper.Map<Batch>(createDto);
            var message = await _batchRepository.CreateBatch(batchEntity);
            if (message.Length > 0) return ("Tạo mới lô hàng thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<BatchDto>(batchEntity));
        }

        public async Task<(string, BatchDto?)> UpdateBatch(BatchUpdateDto updateDto)
        {
            if (updateDto == null)
                return ("Batch update is null.", null);

            var batchExist = await _batchRepository.GetBatchById(updateDto.BatchId);
            if (batchExist == null)
                return ("Lô hàng không tồn tại.".ToMessageForUser(), null);

            if (updateDto.ExpiryDate <= updateDto.ManufacturingDate)
                return ("Ngày hết hạn phải sau ngày sản xuất.".ToMessageForUser(), null);

            var (msg, isDuplicate) = await _batchRepository.IsBatchCodeDuplicate(updateDto.BatchId, updateDto.GoodsId, updateDto.BatchCode);
            if (msg.Length > 0) return (msg, null);
            if (isDuplicate) return ("Mã lô đã tồn tại trong nhà cung cấp của sản phẩm này.".ToMessageForUser(), null);

            _mapper.Map(updateDto, batchExist);
            var message = await _batchRepository.UpdateBatch(batchExist);
            if (message.Length>0 ) return ("Cập nhật lô hàng thất bại.".ToMessageForUser(), null);

            return ("", _mapper.Map<BatchDto>(batchExist));
        }

        public async Task<(string, BatchUpdateStatusDto?)> UpdateBatchStatus(BatchUpdateStatusDto updateDto)
        {
            var batchExist = await _batchRepository.GetBatchById(updateDto.BatchId);
            if (batchExist == null)
                return ("Batch update is null.", null);

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
            if (batchExist == null)
                return "Batch update is null.";

            if (await _batchRepository.IsBatchOnPallet(batchId))
                return "Không thể xóa lô hàng vì đang được liên kết với pallet.".ToMessageForUser();

            batchExist.Status = CommonStatus.Deleted;
            batchExist.UpdateAt = DateTimeUtility.Now();

            var result = await _batchRepository.UpdateBatch(batchExist);
            if (result == null)
                return "Xóa lô hàng thất bại.".ToMessageForUser();

            return "";
        }
    }
}
