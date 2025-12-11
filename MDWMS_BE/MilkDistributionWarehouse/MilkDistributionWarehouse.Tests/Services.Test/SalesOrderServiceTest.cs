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
    public class SalesOrderServiceTest
    {
        private Mock<ISalesOrderRepository> _mockSalesOrderRepo;
        private Mock<ISalesOrderDetailRepository> _mockDetailRepo;
        private Mock<IRetailerRepository> _mockRetailerRepo;
        private Mock<IGoodsRepository> _mockGoodsRepo;
        private Mock<IUserRepository> _mockUserRepo;
        private Mock<INotificationService> _mockNotiService;
        private Mock<IUnitOfWork> _mockUnitOfWork;
        private Mock<IMapper> _mockMapper;

        private SalesOrderService _service;

        [TestInitialize]
        public void Setup()
        {
            _mockSalesOrderRepo = new Mock<ISalesOrderRepository>();
            _mockDetailRepo = new Mock<ISalesOrderDetailRepository>();
            _mockRetailerRepo = new Mock<IRetailerRepository>();
            _mockGoodsRepo = new Mock<IGoodsRepository>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockNotiService = new Mock<INotificationService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();

            _service = new SalesOrderService(
                _mockSalesOrderRepo.Object,
                _mockDetailRepo.Object,
                _mockRetailerRepo.Object,
                _mockGoodsRepo.Object,
                _mockUserRepo.Object,
                _mockNotiService.Object,
                _mockUnitOfWork.Object,
                _mockMapper.Object
            );
        }

        #region Create Sales Order
        // UTCID01: Input Null
        [TestMethod]
        public async Task CreateSalesOrder_UTCID01_InputNull_ReturnsError()
        {
            var result = await _service.CreateSalesOrder(null, 1);
            Assert.AreEqual("Data sales order create is null.", result.Item1);
        }

        // UTCID02: RetailerId Null
        // (Trong code Service kiểm tra: salesOrderCreate.RetailerId ?? 0, rồi gọi repo)
        [TestMethod]
        public async Task CreateSalesOrder_UTCID02_RetailerIdNull_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderCreateDto { RetailerId = null };
            // Repo trả về null vì ID = 0 không tồn tại
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(0)).ReturnsAsync((Retailer)null);

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("Nhà bán lẻ không hợp lệ"));
        }

        // UTCID03: Retailer Not Exist
        [TestMethod]
        public async Task CreateSalesOrder_UTCID03_RetailerNotExist_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderCreateDto { RetailerId = 999 };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(999)).ReturnsAsync((Retailer)null);

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("Nhà bán lẻ không hợp lệ"));
        }

        // UTCID04: Retailer Inactive
        [TestMethod]
        public async Task CreateSalesOrder_UTCID04_RetailerInactive_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderCreateDto { RetailerId = 2 };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(2))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Inactive });

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không còn hoạt động"));
        }

        // UTCID05: Past Date
        [TestMethod]
        public async Task CreateSalesOrder_UTCID05_PastDate_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderCreateDto
            {
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(-1))
            };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không thể trong quá khứ"));
        }

        // UTCID06: Empty List
        [TestMethod]
        public async Task CreateSalesOrder_UTCID06_EmptyList_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderCreateDto
            {
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailCreateDtos = new List<SalesOrderItemDetailCreateDto>() // Empty
            };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không được bỏ trống"));
        }

        // UTCID07: Logic logic Qty <= 0 (Giả định Service check logic này sau validate attributes)
        // Lưu ý: Validation Attribute [Range] thường được check ở Controller.
        // Tuy nhiên nếu dữ liệu này lọt vào Service, Logic Validate Stock có thể sẽ chạy.
        // Test case này kiểm tra xem logic có bị crash không hoặc có xử lý logic không.

        // UTCID08: Insufficient Stock (Case khó nhất - Fix mock GoodsQuantityDto)
        [TestMethod]
        public async Task CreateSalesOrder_UTCID08_InsufficientStock_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderCreateDto
            {
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailCreateDtos = new List<SalesOrderItemDetailCreateDto> {
                    new SalesOrderItemDetailCreateDto { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 90 } // Mua 90
                }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Mock Mapper DTO -> Entity để service tính toán
            _mockMapper.Setup(m => m.Map<List<SalesOrderDetail>>(dto.SalesOrderItemDetailCreateDtos))
                .Returns(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 90 }
                });

            // *** FIX QUAN TRỌNG: Mock trả về GoodsQuantityDto có TotalPackageQuantity ***
            _mockGoodsRepo.Setup(g => g.GetGoodsForSalesOrder(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<GoodsQuantityDto> {
                    new GoodsQuantityDto {
                        Goods = new Good { GoodsId = 100, GoodsName = "Milk A" },
                        GoodsPacking = new GoodsPacking { GoodsPackingId = 10 },
                        TotalPackageQuantity = 100 // Tồn kho thực tế = 100
                    }
                });

            // Mock Committed (Đang bị giữ chỗ 20)
            _mockSalesOrderRepo.Setup(s => s.GetCommittedSaleOrderQuantities(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 20 }
                });

            // Logic: Available = 100 - 20 = 80.
            // Request = 90.
            // 90 > 80 => ERROR.

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không đủ số lượng"));
        }

        // UTCID09: Success
        [TestMethod]
        public async Task CreateSalesOrder_UTCID09_ValidData_ReturnsSuccess()
        {
            // Arrange
            var dto = new SalesOrderCreateDto
            {
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailCreateDtos = new List<SalesOrderItemDetailCreateDto> {
                    new SalesOrderItemDetailCreateDto { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 50 } // Mua 50
                }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            _mockMapper.Setup(m => m.Map<List<SalesOrderDetail>>(dto.SalesOrderItemDetailCreateDtos))
                .Returns(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 50 }
                });

            // Mapper cho việc tạo SalesOrder Entity
            _mockMapper.Setup(m => m.Map<SalesOrder>(dto)).Returns(new SalesOrder());

            // *** Mock GoodsQuantityDto ***
            _mockGoodsRepo.Setup(g => g.GetGoodsForSalesOrder(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<GoodsQuantityDto> {
                    new GoodsQuantityDto {
                        Goods = new Good { GoodsId = 100 },
                        GoodsPacking = new GoodsPacking { GoodsPackingId = 10 },
                        TotalPackageQuantity = 100
                    }
                });

            // Mock Committed (20)
            _mockSalesOrderRepo.Setup(s => s.GetCommittedSaleOrderQuantities(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 20 }
                });

            // Logic: Available = 100 - 20 = 80.
            // Request = 50.
            // 50 <= 80 => OK.

            // Act
            var result = await _service.CreateSalesOrder(dto, 1);

            // Assert
            Assert.AreEqual("", result.Item1);
            Assert.AreEqual(dto, result.Item2);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }
        #endregion

        #region Update Sales Order
        // UTCID01: Input Null
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID01_InputNull_ReturnsError()
        {
            var result = await _service.UpdateSalesOrder(null, 1);
            Assert.AreEqual("Data sales order update is null.", result.Item1);
        }

        // UTCID02: Retailer Inactive
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID02_RetailerInactive_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderUpdateDto { RetailerId = 2 };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(2))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Inactive });

            // Act
            var result = await _service.UpdateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không còn hoạt động"));
        }

        // UTCID03: Past Date
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID03_PastDate_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderUpdateDto
            {
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(-1)) // Quá khứ
            };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Act
            var result = await _service.UpdateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không thể trong quá khứ"));
        }

        // UTCID04: Empty List
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID04_EmptyList_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderUpdateDto
            {
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailUpdateDtos = new List<SalesOrderItemDetailUpdateDto>() // Rỗng
            };
            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1))
                .ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Act
            var result = await _service.UpdateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không được bỏ trống"));
        }

        // UTCID05: Order Not Exist
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID05_OrderNotExist_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderUpdateDto
            {
                SalesOrderId = "SO_NotExist",
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailUpdateDtos = new List<SalesOrderItemDetailUpdateDto> { new() }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1)).ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Mock Repo trả về null
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_NotExist")).ReturnsAsync((SalesOrder)null);

            // Act
            var result = await _service.UpdateSalesOrder(dto, 1);

            // Assert
            Assert.AreEqual("Sales order exist is null", result.Item1);
        }

        // UTCID06: Wrong Status (Only Draft or Rejected allowed)
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID06_WrongStatus_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderUpdateDto
            {
                SalesOrderId = "SO_Approved",
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailUpdateDtos = new List<SalesOrderItemDetailUpdateDto> { new() }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1)).ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Mock trả về đơn hàng đã Approved
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Approved"))
                .ReturnsAsync(new SalesOrder { SalesOrderId = "SO_Approved", Status = SalesOrderStatus.Approved });

            // Act
            var result = await _service.UpdateSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("Chỉ được cập nhật khi đơn hàng ở trạng thái Nháp"));
        }

        // UTCID07: No Permission (Wrong User)
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID07_WrongUser_ReturnsError()
        {
            // Arrange
            var currentUserId = 1;
            var ownerUserId = 99; // Người tạo đơn là người khác
            var dto = new SalesOrderUpdateDto
            {
                SalesOrderId = "SO_Draft_User99",
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailUpdateDtos = new List<SalesOrderItemDetailUpdateDto> { new() }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1)).ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Mock đơn hàng hợp lệ nhưng khác chủ sở hữu
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Draft_User99"))
                .ReturnsAsync(new SalesOrder
                {
                    SalesOrderId = "SO_Draft_User99",
                    Status = SalesOrderStatus.Draft,
                    CreatedBy = ownerUserId
                });

            // Act
            var result = await _service.UpdateSalesOrder(dto, currentUserId);

            // Assert
            Assert.AreEqual("Current User has no permission to update.", result.Item1);
        }

        // UTCID08: Insufficient Stock
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID08_InsufficientStock_ReturnsError()
        {
            // Arrange
            var userId = 1;
            var dto = new SalesOrderUpdateDto
            {
                SalesOrderId = "SO_Valid",
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailUpdateDtos = new List<SalesOrderItemDetailUpdateDto>
                {
                    new SalesOrderItemDetailUpdateDto { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 90 } // Cần 90
                }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1)).ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Mock Order Exist
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Valid"))
                .ReturnsAsync(new SalesOrder { SalesOrderId = "SO_Valid", Status = SalesOrderStatus.Draft, CreatedBy = userId });

            // Mock Mapper: UpdateDTO -> List<SalesOrderDetail> (để validate stock)
            _mockMapper.Setup(m => m.Map<List<SalesOrderDetail>>(dto.SalesOrderItemDetailUpdateDtos))
                .Returns(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 90 }
                });

            // Mock Goods Quantity (Tồn 100)
            _mockGoodsRepo.Setup(g => g.GetGoodsForSalesOrder(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<GoodsQuantityDto> {
                    new GoodsQuantityDto {
                        Goods = new Good { GoodsId = 100, GoodsName = "Milk" },
                        GoodsPacking = new GoodsPacking { GoodsPackingId = 10 },
                        TotalPackageQuantity = 100
                    }
                });

            // Mock Committed (Đang giữ chỗ 20)
            // Available = 100 - 20 = 80 < 90 => Fail
            _mockSalesOrderRepo.Setup(s => s.GetCommittedSaleOrderQuantities(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 20 }
                });

            // Act
            var result = await _service.UpdateSalesOrder(dto, userId);

            // Assert
            Assert.IsTrue(result.Item1.Contains("không đủ số lượng"));
        }

        // UTCID09: Success
        [TestMethod]
        public async Task UpdateSalesOrder_UTCID09_ValidData_ReturnsSuccess()
        {
            // Arrange
            var userId = 1;
            var dto = new SalesOrderUpdateDto
            {
                SalesOrderId = "SO_Valid",
                RetailerId = 1,
                EstimatedTimeDeparture = DateOnly.FromDateTime(DateTime.Now.AddDays(1)),
                SalesOrderItemDetailUpdateDtos = new List<SalesOrderItemDetailUpdateDto>
                {
                    new SalesOrderItemDetailUpdateDto { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 50 } // Cần 50
                }
            };

            _mockRetailerRepo.Setup(r => r.GetRetailerByRetailerId(1)).ReturnsAsync(new Retailer { Status = CommonStatus.Active });

            // Mock Order Exist
            var existingOrder = new SalesOrder
            {
                SalesOrderId = "SO_Valid",
                Status = SalesOrderStatus.Draft,
                CreatedBy = userId,
                SalesOrderDetails = new List<SalesOrderDetail>()
            };

            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Valid")).ReturnsAsync(existingOrder);

            // Mock Mapper Validate
            _mockMapper.Setup(m => m.Map<List<SalesOrderDetail>>(dto.SalesOrderItemDetailUpdateDtos))
                .Returns(new List<SalesOrderDetail> {
                    new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 50 }
                });

            _mockGoodsRepo.Setup(g => g.GetGoodsForSalesOrder(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<GoodsQuantityDto> {
                    new GoodsQuantityDto {
                        TotalPackageQuantity = 100,
                        Goods = new Good { GoodsId = 100, GoodsName = "Sữa Tươi" },
                        GoodsPacking = new GoodsPacking { GoodsPackingId = 10 }
                    }
                });

            // Mock Committed
            _mockSalesOrderRepo.Setup(s => s.GetCommittedSaleOrderQuantities(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<SalesOrderDetail> {
                     new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 20 }
                });

            // Mock Mapper Update Entity
            _mockMapper.Setup(m => m.Map(dto, existingOrder)).Callback<SalesOrderUpdateDto, SalesOrder>((src, dest) =>
            {
                dest.EstimatedTimeDeparture = src.EstimatedTimeDeparture;
            });

            _mockMapper.Setup(m => m.Map<SalesOrderDetail>(It.IsAny<SalesOrderItemDetailUpdateDto>()))
               .Returns(new SalesOrderDetail { GoodsId = 100, GoodsPackingId = 10, PackageQuantity = 50 });

            // Act
            var result = await _service.UpdateSalesOrder(dto, userId);

            // Assert
            // Kiểm tra item1 (message lỗi) phải rỗng
            Assert.AreEqual("", result.Item1, $"Lỗi không mong muốn: {result.Item1}");
            Assert.AreEqual(dto, result.Item2);
            _mockSalesOrderRepo.Verify(s => s.UpdateSalesOrder(It.IsAny<SalesOrder>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }
        #endregion

        #region Update Sales Order Status Approval
        // UTCID01: Input Null
        // Do code của bạn truy cập trực tiếp .SalesOrderId mà không check null,
        // nên mong đợi sẽ bắn ra NullReferenceException.
        [TestMethod]
        public async Task ApproveSalesOrder_UTCID01_InputNull_ThrowsException()
        {
            await Assert.ThrowsExceptionAsync<NullReferenceException>(async () =>
            {
                await _service.UpdateStatusSalesOrder<SalesOrderApprovalDto>(null, 1);
            });
        }

        // UTCID02: Order Not Exist
        [TestMethod]
        public async Task ApproveSalesOrder_UTCID02_OrderNotExist_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderApprovalDto { SalesOrderId = "SO_NotExist" };

            // Mock Repo trả về null
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_NotExist")).ReturnsAsync((SalesOrder)null);

            // Act
            var result = await _service.UpdateStatusSalesOrder(dto, 1);

            // Assert
            Assert.AreEqual("Sales order exist is null", result.Item1);
            Assert.IsNull(result.Item2);
        }

        // UTCID03: Wrong Status (Draft)
        [TestMethod]
        public async Task ApproveSalesOrder_UTCID03_StatusDraft_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderApprovalDto { SalesOrderId = "SO_Draft" };

            // Mock trả về đơn hàng đang ở trạng thái Draft
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Draft"))
                .ReturnsAsync(new SalesOrder
                {
                    SalesOrderId = "SO_Draft",
                    Status = SalesOrderStatus.Draft
                });

            // Act
            var result = await _service.UpdateStatusSalesOrder(dto, 1);

            // Assert
            // Kiểm tra thông báo lỗi có chứa nội dung đúng logic không
            Assert.IsTrue(result.Item1.Contains("Chỉ được duyệt khi đơn hàng ở trạng thái Chờ duyệt"));
        }

        // UTCID04: Wrong Status (Already Approved)
        [TestMethod]
        public async Task ApproveSalesOrder_UTCID04_StatusApproved_ReturnsError()
        {
            // Arrange
            var dto = new SalesOrderApprovalDto { SalesOrderId = "SO_Approved" };

            // Mock trả về đơn hàng đã Approved rồi
            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Approved"))
                .ReturnsAsync(new SalesOrder
                {
                    SalesOrderId = "SO_Approved",
                    Status = SalesOrderStatus.Approved
                });

            // Act
            var result = await _service.UpdateStatusSalesOrder(dto, 1);

            // Assert
            Assert.IsTrue(result.Item1.Contains("Chỉ được duyệt khi đơn hàng ở trạng thái Chờ duyệt"));
        }

        // UTCID05: Success (Happy Path)
        [TestMethod]
        public async Task ApproveSalesOrder_UTCID05_ValidData_ReturnsSuccess()
        {
            // Arrange
            var userId = 20; // Sale Manager
            var createdByUserId = 10;
            var dto = new SalesOrderApprovalDto { SalesOrderId = "SO_Pending" };

            // 1. Mock đơn hàng đang PendingApproval (Hợp lệ để duyệt)
            var salesOrderEntity = new SalesOrder
            {
                SalesOrderId = "SO_Pending",
                Status = SalesOrderStatus.PendingApproval,
                CreatedBy = createdByUserId, // Cần thiết cho logic gửi thông báo
                RejectionReason = "Old Reason" // Giả sử có lý do cũ, cần bị xóa đi
            };

            _mockSalesOrderRepo.Setup(s => s.GetSalesOrderById("SO_Pending"))
                .ReturnsAsync(salesOrderEntity);

            // 2. Mock User Repo để xử lý Notification (tránh NullReference trong HandleStatusChangeNotification)
            // Logic duyệt đơn sẽ gửi thông báo cho WarehouseManager
            _mockUserRepo.Setup(u => u.GetUsersByRoleId(RoleType.WarehouseManager))
                .ReturnsAsync(new List<User> { new User { UserId = 99, Roles = [new Role() { RoleId = RoleType.WarehouseManager }] } });

            // Act
            var result = await _service.UpdateStatusSalesOrder(dto, userId);

            // Assert
            // 1. Kiểm tra kết quả trả về
            Assert.AreEqual("", result.Item1);
            Assert.AreEqual(dto, result.Item2);

            // 2. Kiểm tra trạng thái Entity đã được cập nhật chưa (Quan trọng)
            Assert.AreEqual(SalesOrderStatus.Approved, salesOrderEntity.Status);
            Assert.AreEqual(userId, salesOrderEntity.ApprovalBy);
            Assert.AreEqual("", salesOrderEntity.RejectionReason); // Lý do từ chối phải bị reset
            Assert.IsNotNull(salesOrderEntity.ApprovalAt); // Thời gian duyệt phải được set

            // 3. Verify DB interactions
            _mockSalesOrderRepo.Verify(s => s.UpdateSalesOrder(salesOrderEntity), Times.Once);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);

            // 4. Verify Notification (Optional nhưng nên có)
            // Kiểm tra xem có gọi service tạo thông báo không
            _mockNotiService.Verify(n => n.CreateNotificationBulk(It.IsAny<List<NotificationCreateDto>>()), Times.Once);
        }
        #endregion
    }
}