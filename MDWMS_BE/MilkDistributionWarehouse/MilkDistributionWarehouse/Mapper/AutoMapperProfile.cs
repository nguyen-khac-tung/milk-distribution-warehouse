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
            // Map StorageCondition
            CreateMap<StorageCondition, StorageConditionDto.StorageConditionResponseDto>();
            CreateMap<StorageConditionDto.StorageConditionRequestDto, StorageCondition>();
            CreateMap<StorageConditionDto.StorageConditionRequestDto, StorageCondition>()
                .ForMember(dest => dest.StorageConditionId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore());

            // Map UnitMeasure
            CreateMap<UnitMeasure, UnitMeasureDto>();
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

            // Map Area
            CreateMap<Area, AreaDto.AreaResponseDto>();

            CreateMap<AreaDto.AreaRequestDto, Area>()
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdateAt, opt => opt.Ignore())
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.AreaName.Trim()))
                .ForMember(dest => dest.AreaCode, opt => opt.MapFrom(src => src.AreaCode.Trim()))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description != null ? src.Description.Trim() : null));
        }
    }
}