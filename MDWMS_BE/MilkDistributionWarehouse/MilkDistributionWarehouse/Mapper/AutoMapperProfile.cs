using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Mapper
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            //Map User
            CreateMap<User, UserDto>();
            CreateMap<User, UserDetailDto>();

            // Map StorageCondition
            CreateMap<StorageCondition, StorageConditionDto.StorageConditionResponseDto>();

            CreateMap<StorageConditionDto.StorageConditionCreateDto, StorageCondition>()
                .ForMember(dest => dest.StorageConditionId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore());

            CreateMap<StorageConditionDto.StorageConditionUpdateDto, StorageCondition>()
                .ForMember(dest => dest.StorageConditionId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore());

            // Map UnitMeasure
            CreateMap<UnitMeasure, UnitMeasureDto>();
            CreateMap<UnitMeasure, UnitMeasureDropDown>();
            CreateMap<UnitMeasureCreate, UnitMeasure>()
                .ForMember(dest => dest.UnitMeasureId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null));
            CreateMap<UnitMeasureUpdate, UnitMeasure>()
                .ForMember(dest => dest.UnitMeasureId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // Map Category
            CreateMap<Category, CategoryDto>();
            CreateMap<Category, CategoryDropDown>();
            CreateMap<CategoryCreate, Category>()
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.CategoryName.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description.Trim()));
            CreateMap<CategoryUpdate, Category>()
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.CategoryName.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // Map Location
            CreateMap<Location, LocationDto.LocationResponseDto>()
                .ForMember(dest => dest.AreaNameDto, opt => opt.MapFrom(src => src.Area));

            CreateMap<LocationDto.LocationCreateDto, Location>()
                .ForMember(dest => dest.LocationId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.Area, opt => opt.Ignore())
                .ForMember(dest => dest.Pallets, opt => opt.Ignore())
                .ForMember(dest => dest.StocktakingLocations, opt => opt.Ignore());

            CreateMap<LocationDto.LocationUpdateDto, Location>()
                .ForMember(dest => dest.LocationId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.Area, opt => opt.Ignore())
                .ForMember(dest => dest.Pallets, opt => opt.Ignore())
                .ForMember(dest => dest.StocktakingLocations, opt => opt.Ignore());

            // Map Area
            CreateMap<Area, AreaDto.AreaResponseDto>()
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.StorageCondition.HumidityMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.StorageCondition.HumidityMax))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.StorageCondition.LightLevel));
            CreateMap<Area, AreaDto.AreaNameDto>();
            CreateMap<AreaDto.AreaCreateDto, Area>()
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.AreaName.Trim()))
                .ForMember(dest => dest.AreaCode, opt => opt.MapFrom(src => src.AreaCode.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null));
            CreateMap<AreaDto.AreaUpdateDto, Area>()
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.AreaName.Trim()))
                .ForMember(dest => dest.AreaCode, opt => opt.MapFrom(src => src.AreaCode.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null));

            // Map Goods
            CreateMap<Good, GoodsDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.CategoryName.Trim()))
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.UnitMeasure.Name.Trim()))
                .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Supplier.CompanyName.Trim()));
            CreateMap<Good, GoodsDropDown>();
            CreateMap<Good, GoodsDetail>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.CategoryName.Trim()))
                .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Supplier.BrandName.Trim()))
                .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Supplier.CompanyName.Trim()))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Supplier.Address.Trim()))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.StorageCondition.HumidityMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.StorageCondition.HumidityMin))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.StorageCondition.LightLevel));
            CreateMap<GoodsCreate, Good>()
                .ForMember(dest => dest.GoodsId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<GoodsUpdate, Good>()
                .ForMember(dest => dest.GoodsId, opt => opt.Ignore())
                //.ForMember(dest => dest.GoodsCode, opt => opt.Ignore())
                //.ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                //.ForMember(dest => dest.Category, opt => opt.Ignore())
                //.ForMember(dest => dest.Supplier, opt => opt.Ignore())
                //.ForMember(dest => dest.StorageCondition, opt => opt.Ignore())
                //.ForMember(dest => dest.UnitMeasure, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            //Map Supplier
            CreateMap<Supplier, SupplierDto>();
            CreateMap<Supplier, SupplierDetail>();
            CreateMap<Supplier, SupplierDropDown>();
            CreateMap<SupplierCreate, Supplier>()
                .ForMember(dest => dest.SupplierId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<SupplierUpdate, Supplier>()
                .ForMember(dest => dest.SupplierId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => (DateTime?)null))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<SupplierUpdate, SupplierCreate>();


            //Map Retailer
            CreateMap<Retailer, RetailerDto>();
            CreateMap<Retailer, RetailerDetail>();
            CreateMap<Retailer, RetailerDropDown>();
            CreateMap<RetailerCreate, Retailer>()
                .ForMember(dest => dest.RetailerId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => (DateTime?)null));

        }
    }
}