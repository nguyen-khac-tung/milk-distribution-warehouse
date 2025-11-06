using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
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
        Task<(string, T?)> UpdateGRNStatus<T>(T update, int? userId) where T : GoodsReceiptNoteUpdateStatus;
    }

    public class GoodsReceiptNoteService : IGoodsReceiptNoteService
    {
        private readonly IGoodsReceiptNoteRepository _goodsReceiptNoteRepository;
        private readonly IMapper _mapper;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IGoodsReceiptNoteDetailRepository _goodsReceiptNoteDetailRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IGoodsReceiptNoteDetailService _goodsReceiptNoteDetailService;
        public GoodsReceiptNoteService(IGoodsReceiptNoteRepository goodsReceiptNoteRepository,
            IMapper mapper, IPurchaseOrderDetailRepository purchaseOrderDetailRepository,
            IGoodsReceiptNoteDetailRepository goodsReceiptNoteDetailRepository, IUnitOfWork unitOfWork,
            IGoodsReceiptNoteDetailService goodsReceiptNoteDetailService)
        {
            _goodsReceiptNoteRepository = goodsReceiptNoteRepository;
            _mapper = mapper;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _goodsReceiptNoteDetailRepository = goodsReceiptNoteDetailRepository;
            _unitOfWork = unitOfWork;
            _goodsReceiptNoteDetailService = goodsReceiptNoteDetailService;
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
                if (!string.IsNullOrEmpty(msg))
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

            return ("", grn);
        }

        public async Task<(string, T?)> UpdateGRNStatus<T>(T update, int? userId) where T : GoodsReceiptNoteUpdateStatus
        {
            var grn = await _goodsReceiptNoteRepository.GetGoodsReceiptNoteById(update.GoodsReceiptNoteId);

            if (grn == null) return ("GRN is not exist.", default);

            var currentStatus = grn.Status;

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (update is GoodsReceiptNoteSubmitDto)
                {
                    if (currentStatus != GoodsReceiptNoteStatus.Receiving)
                        throw new Exception("Chỉ được chuyển sang trạng thái Chờ duyệt khi đơn ở trạng thái Đang tiếp nhận.".ToMessageForUser());

                    if (grn.CreatedBy != userId)
                        throw new Exception("Current User has no permission to update.");

                    string message = await UpdateStatusGRNDetail(grn, GoodsReceiptNoteStatus.PendingApproval, userId);
                    if (!string.IsNullOrEmpty(message))
                        throw new Exception(message.ToMessageForUser());

                    grn.Status = GoodsReceiptNoteStatus.PendingApproval;
                    grn.ApprovalBy = userId;
                    grn.UpdatedAt = DateTime.Now;
                }

                if (update is GoodsReceiptNoteCompletedDto)
                {
                    if (currentStatus != GoodsReceiptNoteStatus.PendingApproval)
                        throw new Exception("Chỉ được chuyển sang trạng thái Hoàn thành khi đơn ở trạng thái Chờ duyệt.".ToMessageForUser());

                    string message = await UpdateStatusGRNDetail(grn, GoodsReceiptNoteStatus.Completed, userId);
                    if (!string.IsNullOrEmpty(message))
                        throw new Exception(message.ToMessageForUser());

                    grn.Status = GoodsReceiptNoteStatus.Completed;
                    grn.ApprovalBy = userId;
                    grn.UpdatedAt = DateTime.Now;

                    if (grn.PurchaseOder.Status != PurchaseOrderStatus.Receiving)
                        throw new Exception("Chỉ được chuyển sang trạng thái Đã kiểm tra khi đơn hàng khi đơn hàng ở trạng thái Đang tiếp nhận.");
                    grn.PurchaseOder.Status = PurchaseOrderStatus.Inspected;
                    grn.PurchaseOder.UpdatedAt = DateTime.Now;
                }

                var updateResult = await _goodsReceiptNoteRepository.UpdateGoodsReceiptNote(grn);
                if (updateResult == null)
                    throw new Exception("Cập nhật trạng thái phiếu nhập kho thất bại.".ToMessageForUser());

                await _unitOfWork.CommitTransactionAsync();
                return ("", update);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        private async Task<string> UpdateStatusGRNDetail(GoodsReceiptNote grn, int statusChange, int? userId)
        {
            var grnds = grn.GoodsReceiptNoteDetails.ToList();

            if (statusChange == GoodsReceiptNoteStatus.PendingApproval)
            {
                string message = CheckGRNDetailStatusValidation(grnds);
                if (!string.IsNullOrEmpty(message))
                    return message;

                var grndInspected = grnds.Where(grnd => grnd.Status == ReceiptItemStatus.Inspected)
                    .Select(grnd => new GoodsReceiptNoteDetailPendingApprovalDto
                    {
                        GoodsReceiptNoteDetailId = grnd.GoodsReceiptNoteDetailId
                    }).ToList();

                foreach (var grnd in grndInspected)
                {
                    var (message1, grndResult) = await _goodsReceiptNoteDetailService.UpdateGRNDetail(grnd, userId);
                    if (!string.IsNullOrEmpty(message1))
                        return message1;
                }
            }

            if (statusChange == GoodsReceiptNoteStatus.Completed)
            {
                bool hasAnyNotPendingApprovalGRNDetail = grnds.Any(grnd => grnd.Status != ReceiptItemStatus.PendingApproval);
                if (hasAnyNotPendingApprovalGRNDetail)
                    return "Chỉ có thể Hoàn thành đơn khi mà tất cả các mục nhập kho chi tiết ở trạng thái Chờ duyệt.";

                var grndPendingApproval = grnds.Where(grnd => grnd.Status == ReceiptItemStatus.PendingApproval)
                    .Select(grnd => new GoodsReceiptNoteDetailCompletedDto
                    {
                        GoodsReceiptNoteDetailId = grnd.GoodsReceiptNoteDetailId
                    }).ToList();

                foreach (var grnd in grndPendingApproval)
                {
                    var (message1, grndResult) = await _goodsReceiptNoteDetailService.UpdateGRNDetail(grnd, userId);
                    if (!string.IsNullOrEmpty(message1))
                        return message1;
                }
            }

            return "";
        }

        private string CheckGRNDetailStatusValidation(List<GoodsReceiptNoteDetail> grnds)
        {
            bool hasAnyRecevingGRNDetail = grnds.Any(grnd => grnd.Status == ReceiptItemStatus.Receiving);

            if (hasAnyRecevingGRNDetail)
                return "Chỉ có thể nộp đơn khi mà tất cả các mục nhập kho chi tiết ở trạng thái Đã kiểm tra";

            return "";
        }
    }
}
