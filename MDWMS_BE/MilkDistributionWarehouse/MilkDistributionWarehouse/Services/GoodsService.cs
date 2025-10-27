using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsService
    {
        Task<(string, PageResult<GoodsDto>?)> GetGoods(PagedRequest request);
        Task<(string, List<GoodsDropDown>?)> GetGoodsDropDown();
        Task<(string, List<GoodsDropDownAndUnitMeasure>?)> GetGoodsDropDownBySupplierId(int supplierId);
        Task<(string, GoodsDetail?)> GetGoodsByGoodsId(int goodsId);
        Task<(string, GoodsDto?)> CreateGoods(GoodsCreate goodsCreate);
        Task<(string, GoodsBulkdResponse)> CreateGoodsBulk(GoodsBulkCreate create);
        Task<(string, GoodsDto?)> UpdateGoods(GoodsUpdate update);
        Task<(string, GoodsUpdateStatus?)> UpdateGoodsStatus(GoodsUpdateStatus update);
        Task<(string, GoodsDto?)> DeleteGoods(int goodsId);
    }
    public class GoodsService : IGoodsService
    {
        private readonly IGoodsRepository _goodRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IUnitMeasureRepository _unitMeasureRepository;
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICacheService _cacheService;
        public GoodsService(IGoodsRepository goodRepository, IMapper mapper, ICategoryRepository categoryRepository,
            IUnitMeasureRepository unitMeasureRepository, IStorageConditionRepository storageConditionRepository,
            IUnitOfWork unitOfWork, ICacheService cacheService)
        {
            _goodRepository = goodRepository;
            _mapper = mapper;
            _categoryRepository = categoryRepository;
            _unitMeasureRepository = unitMeasureRepository;
            _storageConditionRepository = storageConditionRepository;
            _unitOfWork = unitOfWork;
            _cacheService = cacheService;
        }

        public async Task<(string, PageResult<GoodsDto>?)> GetGoods(PagedRequest request)
        {
            var goodsQuery = _goodRepository.GetGoods();

            var goodsItems = goodsQuery.ProjectTo<GoodsDto>(_mapper.ConfigurationProvider);

            var goodsDtos = await goodsItems.ToPagedResultAsync<GoodsDto>(request);

            if (!goodsDtos.Items.Any())
                return ("Danh sách sản phẩm trống.".ToMessageForUser(), default);

            return ("", goodsDtos);
        }

        public async Task<(string, List<GoodsDropDown>?)> GetGoodsDropDown()
        {
            var goodsQuery = await _goodRepository.GetGoods()
                .Where(g => g.Status == CommonStatus.Active).ToListAsync();

            var goodsDropDown = _mapper.Map<List<GoodsDropDown>>(goodsQuery);

            if (!goodsDropDown.Any())
                return ("Danh sách sản phẩm trống.".ToMessageForUser(), default);

            return ("", goodsDropDown);
        }

        public async Task<(string, GoodsDetail?)> GetGoodsByGoodsId(int goodsId)
        {
            if (goodsId <= 0)
                return ("GoodsId is invalid", default);

            var goodsQuery = _goodRepository.GetGoodsById(goodsId);

            var goodsDetails = goodsQuery.ProjectTo<GoodsDetail>(_mapper.ConfigurationProvider);

            var goodsDetail = await goodsDetails.FirstOrDefaultAsync(g => g.GoodsId == goodsId);

            if (goodsDetail == null)
                return ("Danh sách sản phấm không tồn tại trong hệ thống".ToMessageForUser(), default);

            goodsDetail.IsDisable = (await IsGoodInUseAnyTransactionToUpdate(goodsId));

            return ("", goodsDetail);
        }

        public async Task<(string, List<GoodsDropDownAndUnitMeasure>?)> GetGoodsDropDownBySupplierId(int supplierId)
        {
            var cacheKey = _cacheService.GenerateDropdownCacheKey("goods", "supplier", supplierId);

            var result = await _cacheService.GetOrCreatedAsync(cacheKey, async () =>
            {
                var goodsQuery = _goodRepository.GetGoods()
                    .Where(g => g.Status == CommonStatus.Active && g.SupplierId == supplierId);

                var goodsDropDowns = goodsQuery.ProjectTo<GoodsDropDownAndUnitMeasure>(_mapper.ConfigurationProvider);

                return await goodsDropDowns.ToListAsync();
            }, 30, 10);

            if (!result.Any())
                return ("Danh sách thả xuống hàng hoá trống.".ToMessageForUser(), default);

            return ("", result);
        }

        public async Task<(string, GoodsDto?)> CreateGoods(GoodsCreate goodsCreate)
        {
            if (goodsCreate == null)
                return ("Goods create data is invalid", default);

            if (await _goodRepository.IsDuplicationCode(null, goodsCreate.GoodsCode))
                return ("Mã sản phẩm đã tồn tại trong hệ thống".ToMessageForUser(), default);

            if (await _goodRepository.IsDuplicationNameAndSupplier(goodsCreate.GoodsName, goodsCreate.SupplierId))
                return ("Nhà cung cấp đã tồn tại tên hàng hoá".ToMessageForUser(), default);

            var goods = _mapper.Map<Good>(goodsCreate);

            if (goodsCreate.GoodsPackingCreates.Any())
            {
                if (IsCheckDuplicationGoodsPacking(goodsCreate.GoodsPackingCreates))
                    return ("Số lượng đóng gói hàng hoá bị trùng lặp.", default);
                goods.GoodsPackings = _mapper.Map<List<GoodsPacking>>(goodsCreate.GoodsPackingCreates);
            }

            var createResult = await _goodRepository.CreateGoods(goods);

            if (createResult == null)
                return ("Tạo mới sản phẩm thất bại.".ToMessageForUser(), default);

            _cacheService.InvalidateDropdownCache("goods", "supplier", createResult.SupplierId);

            return ("", _mapper.Map<GoodsDto>(createResult));
        }

        public async Task<(string, GoodsBulkdResponse)> CreateGoodsBulk(GoodsBulkCreate create)
        {
            var result = new GoodsBulkdResponse();
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var goodsCodeCreate = create.Goods.Select(g => g.GoodsCode).ToList();

                var existingGoodsCode = await _goodRepository.GetExistingGoodsCode(goodsCodeCreate);

                var existingCodesSet = new HashSet<string>(existingGoodsCode);

                var validGoods = new List<Good>();

                for (int i = 0; i < create.Goods.Count; i++)
                {
                    var goodDto = create.Goods[i];

                    var validation = ValidationGoods(goodDto, existingCodesSet);

                    if (validation != null)
                    {
                        result.FailedItems.Add(new FailedItem
                        {
                            Index = i,
                            Code = goodDto.GoodsCode,
                            Error = validation.ToMessageForUser()
                        });
                        result.TotalFailed++;
                        continue;
                    }

                    var goods = _mapper.Map<Good>(goodDto);

                    if (goodDto.GoodsPackingCreates.Any())
                        goods.GoodsPackings = _mapper.Map<List<GoodsPacking>>(goodDto.GoodsPackingCreates);

                    validGoods.Add(goods);

                    existingCodesSet.Add(goodDto.GoodsCode);
                }

                if (validGoods.Any())
                {
                    await _unitOfWork.Goods.CreateGoodsBulk(validGoods);
                    result.TotalInserted = validGoods.Count;
                }
                await _unitOfWork.CommitTransactionAsync();

                return ("", result);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<(string, GoodsDto?)> UpdateGoods(GoodsUpdate update)
        {
            if (update == null)
                return ("Goods update data is invalid", default);

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(update.GoodsId);

            if (goodsExist == null)
                return ("Goods is not exist", default);

            if (await IsGoodInUseAnyTransactionToUpdate(update.GoodsId))
                return ("Không thể cập nhật thông tin hàng hoá vì hàng hoá đang được sử dụng.".ToMessageForUser(), default);

            _mapper.Map(update, goodsExist);

            _cacheService.InvalidateDropdownCache("goods", "supplier", goodsExist.SupplierId);

            var updateResult = await _goodRepository.UpdateGoods(goodsExist);

            if (updateResult == null)
                return ("Cập nhật hàng hoá thất bại.".ToMessageForUser(), default);

            _cacheService.InvalidateDropdownCache("goods", "supplier", updateResult.SupplierId);

            return ("", _mapper.Map<GoodsDto>(goodsExist));
        }

        public async Task<(string, GoodsUpdateStatus?)> UpdateGoodsStatus(GoodsUpdateStatus update)
        {
            if (update.GoodsId <= 0)
                return ("GoodsId is invalid.", default);

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(update.GoodsId);

            if (goodsExist == null)
                return ("Goods is not exist", default);

            if (goodsExist.Status == CommonStatus.Deleted || update.Status == CommonStatus.Deleted)
                return ("Hàng hoá đã bị xoá trước đó".ToMessageForUser(), default);

            bool isChangeStatus = goodsExist.Status != update.Status;
            if (!isChangeStatus)
                return ("Hàng hoá không bị thay đổi trạng thái.".ToMessageForUser(), default);

            if (goodsExist.Status == CommonStatus.Active && update.Status == CommonStatus.Inactive)
            {
                if (await IsGoodInUseAnyTransaction(update.GoodsId))
                    return ("Không thể vô hiệu hoá hàng hoá vì đang được sử dụng.".ToMessageForUser(), default);
            }

            if (goodsExist.Status == CommonStatus.Inactive && update.Status == CommonStatus.Active)
            {
                var activateError = await ActivateLinkedEntitiesAsync(update.GoodsId);
                if (!string.IsNullOrEmpty(activateError))
                    return (activateError, default);
            }

            _cacheService.InvalidateDropdownCache("goods", "supplier", goodsExist.SupplierId);

            goodsExist.Status = update.Status;
            goodsExist.UpdateAt = DateTime.Now;

            var updateResult = await _goodRepository.UpdateGoods(goodsExist);
            if (updateResult == null)
                return ("Cập nhật hàng hoá thất bại.".ToMessageForUser(), default);

            _cacheService.InvalidateDropdownCache("goods", "supplier", updateResult.SupplierId);

            return ("", update);
        }

        public async Task<(string, GoodsDto?)> DeleteGoods(int goodsId)
        {
            if (goodsId <= 0)
                return ("GoodsId is invalid.", default);

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(goodsId);

            if (goodsExist == null)
                return ("Goods is not found", default);

            if (await CheckValidationDeleteGoods(goodsId))
                return ("Không thể xoá hàng hoá vì đang được sử dụng trong lô hàng, đơn nhập hoặc đơn mua hàng đang hoạt động.".ToMessageForUser(), default);

            goodsExist.Status = CommonStatus.Deleted;
            goodsExist.UpdateAt = DateTime.Now;

            var resultDelete = await _goodRepository.UpdateGoods(goodsExist);

            if (resultDelete == null)
                return ("Xoá hàng hoá thất bại.".ToMessageForUser(), default);

            _cacheService.InvalidateDropdownCache("goods", "supplier", goodsExist.SupplierId);

            return ("", _mapper.Map<GoodsDto>(goodsExist));
        }

        private string? ValidationGoods(GoodsCreateBulkDto create, HashSet<string> existingGoodsCode)
        {
            if (existingGoodsCode.Contains(create.GoodsCode))
                return "Mã sản phẩm đã tồn tại trong hệ thống";

            if (string.IsNullOrWhiteSpace(create.GoodsName))
                return "Tên sản phẩm không được để trống";

            if (create.GoodsName.Length > 255)
                return "Độ dài tên sản phẩm không được vượt quá 255 ký tự";

            if (!Regex.IsMatch(create.GoodsName, @"^[\p{L}0-9\s_\-.,]+$"))
                return "Tên sản phẩm không được chứa các ký tự đặc biệt";

            if (create.CategoryId <= 0)
                return "Loại sản phẩm không được để trống";

            if (create.SupplierId <= 0)
                return "Nhà cung cấp không được để trống";

            if (create.StorageConditionId <= 0)
                return "Điều kiện lưu trữ không được để trống";

            if (create.UnitMeasureId <= 0)
                return "Đơn vị sản phẩm không được để trống";

            if (create.GoodsPackingCreates.Count() >= 1)
            {
                if (IsCheckDuplicationGoodsPacking(create.GoodsPackingCreates))
                    return "Số lượng đóng gói hàng hoá bị trùng lặp.";
            }
            else
            {
                return "Danh sách đóng gói hàng hoá trống.";
            }

            return null;
        }

        private async Task<bool> CheckValidationDeleteGoods(int goodsId)
        {
            var checkBatch = await _goodRepository.IsGoodsUsedInBatch(goodsId);

            var checkPurchaseOrder = await _goodRepository.IsGoodUsedInPurchaseOrder(goodsId);

            var checkSaleOrder = await _goodRepository.IsGoodsUsedInSaleOrder(goodsId);

            return checkBatch || checkPurchaseOrder || checkSaleOrder;
        }

        private async Task<bool> IsGoodInUseAnyTransaction(int goodsId)
        {
            var checkBatch = await _goodRepository.HasGoodsUsedInBatchNotExpiry(goodsId);

            var checkPurchaseOrder = await _goodRepository.IsGoodsUsedInPurchaseOrderWithExcludedStatusesAsync(goodsId, PurchaseOrderStatus.Draft, PurchaseOrderStatus.Completed);

            var checkSalesOrder = await _goodRepository.IsGoodsUsedInSalesOrderWithExcludedStatusesAsync(goodsId, SalesOrderStatus.Draft, SalesOrderStatus.Completed);

            return checkBatch || checkPurchaseOrder || checkSalesOrder;
        }

        private async Task<bool> IsGoodInUseAnyTransactionToUpdate(int goodsId)
        {
            var checkBatch = await _goodRepository.HasGoodsUsedInBatchNotExpiry(goodsId);

            var checkPurchaseOrder = await _goodRepository.IsGoodsUsedInPurchaseOrderWithExcludedStatusesAsync(goodsId, PurchaseOrderStatus.Draft);

            var checkSalesOrder = await _goodRepository.IsGoodsUsedInSalesOrderWithExcludedStatusesAsync(goodsId, SalesOrderStatus.Draft);

            return checkBatch || checkPurchaseOrder || checkSalesOrder;
        }

        private async Task<string> ActivateLinkedEntitiesAsync(int goodsId)
        {
            var category = await _goodRepository.GetInactiveCategoryByGoodsIdAsync(goodsId);
            if (category != null)
            {
                category.Status = CommonStatus.Active;
                if (await _categoryRepository.UpdateCategory(category) == null)
                    return "Không thể kích hoạt danh mục liên kết với hàng hoá.".ToMessageForUser();
            }

            var unitMeasure = await _goodRepository.GetInactiveUnitMeasureByGoodsIdAsync(goodsId);
            if (unitMeasure != null)
            {
                unitMeasure.Status = CommonStatus.Active;
                if (await _unitMeasureRepository.UpdateUnitMeasure(unitMeasure) == null)
                    return "Không thể kích hoạt đơn vị đo liên kết với hàng hoá.".ToMessageForUser();
            }

            var storageCondition = await _goodRepository.GetInactiveStorageConditionByGoodsIdAsync(goodsId);
            if (storageCondition != null)
            {
                storageCondition.Status = CommonStatus.Active;
                if (_storageConditionRepository.UpdateStorageCondition(storageCondition) == null)
                    return "Không thể kích hoạt điều kiện lưu kho liên kết với hàng hoá.".ToMessageForUser();
            }

            return string.Empty;
        }

        private bool IsCheckDuplicationGoodsPacking(List<GoodsPackingCreate> goodsPackingCreate)
        {
            if (goodsPackingCreate == null || goodsPackingCreate.Count == 0)
                return false;

            return goodsPackingCreate
                .GroupBy(x => x.UnitPerPackage)
                .Any(g => g.Count() > 1);
        }
    }
}
