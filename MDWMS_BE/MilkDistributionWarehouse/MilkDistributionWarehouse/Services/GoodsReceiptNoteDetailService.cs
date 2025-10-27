using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Repositories;
using static MilkDistributionWarehouse.Models.DTOs.GoodsReceiptNoteDetailDto;
using static MilkDistributionWarehouse.Repositories.GoodsReceiptNoteDetailRepository;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsReceiptNoteDetailService
    {
        Task<(string, List<GoodsReceiptNoteDetailPalletDto>)> GetListGRNDByGRNId(Guid grnId);
    }
    
    public class GoodsReceiptNoteDetailService : IGoodsReceiptNoteDetailService
    {
        private readonly IGoodsReceiptNoteDetailRepository _grndRepository;
        private readonly IMapper _mapper;

        public GoodsReceiptNoteDetailService(IGoodsReceiptNoteDetailRepository grndRepository, IMapper mapper)
        {
            _grndRepository = grndRepository;
            _mapper = mapper;
        }

        public async Task<(string, List<GoodsReceiptNoteDetailPalletDto>)> GetListGRNDByGRNId(Guid grnId)
        {
            try
            {
                var grndList = await _grndRepository.GetListByGRNId(grnId);
                if (grndList == null || !grndList.Any())
                {
                    return ("No goods receipt note details found", new List<GoodsReceiptNoteDetailPalletDto>());
                }

                var grndDtos = _mapper.Map<List<GoodsReceiptNoteDetailPalletDto>>(grndList);
                return (string.Empty, grndDtos);
            }
            catch (Exception ex)
            {
                return ($"Error retrieving goods receipt note details: {ex.Message}", new List<GoodsReceiptNoteDetailPalletDto>());
            }
        }
    }
}
