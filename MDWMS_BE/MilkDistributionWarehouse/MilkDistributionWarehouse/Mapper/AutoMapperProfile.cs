using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Utilities;
using static MilkDistributionWarehouse.Models.DTOs.PalletDto;

namespace MilkDistributionWarehouse.Mapper
{
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            //Map User
            CreateMap<User, UserProfileDto>();
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.Roles));
            CreateMap<User, UserDetailDto>()
                .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.Roles));
            CreateMap<UserCreateDto, User>()
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName.Trim()))
                .ForMember(dest => dest.IsFirstLogin, opt => opt.MapFrom(_ => true))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => CommonStatus.Active))
                .ForMember(dest => dest.CreateAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<UserUpdateDto, User>()
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName.Trim()))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<User, UserDropDown>();

            //Map Role
            CreateMap<Role, RoleDto>();

            // Map StorageCondition
            CreateMap<StorageCondition, StorageConditionDto.StorageConditionResponseDto>();
            CreateMap<StorageCondition, StorageConditionDto.StorageConditionActiveDto>()
                .ForMember(dest => dest.StorageConditionId, opt => opt.MapFrom(src => src.StorageConditionId))
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.TemperatureMin))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.TemperatureMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.HumidityMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.HumidityMax));
            CreateMap<StorageConditionDto.StorageConditionRequestDto, StorageCondition>()
                .ForMember(dest => dest.StorageConditionId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom((src, dest) =>
                {
                    return src.LightLevel switch
                    {
                        LightStorageConditionStatus.Low => "Thấp",
                        LightStorageConditionStatus.Normal => "Bình thường",
                        LightStorageConditionStatus.High => "Cao",
                        _ => src.LightLevel
                    };
                }));

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
                .ForMember(dest => dest.AreaName,
                opt => opt.MapFrom(src => src.Area != null ? src.Area.AreaName.Trim() : null))
                .ForMember(dest => dest.AreaCode,
                opt => opt.MapFrom(src => src.Area != null ? src.Area.AreaCode.Trim() : null));
            CreateMap<Location, LocationDto.LocationSuggestDto>()
                .ForMember(dest => dest.AreaName,
                opt => opt.MapFrom(src => src.Area != null ? src.Area.AreaName.Trim() : null))
                .ForMember(dest => dest.AreaCode,
                opt => opt.MapFrom(src => src.Area != null ? src.Area.AreaCode.Trim() : null));
            CreateMap<Location, LocationDto.LocationActiveDto>()
                .ForMember(dest => dest.LocationId, opt => opt.MapFrom(src => src.LocationId))
                .ForMember(dest => dest.LocationCode, opt => opt.MapFrom(src => src.LocationCode.Trim()));
            CreateMap<Location, LocationDto.LocationPalletDto>()
                .ForMember(dest => dest.AreaName,
                opt => opt.MapFrom(src => src.Area != null ? src.Area.AreaName.Trim() : null));
            CreateMap<LocationDto.LocationRequestDto, Location>()
                .ForMember(dest => dest.LocationId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.Area, opt => opt.Ignore())
                .ForMember(dest => dest.Pallets, opt => opt.Ignore())
                .ForMember(dest => dest.StocktakingLocations, opt => opt.Ignore());

            // Map Area
            CreateMap<Area, AreaDto.AreaResponseDto>();
            CreateMap<Area, AreaDto.AreaNameDto>();
            CreateMap<Area, AreaDto.AreaActiveDto>();
            CreateMap<AreaDto.AreaRequestDto, Area>()
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.AreaName.Trim()))
                .ForMember(dest => dest.AreaCode, opt => opt.MapFrom(src => src.AreaCode.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null))
                .ForMember(dest => dest.StorageConditionId, opt => opt.MapFrom(src => src.StorageConditionId));
            CreateMap<Area, AreaDto.AreaDetailDto>()
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.StorageCondition.HumidityMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.StorageCondition.HumidityMax))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.StorageCondition.LightLevel));
            CreateMap<Area, AreaDto.AreaDetailDto>()
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.StorageCondition.HumidityMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.StorageCondition.HumidityMax))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.StorageCondition.LightLevel));
            CreateMap<Area, AreaDto.StocktakingAreaDto>()
                .ForMember(dest => dest.AvailableLocationCount, opt => opt.MapFrom(src => src.Locations.Count(l => l.IsAvailable == true && l.Status != CommonStatus.Inactive)))
                .ForMember(dest => dest.UnAvailableLocationCount, opt => opt.MapFrom(src => src.Locations.Count(l => l.IsAvailable == false && l.Status != CommonStatus.Inactive)))
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.StorageCondition.HumidityMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.StorageCondition.HumidityMax))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.StorageCondition.LightLevel));

            // Map Goods
            CreateMap<Good, GoodsDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.CategoryName.Trim()))
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.UnitMeasure.Name.Trim()))
                .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Supplier.CompanyName.Trim()));
            CreateMap<Good, GoodsDropDown>();
            CreateMap<Good, GoodsDropDownAndUnitMeasure>()
                .IncludeBase<Good, GoodsDropDown>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.UnitMeasure.Name.Trim()));
            CreateMap<Good, GoodsDetail>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.CategoryName.Trim()))
                .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Supplier.BrandName.Trim()))
                .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Supplier.CompanyName.Trim()))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Supplier.Address.Trim()))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.StorageCondition.HumidityMax))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.StorageCondition.HumidityMin))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.StorageCondition.LightLevel))
                .ForMember(dest => dest.GoodsPackings, opt => opt.MapFrom(src => src.GoodsPackings));
            CreateMap<GoodsCreate, Good>()
                .ForMember(dest => dest.GoodsId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<GoodsCreateBulkDto, Good>()
                .ForMember(dest => dest.GoodsId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => CommonStatus.Active))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<GoodsUpdate, Good>()
                .ForMember(dest => dest.GoodsId, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<Good, GoodsInventoryDto>()
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.UnitMeasure.Name))
                .ForMember(dest => dest.GoodsPackings, opt => opt.MapFrom(src => src.GoodsPackings));


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


            //Map Batch
            CreateMap<Batch, BatchDropDownDto>();
            CreateMap<Batch, BatchDto>()
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods != null ? src.Goods.GoodsName : null))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null));
            CreateMap<BatchCreateDto, Batch>()
                .ForMember(dest => dest.BatchId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.BatchCode.Trim()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => CommonStatus.Active))
                .ForMember(dest => dest.CreateAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<BatchUpdateDto, Batch>()
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now));

            //Map PurchaseOrder
            CreateMap<PurchaseOrder, PurchaseOrderDtoCommon>()
                .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier.CompanyName.Trim()));
            CreateMap<PurchaseOrder, PurchaseOrderDetailBySupplier>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName.Trim()))
                .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier.CompanyName.Trim()));
            CreateMap<PurchaseOrder, PurchaseOrderDtoSaleRepresentative>()
                .IncludeBase<PurchaseOrder, PurchaseOrderDtoCommon>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName.Trim()))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName.Trim()));
            CreateMap<PurchaseOrder, PurchaseOrderDtoSaleManager>()
                .IncludeBase<PurchaseOrder, PurchaseOrderDtoCommon>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName.Trim()))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName.Trim()))
                .ForMember(dest => dest.ArrivalConfirmedByName, opt => opt.MapFrom(src => src.ArrivalConfirmedByNavigation.FullName.Trim()));
            CreateMap<PurchaseOrder, PurchaseOrderDtoWarehouseManager>()
                .IncludeBase<PurchaseOrder, PurchaseOrderDtoSaleManager>()
                .ForMember(dest => dest.AssignToByName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName.Trim()));
            CreateMap<PurchaseOrder, PurchaseOrderDtoWarehouseStaff>()
                .IncludeBase<PurchaseOrder, PurchaseOrderDtoCommon>()
                .ForMember(dest => dest.ArrivalConfirmedByName, opt => opt.MapFrom(src => src.ArrivalConfirmedByNavigation.FullName.Trim()))
                .ForMember(dest => dest.AssignToByName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName.Trim()));
            CreateMap<PurchaseOrder, PurchaseOrdersDetail>()
                .IncludeBase<PurchaseOrder, PurchaseOrderDtoWarehouseManager>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Supplier.Email.Trim()))
                .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Supplier.Phone.Trim()))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Supplier.Address.Trim()));
            CreateMap<PurchaseOrderCreate, PurchaseOrder>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => PurchaseOrderStatus.Draft))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => (DateTime?)null));

            //Map PurchaseOderDetail
            CreateMap<PurchaseOderDetail, PurchaseOrderDetailDto>()
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName.Trim()))
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Goods.GoodsCode.Trim()))
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.Goods.UnitMeasure.Name.Trim()))
                .ForMember(dest => dest.UnitPerPacking, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage));
            CreateMap<PurchaseOrderDetailCreate, PurchaseOderDetail>()
                .ForMember(dest => dest.PurchaseOderId, opt => opt.Ignore());
            CreateMap<PurchaseOrderDetailUpdate, PurchaseOderDetail>()
                .IncludeBase<PurchaseOrderDetailCreate, PurchaseOderDetail>()
                .ForMember(dest => dest.PurchaseOrderDetailId, opt => opt.Ignore());

            //Map Pallet
            CreateMap<Pallet, PalletResponseDto>()
                .ForMember(dest => dest.CreateByName, opt => opt.MapFrom(src => src.CreateByNavigation != null ? src.CreateByNavigation.FullName : null))
                .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.BatchCode : null))
                .ForMember(dest => dest.GoodId, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.GoodsId : null))
                .ForMember(dest => dest.GoodCode, opt => opt.MapFrom(src => src.Batch != null && src.Batch.Goods != null ? src.Batch.Goods.GoodsCode : null))
                .ForMember(dest => dest.GoodName, opt => opt.MapFrom(src => src.Batch != null && src.Batch.Goods != null ? src.Batch.Goods.GoodsName : null))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking != null ? src.GoodsPacking.UnitPerPackage : null))
                .ForMember(dest => dest.LocationCode, opt => opt.MapFrom(src => src.Location != null ? src.Location.LocationCode : null));
            CreateMap<Pallet, PalletDetailDto>()
                .ForMember(dest => dest.CreateByName, opt => opt.MapFrom(src => src.CreateByNavigation != null ? src.CreateByNavigation.FullName : null))
                .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.BatchCode : null))
                .ForMember(dest => dest.ManufacturingDate, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.ManufacturingDate : null))
                .ForMember(dest => dest.ExpiryDate, opt => opt.MapFrom(src => src.Batch != null ? src.Batch.ExpiryDate : null))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking != null ? src.GoodsPacking.UnitPerPackage : null))
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Batch != null && src.Batch.Goods != null ? src.Batch.Goods.GoodsName : null))
                .ForMember(dest => dest.UnitOfMeasure, opt => opt.MapFrom(src => src.Batch != null && src.Batch.Goods.UnitMeasure != null ? src.Batch.Goods.UnitMeasure.Name : null))
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Location != null && src.Location.Area != null ? src.Location.Area.AreaName : null))
                .ForMember(dest => dest.AreaCode, opt => opt.MapFrom(src => src.Location != null && src.Location.Area != null ? src.Location.Area.AreaCode : null))
                .ForMember(dest => dest.LocationCode, opt => opt.MapFrom(src => src.Location != null ? src.Location.LocationCode : null));
            CreateMap<PalletUpdateStatusDto, Pallet>();
            CreateMap<Pallet, PalletUpdateStatusDto>().ReverseMap();
            CreateMap<PalletRequestDto, Pallet>();
            CreateMap<Pallet, PalletActiveDto>();
            CreateMap<PalletUpdatePQuantityDto, Pallet>();
            CreateMap<Pallet, PalletUpdatePQuantityDto>();

            //Map SalesOrder
            CreateMap<SalesOrder, SalesOrderDtoSalesRepresentative>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer.RetailerName))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName));
            CreateMap<SalesOrder, SalesOrderDtoSaleManager>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer.RetailerName))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName))
                .ForMember(dest => dest.AcknowledgedByName, opt => opt.MapFrom(src => src.AcknowledgedByNavigation.FullName));
            CreateMap<SalesOrder, SalesOrderDtoWarehouseManager>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer.RetailerName))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName))
                .ForMember(dest => dest.AcknowledgedByName, opt => opt.MapFrom(src => src.AcknowledgedByNavigation.FullName))
                .ForMember(dest => dest.AssignToName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName));
            CreateMap<SalesOrder, SalesOrderDtoWarehouseStaff>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer.RetailerName))
                .ForMember(dest => dest.AcknowledgedByName, opt => opt.MapFrom(src => src.AcknowledgedByNavigation.FullName))
                .ForMember(dest => dest.AssignToName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName));
            CreateMap<SalesOrder, SalesOrderDetailDto>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer.RetailerName))
                .ForMember(dest => dest.RetailerPhone, opt => opt.MapFrom(src => src.Retailer.Phone))
                .ForMember(dest => dest.RetailerEmail, opt => opt.MapFrom(src => src.Retailer.Email))
                .ForMember(dest => dest.RetailerAddress, opt => opt.MapFrom(src => src.Retailer.Address))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedByNavigation))
                .ForMember(dest => dest.ApprovalBy, opt => opt.MapFrom(src => src.ApprovalByNavigation))
                .ForMember(dest => dest.AcknowledgedBy, opt => opt.MapFrom(src => src.AcknowledgedByNavigation))
                .ForMember(dest => dest.AssignTo, opt => opt.MapFrom(src => src.AssignToNavigation))
                .ForMember(dest => dest.SalesOrderItemDetails, opt => opt.MapFrom(src => src.SalesOrderDetails.ToList()));
            CreateMap<SalesOrderDetail, SalesOrderItemDetailDto>()
                .ForMember(dest => dest.Goods, opt => opt.MapFrom(src => src.Goods))
                .ForMember(dest => dest.GoodsPacking, opt => opt.MapFrom(src => src.GoodsPacking));
            CreateMap<SalesOrderCreateDto, SalesOrder>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => SalesOrderStatus.Draft))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note ?? ""))
                .ForMember(dest => dest.SalesOrderDetails, opt => opt.MapFrom(src => src.SalesOrderItemDetailCreateDtos));
            CreateMap<SalesOrderItemDetailCreateDto, SalesOrderDetail>()
                .ForMember(dest => dest.SalesOrderDetailId, opt => opt.Ignore())
                .ForMember(dest => dest.SalesOrderId, opt => opt.Ignore());
            CreateMap<SalesOrderUpdateDto, SalesOrder>()
                .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note ?? ""))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.SalesOrderDetails, opt => opt.Ignore());
            CreateMap<SalesOrderItemDetailUpdateDto, SalesOrderDetail>();

            //Map GoodsPacking
            CreateMap<GoodsPacking, GoodsPackingDto>();
            CreateMap<GoodsPackingCreate, GoodsPacking>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => CommonStatus.Active));
            CreateMap<GoodsPackingCreateDto, GoodsPacking>()
                .IncludeBase<GoodsPackingCreate, GoodsPacking>();

            //Map GoodsReceiptNoteDetail
            CreateMap<GoodsReceiptNoteDetail, GoodsReceiptNoteDetailDto.GoodsReceiptNoteDetailPalletDto>()
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.Goods.UnitMeasure.Name))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage))
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName));

            CreateMap<GoodsReceiptNoteDetail, GoodsReceiptNoteDetailListDto>()
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Goods.GoodsCode))
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName))
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.Goods.UnitMeasure.Name))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage));

            CreateMap<PurchaseOderDetail, GoodsReceiptNoteDetail>()
                .ForMember(dest => dest.GoodsReceiptNoteDetailId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.GoodsReceiptNoteId, opt => opt.Ignore())
                .ForMember(dest => dest.ExpectedPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => GoodsReceiptNoteStatus.Receiving))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<GoodsReceiptNoteDetailUpdateStatus, GoodsReceiptNoteDetail>()
                .ForMember(dest => dest.GoodsReceiptNoteDetailId, opt => opt.Ignore())
                .ForMember(dest => dest.GoodsReceiptNoteId, opt => opt.Ignore())
                .ForMember(dest => dest.GoodsId, opt => opt.Ignore())
                .ForMember(dest => dest.GoodsPackingId, opt => opt.Ignore())
                .ForMember(dest => dest.ExpectedPackageQuantity, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<GoodsReceiptNoteDetailInspectedDto, GoodsReceiptNoteDetail>()
                .IncludeBase<GoodsReceiptNoteDetailUpdateStatus, GoodsReceiptNoteDetail>()
                .ForMember(dest => dest.ActualPackageQuantity, opt => opt.MapFrom(src => src.DeliveredPackageQuantity - src.RejectPackageQuantity))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => ReceiptItemStatus.Inspected));
            CreateMap<GoodsReceiptNoteDetailCancelDto, GoodsReceiptNoteDetail>()
                .IncludeBase<GoodsReceiptNoteDetailUpdateStatus, GoodsReceiptNoteDetail>()
                .AfterMap((src, dest) =>
                {
                    dest.DeliveredPackageQuantity = null;
                    dest.RejectPackageQuantity = null;
                    dest.ActualPackageQuantity = null;
                    dest.Note = null;
                    dest.Status = ReceiptItemStatus.Receiving;
                    dest.UpdatedAt = DateTime.Now;
                });
            CreateMap<GoodsReceiptNoteDetailPendingApprovalDto, GoodsReceiptNoteDetail>()
                .IncludeBase<GoodsReceiptNoteDetailUpdateStatus, GoodsReceiptNoteDetail>()
                 .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => ReceiptItemStatus.PendingApproval));
            CreateMap<GoodsReceiptNoteDetailRejectDto, GoodsReceiptNoteDetail>()
                .IncludeBase<GoodsReceiptNoteDetailUpdateStatus, GoodsReceiptNoteDetail>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => ReceiptItemStatus.Receiving));
            CreateMap<GoodsReceiptNoteDetailCompletedDto, GoodsReceiptNoteDetail>()
                .IncludeBase<GoodsReceiptNoteDetailUpdateStatus, GoodsReceiptNoteDetail>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => ReceiptItemStatus.Completed));


            // Map BackOrder
            CreateMap<BackOrder, BackOrderDto.BackOrderResponseDto>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer != null ? src.Retailer.RetailerName : null))
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods != null ? src.Goods.GoodsName : null))
                .ForMember(dest => dest.UnitMeasureId, opt => opt.MapFrom(src => src.Goods.UnitMeasure != null ? src.Goods.UnitMeasureId : null))
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.Goods.UnitMeasure != null ? src.Goods.UnitMeasure.Name : null))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking != null ? src.GoodsPacking.UnitPerPackage : null))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation != null ? src.CreatedByNavigation.FullName : null));
            CreateMap<BackOrder, BackOrderDto.BackOrderResponseCreateDto>()
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.Retailer != null ? src.Retailer.RetailerName : null))
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods != null ? src.Goods.GoodsName : null))
                .ForMember(dest => dest.UnitMeasureId, opt => opt.MapFrom(src => src.Goods.UnitMeasure != null ? src.Goods.UnitMeasureId : null))
                .ForMember(dest => dest.UnitMeasureName, opt => opt.MapFrom(src => src.Goods.UnitMeasure != null ? src.Goods.UnitMeasure.Name : null))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking != null ? src.GoodsPacking.UnitPerPackage : null))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation != null ? src.CreatedByNavigation.FullName : null));
            CreateMap<BackOrderDto.BackOrderRequestDto, BackOrder>();

            //Map GoodsReceiptNote
            CreateMap<GoodsReceiptNoteCreate, GoodsReceiptNote>()
                .ForMember(dest => dest.ApprovalBy, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => GoodsReceiptNoteStatus.Receiving))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<GoodsReceiptNote, GoodsReceiptNoteDto>()
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.GoodsReceiptNoteDetails, opt => opt.MapFrom(src => src.GoodsReceiptNoteDetails));

            // Map GoodsIssueNote
            CreateMap<SalesOrder, GoodsIssueNote>()
                .ForMember(dest => dest.SalesOderId, opt => opt.MapFrom(src => src.SalesOrderId))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => GoodsIssueNoteStatus.Picking))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovalBy, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByNavigation, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovalByNavigation, opt => opt.Ignore());
            CreateMap<SalesOrderDetail, GoodsIssueNoteDetail>()
                .ForMember(dest => dest.GoodsIssueNoteDetailId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => IssueItemStatus.Picking))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.Note, opt => opt.Ignore())
                .ForMember(dest => dest.RejectionReason, opt => opt.Ignore());
            CreateMap<GoodsIssueNote, GoodsIssueNoteDetailDto>()
                .ForMember(dest => dest.EstimatedTimeDeparture, opt => opt.MapFrom(src => src.SalesOder.EstimatedTimeDeparture))
                .ForMember(dest => dest.RetailerName, opt => opt.MapFrom(src => src.SalesOder.Retailer.RetailerName))
                .ForMember(dest => dest.RetailerAddress, opt => opt.MapFrom(src => src.SalesOder.Retailer.Address))
                .ForMember(dest => dest.RetailerPhone, opt => opt.MapFrom(src => src.SalesOder.Retailer.Phone))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName));
            CreateMap<GoodsIssueNoteDetail, GoodsIssueNoteItemDetailDto>()
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName))
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Goods.GoodsCode))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage))
                .ForMember(dest => dest.RequiredPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity));

            //Map DisposalRequest
            CreateMap<DisposalRequest, DisposalRequestDtoSaleManager>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName));
            CreateMap<DisposalRequest, DisposalRequestDtoWarehouseManager>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName))
                .ForMember(dest => dest.AssignToName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName));
            CreateMap<DisposalRequest, DisposalRequestDtoWarehouseStaff>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.AssignToName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName));
            CreateMap<DisposalRequest, DisposalRequestDetailDto>()
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedByNavigation))
                .ForMember(dest => dest.ApprovalBy, opt => opt.MapFrom(src => src.ApprovalByNavigation))
                .ForMember(dest => dest.AssignTo, opt => opt.MapFrom(src => src.AssignToNavigation))
                .ForMember(dest => dest.DisposalRequestDetails, opt => opt.MapFrom(src => src.DisposalRequestDetails.ToList()));
            CreateMap<DisposalRequestDetail, DisposalRequestItemDetailDto>()
                .ForMember(dest => dest.Goods, opt => opt.MapFrom(src => src.Goods))
                .ForMember(dest => dest.GoodsPacking, opt => opt.MapFrom(src => src.GoodsPacking));
            CreateMap<DisposalRequestCreateDto, DisposalRequest>()
               .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => DisposalRequestStatus.Draft))
               .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
               .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note ?? ""))
               .ForMember(dest => dest.DisposalRequestDetails, opt => opt.MapFrom(src => src.DisposalRequestItems));
            CreateMap<DisposalRequestItemCreateDto, DisposalRequestDetail>()
                .ForMember(dest => dest.DisposalRequestDetailId, opt => opt.Ignore());
            CreateMap<DisposalRequestUpdateDto, DisposalRequest>()
                .ForMember(dest => dest.Note, opt => opt.MapFrom(src => src.Note ?? ""))
                .ForMember(dest => dest.DisposalRequestDetails, opt => opt.Ignore());
            CreateMap<DisposalRequestItemUpdateDto, DisposalRequestDetail>();

            // Map DisposalNote
            CreateMap<DisposalRequest, DisposalNote>()
                .ForMember(dest => dest.DisposalRequestId, opt => opt.MapFrom(src => src.DisposalRequestId))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => DisposalNoteStatus.Picking))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.ApprovalBy, opt => opt.Ignore());
            CreateMap<DisposalRequestDetail, DisposalNoteDetail>()
                .ForMember(dest => dest.DisposalNoteDetailId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => DisposalNoteItemStatus.Picking))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.Note, opt => opt.Ignore())
                .ForMember(dest => dest.RejectionReason, opt => opt.Ignore());
            CreateMap<DisposalNote, DisposalNoteDetailDto>()
                .ForMember(dest => dest.EstimatedTimeDeparture, opt => opt.MapFrom(src => src.DisposalRequest.EstimatedTimeDeparture))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName));
            CreateMap<DisposalNoteDetail, DisposalNoteItemDetailDto>()
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName))
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Goods.GoodsCode))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage))
                .ForMember(dest => dest.RequiredPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity));

            // Map PickAllocation            
            CreateMap<PickAllocation, PickAllocationDto>()
                .ForMember(dest => dest.PickPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity))
                .ForMember(dest => dest.LocationCode, opt => opt.MapFrom(src => src.Pallet.Location.LocationCode))
                .ForMember(dest => dest.Rack, opt => opt.MapFrom(src => src.Pallet.Location.Rack))
                .ForMember(dest => dest.Row, opt => opt.MapFrom(src => src.Pallet.Location.Row))
                .ForMember(dest => dest.Column, opt => opt.MapFrom(src => src.Pallet.Location.Column))
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Pallet.Location.Area.AreaName));
            CreateMap<PickAllocation, PickAllocationDetailDto>()
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Pallet.Batch.Goods.GoodsName))
                .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Pallet.Batch.BatchCode))
                .ForMember(dest => dest.ExpiryDate, opt => opt.MapFrom(src => src.Pallet.Batch.ExpiryDate))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.Pallet.GoodsPacking.UnitPerPackage))
                .ForMember(dest => dest.UnitMeasure, opt => opt.MapFrom(src => src.Pallet.Batch.Goods.UnitMeasure.Name))
                .ForMember(dest => dest.PalletPackageQuantity, opt => opt.MapFrom(src => src.Pallet.PackageQuantity))
                .ForMember(dest => dest.PickPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity));

            //Map StocktakingSheet
            CreateMap<StocktakingSheet, StocktakingSheetDto>()
                .ForMember(dest => dest.CreateByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName));
            CreateMap<StocktakingSheetCreate, StocktakingSheet>()
                .ForMember(dest => dest.StocktakingSheetId, opt => opt.MapFrom(_ => PrimaryKeyUtility.GenerateStocktakingKey(null)))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StocktakingStatus.Draft))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<StocktakingSheet, StocktakingSheetDetail>()
                .IncludeBase<StocktakingSheet, StocktakingSheetDto>()
                .ForMember(dest => dest.StocktakingAreas, opt => opt.MapFrom(src => src.StocktakingAreas));

            //Map StocktakingArea
            CreateMap<StocktakingAreaCreate, StocktakingArea>()
                .ForMember(dest => dest.StocktakingAreaId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockAreaStatus.Assigned))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<StocktakingArea, StocktakingAreaDetail>()
                .ForMember(dest => dest.AssignToName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName))
                .ForMember(dest => dest.AreaDetail, opt => opt.MapFrom(src => src.Area));
            CreateMap<StocktakingArea, StocktakingAreaDetailDto>()
                .IncludeBase<StocktakingArea, StocktakingAreaDetail>()
                .ForMember(dest => dest.StocktakingLocations, opt => opt.MapFrom(src => src.StocktakingLocations));
            CreateMap<StocktakingAreaUpdate, StocktakingArea>()
                .ForMember(dest => dest.StocktakingAreaId, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<StocktakingArea, StocktakingAreaUpdateDto>()
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area.AreaName))
                .ForMember(dest => dest.TemperatureMax, opt => opt.MapFrom(src => src.Area.StorageCondition.TemperatureMax))
                .ForMember(dest => dest.TemperatureMin, opt => opt.MapFrom(src => src.Area.StorageCondition.TemperatureMin))
                .ForMember(dest => dest.HumidityMin, opt => opt.MapFrom(src => src.Area.StorageCondition.HumidityMin))
                .ForMember(dest => dest.HumidityMax, opt => opt.MapFrom(src => src.Area.StorageCondition.HumidityMax))
                .ForMember(dest => dest.LightLevel, opt => opt.MapFrom(src => src.Area.StorageCondition.LightLevel))
                .ForMember(dest => dest.AssignName, opt => opt.MapFrom(src => src.AssignToNavigation.FullName))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status));

            //Map StocktakingLocation
            CreateMap<Location, StocktakingLocation>()
                .ForMember(dest => dest.StocktakingLocationId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.LocationId, opt => opt.MapFrom(src => src.LocationId))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockLocationStatus.Pending))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore());
            CreateMap<StocktakingArea, StocktakingLocationCreate>();
            CreateMap<StocktakingLocation, StocktakingLocationDto>()
                .ForMember(dest => dest.LocationCode, opt => opt.MapFrom(src => src.Location.LocationCode))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => src.Location.IsAvailable));
            CreateMap<StocktakingLocationRejectStatus, StocktakingLocation>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockLocationStatus.Pending))
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now));

            //Map StocktakingPallet
            CreateMap<Pallet, StocktakingPallet>()
                .ForMember(dest => dest.StocktakingPalletId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.PalletId, opt => opt.MapFrom(src => src.PalletId))
                .ForMember(dest => dest.ExpectedPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockPalletStatus.Unscanned))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore());
            CreateMap<StocktakingPallet, StocktakingPalletDto>()
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Pallet.Batch.Goods.GoodsCode))
                .ForMember(dest => dest.GooodsName, opt => opt.MapFrom(src => src.Pallet.Batch.Goods.GoodsName))
                .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Pallet.Batch.BatchCode));
            CreateMap<StocktakingPalletUpdateStatus, StocktakingPallet>()
                .ForMember(dest => dest.UpdateAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<StocktakingPalletMissingStatus, StocktakingPallet>()
                .IncludeBase<StocktakingPalletUpdateStatus, StocktakingPallet>()
                .ForMember(dest => dest.ActualPackageQuantity, opt => opt.MapFrom(_ => 0))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockPalletStatus.Missing));
            CreateMap<StocktakingPalletMatchStatus, StocktakingPallet>()
                .IncludeBase<StocktakingPalletUpdateStatus, StocktakingPallet>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockPalletStatus.Matched));
            CreateMap<StocktakingPalletSurplusStatus, StocktakingPallet>()
                .IncludeBase<StocktakingPalletUpdateStatus, StocktakingPallet>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => StockPalletStatus.Surplus));

            //Map GoodsReceiptNoteDetail -> GoodsReceiptReportDto (per-detail projection)
            CreateMap<GoodsReceiptNoteDetail, ReportDto.GoodsReceiptReportDto>()
                .ForMember(dest => dest.SupplierId,
                    opt => opt.MapFrom(src => src.GoodsReceiptNote != null && src.GoodsReceiptNote.PurchaseOder != null
                        ? src.GoodsReceiptNote.PurchaseOder.SupplierId ?? src.Goods.SupplierId ?? 0
                        : src.Goods.SupplierId ?? 0))
                .ForMember(dest => dest.SupplierName,
                    opt => opt.MapFrom(src => src.GoodsReceiptNote != null && src.GoodsReceiptNote.PurchaseOder != null && src.GoodsReceiptNote.PurchaseOder.Supplier != null
                        ? src.GoodsReceiptNote.PurchaseOder.Supplier.CompanyName
                        : src.Goods != null && src.Goods.Supplier != null ? src.Goods.Supplier.CompanyName : null))
                .ForMember(dest => dest.GoodsId, opt => opt.MapFrom(src => src.GoodsId))
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Goods.GoodsCode))
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName))
                .ForMember(dest => dest.GoodsPackingId, opt => opt.MapFrom(src => src.GoodsPackingId ?? 0))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage))
                .ForMember(dest => dest.ReceiptDate, opt => opt.MapFrom(src => src.GoodsReceiptNote != null ? src.GoodsReceiptNote.CreatedAt : (DateTime?)null))
                // Received packages: prefer ActualPackageQuantity, otherwise Delivered - Reject
                .ForMember(dest => dest.TotalPackageQuantity,
                    opt => opt.MapFrom(src => src.ActualPackageQuantity ?? ((src.DeliveredPackageQuantity ?? 0) - (src.RejectPackageQuantity ?? 0))))
                // Total units = packages * unit-per-package (unit-per-package may be null -> treated as 0)
                .ForMember(dest => dest.TotalUnitQuantity,
                    opt => opt.MapFrom(src => (src.ActualPackageQuantity ?? ((src.DeliveredPackageQuantity ?? 0) - (src.RejectPackageQuantity ?? 0)))
                                             * (src.GoodsPacking.UnitPerPackage ?? 0)))
                .ForMember(dest => dest.UnitOfMeasure,
                    opt => opt.MapFrom(src => src.Goods != null && src.Goods.UnitMeasure != null ? src.Goods.UnitMeasure.Name : null));
        }
    }
}