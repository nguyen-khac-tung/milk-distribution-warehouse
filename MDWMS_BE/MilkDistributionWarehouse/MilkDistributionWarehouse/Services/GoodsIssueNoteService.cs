using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{

    public interface IGoodsIssueNoteService
    {
        Task<string> CreateGoodsIssueNote(GoodsIssueNoteCreateDto goodsIssueNoteCreate, int? userId);
    }

    public class GoodsIssueNoteService : IGoodsIssueNoteService
    {
        private readonly IGoodsIssueNoteRepository _goodsIssueNoteRepository;
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GoodsIssueNoteService(IGoodsIssueNoteRepository goodsIssueNoteRepository,
                                 ISalesOrderRepository salesOrderRepository,
                                 IUnitOfWork unitOfWork,
                                 IMapper mapper)
        {
            _goodsIssueNoteRepository = goodsIssueNoteRepository;
            _salesOrderRepository = salesOrderRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<string> CreateGoodsIssueNote(GoodsIssueNoteCreateDto goodsIssueNoteCreate, int? userId)
        {
            if (goodsIssueNoteCreate.SalesOrderId == null) return "SalesOrderId to create GoodsIssueNote Data is null.";
        
            var salesOrder = await _salesOrderRepository.GetSalesOrderById(goodsIssueNoteCreate.SalesOrderId);
            if (salesOrder == null) return "Data of SalesOrder to create GoodsIssueNote is null.";


        }
    }
}
