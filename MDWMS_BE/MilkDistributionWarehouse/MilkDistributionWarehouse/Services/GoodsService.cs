using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsService
    {
        Task<(string, PageResult<GoodsDto>)> GetGoods(PagedRequest request);
        Task<(string, GoodsDetail)> GetGoodsByGoodsId(int goodsId);
        Task<(string, GoodsDto)> CreateGoods(GoodsCreate goodsCreate);
        Task<(string, GoodsDto)> DeleteGoods(int goodsId);
        Task<(string, GoodsDto)> UpdateGoods_1(GoodsUpdate update);
        Task<(string, List<GoodsDropDown>)> GetGoodsDropDown();
        Task<(string, GoodsUpdateStatus)> UpdateGoodsStatus(GoodsUpdateStatus update);
    }
    public class GoodsService : IGoodsService
    {
        private readonly IGoodsRepository _goodRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IUnitMeasureRepository _unitMeasureRepository;
        private readonly IStorageConditionRepository _storageConditionRepository;
        private readonly IMapper _mapper;
        public GoodsService(IGoodsRepository goodRepository, IMapper mapper, ICategoryRepository categoryRepository,
            IUnitMeasureRepository unitMeasureRepository, IStorageConditionRepository storageConditionRepository)
        {
            _goodRepository = goodRepository;
            _mapper = mapper;
            _categoryRepository = categoryRepository;
            _unitMeasureRepository = unitMeasureRepository;
            _storageConditionRepository = storageConditionRepository;
        }

        public async Task<(string, PageResult<GoodsDto>)> GetGoods(PagedRequest request)
        {
            var goodsQuery = _goodRepository.GetGoods();

            var goodsItems = goodsQuery.ProjectTo<GoodsDto>(_mapper.ConfigurationProvider);

            var goodsDtos = await goodsItems.ToPagedResultAsync<GoodsDto>(request);

            if (!goodsDtos.Items.Any())
                return ("Danh sách sản phẩm trống.".ToMessageForUser(), new PageResult<GoodsDto> { });

            return ("", goodsDtos);
        }

        public async Task<(string, List<GoodsDropDown>)> GetGoodsDropDown()
        {
            var goodsQuery = await _goodRepository.GetGoods()
                .Where(g => g.Status == CommonStatus.Active).ToListAsync();

            var goodsDropDown = _mapper.Map<List<GoodsDropDown>>(goodsQuery);

            if (!goodsDropDown.Any())
                return ("Danh sách sản phẩm trống.".ToMessageForUser(), new List<GoodsDropDown>());

            return ("", goodsDropDown);
        }

        public async Task<(string, GoodsDetail)> GetGoodsByGoodsId(int goodsId)
        {
            if (goodsId <= 0)
                return ("GoodsId is invalid", new GoodsDetail());

            var goodsQuery = _goodRepository.GetGoodsById(goodsId);

            var goodsDetails = goodsQuery.ProjectTo<GoodsDetail>(_mapper.ConfigurationProvider);

            var goodsDetail = await goodsDetails.FirstOrDefaultAsync(g => g.GoodsId == goodsId);

            if (goodsDetail == null)
                return ("Danh sách sản phấm không tồn tại trong hệ thống".ToMessageForUser(), new GoodsDetail());

            goodsDetail.IsDisable = (await IsGoodInUseAnyTransactionToUpdate(goodsId));

            return ("", goodsDetail);
        }

        public async Task<(string, GoodsDto)> CreateGoods(GoodsCreate goodsCreate)
        {
            if (goodsCreate == null)
                return ("Goods create data is invalid", new GoodsDto());

            if (await _goodRepository.IsDuplicationCode(null, goodsCreate.GoodsCode))
                return ("Mã sản phẩm đã tồn tại trong hệ thống", new GoodsDto());

            var goods = _mapper.Map<Good>(goodsCreate);

            var createResult = await _goodRepository.CreateGoods(goods);

            if (createResult == null)
                return ("Tạo mới sản phẩm thất bại.".ToMessageForUser(), new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(createResult));
        }

        public async Task<(string, GoodsDto)> UpdateGoods_1(GoodsUpdate update)
        {
            if (update == null)
                return ("Goods update data is invalid", new GoodsDto());

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(update.GoodsId);

            if (goodsExist == null)
                return ("Goods is not exist", new GoodsDto());

            if (await IsGoodInUseAnyTransactionToUpdate(update.GoodsId))
                return ("Không thể cập nhật thông tin hàng hoá vì hàng hoá đang được sử dụng.".ToMessageForUser(), new GoodsDto());

            _mapper.Map(update, goodsExist);

            var updateResult = await _goodRepository.UpdateGoods(goodsExist);

            if (updateResult == null)
                return ("Cập nhật hàng hoá thất bại.".ToMessageForUser(), new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(goodsExist));
        }

        public async Task<(string, GoodsUpdateStatus)> UpdateGoodsStatus(GoodsUpdateStatus update)
        {
            if (update.GoodsId <= 0)
                return ("GoodsId is invalid.", new GoodsUpdateStatus());

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(update.GoodsId);

            if (goodsExist == null)
                return ("Goods is not exist", new GoodsUpdateStatus());

            if (goodsExist.Status == CommonStatus.Deleted || update.Status == CommonStatus.Deleted)
                return ("Hàng hoá đã bị xoá trước đó".ToMessageForUser(), new GoodsUpdateStatus());

            bool isChangeStatus = goodsExist.Status != update.Status;
            if (!isChangeStatus)
                return ("Hàng hoá không bị thay đổi trạng thái.".ToMessageForUser(), new GoodsUpdateStatus());

            if (goodsExist.Status == CommonStatus.Active && update.Status == CommonStatus.Inactive)
            {
                if (await IsGoodInUseAnyTransaction(update.GoodsId))
                    return ("Không thể vô hiệu hoá hàng hoá vì đang được sử dụng.".ToMessageForUser(), new GoodsUpdateStatus());
            }

            if (goodsExist.Status == CommonStatus.Inactive && update.Status == CommonStatus.Active)
            {
                var activateError = await ActivateLinkedEntitiesAsync(update.GoodsId);
                if (!string.IsNullOrEmpty(activateError))
                    return (activateError, new GoodsUpdateStatus());
            }

            goodsExist.Status = update.Status;
            goodsExist.UpdateAt = DateTime.Now;

            var updateResult = await _goodRepository.UpdateGoods(goodsExist);
            if (updateResult == null)
                return ("Cập nhật hàng hoá thất bại.".ToMessageForUser(), new GoodsUpdateStatus());

            return ("", update);
        }

        public async Task<(string, GoodsDto)> DeleteGoods(int goodsId)
        {
            if (goodsId <= 0)
                return ("GoodsId is invalid.", new GoodsDto());

            var goodsExist = await _goodRepository.GetGoodsByGoodsId(goodsId);

            if (goodsExist == null)
                return ("Goods is not found", new GoodsDto());

            if (await CheckValidationDeleteGoods(goodsId))
                return ("Không thể xoá hàng hoá vì đang được sử dụng trong lô hàng, đơn nhập hoặc đơn mua hàng đang hoạt động.".ToMessageForUser(), new GoodsDto());

            goodsExist.Status = CommonStatus.Deleted;
            goodsExist.UpdateAt = DateTime.Now;

            var resultDelete = await _goodRepository.UpdateGoods(goodsExist);
            if (resultDelete == null)
                return ("Xoá hàng hoá thất bại.".ToMessageForUser(), new GoodsDto());

            return ("", _mapper.Map<GoodsDto>(goodsExist));
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

    }
}
