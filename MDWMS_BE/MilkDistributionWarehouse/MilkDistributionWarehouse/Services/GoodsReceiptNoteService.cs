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
        Task<(string, GoodsReceiptNoteDto?)> GetGRNByPurchaseOrderId(string purchaseOrderId);
        Task<(string, GoodsReceiptNoteDto?)> CreateGoodsReceiptNote(GoodsReceiptNoteCreate create, int? userId);
        Task<(string, T?)> UpdateGRNStatus<T>(T update, int? userId) where T : GoodsReceiptNoteUpdateStatus;
        Task<(string, byte[]?, string?)> ExportGoodsReceiptNoteWord(string purchaseOrderId);
    }

    public class GoodsReceiptNoteService : IGoodsReceiptNoteService
    {
        private readonly IGoodsReceiptNoteRepository _goodsReceiptNoteRepository;
        private readonly IMapper _mapper;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IGoodsReceiptNoteDetailRepository _goodsReceiptNoteDetailRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IGoodsReceiptNoteDetailService _goodsReceiptNoteDetailService;
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        private readonly IInventoryLedgerService _inventoryLedgerService;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly INotificationService _notificationService;
        private readonly IWebHostEnvironment _env;
        private readonly IUserRepository _userRepository;

        public GoodsReceiptNoteService(IGoodsReceiptNoteRepository goodsReceiptNoteRepository,
            IMapper mapper, IPurchaseOrderDetailRepository purchaseOrderDetailRepository,
            IGoodsReceiptNoteDetailRepository goodsReceiptNoteDetailRepository, IUnitOfWork unitOfWork,
            IGoodsReceiptNoteDetailService goodsReceiptNoteDetailService,
            IPurchaseOrderRepositoy purchaseOrderRepository,
            IInventoryLedgerService inventoryLedgerService,
            IStocktakingSheetRepository stocktakingSheetRepository,
            INotificationService notificationService, IWebHostEnvironment env, IUserRepository userRepository)
        {
            _goodsReceiptNoteRepository = goodsReceiptNoteRepository;
            _mapper = mapper;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _goodsReceiptNoteDetailRepository = goodsReceiptNoteDetailRepository;
            _unitOfWork = unitOfWork;
            _goodsReceiptNoteDetailService = goodsReceiptNoteDetailService;
            _purchaseOrderRepository = purchaseOrderRepository;
            _inventoryLedgerService = inventoryLedgerService;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _notificationService = notificationService;
            _env = env;
            _userRepository = userRepository;
        }

        public async Task<(string, GoodsReceiptNoteDto?)> CreateGoodsReceiptNote(GoodsReceiptNoteCreate create, int? userId)
        {
            try
            {
                if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                    throw new Exception("Không thể tạo phiếu nhập kho khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser());

                var purchaseOrderDetails = await _purchaseOrderDetailRepository.GetPurchaseOrderDetail()
                .Where(pod => pod.PurchaseOderId.Equals(create.PurchaseOderId)).ToListAsync();

                if (!purchaseOrderDetails.Any())
                    throw new Exception("Danh sách đơn đặt hàng chi tiết trống.".ToMessageForUser());

                var grnDetails = _mapper.Map<List<GoodsReceiptNoteDetail>>(purchaseOrderDetails);

                var purchaseOrder = await _purchaseOrderRepository.GetPurchaseOrderByPurchaseOrderId(create.PurchaseOderId);

                if (purchaseOrder == null)
                    throw new Exception("Đơn đặt hàng không tồn tại.".ToMessageForUser());

                if (purchaseOrder.AssignTo != userId)
                    throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                var grn = _mapper.Map<GoodsReceiptNote>(create);

                grn.GoodsReceiptNoteId = PrimaryKeyUtility.GenerateKey(purchaseOrder!.Supplier.BrandName, "GRN");

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

        public async Task<(string, GoodsReceiptNoteDto?)> GetGRNByPurchaseOrderId(string purchaseOrderId)
        {
            if (string.IsNullOrEmpty(purchaseOrderId))
                return ("PurchaseOrderId is invalid.", default);

            var grnQuery = _goodsReceiptNoteRepository.GetGRN();

            var grn = await (grnQuery.ProjectTo<GoodsReceiptNoteDto>(_mapper.ConfigurationProvider))
                .FirstOrDefaultAsync(grn => grn.PurchaseOderId.Equals(purchaseOrderId));

            if (grn == null)
                return ("Phiếu nhập kho không tồn tại.".ToMessageForUser(), default);

            return ("", grn);
        }

        public async Task<(string, T?)> UpdateGRNStatus<T>(T update, int? userId) where T : GoodsReceiptNoteUpdateStatus
        {
            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return ("Không thể cập nhật phiếu nhập kho khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser(), default);

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
                        throw new Exception("Bạn không có quyền thực hiện chức năng này.".ToMessageForUser());

                    string message = await UpdateStatusGRNDetail(grn, GoodsReceiptNoteStatus.PendingApproval, userId);
                    if (!string.IsNullOrEmpty(message))
                        throw new Exception(message.ToMessageForUser());

                    grn.Status = GoodsReceiptNoteStatus.PendingApproval;
                    grn.UpdatedAt = DateTimeUtility.Now();
                }

                if (update is GoodsReceiptNoteCompletedDto)
                {
                    if (currentStatus != GoodsReceiptNoteStatus.PendingApproval)
                        throw new Exception("Chỉ được chuyển sang trạng thái Hoàn thành khi đơn ở trạng thái Chờ duyệt.".ToMessageForUser());

                    await EnsureRolePermission(
                            RoleType.WarehouseManager,
                            userId,
                            "Tài khoản quản lý kho không tồn tại hoặc đã bị vô hiệu hoá.",
                            "Bạn không có quyền thực hiện chức năng này");

                    string message = await UpdateStatusGRNDetail(grn, GoodsReceiptNoteStatus.Completed, userId);
                    if (!string.IsNullOrEmpty(message))
                        throw new Exception(message.ToMessageForUser());

                    grn.Status = GoodsReceiptNoteStatus.Completed;
                    grn.ApprovalBy = userId;
                    grn.UpdatedAt = DateTimeUtility.Now();

                    if (grn.PurchaseOder.Status != PurchaseOrderStatus.Receiving)
                        throw new Exception("Chỉ được chuyển sang trạng thái Đã kiểm tra khi đơn hàng khi đơn hàng ở trạng thái Đang tiếp nhận.");
                    grn.PurchaseOder.Status = PurchaseOrderStatus.Inspected;
                    grn.PurchaseOder.UpdatedAt = DateTimeUtility.Now();
                }

                var updateResult = await _goodsReceiptNoteRepository.UpdateGoodsReceiptNote(grn);
                if (updateResult == null)
                    throw new Exception("Cập nhật trạng thái phiếu nhập kho thất bại.".ToMessageForUser());

                await _unitOfWork.CommitTransactionAsync();

                if (update is GoodsReceiptNoteCompletedDto)
                {
                    var (invErr, _) = await _inventoryLedgerService.CreateInventoryLedgerByGRNID(grn.GoodsReceiptNoteId);
                    if (!string.IsNullOrEmpty(invErr))
                    {
                        return (invErr, default);
                    }
                }

                await HandleGRNStatusChangeNotification(grn);

                return ("", update);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}", default);
            }
        }

        public async Task<(string, byte[]?, string?)> ExportGoodsReceiptNoteWord(string purchaseOrderId)
        {
            var grnDetail = await _goodsReceiptNoteRepository.GetGRNByPurchaseOrderId(purchaseOrderId);

            if (grnDetail == null) return ("Không tìm thấy phiếu nhập kho.".ToMessageForUser(), null, null);

            var simpleData = new Dictionary<string, string>
            {
                { "$Ngay_Tao_Phieu", grnDetail.CreatedAt?.Day.ToString("00") ?? "..." },
                { "$Thang_Tao_Phieu", grnDetail.CreatedAt?.Month.ToString("00") ?? "..." },
                { "$Nam_Tao_Phieu", grnDetail.CreatedAt?.Year.ToString() ?? "..." },
                { "$So_Phieu", grnDetail.GoodsReceiptNoteId.ToString() ?? "..." },
                { "$Nguoi_Giao", grnDetail.PurchaseOder.Supplier.CompanyName ?? "" },
                { "$Ten_Kho", WarehouseInformation.Name ?? ""},
                { "$Dia_Chi", WarehouseInformation.Address ?? "" },
                { "$Theo_So", grnDetail.PurchaseOderId.ToString() ?? "...." },
                { "$Theo_Ngay", grnDetail.PurchaseOder.CreatedAt?.Day.ToString("00") ?? "..." },
                { "$Theo_Thang", grnDetail.PurchaseOder.CreatedAt?.Month.ToString("00") ?? "..."},
                { "$Theo_Nam", grnDetail.PurchaseOder.CreatedAt?.Year.ToString() ?? "..."}
            };

            var tableData = new List<Dictionary<string, string>>();
            int stt = 1;
            if (grnDetail.GoodsReceiptNoteDetails != null)
            {
                foreach (var grnd in grnDetail.GoodsReceiptNoteDetails)
                {
                    tableData.Add(new Dictionary<string, string>
                    {
                        { "$STT", stt++.ToString() },
                        { "$Ten_Hang_Hoa", grnd.Goods.GoodsName ?? "" },
                        { "$Ma_Hang_Hoa", grnd.Goods.GoodsCode ?? "" },
                        { "$Don_Vi_Tinh", "Thùng"},
                        { "$So_Luong", grnd.ExpectedPackageQuantity?.ToString() ?? "0" }
                    });
                }
            }

            string templatePath = Path.Combine(_env.ContentRootPath, "Templates", "phieu-nhap-kho.docx");

            try
            {
                var fileBytes = WordExportUtility.FillTemplate(templatePath, simpleData, tableData);
                string fileName = $"Phieu_Nhap_Kho_{grnDetail.GoodsReceiptNoteId}.docx";

                return ("", fileBytes, fileName);
            }
            catch (Exception ex)
            {
                return ($"Xảy ra lỗi khi xuất file.".ToMessageForUser(), null, null);
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

        private async Task HandleGRNStatusChangeNotification(GoodsReceiptNote grn)
        {
            var notificationToCreate = new NotificationCreateDto();
            switch (grn.Status)
            {
                case GoodsReceiptNoteStatus.PendingApproval:
                    notificationToCreate.UserId = grn.PurchaseOder.ArrivalConfirmedBy;
                    notificationToCreate.Title = "Phiếu nhập kho chờ duyệt";
                    notificationToCreate.Content = $"Phiếu nhập kho '{grn.GoodsReceiptNoteId}' đang chờ duyệt.";
                    notificationToCreate.EntityType = NotificationEntityType.GoodsReceiptNote;
                    notificationToCreate.EntityId = grn.PurchaseOderId;
                    break;
                case GoodsReceiptNoteStatus.Completed:
                    notificationToCreate.UserId = grn.PurchaseOder.AssignTo;
                    notificationToCreate.Title = "Phiếu nhập kho hoàn tất kiểm tra";
                    notificationToCreate.Content = $"Phiếu nhập kho '{grn.GoodsReceiptNoteId}' đã được hoàn thành kiểm tra.";
                    notificationToCreate.EntityType = NotificationEntityType.GoodsReceiptNote;
                    notificationToCreate.EntityId = grn.PurchaseOderId;
                    notificationToCreate.Category = NotificationCategory.Important;
                    break;
                default:
                    break;
            }
            if (notificationToCreate != null && notificationToCreate.UserId != null)
                await _notificationService.CreateNotification(notificationToCreate);
        }

        private async Task HandleStatusChangeNotification(PurchaseOrder purchaseOder)
        {
            var notificationToCreate = new NotificationCreateDto();
            var notificationList = new List<NotificationCreateDto>();
            switch (purchaseOder.Status)
            {
                case PurchaseOrderStatus.Inspected:
                    notificationList.Add(new NotificationCreateDto
                    {
                        UserId = purchaseOder.ArrivalConfirmedBy,
                        Title = "Đơn đặt hàng đã được kiểm tra",
                        Content = $"Đơn đặt hàng '{purchaseOder.PurchaseOderId}' đã được kiểm tra.",
                        EntityType = NotificationEntityType.PurchaseOrder,
                        EntityId = purchaseOder.PurchaseOderId
                    });
                    break;
                default:
                    break;
            }
            if (notificationList.Any())
                await _notificationService.CreateNotificationBulk(notificationList);
        }

        private async Task EnsureRolePermission(int roleType, int? userId, string missingRoleMessage, string noPermissionMessage)
        {
            var users = await _userRepository.GetUsersByRoleId(roleType);

            if (!users.Any())
                throw new Exception(missingRoleMessage.ToMessageForUser(), default);

            if (userId == null || !users.Any(user => user.UserId == userId))
                throw new Exception(noPermissionMessage.ToMessageForUser(), default);
        }
    }
}