using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Services;
using Online_Learning.Services.Ultilities;

namespace MilkDistributionWarehouse.Configurations
{
    public static class DependencyInjectionConfiguration
    {
        public static void AddDependencyInjection(this IServiceCollection services)
        {
            //Authentication
            services.AddScoped<IAuthenticatonService, AuthenticatonService>();

            //RefreshToken
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

            //User
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUserService, UserService>();

            //StorageConditionm
            services.AddScoped<IStorageConditionRepository, StorageConditionRepository>();
            services.AddScoped<IStorageConditionService, StorageConditionService>();

            //Email
            services.AddSingleton<EmailUtility>();

            //Category
            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<ICategoryService, CategoryService>();

            //UnitMeasure
            services.AddScoped<IUnitMeasureRepository, UnitMeasureRepository>();
            services.AddScoped<IUnitMeasureService, UnitMeasureService>();

            //Location
            services.AddScoped<ILocationRepository, LocationRepository>();
            services.AddScoped<ILocationService, LocationService>();

            //Area
            services.AddScoped<IAreaRepository, AreaRepository>();
            services.AddScoped<IAreaService, AreaService>();

            //Goods
            services.AddScoped<IGoodsRepository, GoodsRepository>();
            services.AddScoped<IGoodsService, GoodsService>();

            //Bacth
            services.AddScoped<IBatchService, BatchService>();
            services.AddScoped<IBatchRepository, BatchRepository>();

            //UserOtp
            services.AddScoped<IUserOtpRepository, UserOtpRepository>();

            //Supplier
            services.AddScoped<ISupplierRepository, SupplierRepository>();
            services.AddScoped<ISupplierService, SupplierService>();

            //Retailer
            services.AddScoped<IRetailerRepository, RetailerRepository>();
            services.AddScoped<IRetailerService, RetailerService>();

            //PurchaseOrder
            services.AddScoped<IPurchaseOrderRepositoy, PurchaseOrderRepository>();
            services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();

            //SalesOrder
            services.AddScoped<ISalesOrderService, SalesOrderService>();
            services.AddScoped<ISalesOrderRepository, SalesOrderRepository>();

            //Role
            services.AddScoped<IRoleService, RoleService>();
            services.AddScoped<IRoleRepository, RoleRepository>();

            //UnitOfWork
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            //PurchaseOrderDetail
            services.AddScoped<IPurchaseOrderDetailRepository, PurchaseOrderDetailReposotory>();
            services.AddScoped<IPurchaseOrderDetailService, PurchaseOrderDetailService>();

            //Cache
            services.AddScoped<ICacheService, CacheService>();

            //Pallet
            services.AddScoped<IPalletRepository, PalletRepository>();
            services.AddScoped<IPalletService, PalletService>();

            //SalesOrderDetail
            services.AddScoped<ISalesOrderDetailService, SalesOrderDetailService>();
            services.AddScoped<ISalesOrderDetailRepository, SalesOrderDetailRepository>();

            //GoodsPacking
            services.AddScoped<IGoodsPackingRepository, GoodsPackingRepository>();
            services.AddScoped<IGoodsPackingService, GoodsPackingService>();
          
            //GoodsReceiptNoteDetail
            services.AddScoped<IGoodsReceiptNoteDetailRepository, GoodsReceiptNoteDetailRepository>();
            services.AddScoped<IGoodsReceiptNoteDetailService, GoodsReceiptNoteDetailService>();

            //BackOrder
            services.AddScoped<IBackOrderRepository, BackOrderRepository>();
            services.AddScoped<IBackOrderService, BackOrderService>();

            //GoodsReceiptNote
            services.AddScoped<IGoodsReceiptNoteRepository, GoodsReceiptNoteRepository>();
            services.AddScoped<IGoodsReceiptNoteService, GoodsReceiptNoteService>();

            //GoodsIssueNote
            services.AddScoped<IGoodsIssueNoteRepository, GoodsIssueNoteRepository>();
            services.AddScoped<IGoodsIssueNoteService, GoodsIssueNoteService>();

            //GoodsIssueNoteDetail
            services.AddScoped<IGoodsIssueNoteDetailRepository, GoodsIssueNoteDetailRepository>();
            
            //Picking Allocation
            services.AddScoped<IPickAllocationRepository, PickAllocationRepository>();
            services.AddScoped<IPickAllocationService, PickAllocationService>();
        }
    }
}
