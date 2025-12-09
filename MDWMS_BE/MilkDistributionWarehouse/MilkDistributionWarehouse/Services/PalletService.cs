using AutoMapper;
using AutoMapper.QueryableExtensions;
using DocumentFormat.OpenXml.Spreadsheet;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Linq;

namespace MilkDistributionWarehouse.Services
{
    public interface IPalletService
    {
        Task<(string, PageResult<PalletDto.PalletResponseDto>)> GetPallets(PagedRequest request);
        Task<(string, PalletDto.PalletDetailDto)> GetPalletById(string palletId);
        Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int? userId);
        Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(string palletId, PalletDto.PalletRequestDto dto, int? userID);
        Task<(string, PalletDto.PalletResponseDto)> DeletePallet(string palletId);
        Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown();
        Task<(string, List<PalletDto.PalletResponseDto>)> GetPalletByGRNID(string grnId);
        Task<(string, PalletDto.PalletUpdateStatusDto)> UpdatePalletStatus(PalletDto.PalletUpdateStatusDto update);
        Task<(string, PalletDto.PalletUpdateStatusDto)> UpdatePalletQuantity(string palletId, int takeOutQuantity);
        Task<(string, PalletDto.PalletBulkResponse)> CreatePalletBulk(PalletDto.PalletBulkCreate create, int? userId);
    }

    public class PalletService : IPalletService
    {
        private readonly IPalletRepository _palletRepository;
        private readonly ILocationRepository _locationRepository;
        private readonly IMapper _mapper;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IBatchRepository _batchRepository;
        private readonly IGoodsReceiptNoteRepository _goodsReceiptNoteRepository;

        public PalletService(IPalletRepository palletRepository, IMapper mapper, ILocationRepository locationRepository, IStocktakingSheetRepository stocktakingSheetRepository)
        {
            _palletRepository = palletRepository;
            _mapper = mapper;
            _locationRepository = locationRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
        }

        // NOTE: keep existing constructor for compatibility, but provide an overload that accepts new repos for DI
        public PalletService(IPalletRepository palletRepository, IMapper mapper, ILocationRepository locationRepository, IStocktakingSheetRepository stocktakingSheetRepository, IBatchRepository batchRepository, IGoodsReceiptNoteRepository goodsReceiptNoteRepository)
            : this(palletRepository, mapper, locationRepository, stocktakingSheetRepository)
        {
            _batchRepository = batchRepository;
            _goodsReceiptNoteRepository = goodsReceiptNoteRepository;
        }

        public async Task<(string, PageResult<PalletDto.PalletResponseDto>)> GetPallets(PagedRequest request)
        {
            var pallets = _palletRepository.GetPallets();
            if (pallets == null)
                return ("Không có pallet nào.".ToMessageForUser(), new PageResult<PalletDto.PalletResponseDto>());

            var palletDtos = pallets.ProjectTo<PalletDto.PalletResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await palletDtos.ToPagedResultAsync(request);
            return ("", pagedResult);
        }

        public async Task<(string, PalletDto.PalletDetailDto)> GetPalletById(string palletId)
        {
            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Không tìm thấy pallet.".ToMessageForUser(), new PalletDto.PalletDetailDto());

            var dto = _mapper.Map<PalletDto.PalletDetailDto>(pallet);
            return ("", dto);
        }

        public async Task<(string, PalletDto.PalletResponseDto)> CreatePallet(PalletDto.PalletRequestDto dto, int? userId)
        {
            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (!string.IsNullOrEmpty(dto.GoodsReceiptNoteId) && !await _palletRepository.ExistsGoodRecieveNote(dto.GoodsReceiptNoteId))
                return ("Phiếu nhận hàng không tồn tại.", new PalletDto.PalletResponseDto());

            if(!await _palletRepository.CheckUserCreatePallet(dto.GoodsReceiptNoteId, userId))
                return ("Người dùng không có quyền tạo pallet cho phiếu nhận hàng này.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (!await _palletRepository.ExistsBatch(dto.BatchId))
                return ("Lô hàng không tồn tại.", new PalletDto.PalletResponseDto());

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thêm mới pallet khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (dto.LocationId.HasValue)
            {
                if (!await _palletRepository.ExistsLocation(dto.LocationId))
                    return ("Vị trí không tồn tại.".ToMessageForUser(), new());

                if (!await _palletRepository.IsLocationAvailable(dto.LocationId))
                    return ("Vị trí này đã có pallet khác.".ToMessageForUser(), new());
            }

            var entity = _mapper.Map<Pallet>(dto);
            entity.PalletId = Ulid.NewUlid().ToString();
            entity.CreateBy = userId;
            entity.CreateAt = DateTimeUtility.Now();
            entity.Status = CommonStatus.Inactive;

            // Only update location availability when a location is provided
            if (dto.LocationId.HasValue)
            {
                entity.Status = CommonStatus.Active;
                var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);
                if (!updateIsAvail)
                    return ("Cập nhật trạng thái vị trí thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            var created = await _palletRepository.CreatePallet(entity);
            if (created == null)
                return ("Create pallet failed.", new PalletDto.PalletResponseDto());

            var createdResponse = await _palletRepository.GetPalletById(created.PalletId);
            if (createdResponse == null)
                return ("Create pallet failed (cannot load created record).", new PalletDto.PalletResponseDto());

            var createdDto = _mapper.Map<PalletDto.PalletResponseDto>(createdResponse);
            return ("", createdDto);
        }

        // Bulk create pallets: create multiple pallets based on provided list
        public async Task<(string, PalletDto.PalletBulkResponse)> CreatePalletBulk(PalletDto.PalletBulkCreate create, int? userId)
        {
            var result = new PalletDto.PalletBulkResponse();

            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), result);
             
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể thêm mới pallet khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), result);

            if (create == null || create.Pallets == null || !create.Pallets.Any())
                return ("Danh sách pallet trống.".ToMessageForUser(), result);

            // Phase 1: Validation (no side effects)
            for (int i = 0; i < create.Pallets.Count; i++)
            {
                var dto = create.Pallets[i];

                // Validate batch
                if (!await _palletRepository.ExistsBatch(dto.BatchId))
                {
                    result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.BatchId.ToString(), Error = "Lô hàng không tồn tại.".ToMessageForUser() });
                    result.TotalFailed++;
                    continue;
                }

                // Validate goods receipt note
                if (!string.IsNullOrEmpty(dto.GoodsReceiptNoteId) && !await _palletRepository.ExistsGoodRecieveNote(dto.GoodsReceiptNoteId))
                {
                    result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.GoodsReceiptNoteId.ToString(), Error = "Phiếu nhận hàng không tồn tại".ToMessageForUser() });
                    result.TotalFailed++;
                    continue;
                }

                if (!await _palletRepository.CheckUserCreatePallet(dto.GoodsReceiptNoteId, userId))
                {
                    result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.GoodsReceiptNoteId.ToString(), Error = "Người dùng không có quyền tạo pallet cho phiếu nhận hàng này.".ToMessageForUser() });
                    result.TotalFailed++;
                    continue;
                }

                // Validate location (no updates)
                if (dto.LocationId.HasValue)
                {
                    if (!await _palletRepository.ExistsLocation(dto.LocationId))
                    {
                        result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.LocationId.Value.ToString(), Error = "Vị trí không tồn tại.".ToMessageForUser() });
                        result.TotalFailed++;
                        continue;
                    }

                    if (!await _palletRepository.IsLocationAvailable(dto.LocationId))
                    {
                        result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.LocationId.Value.ToString(), Error = "Vị trí này đã có pallet khác.".ToMessageForUser() });
                        result.TotalFailed++;
                        continue;
                    }
                }
            }

            // If any validation errors found, return immediately with details
            if (result.FailedItems.Any())
                return ("", result);

            // Additional validation: Compare grouped pallets with GoodsReceiptNoteDetails
            // Group input pallets by GoodsReceiptNoteId so we validate per GRN
            var palletsByGrn = create.Pallets
                .GroupBy(p => p.GoodsReceiptNoteId ?? string.Empty)
                .ToDictionary(g => g.Key, g => g.ToList());

            // Only validate GRNs that are provided (non-empty key)
            foreach (var kv in palletsByGrn)
            {
                var grnId = kv.Key;
                if (string.IsNullOrEmpty(grnId))
                    continue;

                if (_goodsReceiptNoteRepository == null || _batchRepository == null)
                {
                    // If repositories not injected, skip this strict validation
                    continue;
                }

                var grn = await _goodsReceiptNoteRepository.GetGoodsReceiptNoteById(grnId);
                if (grn == null)
                {
                    return ("Phiếu nhận hàng không tồn tại.".ToMessageForUser(), result);
                }

                var grnDetails = grn.GoodsReceiptNoteDetails?.ToList() ?? new List<GoodsReceiptNoteDetail>();

                // Build pallet groups keyed by (goodsId, goodsPackingId)
                var palletGroups = new Dictionary<(int goodsId, int goodsPackingId), int>();

                // Cache batch lookups
                var batchCache = new Dictionary<Guid, Batch>();

                foreach (var dto in kv.Value)
                {
                    if (!batchCache.ContainsKey(dto.BatchId))
                    {
                        var batch = await _batchRepository.GetBatchById(dto.BatchId);
                        batchCache[dto.BatchId] = batch;
                    }

                    var batchEntity = batchCache[dto.BatchId];
                    if (batchEntity == null)
                    {
                        return ("Lô hàng không tồn tại.".ToMessageForUser(), result);
                    }

                    var goodsId = batchEntity.GoodsId ?? 0;
                    var packingId = dto.GoodsPackingId;
                    var key = (goodsId, packingId);

                    if (!palletGroups.ContainsKey(key)) palletGroups[key] = 0;
                    palletGroups[key] += dto.PackageQuantity;
                }

                // For each GRN detail, check matching pallet group sums
                var grnDetailKeys = new HashSet<(int goodsId, int goodsPackingId)>();
                foreach (var grnd in grnDetails)
                {
                    var gKey = (grnd.GoodsId, grnd.GoodsPackingId ?? 0);
                    grnDetailKeys.Add(gKey);

                    var expected = grnd.ActualPackageQuantity ?? 0;
                    var hasGroup = palletGroups.TryGetValue(gKey, out var sumPackages);
                    if (!hasGroup)
                    {
                        // If expected is zero and no pallets, it's fine; otherwise error
                        if (expected > 0)
                        {
                            return ($"Thiếu hàng hóa ({grnd.Goods.GoodsName}) trong danh sách pallet so với phiếu nhận hàng (Mã GRN: {grnId}).".ToMessageForUser(), result);
                        }
                        continue;
                    }

                    if (sumPackages != expected)
                    {
                        return ($"Tổng số kiện pallet ({sumPackages}) không khớp với số thực nhập trên phiếu ({grnd.Goods.GoodsName}).".ToMessageForUser(), result);
                    }

                    // remove matched group so we can detect extra pallet groups later
                    palletGroups.Remove(gKey);
                }

                // If there are any leftover pallet groups that don't match GRN details => error
                if (palletGroups.Any())
                {
                    return ($"Các pallet gửi lên chứa hàng không tồn tại trong phiếu nhận hàng (Mã GRN: {grnId}).".ToMessageForUser(), result);
                }
            }

            // Phase 2: Creation (perform side effects)
            for (int i = 0; i < create.Pallets.Count; i++)
            {
                var dto = create.Pallets[i];

                try
                {
                    var entity = _mapper.Map<Pallet>(dto);
                    entity.PalletId = Ulid.NewUlid().ToString();
                    entity.CreateBy = userId;
                    entity.CreateAt = DateTimeUtility.Now();
                    entity.Status = dto.LocationId.HasValue ? CommonStatus.Active : CommonStatus.Inactive;

                    if (dto.LocationId.HasValue)
                    {
                        var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);
                        if (!updateIsAvail)
                        {
                            result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.LocationId.Value.ToString(), Error = "Cập nhật trạng thái vị trí thất bại.".ToMessageForUser() });
                            result.TotalFailed++;
                            continue;
                        }
                    }

                    var created = await _palletRepository.CreatePallet(entity);
                    if (created == null)
                    {
                        result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.BatchId.ToString(), Error = "Có lỗi khi tạo pallet mới.".ToMessageForUser() });
                        result.TotalFailed++;
                        continue;
                    }

                    result.TotalInserted++;
                }
                catch (Exception ex)
                {
                    result.FailedItems.Add(new PalletDto.FailedItem { Index = i, Code = dto.BatchId.ToString(), Error = ex.Message.ToMessageForUser() });
                    result.TotalFailed++;
                }
            }

            return ("", result);
        }

        public async Task<(string, PalletDto.PalletResponseDto)> UpdatePallet(string palletId, PalletDto.PalletRequestDto dto, int? userId)
        {
            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể cập nhật pallet khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Pallet do not exist.", new PalletDto.PalletResponseDto());

            if (!string.IsNullOrEmpty(dto.GoodsReceiptNoteId) && !await _palletRepository.ExistsGoodRecieveNote(dto.GoodsReceiptNoteId))
                return ("Phiếu nhận hàng không tồn tại.", new PalletDto.PalletResponseDto());

            if (pallet.Location == null)
            {
                if (!await _palletRepository.CheckUserCreatePallet(dto.GoodsReceiptNoteId, userId))
                    return ("Pallet đang trong quá trình kiểm nhập, chỉ có người được giao mới có quyền sắp xếp pallet.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }
            
            if(await _palletRepository.IsPalletInSalesPickingOrDisposalPicking(palletId))
                return ("Không thể cập nhật pallet này do pallet đang trong quá trình lấy hàng.", new PalletDto.PalletResponseDto());

            if (pallet.Status == CommonStatus.Inactive)
            {
                if (!await _palletRepository.CheckUserCreatePallet(dto.GoodsReceiptNoteId, userId))
                    return ("Người dùng không có quyền sắp xếp pallet cho phiếu nhận hàng này.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            if (!await _palletRepository.ExistsBatch(dto.BatchId))
                return ("Lô hàng không hợp lệ.", new PalletDto.PalletResponseDto());

            var location = await _locationRepository.GetLocationById(dto.LocationId.Value);
            if (location == null)
                return ("Vị trí không tồn tại.".ToMessageForUser(), new());

            if (!await _palletRepository.IsLocationAvailable(dto.LocationId, palletId))
                return ("Vị trí mới đã có pallet khác hoặc đang ngừng hoạt động.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            var oldLocationId = pallet.LocationId;
            if( oldLocationId == null && dto.LocationId.HasValue)
            {
                var updateIsAvailNew = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);
                if (!updateIsAvailNew)
                    return ("Cập nhật trạng thái vị trí mới thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }
            if (dto.LocationId.HasValue && oldLocationId != null && dto.LocationId != oldLocationId)
            {
                var updateIsAvailOld = await _locationRepository.UpdateIsAvailableAsync(oldLocationId, true);
                if (!updateIsAvailOld)
                    return ("Cập nhật trạng thái vị trí cũ thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
                var updateIsAvailNew = await _locationRepository.UpdateIsAvailableAsync(dto.LocationId, false);
                if (!updateIsAvailNew)
                    return ("Cập nhật trạng thái vị trí mới thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }
            _mapper.Map(dto, pallet);

            pallet.UpdateAt = DateTimeUtility.Now();

            if (dto.LocationId.HasValue)
                pallet.Status = CommonStatus.Active;
            else
                pallet.Status = CommonStatus.Inactive;

            var updated = await _palletRepository.UpdatePallet(pallet);
            if (updated == null)
                return ("Update pallet failed.", new PalletDto.PalletResponseDto());

            var updateResponse = await _palletRepository.GetPalletById(updated.PalletId);
            if (updateResponse == null)
                return ("Update pallet failed (cannot load updated record).", new PalletDto.PalletResponseDto());

            var updatedDto = _mapper.Map<PalletDto.PalletResponseDto>(updateResponse);
            return ("", updatedDto);
        }

        public async Task<(string, PalletDto.PalletResponseDto)> DeletePallet(string palletId)
        {
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể xoá pallet khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Pallet do not exist.", new PalletDto.PalletResponseDto());

            if (pallet.PackageQuantity > 0)
                return ("Không thể xóa pallet còn hàng.".ToMessageForUser(), new PalletDto.PalletResponseDto());

            pallet.Status = CommonStatus.Deleted;
            pallet.UpdateAt = DateTimeUtility.Now();

            if (pallet.LocationId.HasValue)
            {
                var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(pallet.LocationId, true);
                if (!updateIsAvail)
                    return ("Cập nhật trạng thái vị trí khi xóa pallet thất bại.".ToMessageForUser(), new PalletDto.PalletResponseDto());
            }

            var deleted = await _palletRepository.UpdatePallet(pallet);
            if (deleted == null)
                return ("Delete pallet failed.", new PalletDto.PalletResponseDto());

            var deletedDto = _mapper.Map<PalletDto.PalletResponseDto>(deleted);
            return ("", deletedDto);
        }

        public async Task<(string, List<PalletDto.PalletActiveDto>)> GetPalletDropdown()
        {
            var pallets = await _palletRepository.GetActivePalletsAsync();
            if (!pallets.Any())
                return ("Không có pallet hoạt động.", new List<PalletDto.PalletActiveDto>());

            var dto = _mapper.Map<List<PalletDto.PalletActiveDto>>(pallets);
            return ("", dto);
        }

        public async Task<(string, List<PalletDto.PalletResponseDto>)> GetPalletByGRNID(string grnId)
        {
            var pallets = await _palletRepository.GetPalletsByGRNID(grnId);
            if (!pallets.Any())
                return ("Không có pallet nào cho phiếu nhận hàng.".ToMessageForUser(), new List<PalletDto.PalletResponseDto>());
            var dto = _mapper.Map<List<PalletDto.PalletResponseDto>>(pallets);
            return ("", dto);
        }

        public async Task<(string, PalletDto.PalletUpdateStatusDto)> UpdatePalletStatus(PalletDto.PalletUpdateStatusDto update)
        {
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể cập nhật trạng thái pallet khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());

            var palletExist = await _palletRepository.GetPalletById(update.PalletId);
            if (palletExist == null)
            {
                return ("Pallet do not exist.", new PalletDto.PalletUpdateStatusDto());
            }

            if (palletExist.Status == update.Status)
            {
                return ("Trạng thái hiện tại và trạng thái update đang giống nhau.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            }

            if (palletExist.Status == CommonStatus.Active && update.Status == CommonStatus.Inactive)
            {
                return ("Pallet đã được xếp vào vị trí rồi không thể xếp ra.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            }

            if (await _palletRepository.IsPalletInSalesPickingOrDisposalPicking(update.PalletId))
                return ("Không thể cập nhật pallet này do pallet đang trong quá trình lấy hàng.", new PalletDto.PalletUpdateStatusDto());

            if (update.Status == CommonStatus.Deleted && palletExist.LocationId.HasValue)
            {
                if (palletExist.PackageQuantity > 0)
                    return ("Không thể xóa pallet còn hàng.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());

                var updateIsAvailOld = await _locationRepository.UpdateIsAvailableAsync(palletExist.LocationId, true);
                if (!updateIsAvailOld)
                    return ("Cập nhật trạng thái vị trí cũ thất bại.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            }

            palletExist.Status = update.Status;
            palletExist.UpdateAt = DateTimeUtility.Now();

            var updatedPallet = await _palletRepository.UpdatePallet(palletExist);
            if (updatedPallet == null)
            {
                return ("Update pallet status failed.", new PalletDto.PalletUpdateStatusDto());
            }

            var resultDto = _mapper.Map<PalletDto.PalletUpdateStatusDto>(updatedPallet);
            return ("", resultDto);
        }

        public async Task<(string, PalletDto.PalletUpdateStatusDto)> UpdatePalletQuantity(string palletId, int takeOutQuantity)
        {
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể cập nhật số lượng pallet khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());

            var pallet = await _palletRepository.GetPalletById(palletId);
            if (pallet == null)
                return ("Pallet do not exist.", new PalletDto.PalletUpdateStatusDto());
            if (takeOutQuantity < 0)
                return ("Số lượng lấy ra không được âm.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            if (takeOutQuantity > pallet.PackageQuantity)
                return ("Số lượng lấy ra vượt quá số lượng hiện có trên pallet.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
            pallet.PackageQuantity -= takeOutQuantity;
            if (pallet.PackageQuantity == 0 && pallet.LocationId.HasValue)
            {
                var updateIsAvail = await _locationRepository.UpdateIsAvailableAsync(pallet.LocationId, true);
                if (!updateIsAvail)
                    return ("Cập nhật trạng thái vị trí khi pallet hết hàng thất bại.".ToMessageForUser(), new PalletDto.PalletUpdateStatusDto());
                pallet.Status = CommonStatus.Deleted;
            }
            pallet.UpdateAt = DateTimeUtility.Now();
            var updated = await _palletRepository.UpdatePallet(pallet);
            if (updated == null)
                return ("Update pallet quantity failed.", new PalletDto.PalletUpdateStatusDto());
            var updatedDto = _mapper.Map<PalletDto.PalletUpdateStatusDto>(updated);
            return ("", updatedDto);
        }
    }
}
