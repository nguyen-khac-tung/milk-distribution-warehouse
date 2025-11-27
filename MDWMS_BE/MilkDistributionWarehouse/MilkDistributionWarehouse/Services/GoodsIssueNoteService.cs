using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{

    public interface IGoodsIssueNoteService
    {
        Task<string> CreateGoodsIssueNote(GoodsIssueNoteCreateDto goodsIssueNoteCreate, int? userId);
        Task<(string, GoodsIssueNoteDetailDto?)> GetDetailGoodsIssueNote(string? salesOrderId);
        Task<string> SubmitGoodsIssueNote(SubmitGoodsIssueNoteDto submitGoodsIssueDto, int? userId);
        Task<string> ApproveGoodsIssueNote(ApproveGoodsIssueNoteDto approveGoodsIssueDto, int? userId);
        Task<(string, byte[]?, string?)> ExportGoodsIssueNoteWord(string salesOrderId);
    }

    public class GoodsIssueNoteService : IGoodsIssueNoteService
    {
        private readonly IGoodsIssueNoteRepository _goodsIssueNoteRepository;
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IPalletRepository _palletRepository;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IPickAllocationRepository _pickAllocationRepository;
        private readonly INotificationService _notificationService;
        private readonly IInventoryLedgerService _inventoryLedgerService;
        private readonly IWebHostEnvironment _env;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GoodsIssueNoteService(IGoodsIssueNoteRepository goodsIssueNoteRepository,
                                 ISalesOrderRepository salesOrderRepository,
                                 IPalletRepository palletRepository,
                                 IStocktakingSheetRepository stocktakingSheetRepository,
                                 IPickAllocationRepository pickAllocationRepository,
                                 INotificationService notificationService,
                                 IInventoryLedgerService inventoryLedgerService,
                                 IWebHostEnvironment env,
                                 IUnitOfWork unitOfWork,
                                 IMapper mapper)
        {
            _goodsIssueNoteRepository = goodsIssueNoteRepository;
            _salesOrderRepository = salesOrderRepository;
            _palletRepository = palletRepository;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _pickAllocationRepository = pickAllocationRepository;
            _notificationService = notificationService;
            _inventoryLedgerService = inventoryLedgerService;
            _env = env;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<string> CreateGoodsIssueNote(GoodsIssueNoteCreateDto goodsIssueNoteCreate, int? userId)
        {
            if (goodsIssueNoteCreate.SalesOrderId == null) return "SalesOrderId to create GoodsIssueNote Data is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể tạo phiếu xuất kho khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var salesOrder = await _salesOrderRepository.GetSalesOrderById(goodsIssueNoteCreate.SalesOrderId);
            if (salesOrder == null) return "Data of SalesOrder to create GoodsIssueNote is null.";

            if (salesOrder.AssignTo != userId) return "Người dùng hiện tại không được phân công cho đơn hàng này.".ToMessageForUser();

            //if (salesOrder.EstimatedTimeDeparture > DateOnly.FromDateTime(DateTime.Now))
            //    return "Không tạo được phiếu xuất kho trước ngày dự kiến xuất kho.".ToMessageForUser();

            if (salesOrder.Status != SalesOrderStatus.AssignedForPicking)
                return "Chỉ có thể tạo phiếu xuất kho cho đơn hàng ở trạng thái 'Đã phân công'.".ToMessageForUser();

            if (await _goodsIssueNoteRepository.GetGINBySalesOrderId(salesOrder.SalesOrderId) != null)
                return "Phiếu xuất kho cho đơn hàng này đã tồn tại.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var goodsIssueNote = _mapper.Map<GoodsIssueNote>(salesOrder);
                goodsIssueNote.GoodsIssueNoteId = PrimaryKeyUtility.GenerateKey("RET", "GIN");
                goodsIssueNote.CreatedBy = userId;

                var committedQuantities = await _pickAllocationRepository.GetCommittedQuantitiesForSalesByPallet();

                foreach (var orderDetail in salesOrder.SalesOrderDetails)
                {
                    var issueNoteDetail = _mapper.Map<GoodsIssueNoteDetail>(orderDetail);
                    var goodsName = orderDetail.Goods.GoodsName;
                    var requiredQuantity = orderDetail.PackageQuantity ?? 0;

                    var potentialPallets = await _palletRepository.GetPotentiallyPalletsForPicking(orderDetail.GoodsId, orderDetail.GoodsPackingId);
                    if (potentialPallets.IsNullOrEmpty()) throw new Exception($"Không có kệ hàng nào cho sản phẩm {goodsName} loại đóng gói {orderDetail.GoodsPacking.UnitPerPackage} {orderDetail.Goods.UnitMeasure.Name.ToLower()}/thùng".ToMessageForUser());

                    var availablePallets = potentialPallets.Select(p => new
                    {
                        Pallet = p,
                        AvailableQuantity = (p.PackageQuantity ?? 0) - committedQuantities.GetValueOrDefault(p.PalletId, 0)
                    })
                    .Where(p => p.AvailableQuantity > 0)        // Only get pallets with available quantity
                    .OrderBy(p => p.Pallet.Batch.ExpiryDate)   // Prioritize by earliest Expiration Date(EXP)
                    .ThenBy(p => p.AvailableQuantity)         // Then pallets with less available quantity
                    .ToList();
                    if (availablePallets.IsNullOrEmpty()) throw new Exception($"Không có kệ hàng nào cho sản phẩm {goodsName} loại đóng gói {orderDetail.GoodsPacking.UnitPerPackage} {orderDetail.Goods.UnitMeasure.Name.ToLower()}/thùng".ToMessageForUser());

                    var remainingQuantity = requiredQuantity;
                    foreach (var pInfo in availablePallets)
                    {
                        if (remainingQuantity <= 0) break;

                        var quantityToPick = Math.Min(remainingQuantity, pInfo.AvailableQuantity);

                        var pickAllocation = new PickAllocation
                        {
                            GoodsIssueNoteDetailId = issueNoteDetail.GoodsIssueNoteDetailId,
                            PalletId = pInfo.Pallet.PalletId,
                            PackageQuantity = quantityToPick,
                            Status = PickAllocationStatus.UnScanned
                        };

                        issueNoteDetail.PickAllocations.Add(pickAllocation);
                        remainingQuantity -= quantityToPick;
                    }

                    if (remainingQuantity > 0) throw new Exception($"Không đủ tồn kho khả dụng cho sản phẩm {goodsName}".ToMessageForUser());

                    goodsIssueNote.GoodsIssueNoteDetails.Add(issueNoteDetail);
                }

                await _goodsIssueNoteRepository.CreateGoodsIssueNote(goodsIssueNote);

                salesOrder.Status = SalesOrderStatus.Picking;
                salesOrder.PickingAt = DateTime.Now;
                await _salesOrderRepository.UpdateSalesOrder(salesOrder);

                await _unitOfWork.CommitTransactionAsync();

                await HandleSaleOrderStatusChangeNotification(salesOrder);
                return "";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                if (ex.Message.Contains("[User]")) return ex.Message;
                return "Đã xảy ra lỗi hệ thống khi tạo phiếu xuất kho.".ToMessageForUser();
            }
        }

        public async Task<(string, GoodsIssueNoteDetailDto?)> GetDetailGoodsIssueNote(string? salesOrderId)
        {
            if (salesOrderId == null) return ("Sales Order Id is not valid", null);
            var goodsIssueNote = await _goodsIssueNoteRepository.GetGINDetailBySalesOrderId(salesOrderId);
            if (goodsIssueNote == null) return ("Không tìm thấy phiếu xuất kho.".ToMessageForUser(), null);

            var resultDto = _mapper.Map<GoodsIssueNoteDetailDto>(goodsIssueNote);
            return ("", resultDto);
        }

        public async Task<string> SubmitGoodsIssueNote(SubmitGoodsIssueNoteDto submitGoodsIssueDto, int? userId)
        {
            if (submitGoodsIssueDto.GoodsIssueNoteId == null) return "GoodsIssueNoteId is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var goodsIssueNote = await _goodsIssueNoteRepository.GetGINByGoodsIssueNoteId(submitGoodsIssueDto.GoodsIssueNoteId);
            if (goodsIssueNote == null) return "Không tìm thấy phiếu xuất kho.".ToMessageForUser();

            if (goodsIssueNote.CreatedBy != userId)
                return "Người dùng hiện tại không được phân công cho đơn hàng này.".ToMessageForUser();

            if (goodsIssueNote.Status != GoodsIssueNoteStatus.Picking)
                return "Chỉ có thể nộp đơn khi phiếu đang ở trạng thái 'Đang lấy hàng'.".ToMessageForUser();

            if (goodsIssueNote.GoodsIssueNoteDetails.Any(g => g.Status == IssueItemStatus.Picking))
                return "Không thể nộp đơn. Vẫn còn hạng mục đang trong quá trình lấy hàng.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var issueNoteDetail in goodsIssueNote.GoodsIssueNoteDetails)
                {
                    if (issueNoteDetail.Status == IssueItemStatus.Picked)
                    {
                        issueNoteDetail.Status = IssueItemStatus.PendingApproval;
                        issueNoteDetail.RejectionReason = "";
                        issueNoteDetail.UpdatedAt = DateTime.Now;
                    }
                }

                goodsIssueNote.Status = GoodsIssueNoteStatus.PendingApproval;
                goodsIssueNote.UpdatedAt = DateTime.Now;

                await _goodsIssueNoteRepository.UpdateGoodsIssueNote(goodsIssueNote);
                await _unitOfWork.CommitTransactionAsync();

                await HandleGINStatusChangeNotification(goodsIssueNote);
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Đã xảy ra lỗi hệ thống khi nộp đơn.".ToMessageForUser();
            }
        }

        public async Task<string> ApproveGoodsIssueNote(ApproveGoodsIssueNoteDto approveGoodsIssueDto, int? userId)
        {
            if (approveGoodsIssueDto.GoodsIssueNoteId == null) return "GoodsIssueNoteId is null.";

            if (await _stocktakingSheetRepository.HasActiveStocktakingInProgressAsync())
                return "Không thể thực hiện thao tác này khi đang có phiếu kiểm kê đang thực hiện.".ToMessageForUser();

            var goodsIssueNote = await _goodsIssueNoteRepository.GetGINByGoodsIssueNoteId(approveGoodsIssueDto.GoodsIssueNoteId);
            if (goodsIssueNote == null) return "Không tìm thấy phiếu xuất kho.".ToMessageForUser();

            if (goodsIssueNote.Status != GoodsIssueNoteStatus.PendingApproval)
                return "Chỉ có thể duyệt phiếu xuất kho đang ở trạng thái 'Chờ duyệt'.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                goodsIssueNote.Status = GoodsIssueNoteStatus.Completed;
                goodsIssueNote.ApprovalBy = userId;
                goodsIssueNote.UpdatedAt = DateTime.Now;

                goodsIssueNote.SalesOder.Status = SalesOrderStatus.Completed;
                goodsIssueNote.SalesOder.UpdateAt = DateTime.Now;

                foreach (var issueNoteDetail in goodsIssueNote.GoodsIssueNoteDetails)
                {
                    issueNoteDetail.Status = IssueItemStatus.Completed;
                    issueNoteDetail.UpdatedAt = DateTime.Now;
                }

                var pickAllocationList = goodsIssueNote.GoodsIssueNoteDetails.SelectMany(g => g.PickAllocations).ToList();
                pickAllocationList.ForEach(pick =>
                {
                    var palletPackageQuantity = pick.Pallet.PackageQuantity ?? 0;
                    var pickPackageQuantity = pick.PackageQuantity ?? 0;

                    if (palletPackageQuantity < pickPackageQuantity)
                        throw new Exception($"Thao tác thất bại: Kệ kê hàng '{pick.Pallet.PalletId}' không đủ số lượng để trừ kho (cần {pickPackageQuantity}, chỉ có {palletPackageQuantity}).".ToMessageForUser());

                    pick.Pallet.PackageQuantity = palletPackageQuantity - pickPackageQuantity;
                    pick.Pallet.UpdateAt = DateTime.Now;
                    if (pick.Pallet.PackageQuantity == 0)
                    {
                        pick.Pallet.Status = CommonStatus.Deleted;
                        pick.Pallet.Location.IsAvailable = true;
                    }
                });

                await _goodsIssueNoteRepository.UpdateGoodsIssueNote(goodsIssueNote);
                await _unitOfWork.CommitTransactionAsync();

                var (invErr, _) = await _inventoryLedgerService.CreateInventoryLedgerByGINID(goodsIssueNote.GoodsIssueNoteId);
                if (!string.IsNullOrEmpty(invErr))
                {
                    return invErr;
                }

                await HandleSaleOrderStatusChangeNotification(goodsIssueNote.SalesOder);
                return "";
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                if (ex.Message.Contains("[User]")) return ex.Message;
                return "Đã xảy ra lỗi hệ thống khi duyệt phiếu xuất kho.".ToMessageForUser();
            }
        }

        public async Task<(string, byte[]?, string?)> ExportGoodsIssueNoteWord(string salesOrderId)
        {
            var ginDetail = await _goodsIssueNoteRepository.GetGINDetailBySalesOrderId(salesOrderId);

            if (ginDetail == null) return ("Không tìm thấy phiếu xuất kho.".ToMessageForUser(), null, null);

            var simpleData = new Dictionary<string, string>
            {
                { "$Ngay", ginDetail.SalesOder.EstimatedTimeDeparture?.Day.ToString("00") ?? "..." },
                { "$Thang", ginDetail.SalesOder.EstimatedTimeDeparture?.Month.ToString("00") ?? "..." },
                { "$Nam", ginDetail.SalesOder.EstimatedTimeDeparture?.Year.ToString() ?? "..." },
                { "$SoPhieu", ginDetail.GoodsIssueNoteId ?? "..." },
                { "$NguoiNhan", ginDetail.SalesOder.Retailer.RetailerName ?? "" },
                { "$DiaChi", ginDetail.SalesOder.Retailer.Address ?? "" },
            };

            var tableData = new List<Dictionary<string, string>>();
            int stt = 1;
            if (ginDetail.GoodsIssueNoteDetails != null)
            {
                foreach (var issueNoteDetail in ginDetail.GoodsIssueNoteDetails)
                {
                    tableData.Add(new Dictionary<string, string>
                    {
                        { "$STT", stt++.ToString() },
                        { "$TenHang", issueNoteDetail.Goods.GoodsName ?? "" },
                        { "$MaHang", issueNoteDetail.Goods.GoodsCode ?? "" },
                        { "$DVT", "Thùng"},
                        { "$LuongYeuCau", issueNoteDetail.PackageQuantity?.ToString() ?? "0" },
                        { "$LuongThucXuat", issueNoteDetail.PackageQuantity?.ToString() ?? "0" },
                    });
                }
            }

            string templatePath = Path.Combine(_env.ContentRootPath, "Templates", "phieu-xuat-kho.docx");

            try
            {
                var fileBytes = WordExportUtility.FillTemplate(templatePath, simpleData, tableData);
                string fileName = $"Phieu_Xuat_Kho_{ginDetail.GoodsIssueNoteId}.docx";

                return ("", fileBytes, fileName);
            }
            catch (Exception ex)
            {
                return ($"Xảy ra lỗi khi xuất file.".ToMessageForUser(), null, null);
            }
        }

        private async Task HandleSaleOrderStatusChangeNotification(SalesOrder salesOrder)
        {
            var notificationsToCreate = new List<NotificationCreateDto>();

            switch (salesOrder.Status)
            {
                case SalesOrderStatus.Picking:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = salesOrder.AcknowledgedBy,
                        Title = "Đơn bán hàng đang được lấy hàng",
                        Content = $"Đơn bán hàng '{salesOrder.SalesOrderId}' đang được nhân viên kho tiến hành lấy hàng.",
                        EntityType = NotificationEntityType.SaleOrder,
                        EntityId = salesOrder.SalesOrderId
                    });
                    break;

                case SalesOrderStatus.Completed:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = salesOrder.AssignTo,
                        Title = "Đơn bán hàng đã hoàn thành",
                        Content = $"Đơn bán hàng '{salesOrder.SalesOrderId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.SaleOrder,
                        EntityId = salesOrder.SalesOrderId
                    });
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = salesOrder.ApprovalBy,
                        Title = "Đơn bán hàng đã hoàn thành",
                        Content = $"Đơn bán hàng '{salesOrder.SalesOrderId}' đã hoàn thành.",
                        EntityType = NotificationEntityType.SaleOrder,
                        EntityId = salesOrder.SalesOrderId
                    });
                    break;

                default: break;
            }

            if (notificationsToCreate.Count > 0)
                await _notificationService.CreateNotificationBulk(notificationsToCreate);
        }

        private async Task HandleGINStatusChangeNotification(GoodsIssueNote goodsIssueNote)
        {
            var notificationsToCreate = new NotificationCreateDto()
            {
                UserId = goodsIssueNote.SalesOder.AcknowledgedBy,
                Title = "Đơn xuất kho mới chờ duyệt",
                Content = $"Đơn xuất kho '{goodsIssueNote.GoodsIssueNoteId}' vừa được gửi và đang chờ bạn duyệt.",
                EntityType = NotificationEntityType.GoodsIssueNote,
                EntityId = goodsIssueNote.SalesOderId
            };

            await _notificationService.CreateNotification(notificationsToCreate);
        }
    }
}
