using AutoMapper;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IDisposalNoteService
    {
        Task<string> CreateDisposalNote(DisposalNoteCreateDto createDto, int? userId);
        Task<(string, DisposalNoteDetailDto?)> GetDetailDisposalNote(string? disposalRequestId);
        Task<string> SubmitDisposalNote(SubmitDisposalNoteDto submitDto, int? userId);
        Task<string> ApproveDisposalNote(ApproveDisposalNoteDto approveDto, int? userId);
        Task<(string, byte[]?, string?)> ExportDisposalNoteWord(string disposalRequestId);
    }

    public class DisposalNoteService : IDisposalNoteService
    {
        private readonly IDisposalNoteRepository _disposalNoteRepository;
        private readonly IDisposalRequestRepository _disposalRequestRepository;
        private readonly IPalletRepository _palletRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IPickAllocationRepository _pickAllocationRepository;
        private readonly INotificationService _notificationService;
        private readonly IInventoryLedgerService _inventoryLedgerService;
        private readonly IWebHostEnvironment _env;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public DisposalNoteService(IDisposalNoteRepository disposalNoteRepository,
                                   IDisposalRequestRepository disposalRequestRepository,
                                   IPalletRepository palletRepository,
                                   IStocktakingSheetRepository stocktakingSheetRepository,
                                   IPickAllocationRepository pickAllocationRepository,
                                   INotificationService notificationService,
                                   IInventoryLedgerService inventoryLedgerService,
                                   IWebHostEnvironment env,
                                   IUnitOfWork unitOfWork,
                                   IMapper mapper)
        {
            _disposalNoteRepository = disposalNoteRepository;
            _disposalRequestRepository = disposalRequestRepository;
            _palletRepository = palletRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _pickAllocationRepository = pickAllocationRepository;
            _notificationService = notificationService;
            _inventoryLedgerService = inventoryLedgerService;
            _env = env;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<string> CreateDisposalNote(DisposalNoteCreateDto createDto, int? userId)
        {
            if (createDto.DisposalRequestId == null) return "DisposalRequestId to create DisposalNote is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var disposalRequest = await _disposalRequestRepository.GetDisposalRequestById(createDto.DisposalRequestId);
            if (disposalRequest == null) return "Data of DisposalRequest to create DisposalNote is null.";

            if (disposalRequest.AssignTo != userId) return "Bạn không được phân công cho yêu cầu này.".ToMessageForUser();

            if (disposalRequest.EstimatedTimeDeparture > DateOnly.FromDateTime(DateTimeUtility.Now()))
                return "Không tạo được phiếu xuất hủy trước ngày dự kiến xuất.".ToMessageForUser();

            if (disposalRequest.Status != DisposalRequestStatus.AssignedForPicking)
                return "Chỉ có thể tạo phiếu xuất hủy cho yêu cầu ở trạng thái 'Đã phân công'.".ToMessageForUser();

            if (await _disposalNoteRepository.GetDNByDisposalRequestId(disposalRequest.DisposalRequestId) != null)
                return "Phiếu xuất hủy cho yêu cầu này đã tồn tại.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var disposalNote = _mapper.Map<DisposalNote>(disposalRequest);
                disposalNote.DisposalNoteId = PrimaryKeyUtility.GenerateKey("DIS", "DN");
                disposalNote.CreatedBy = userId;

                var committedQuantities = await _pickAllocationRepository.GetCommittedQuantitiesForDisposalByPallet();

                foreach (var requestDetail in disposalRequest.DisposalRequestDetails)
                {
                    var noteDetail = _mapper.Map<DisposalNoteDetail>(requestDetail);
                    var goodsName = requestDetail.Goods.GoodsName;
                    var requiredQuantity = requestDetail.PackageQuantity ?? 0;

                    var potentialPallets = await _palletRepository.GetExpiredPalletsForPicking(requestDetail.GoodsId, requestDetail.GoodsPackingId);
                    if (potentialPallets.IsNullOrEmpty())
                        throw new Exception($"Không có pallet hàng hết hạn nào cho sản phẩm {goodsName}.".ToMessageForUser());

                    var availablePallets = potentialPallets.Select(p => new
                    {
                        Pallet = p,
                        AvailableQuantity = (p.PackageQuantity ?? 0) - committedQuantities.GetValueOrDefault(p.PalletId, 0)
                    })
                    .Where(p => p.AvailableQuantity > 0)
                    .OrderBy(p => p.Pallet.Batch.ExpiryDate)
                    .ThenBy(p => p.AvailableQuantity)
                    .ToList();

                    if (availablePallets.IsNullOrEmpty())
                        throw new Exception($"Không có pallet hàng hết hạn nào khả dụng cho sản phẩm {goodsName}.".ToMessageForUser());

                    var remainingQuantity = requiredQuantity;
                    foreach (var pInfo in availablePallets)
                    {
                        if (remainingQuantity <= 0) break;

                        var quantityToPick = Math.Min(remainingQuantity, pInfo.AvailableQuantity);

                        var pickAllocation = new PickAllocation
                        {
                            DisposalNoteDetailId = noteDetail.DisposalNoteDetailId,
                            PalletId = pInfo.Pallet.PalletId,
                            PackageQuantity = quantityToPick,
                            Status = PickAllocationStatus.UnScanned
                        };

                        noteDetail.PickAllocations.Add(pickAllocation);
                        remainingQuantity -= quantityToPick;
                    }

                    if (remainingQuantity > 0)
                        throw new Exception($"Không đủ tồn kho hết hạn khả dụng cho sản phẩm {goodsName}.".ToMessageForUser());

                    disposalNote.DisposalNoteDetails.Add(noteDetail);
                }

                await _disposalNoteRepository.CreateDisposalNote(disposalNote);

                disposalRequest.Status = DisposalRequestStatus.Picking;
                await _disposalRequestRepository.UpdateDisposalRequest(disposalRequest);

                await _unitOfWork.CommitTransactionAsync();

                await HandleDisposalRequestStatusChangeNotification(disposalRequest);
                return "";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                if (ex.Message.Contains("[User]")) return ex.Message;
                return "Đã xảy ra lỗi hệ thống khi tạo phiếu xuất hủy.".ToMessageForUser();
            }
        }

        public async Task<(string, DisposalNoteDetailDto?)> GetDetailDisposalNote(string? disposalRequestId)
        {
            if (string.IsNullOrEmpty(disposalRequestId)) return ("Mã yêu cầu xuất hủy không hợp lệ.", null);

            var disposalNote = await _disposalNoteRepository.GetDNDetailByDisposalRequestId(disposalRequestId);
            if (disposalNote == null) return ("Không tìm thấy phiếu xuất hủy.".ToMessageForUser(), null);

            var resultDto = _mapper.Map<DisposalNoteDetailDto>(disposalNote);
            return ("", resultDto);
        }

        public async Task<string> SubmitDisposalNote(SubmitDisposalNoteDto submitDto, int? userId)
        {
            if (submitDto.DisposalNoteId == null) return "DisposalNoteId is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var disposalNote = await _disposalNoteRepository.GetDNByDisposalNoteId(submitDto.DisposalNoteId);
            if (disposalNote == null) return "Không tìm thấy phiếu xuất hủy.".ToMessageForUser();

            if (disposalNote.CreatedBy != userId)
                return "Người dùng hiện tại không được phân công cho phiếu xuất hủy này.".ToMessageForUser();

            if (disposalNote.Status != DisposalNoteStatus.Picking)
                return "Chỉ có thể nộp khi phiếu đang ở trạng thái 'Đang lấy hàng'.".ToMessageForUser();

            if (disposalNote.DisposalNoteDetails.Any(d => d.Status == DisposalNoteItemStatus.Picking))
                return "Không thể nộp. Vẫn còn hạng mục đang trong quá trình lấy hàng.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var noteDetail in disposalNote.DisposalNoteDetails)
                {
                    if (noteDetail.Status == DisposalNoteItemStatus.Picked)
                    {
                        noteDetail.Status = DisposalNoteItemStatus.PendingApproval;
                        noteDetail.RejectionReason = "";
                        noteDetail.UpdatedAt = DateTimeUtility.Now();
                    }
                }

                disposalNote.Status = DisposalNoteStatus.PendingApproval;
                disposalNote.UpdatedAt = DateTimeUtility.Now();

                await _disposalNoteRepository.UpdateDisposalNote(disposalNote);
                await _unitOfWork.CommitTransactionAsync();

                await HandleDNStatusChangeNotification(disposalNote);
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi nộp phiếu xuất hủy.".ToMessageForUser();
            }
        }

        public async Task<string> ApproveDisposalNote(ApproveDisposalNoteDto approveDto, int? userId)
        {
            if (approveDto.DisposalNoteId == null) return "DisposalNoteId is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var disposalNote = await _disposalNoteRepository.GetDNByDisposalNoteId(approveDto.DisposalNoteId);
            if (disposalNote == null) return "Không tìm thấy phiếu xuất hủy.".ToMessageForUser();

            if (disposalNote.Status != DisposalNoteStatus.PendingApproval)
                return "Chỉ có thể duyệt phiếu xuất hủy đang ở trạng thái 'Chờ duyệt'.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                disposalNote.Status = DisposalNoteStatus.Completed;
                disposalNote.ApprovalBy = userId;
                disposalNote.UpdatedAt = DateTimeUtility.Now();

                disposalNote.DisposalRequest.Status = DisposalRequestStatus.Completed;
                disposalNote.DisposalRequest.UpdateAt = DateTimeUtility.Now();

                foreach (var noteDetail in disposalNote.DisposalNoteDetails)
                {
                    noteDetail.Status = DisposalNoteItemStatus.Completed;
                    noteDetail.UpdatedAt = DateTimeUtility.Now();
                }

                var pickAllocationList = disposalNote.DisposalNoteDetails.SelectMany(d => d.PickAllocations).ToList();
                foreach (var pick in pickAllocationList)
                {
                    var pallet = pick.Pallet;
                    var palletPackageQuantity = pallet.PackageQuantity ?? 0;
                    var pickPackageQuantity = pick.PackageQuantity ?? 0;

                    if (palletPackageQuantity < pickPackageQuantity)
                        throw new Exception($"Thao tác thất bại: Kệ kê hàng '{pallet.PalletId}' không đủ số lượng để trừ kho (cần {pickPackageQuantity}, chỉ có {palletPackageQuantity}).".ToMessageForUser());

                    pallet.PackageQuantity = palletPackageQuantity - pickPackageQuantity;
                    pallet.UpdateAt = DateTimeUtility.Now();
                    if (pallet.PackageQuantity == 0)
                    {
                        pallet.Status = CommonStatus.Deleted;
                        pallet.Location.IsAvailable = true;
                    }
                }

                await _disposalNoteRepository.UpdateDisposalNote(disposalNote);
                await _unitOfWork.CommitTransactionAsync();

                var (invErr, _) = await _inventoryLedgerService.CreateInventoryLedgerByDPNID(disposalNote.DisposalNoteId);
                if (!string.IsNullOrEmpty(invErr))
                {
                    return invErr;
                }

                await HandleDisposalRequestStatusChangeNotification(disposalNote.DisposalRequest);
                return "";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                if (ex.Message.Contains("[User]")) return ex.Message;
                return "Đã xảy ra lỗi hệ thống khi duyệt phiếu xuất hủy.".ToMessageForUser();
            }
        }

        private async Task HandleDisposalRequestStatusChangeNotification(DisposalRequest disposalRequest)
        {
            var notificationsToCreate = new List<NotificationCreateDto>();

            switch (disposalRequest.Status)
            {
                case DisposalRequestStatus.Picking:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = disposalRequest.CreatedBy,
                        Title = "Yêu cầu xuất hủy đang được lấy hàng",
                        Content = $"Yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}' đang được nhân viên kho tiến hành lấy hàng.",
                        EntityType = NotificationEntityType.DisposalRequest,
                        EntityId = disposalRequest.DisposalRequestId
                    });
                    break;

                case DisposalRequestStatus.Completed:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = disposalRequest.AssignTo,
                        Title = "Yêu cầu xuất hủy đã hoàn thành",
                        Content = $"Yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.DisposalRequest,
                        EntityId = disposalRequest.DisposalRequestId
                    });
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = disposalRequest.ApprovalBy,
                        Title = "Yêu cầu xuất hủy đã hoàn thành",
                        Content = $"Yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.DisposalRequest,
                        EntityId = disposalRequest.DisposalRequestId
                    });
                    break;

                default: break;
            }

            if (notificationsToCreate.Count > 0)
                await _notificationService.CreateNotificationBulk(notificationsToCreate);
        }

        public async Task<(string, byte[]?, string?)> ExportDisposalNoteWord(string disposalRequestId)
        {
            var dnDetail = await _disposalNoteRepository.GetDNDetailByDisposalRequestId(disposalRequestId);

            if (dnDetail == null) return ("Không tìm thấy phiếu xuất hủy.".ToMessageForUser(), null, null);

            var simpleData = new Dictionary<string, string>
            {
                { "$Ngay", dnDetail.DisposalRequest.EstimatedTimeDeparture?.Day.ToString("00") ?? "..." },
                { "$Thang", dnDetail.DisposalRequest.EstimatedTimeDeparture?.Month.ToString("00") ?? "..." },
                { "$Nam", dnDetail.DisposalRequest.EstimatedTimeDeparture?.Year.ToString() ?? "..." },
                { "$SoPhieu", dnDetail.DisposalNoteId ?? "..." },
            };

            var tableData = new List<Dictionary<string, string>>();
            int stt = 1;
            if (dnDetail.DisposalNoteDetails != null)
            {
                foreach (var disposalNote in dnDetail.DisposalNoteDetails)
                {
                    tableData.Add(new Dictionary<string, string>
                    {
                        { "$STT", stt++.ToString() },
                        { "$TenHang", disposalNote.Goods.GoodsName ?? "" },
                        { "$MaHang", disposalNote.Goods.GoodsCode ?? "" },
                        { "$DVT", "Thùng"},
                        { "$SoLuong", disposalNote.PackageQuantity?.ToString() ?? "0" },
                        { "$HanSuDung", disposalNote.PickAllocations.FirstOrDefault()?.Pallet.Batch?.ExpiryDate.Value.ToString("dd/MM/yyyy") ?? "" },
                    });
                }
            }

            string templatePath = Path.Combine(_env.ContentRootPath, "Templates", "phieu-xuat-huy.docx");

            try
            {
                var fileBytes = WordExportUtility.FillTemplate(templatePath, simpleData, tableData);
                string fileName = $"Phieu_Xuat_Huy_{dnDetail.DisposalNoteId}.docx";

                return ("", fileBytes, fileName);
            }
            catch (Exception ex)
            {
                return ($"Xảy ra lỗi khi xuất file.".ToMessageForUser(), null, null);
            }
        }

        private async Task HandleDNStatusChangeNotification(DisposalNote disposalNote)
        {
            var notificationToCreate = new NotificationCreateDto()
            {
                UserId = disposalNote.DisposalRequest.CreatedBy,
                Title = "Phiếu xuất hủy mới chờ duyệt",
                Content = $"Phiếu xuất hủy '{disposalNote.DisposalNoteId}' vừa được gửi và đang chờ bạn duyệt.",
                EntityType = NotificationEntityType.DisposalNote,
                EntityId = disposalNote.DisposalRequestId
            };

            await _notificationService.CreateNotification(notificationToCreate);
        }
    }
}