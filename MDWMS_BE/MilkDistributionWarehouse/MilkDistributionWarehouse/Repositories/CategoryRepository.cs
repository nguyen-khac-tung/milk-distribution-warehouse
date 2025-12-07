using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Repositories
{
    public interface ICategoryRepository
    {
        IQueryable<Category> GetCategories();
        Task<Category?> CreateCategory(Category category);
        Task<Category?> GetCategoryByCategoryId(int categoryId);
        Task<bool> IsDuplicationByName(int? categoryId, string categoryName);
        Task<Category?> UpdateCategory(Category category);
        Task<bool> IsCategoryContainingGoodsAsync(int categoryId); 
        Task<bool> IsCategoryContainingGoodsInActive(int categoryId);
        Task<bool> IsActiveCategory(int categoryId);
        Task<bool> HasCategoryInUse(int categoryId);
    }
    public class CategoryRepository : ICategoryRepository
    {
        private readonly WarehouseContext _warehouseContext;
        public CategoryRepository(WarehouseContext warehouseContext)
        {
            _warehouseContext = warehouseContext;
        }

        public IQueryable<Category> GetCategories()
        {
            return _warehouseContext.Categories.Where(c => c.Status != CommonStatus.Deleted).OrderByDescending(c => c.CreatedAt).AsNoTracking();
        }

        public async Task<Category?> CreateCategory(Category category)
        {
            try
            {
                await _warehouseContext.Categories.AddAsync(category);
                await _warehouseContext.SaveChangesAsync();
                return category;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Category?> UpdateCategory(Category category)
        {
            try
            {
                _warehouseContext.Categories.Update(category);
                await (_warehouseContext.SaveChangesAsync());
                return category;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Category?> GetCategoryByCategoryId(int categoryId)
        {
            return await _warehouseContext.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsDuplicationByName(int? categoryId, string categoryName)
        {
            return await _warehouseContext.Categories.AnyAsync(c => (c.CategoryId != categoryId || categoryId == null)
                            && c.CategoryName.ToLower().Trim().Equals(categoryName.ToLower().Trim())
                            && c.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsCategoryContainingGoodsAsync(int categoryId)
        {
            return await _warehouseContext.Goods.AnyAsync(g => g.CategoryId == categoryId && g.Status != CommonStatus.Deleted);
        }

        public async Task<bool> IsCategoryContainingGoodsInActive(int categoryId)
        {
            IQueryable<Good> goods = _warehouseContext.Goods.Where(g => g.CategoryId == categoryId && g.Status != CommonStatus.Deleted);

            return !(await goods.AnyAsync(g => g.Status != CommonStatus.Inactive));
        }

        public async Task<bool> IsActiveCategory(int categoryId)
        {
            return await _warehouseContext.Categories
                .AnyAsync(c => c.CategoryId == categoryId &&
                            c.Status == CommonStatus.Active);
        }

        public async Task<bool> HasCategoryInUse(int categoryId)
        {
            bool hasInPurchaseOrder = await _warehouseContext.PurchaseOderDetails
                .Join(_warehouseContext.Goods,
                    pod => pod.GoodsId,
                    g => g.GoodsId,
                    (pod, g) => new { pod, g })
                .Join(_warehouseContext.PurchaseOrders,
                    x => x.pod.PurchaseOderId,
                    po => po.PurchaseOderId,
                    (x, po) => new { x.g, po })
                .AnyAsync(x => x.g.CategoryId == categoryId 
                    && x.g.Status != CommonStatus.Deleted
                    && x.po.Status != PurchaseOrderStatus.Draft 
                    && x.po.Status != PurchaseOrderStatus.Rejected);

            if (hasInPurchaseOrder) return true;

            bool hasInSalesOrder = await _warehouseContext.SalesOrderDetails
                .Where(sod => sod.GoodsId.HasValue)
                .Join(_warehouseContext.Goods,
                    sod => sod.GoodsId.Value,
                    g => g.GoodsId,
                    (sod, g) => new { sod, g })
                .Join(_warehouseContext.SalesOrders,
                    x => x.sod.SalesOrderId,
                    so => so.SalesOrderId,
                    (x, so) => new { x.g, so })
                .AnyAsync(x => x.g.CategoryId == categoryId 
                    && x.g.Status != CommonStatus.Deleted
                    && x.so.Status != SalesOrderStatus.Draft 
                    && x.so.Status != SalesOrderStatus.Rejected);

            if (hasInSalesOrder) return true;

            bool hasInDisposalRequest = await _warehouseContext.DisposalRequestDetails
                .Where(drd => drd.GoodsId.HasValue)
                .Join(_warehouseContext.Goods,
                    drd => drd.GoodsId.Value,
                    g => g.GoodsId,
                    (drd, g) => new { drd, g })
                .Join(_warehouseContext.DisposalRequests,
                    x => x.drd.DisposalRequestId,
                    dr => dr.DisposalRequestId,
                    (x, dr) => new { x.g, dr })
                .AnyAsync(x => x.g.CategoryId == categoryId 
                    && x.g.Status != CommonStatus.Deleted
                    && x.dr.Status != DisposalRequestStatus.Draft 
                    && x.dr.Status != DisposalRequestStatus.Rejected);

            return hasInDisposalRequest;
        }
    }
}
