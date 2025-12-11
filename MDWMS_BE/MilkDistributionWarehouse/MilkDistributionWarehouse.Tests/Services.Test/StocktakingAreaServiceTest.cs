using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using Microsoft.AspNetCore.Hosting;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StocktakingAreaServiceTest
    {
        private Mock<IStocktakingAreaRepository> _areaRepoMock = null!;
        private Mock<IStocktakingLocationRepository> _locationRepoMock = null!;
        private Mock<IStocktakingPalletRepository> _palletRepoMock = null!;
        private Mock<IPalletRepository> _palletRepositoryMock = null!;
        private Mock<IStocktakingSheetRepository> _sheetRepoMock = null!;
        private Mock<IUnitOfWork> _unitOfWorkMock = null!;
        private Mock<IStocktakingStatusDomainService> _statusDomainMock = null!;
        private Mock<INotificationService> _notificationMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private Mock<IMapper> _mapperMock = null!;
        private Mock<IWebHostEnvironment> _envMock = null!;
        private StocktakingAreaService _service = null!;

        [TestInitialize]
        public void Init()
        {
            _areaRepoMock = new Mock<IStocktakingAreaRepository>();
            _locationRepoMock = new Mock<IStocktakingLocationRepository>();
            _palletRepoMock = new Mock<IStocktakingPalletRepository>();
            _palletRepositoryMock = new Mock<IPalletRepository>();
            _sheetRepoMock = new Mock<IStocktakingSheetRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _statusDomainMock = new Mock<IStocktakingStatusDomainService>();
            _notificationMock = new Mock<INotificationService>();
            _userRepoMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();
            _envMock = new Mock<IWebHostEnvironment>();

            // default unit of work no-op
            _unitOfWorkMock.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.CommitTransactionAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.RollbackTransactionAsync()).Returns(Task.CompletedTask);

            _service = new StocktakingAreaService(
                _areaRepoMock.Object,
                Mock.Of<IAreaRepository>(),
                _mapperMock.Object,
                _locationRepoMock.Object,
                _palletRepoMock.Object,
                _sheetRepoMock.Object,
                _unitOfWorkMock.Object,
                _statusDomainMock.Object,
                _palletRepositoryMock.Object,
                _notificationMock.Object,
                _userRepoMock.Object,
                _envMock.Object
            );
        }

        #region CreateStocktakingAreaBulk tests

        [TestMethod]
        public async Task CreateStocktakingAreaBulk_WhenAreaAssignmentExists_ReturnsError()
        {
            // Arrange
            var sheetId = "SHEET-1";
            _areaRepoMock.Setup(r => r.IsCheckStocktakingAreaExist(sheetId)).ReturnsAsync(true);

            // Act
            var (msg, resp) = await _service.CreateStocktakingAreaBulk(sheetId, new List<StocktakingAreaCreateDto> { new() });

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Phiểu kiểm kê đã tồn tại phân công nhân viên theo khu vực");
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task CreateStocktakingAreaBulk_WhenRepositoryReturnsZero_ReturnsFailureMessage()
        {
            // Arrange
            var sheetId = "SHEET-2";
            _areaRepoMock.Setup(r => r.IsCheckStocktakingAreaExist(sheetId)).ReturnsAsync(false);

            var creates = new List<StocktakingAreaCreateDto>
            {
                new StocktakingAreaCreateDto { AreaId = 1 }
            };

            var mappedAreas = new List<StocktakingArea>
            {
                new StocktakingArea { AreaId = 1 }
            };

            _mapperMock.Setup(m => m.Map<List<StocktakingArea>>(It.IsAny<List<StocktakingAreaCreateDto>>()))
                .Returns(mappedAreas);

            _areaRepoMock.Setup(r => r.CreateStocktakingAreaBulk(It.IsAny<List<StocktakingArea>>()))
                .ReturnsAsync(0);

            // Act
            var (msg, resp) = await _service.CreateStocktakingAreaBulk(sheetId, creates);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Tạo phiếu kiểm kê khu vục thất bại");
            Assert.IsNull(resp);
            _areaRepoMock.Verify(r => r.CreateStocktakingAreaBulk(It.Is<List<StocktakingArea>>(l => l.Count == 1)), Times.Once);
        }

        [TestMethod]
        public async Task CreateStocktakingAreaBulk_OnSuccess_ReturnsResponse()
        {
            // Arrange
            var sheetId = "SHEET-3";
            _areaRepoMock.Setup(r => r.IsCheckStocktakingAreaExist(sheetId)).ReturnsAsync(false);

            var creates = new List<StocktakingAreaCreateDto>
            {
                new StocktakingAreaCreateDto { AreaId = 1 },
                new StocktakingAreaCreateDto { AreaId = 2 }
            };

            var mappedAreas = new List<StocktakingArea>
            {
                new StocktakingArea { AreaId = 1 },
                new StocktakingArea { AreaId = 2 }
            };

            _mapperMock.Setup(m => m.Map<List<StocktakingArea>>(It.IsAny<List<StocktakingAreaCreateDto>>()))
                .Returns(mappedAreas);

            _areaRepoMock.Setup(r => r.CreateStocktakingAreaBulk(It.IsAny<List<StocktakingArea>>()))
                .ReturnsAsync(2);

            // Act
            var (msg, resp) = await _service.CreateStocktakingAreaBulk(sheetId, creates);

            // Assert
            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(resp);
            Assert.AreEqual(sheetId, resp!.StocktakingSheetId);
        }

        #endregion

        #region UpdateStocktakingAreaApprovalStatus tests

        [TestMethod]
        public async Task UpdateStocktakingAreaApprovalStatus_WhenAreaNotFound_ReturnsError()
        {
            // Arrange
            var update = new StocktakingAreaApprovalStatus { StocktakingAreaId = Guid.NewGuid() };
            _areaRepoMock.Setup(r => r.GetStocktakingAreaByStocktakingAreaId(update.StocktakingAreaId)).ReturnsAsync((StocktakingArea?)null);

            // Act
            var (msg, resp) = await _service.UpdateStocktakingAreaApprovalStatus(update);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Kiểm kê khu vực không tồn tại");
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task UpdateStocktakingAreaApprovalStatus_WhenStatusNotPendingApproval_ReturnsError()
        {
            // Arrange
            var areaId = Guid.NewGuid();
            var update = new StocktakingAreaApprovalStatus { StocktakingAreaId = areaId };

            var area = new StocktakingArea
            {
                StocktakingAreaId = areaId,
                StocktakingSheetId = "S1",
                Status = (int)StockAreaStatus.Pending // not PendingApproval
            };

            _areaRepoMock.Setup(r => r.GetStocktakingAreaByStocktakingAreaId(areaId)).ReturnsAsync(area);

            // Act
            var (msg, resp) = await _service.UpdateStocktakingAreaApprovalStatus(update);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Chỉ có thể chuyển trạng thái sang Đã duyệt");
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task UpdateStocktakingAreaApprovalStatus_WhenHasNoPendingApprovalLocations_ReturnsError()
        {
            // Arrange
            var areaId = Guid.NewGuid();
            var update = new StocktakingAreaApprovalStatus { StocktakingAreaId = areaId };

            var area = new StocktakingArea
            {
                StocktakingAreaId = areaId,
                StocktakingSheetId = "S2",
                Status = (int)StockAreaStatus.PendingApproval
            };

            _areaRepoMock.Setup(r => r.GetStocktakingAreaByStocktakingAreaId(areaId)).ReturnsAsync(area);
            _unitOfWorkMock.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _locationRepoMock.Setup(r => r.HasLocationsNotPendingApprovalAsync(area.StocktakingAreaId)).ReturnsAsync(true);

            // Act
            var (msg, resp) = await _service.UpdateStocktakingAreaApprovalStatus(update);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Chỉ có thể chuyển trạng thái sang Đã duyệt khi kiểm kê vị trí ở trạng thái Chờ duyệt");
            Assert.IsNull(resp);
            _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateStocktakingAreaApprovalStatus_WhenLocationsEmpty_ReturnsError()
        {
            // Arrange
            var areaId = Guid.NewGuid();
            var update = new StocktakingAreaApprovalStatus { StocktakingAreaId = areaId };

            var area = new StocktakingArea
            {
                StocktakingAreaId = areaId,
                StocktakingSheetId = "S3",
                AreaId = 1,
                Status = (int)StockAreaStatus.PendingApproval
            };

            _areaRepoMock.Setup(r => r.GetStocktakingAreaByStocktakingAreaId(areaId)).ReturnsAsync(area);
            _unitOfWorkMock.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _locationRepoMock.Setup(r => r.HasLocationsNotPendingApprovalAsync(area.StocktakingAreaId)).ReturnsAsync(false);
            _locationRepoMock.Setup(r => r.GetLocationsByStockSheetIdAreaIdsAsync(area.StocktakingSheetId, It.IsAny<List<int>>()))
                .ReturnsAsync(new List<StocktakingLocation>());

            // Act
            var (msg, resp) = await _service.UpdateStocktakingAreaApprovalStatus(update);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Danh sách kiểm kê vị trí trống");
            Assert.IsNull(resp);
            _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        #endregion
    }
}
