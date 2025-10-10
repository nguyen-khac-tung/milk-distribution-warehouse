﻿using MilkDistributionWarehouse.Repositories;
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
            services.AddScoped<ILocationService,  LocationService>();

            //Area
            services.AddScoped<IAreaRepository, AreaRepository>();
            services.AddScoped<IAreaService, AreaService>();

            //Goods
            services.AddScoped<IGoodsRepository, GoodsRepository>();
            services.AddScoped<IGoodsService, GoodsService>();

            //UserOtp
            services.AddScoped<IUserOtpRepository, UserOtpRepository>();

            //Supplier
            services.AddScoped<ISupplierRepository, SupplierRepository>();
            services.AddScoped<ISupplierService, SupplierService>();
        }
    }
}
