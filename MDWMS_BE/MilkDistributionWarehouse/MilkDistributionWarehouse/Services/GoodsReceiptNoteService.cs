using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IGoodsReceiptNoteService
    {
        Task<(string, GoodsReceiptNoteDto?)> GetGRNByPurchaseOrderId(Guid purchaseOrderId);
        Task<(string, GoodsReceiptNoteDto?)> CreateGoodsReceiptNote(GoodsReceiptNoteCreate create, int? userId);
    }

    public class GoodsReceiptNoteService : IGoodsReceiptNoteService
    {
        private readonly IGoodsReceiptNoteRepository _goodsReceiptNoteRepository;
        private readonly IMapper _mapper;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IGoodsReceiptNoteDetailRepository _goodsReceiptNoteDetailRepository;
        public GoodsReceiptNoteService(IGoodsReceiptNoteRepository goodsReceiptNoteRepository, 
            IMapper mapper, IPurchaseOrderDetailRepository purchaseOrderDetailRepository,
            IGoodsReceiptNoteDetailRepository goodsReceiptNoteDetailRepository)
        {
            _goodsReceiptNoteRepository = goodsReceiptNoteRepository;
            _mapper = mapper;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _goodsReceiptNoteDetailRepository = goodsReceiptNoteDetailRepository;
        }

        public async Task<(string, GoodsReceiptNoteDto?)> CreateGoodsReceiptNote(GoodsReceiptNoteCreate create, int? userId)
        {
            try
            {
                var purchaseOrderDetails = await _purchaseOrderDetailRepository.GetPurchaseOrderDetail()
                .Where(pod => pod.PurchaseOderId == create.PurchaseOderId).ToListAsync();

                if (!purchaseOrderDetails.Any())
                    throw new Exception("Danh sách đơn đặt hàng chi tiết trống.".ToMessageForUser());

                var grnDetails = _mapper.Map<List<GoodsReceiptNoteDetail>>(purchaseOrderDetails);

                var grn = _mapper.Map<GoodsReceiptNote>(create);

                foreach (var detail in grnDetails)
                {
                    detail.GoodsReceiptNoteId = grn.GoodsReceiptNoteId;
                }
                grn.CreatedBy = userId;
                grn.GoodsReceiptNoteDetails = grnDetails;

                var resultCreate = await _goodsReceiptNoteRepository.CreateGoodsReceiptNote(grn);
                if (resultCreate == null)
                    throw new Exception("GRN create is failed.");

                var (msg, getGRN) = await GetGRNByPurchaseOrderId(resultCreate.PurchaseOderId);
                if(!string.IsNullOrEmpty(msg))
                    throw new Exception(msg);

                return ("", getGRN);
            }
            catch (Exception ex)
            {
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, GoodsReceiptNoteDto?)> GetGRNByPurchaseOrderId(Guid purchaseOrderId)
        {
            if (purchaseOrderId == Guid.Empty)
                return ("PurchaseOrderId is invalid.", default);

            var grnQuery = _goodsReceiptNoteRepository.GetGRN();

            var grn = await (grnQuery.ProjectTo<GoodsReceiptNoteDto>(_mapper.ConfigurationProvider))
                .FirstOrDefaultAsync(grn => grn.PurchaseOderId == purchaseOrderId);

            if (grn == null)
                return ("Phiếu nhập kho không tồn tại.".ToMessageForUser(), default);

            return ("",  grn);
        }

    }
}
