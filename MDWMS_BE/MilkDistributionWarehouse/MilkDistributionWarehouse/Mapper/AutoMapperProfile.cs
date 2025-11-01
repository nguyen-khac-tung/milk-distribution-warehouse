using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
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
                .ForMember(dest => dest.PurchaseOderId, opt => opt.MapFrom(_ => Guid.NewGuid()))
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
                .ForMember(dest => dest.SalesOrderId, opt => opt.MapFrom(_ => Guid.NewGuid()))
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
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking != null ? src.GoodsPacking.UnitPerPackage : null))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation != null ? src.CreatedByNavigation.FullName : null));

            CreateMap<BackOrderDto.BackOrderRequestDto, BackOrder>();

            //Map GoodsReceiptNote
            CreateMap<GoodsReceiptNoteCreate, GoodsReceiptNote>()
                .ForMember(dest => dest.GoodsReceiptNoteId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => GoodsReceiptNoteStatus.Receiving))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => (DateTime?)null));
            CreateMap<GoodsReceiptNote, GoodsReceiptNoteDto>()
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.GoodsReceiptNoteDetails, opt => opt.MapFrom(src => src.GoodsReceiptNoteDetails));

            // Map GoodsIssueNote
            CreateMap<SalesOrder, GoodsIssueNote>()
                .ForMember(dest => dest.GoodsIssueNoteId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.SalesOderId, opt => opt.MapFrom(src => src.SalesOrderId))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => GoodsIssueNoteStatus.Picking))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now));
            CreateMap<SalesOrderDetail, GoodsIssueNoteDetail>()
                .ForMember(dest => dest.GoodsIssueNoteDetailId, opt => opt.MapFrom(_ => Guid.NewGuid()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => IssueItemStatus.Picking))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.Note, opt => opt.Ignore())
                .ForMember(dest => dest.RejectionReason, opt => opt.Ignore());
            CreateMap<GoodsIssueNote, GoodsIssueNoteDetailDto>()
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByNavigation.FullName))
                .ForMember(dest => dest.ApprovalByName, opt => opt.MapFrom(src => src.ApprovalByNavigation.FullName));
            CreateMap<GoodsIssueNoteDetail, GoodsIssueNoteItemDetailDto>()
                .ForMember(dest => dest.GoodsName, opt => opt.MapFrom(src => src.Goods.GoodsName))
                .ForMember(dest => dest.GoodsCode, opt => opt.MapFrom(src => src.Goods.GoodsCode))
                .ForMember(dest => dest.UnitPerPackage, opt => opt.MapFrom(src => src.GoodsPacking.UnitPerPackage))
                .ForMember(dest => dest.RequiredPackageQuantity, opt => opt.MapFrom(src => src.PackageQuantity));
            CreateMap<PickAllocation, PickAllocationDetailDto>()
                .ForMember(dest => dest.LocationCode, opt => opt.MapFrom(src => src.Pallet.Location.LocationCode))
                .ForMember(dest => dest.Rack, opt => opt.MapFrom(src => src.Pallet.Location.Rack))
                .ForMember(dest => dest.Row, opt => opt.MapFrom(src => src.Pallet.Location.Row))
                .ForMember(dest => dest.Column, opt => opt.MapFrom(src => src.Pallet.Location.Column))
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Pallet.Location.Area.AreaName))
                .ForMember(dest => dest.AreaCode, opt => opt.MapFrom(src => src.Pallet.Location.Area.AreaCode));
        }
    }
}