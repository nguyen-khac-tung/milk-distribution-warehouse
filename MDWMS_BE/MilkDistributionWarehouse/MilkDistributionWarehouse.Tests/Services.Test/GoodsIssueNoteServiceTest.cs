using Microsoft.AspNetCore.Hosting;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Tests.Services.Test
{
    [TestClass]
    public class GoodsIssueNoteServiceTest
    {
        // Mock tất cả các dependency injection trong Constructor của GoodsIssueNoteService
        private Mock<IGoodsIssueNoteRepository> _mockGinRepo;
        private Mock<ISalesOrderRepository> _mockSalesOrderRepo;
        private Mock<IPalletRepository> _mockPalletRepo;
        private Mock<IStocktakingSheetRepository> _mockStocktakingRepo;
        private Mock<IPickAllocationRepository> _mockPickRepo;
        private Mock<INotificationService> _mockNotiService;
        private Mock<IInventoryLedgerService> _mockInventoryService;
        private Mock<IWebHostEnvironment> _mockEnv;
        private Mock<IUnitOfWork> _mockUnitOfWork;
        private Mock<IMapper> _mockMapper;

        private GoodsIssueNoteService _service;

        [TestInitialize]
        public void Setup()
        {
            _mockGinRepo = new Mock<IGoodsIssueNoteRepository>();
            _mockSalesOrderRepo = new Mock<ISalesOrderRepository>();
            _mockPalletRepo = new Mock<IPalletRepository>();
            _mockStocktakingRepo = new Mock<IStocktakingSheetRepository>();
            _mockPickRepo = new Mock<IPickAllocationRepository>();
            _mockNotiService = new Mock<INotificationService>();
            _mockInventoryService = new Mock<IInventoryLedgerService>();
            _mockEnv = new Mock<IWebHostEnvironment>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();

            _service = new GoodsIssueNoteService(
                _mockGinRepo.Object,
                _mockSalesOrderRepo.Object,
                _mockPalletRepo.Object,
                _mockStocktakingRepo.Object,
                _mockPickRepo.Object,
                _mockNotiService.Object,
                _mockInventoryService.Object,
                _mockEnv.Object,
                _mockUnitOfWork.Object,
                _mockMapper.Object
            );
        }

        #region Submit Goods Issue Note
        // UTCID01: Input Null
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID01_InputNull_ReturnsError()
        {
            // Arrange
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = null };

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, 1);

            // Assert
            Assert.AreEqual("GoodsIssueNoteId is null.", result);
        }

        // UTCID02: Stocktaking in progress
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID02_StocktakingActive_ReturnsError()
        {
            // Arrange
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            // Mock đang kiểm kê = true
            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(true);

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, 1);

            // Assert
            Assert.IsTrue(result.Contains("phiếu kiểm kê đang thực hiện"));
        }

        // UTCID03: GIN Not Exist
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID03_GinNotExist_ReturnsError()
        {
            // Arrange
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN_NotExist" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN_NotExist")).ReturnsAsync((GoodsIssueNote)null);

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, 1);

            // Assert
            Assert.IsTrue(result.Contains("Không tìm thấy phiếu xuất kho"));
        }

        // UTCID04: Wrong User Permission (CreatedBy != CurrentUser)
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID04_WrongUser_ReturnsError()
        {
            // Arrange
            var userId = 10;
            var ownerId = 99;
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock GIN được tạo bởi người khác
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01"))
                .ReturnsAsync(new GoodsIssueNote { CreatedBy = ownerId });

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, userId);

            // Assert
            Assert.IsTrue(result.Contains("Người dùng hiện tại không được phân công"));
        }

        // UTCID05: Wrong Status (Not Picking)
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID05_WrongStatus_ReturnsError()
        {
            // Arrange
            var userId = 10;
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock GIN đang ở trạng thái PendingApproval (Chưa chuyển sang Picking)
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01"))
                .ReturnsAsync(new GoodsIssueNote
                {
                    CreatedBy = userId,
                    Status = GoodsIssueNoteStatus.PendingApproval
                });

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, userId);

            // Assert
            Assert.IsTrue(result.Contains("Chỉ có thể nộp đơn khi phiếu đang ở trạng thái 'Đang lấy hàng'"));
        }

        // UTCID06: Detail Items Not Done (Still Picking)
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID06_DetailNotDone_ReturnsError()
        {
            // Arrange
            var userId = 10;
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock GIN hợp lệ nhưng Details vẫn còn item đang Picking
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01"))
                .ReturnsAsync(new GoodsIssueNote
                {
                    CreatedBy = userId,
                    Status = GoodsIssueNoteStatus.Picking,
                    GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>
                    {
                        new GoodsIssueNoteDetail { Status = IssueItemStatus.Picked }, // Đã xong
                        new GoodsIssueNoteDetail { Status = IssueItemStatus.Picking } // Vẫn đang lấy -> Lỗi
                    }
                });

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, userId);

            // Assert
            Assert.IsTrue(result.Contains("Vẫn còn hạng mục đang trong quá trình lấy hàng"));
        }

        // UTCID07: Success (Happy Path)
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID07_ValidData_ReturnsSuccess()
        {
            // Arrange
            var userId = 10;
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            var gin = new GoodsIssueNote
            {
                GoodsIssueNoteId = "GIN01",
                CreatedBy = userId,
                Status = GoodsIssueNoteStatus.Picking,
                SalesOderId = "SO01",
                SalesOder = new SalesOrder { AcknowledgedBy = 99 }, // Mock để gửi noti
                GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>
                {
                    // Tất cả detail đã Picked
                    new GoodsIssueNoteDetail { Status = IssueItemStatus.Picked }
                }
            };

            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01")).ReturnsAsync(gin);

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, userId);

            // Assert
            Assert.AreEqual("", result); // Kết quả thành công

            // Kiểm tra trạng thái đã được update chưa
            Assert.AreEqual(GoodsIssueNoteStatus.PendingApproval, gin.Status);
            Assert.AreEqual(IssueItemStatus.PendingApproval, gin.GoodsIssueNoteDetails.First().Status); // Detail phải chuyển sang PendingApproval

            // Verify gọi DB và Noti
            _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(), Times.Once);
            _mockGinRepo.Verify(r => r.UpdateGoodsIssueNote(gin), Times.Once);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
            _mockNotiService.Verify(n => n.CreateNotification(It.IsAny<NotificationCreateDto>()), Times.Once);
        }

        // UTCID08: System Error (DB Exception)
        [TestMethod]
        public async Task SubmitGoodsIssueNote_UTCID08_SystemError_ReturnsMessage()
        {
            // Arrange
            var userId = 10;
            var dto = new SubmitGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            var gin = new GoodsIssueNote
            {
                CreatedBy = userId,
                Status = GoodsIssueNoteStatus.Picking,
                GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>()
            };

            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01")).ReturnsAsync(gin);

            // Giả lập lỗi khi commit transaction
            _mockUnitOfWork.Setup(u => u.CommitTransactionAsync()).ThrowsAsync(new Exception("DB Down"));

            // Act
            var result = await _service.SubmitGoodsIssueNote(dto, userId);

            // Assert
            Assert.IsTrue(result.Contains("Đã xảy ra lỗi hệ thống"));
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }
        #endregion

        #region Approve Goods Issue Note
        // UTCID01: Input Null
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID01_InputNull_ReturnsError()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = null };

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            Assert.AreEqual("GoodsIssueNoteId is null.", result);
        }

        // UTCID02: Stocktaking in progress
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID02_StocktakingActive_ReturnsError()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };
            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(true);

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            Assert.IsTrue(result.Contains("phiếu kiểm kê đang thực hiện"));
        }

        // UTCID03: GIN Not Exist
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID03_GinNotExist_ReturnsError()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN_NotExist" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN_NotExist")).ReturnsAsync((GoodsIssueNote)null);

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            Assert.IsTrue(result.Contains("Không tìm thấy phiếu xuất kho"));
        }

        // UTCID04: Wrong Status (Not PendingApproval)
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID04_WrongStatus_ReturnsError()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock GIN đang ở trạng thái Picking (Chưa nộp đơn) hoặc Completed
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01"))
                .ReturnsAsync(new GoodsIssueNote { Status = GoodsIssueNoteStatus.Picking });

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            Assert.IsTrue(result.Contains("Chỉ có thể duyệt phiếu xuất kho đang ở trạng thái 'Chờ duyệt'"));
        }

        // UTCID05: Logic Error - Pallet Insufficient (Kệ thiếu hàng)
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID05_PalletInsufficient_ReturnsError()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };
            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock cấu trúc dữ liệu phức tạp: GIN -> Details -> Allocations -> Pallet
            var pallet = new Pallet { PalletId = "P1", PackageQuantity = 5 }; // Thực tế chỉ còn 5
            var gin = new GoodsIssueNote
            {
                Status = GoodsIssueNoteStatus.PendingApproval,
                SalesOder = new SalesOrder(),
                GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>
                {
                    new GoodsIssueNoteDetail
                    {
                        PickAllocations = new List<PickAllocation>
                        {
                            // Yêu cầu lấy 10 từ Pallet P1
                            new PickAllocation { Pallet = pallet, PackageQuantity = 10 }
                        }
                    }
                }
            };

            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01")).ReturnsAsync(gin);

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            // Code sẽ ném Exception chứa message, sau đó catch và return message đó
            Assert.IsTrue(result.Contains("không đủ số lượng"), $"Expected error about quantity, but got: {result}");

            // Verify Rollback được gọi
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        // UTCID06: Inventory Ledger Fail (Lỗi ghi sổ kho)
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID06_LedgerFail_ReturnsError()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };
            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock GIN hợp lệ để vượt qua các check logic
            var gin = new GoodsIssueNote
            {
                GoodsIssueNoteId = "GIN01",
                Status = GoodsIssueNoteStatus.PendingApproval,
                SalesOder = new SalesOrder(),
                GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>()
            };
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01")).ReturnsAsync(gin);

            // Mock Service Inventory trả về lỗi
            _mockInventoryService.Setup(i => i.CreateInventoryLedgerByGINID("GIN01"))
                .ReturnsAsync(("Lỗi ghi sổ kho", null));

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            Assert.AreEqual("Lỗi ghi sổ kho", result);

            // Lưu ý: Code của bạn commit transaction TRƯỚC khi gọi InventoryLedgerService.
            // Nếu Inventory lỗi, nó return luôn. 
            // Logic này có thể gây rủi ro data (GIN Completed nhưng Ledger chưa ghi), 
            // nhưng Unit Test này phản ánh đúng code hiện tại.
        }

        // UTCID07: Success (Happy Path)
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID07_ValidData_ReturnsSuccess()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };
            var userId = 20;

            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            // Mock Pallet đủ hàng
            var pallet = new Pallet
            {
                PalletId = "P1",
                PackageQuantity = 15,
                Status = CommonStatus.Active,
                Location = new Location() // Để code access Location.IsAvailable không null
            };

            var salesOrder = new SalesOrder
            {
                SalesOrderId = "SO01",
                Status = SalesOrderStatus.Picking
            };

            var gin = new GoodsIssueNote
            {
                GoodsIssueNoteId = "GIN01",
                Status = GoodsIssueNoteStatus.PendingApproval,
                SalesOder = salesOrder,
                GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>
                {
                    new GoodsIssueNoteDetail
                    {
                        Status = IssueItemStatus.PendingApproval,
                        PickAllocations = new List<PickAllocation>
                        {
                            // Lấy 10 thùng từ 15 -> Còn 5
                            new PickAllocation { Pallet = pallet, PackageQuantity = 10 }
                        }
                    }
                }
            };

            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01")).ReturnsAsync(gin);

            // Mock Inventory Success
            _mockInventoryService.Setup(i => i.CreateInventoryLedgerByGINID("GIN01"))
                .ReturnsAsync(("", new InventoryLedgerResponseDto()));

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, userId);

            // Assert
            Assert.AreEqual("", result);

            // 1. Check GIN updated
            Assert.AreEqual(GoodsIssueNoteStatus.Completed, gin.Status);
            Assert.AreEqual(userId, gin.ApprovalBy);

            // 2. Check SalesOrder updated
            Assert.AreEqual(SalesOrderStatus.Completed, salesOrder.Status);

            // 3. Check Details updated
            Assert.AreEqual(IssueItemStatus.Completed, gin.GoodsIssueNoteDetails.First().Status);

            // 4. Check Pallet deduction (15 - 10 = 5)
            Assert.AreEqual(5, pallet.PackageQuantity);

            // 5. Verify calls
            _mockGinRepo.Verify(r => r.UpdateGoodsIssueNote(gin), Times.Once);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
            _mockNotiService.Verify(n => n.CreateNotificationBulk(It.IsAny<List<NotificationCreateDto>>()), Times.Once);
        }

        // UTCID08: System Error (Generic Exception)
        [TestMethod]
        public async Task ApproveGoodsIssueNote_UTCID08_SystemError_ReturnsMessage()
        {
            // Arrange
            var dto = new ApproveGoodsIssueNoteDto { GoodsIssueNoteId = "GIN01" };
            _mockStocktakingRepo.Setup(x => x.HasActiveStocktakingInProgressAsync()).ReturnsAsync(false);

            var gin = new GoodsIssueNote
            {
                Status = GoodsIssueNoteStatus.PendingApproval,
                SalesOder = new SalesOrder(),
                GoodsIssueNoteDetails = new List<GoodsIssueNoteDetail>()
            };
            _mockGinRepo.Setup(x => x.GetGINByGoodsIssueNoteId("GIN01")).ReturnsAsync(gin);

            // Mock lỗi khi save
            _mockUnitOfWork.Setup(u => u.CommitTransactionAsync()).ThrowsAsync(new Exception("Database connection failed"));

            // Act
            var result = await _service.ApproveGoodsIssueNote(dto, 1);

            // Assert
            Assert.IsTrue(result.Contains("Đã xảy ra lỗi hệ thống"));
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }
        #endregion
    }
}