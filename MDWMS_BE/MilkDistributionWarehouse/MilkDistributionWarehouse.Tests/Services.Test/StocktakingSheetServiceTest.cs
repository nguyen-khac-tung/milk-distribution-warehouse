using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Utilities;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StocktakingSheetServiceTest
    {
        private Mock<IMapper> _mapperMock = null!;
        private Mock<IStocktakingSheetRepository> _sheetRepoMock = null!;
        private Mock<IStocktakingAreaService> _areaServiceMock = null!;
        private Mock<IUnitOfWork> _unitOfWorkMock = null!;
        private Mock<IAreaRepository> _areaRepoMock = null!;
        private Mock<IStocktakingLocationService> _locationServiceMock = null!;
        private Mock<IStocktakingLocationRepository> _locationRepoMock = null!;
        private Mock<IStocktakingStatusDomainService> _statusDomainMock = null!;
        private Mock<IStocktakingPalletRepository> _palletRepoMock = null!;
        private Mock<IPalletRepository> _palletRepoSimpleMock = null!;
        private Mock<ILocationRepository> _locationRepoSimpleMock = null!;
        private Mock<INotificationService> _notificationServiceMock = null!;
        private Mock<IUserRepository> _userRepoMock = null!;
        private StocktakingSheetService _service = null!;

        [TestInitialize]
        public void Setup()
        {
            _mapperMock = new Mock<IMapper>();
            _sheetRepoMock = new Mock<IStocktakingSheetRepository>();
            _areaServiceMock = new Mock<IStocktakingAreaService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _areaRepoMock = new Mock<IAreaRepository>();
            _locationServiceMock = new Mock<IStocktakingLocationService>();
            _locationRepoMock = new Mock<IStocktakingLocationRepository>();
            _statusDomainMock = new Mock<IStocktakingStatusDomainService>();
            _palletRepoMock = new Mock<IStocktakingPalletRepository>();
            _palletRepoSimpleMock = new Mock<IPalletRepository>();
            _locationRepoSimpleMock = new Mock<ILocationRepository>();
            _notificationServiceMock = new Mock<INotificationService>();
            _userRepoMock = new Mock<IUserRepository>();

            // Setup common unit of work transactional methods
            _unitOfWorkMock.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.CommitTransactionAsync()).Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.RollbackTransactionAsync()).Returns(Task.CompletedTask);

            _service = new StocktakingSheetService(
                _mapperMock.Object,
                _sheetRepoMock.Object,
                Mock.Of<IStocktakingAreaRepository>(),
                _unitOfWorkMock.Object,
                _areaRepoMock.Object,
                _areaServiceMock.Object,
                _locationServiceMock.Object,
                _locationRepoMock.Object,
                _statusDomainMock.Object,
                _palletRepoMock.Object,
                _palletRepoSimpleMock.Object,
                _locationRepoSimpleMock.Object,
                _notificationServiceMock.Object,
                _userRepoMock.Object
            );
        }

        #region CreateStocktakingSheet tests

        [TestMethod]
        public async Task CreateStocktakingSheet_NullCreate_ReturnsError()
        {
            var (msg, resp) = await _service.CreateStocktakingSheet(null!, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_UserNull_ReturnsError()
        {
            var create = new StocktakingSheetCreate { AreaIds = new List<StocktakingAreaCreateDto>(), StartTime = DateTimeUtility.Now().AddHours(5) };
            var (msg, resp) = await _service.CreateStocktakingSheet(create, null);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_StartTimeInPast_ReturnsError()
        {
            var create = new StocktakingSheetCreate
            {
                AreaIds = new List<StocktakingAreaCreateDto>(),
                StartTime = DateTimeUtility.Now().AddHours(-1)
            };

            var (msg, resp) = await _service.CreateStocktakingSheet(create, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_DuplicateStartTime_ReturnsError()
        {
            var create = new StocktakingSheetCreate
            {
                AreaIds = new List<StocktakingAreaCreateDto>(),
                StartTime = DateTimeUtility.Now().AddHours(5)
            };
            var future = create.StartTime;
            _mapperMock.Setup(m => m.Map<StocktakingSheet>(It.IsAny<StocktakingSheetCreate>()))
                .Returns(new StocktakingSheet { StartTime = future });
            _sheetRepoMock.Setup(r => r.IsDuplicationStartTimeStocktakingSheet(null, future)).ReturnsAsync(true);

            var (msg, resp) = await _service.CreateStocktakingSheet(create, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_RepositoryCreateFails_ReturnsError()
        {
            var create = new StocktakingSheetCreate { AreaIds = new List<StocktakingAreaCreateDto>(), StartTime = DateTimeUtility.Now().AddHours(5) };
            var future = create.StartTime;
            var mapped = new StocktakingSheet { StartTime = future };
            _mapperMock.Setup(m => m.Map<StocktakingSheet>(It.IsAny<StocktakingSheetCreate>())).Returns(mapped);
            _sheetRepoMock.Setup(r => r.IsDuplicationStartTimeStocktakingSheet(null, future)).ReturnsAsync(false);
            _sheetRepoMock.Setup(r => r.CreateStocktakingSheet(It.IsAny<StocktakingSheet>())).ReturnsAsync(0);

            var (msg, resp) = await _service.CreateStocktakingSheet(create, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
            _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_CreateAreasFails_RollsBackAndReturnsError()
        {
            var create = new StocktakingSheetCreate { AreaIds = new List<StocktakingAreaCreateDto> { new StocktakingAreaCreateDto { AreaId = 1 } }, StartTime = DateTimeUtility.Now().AddHours(5) };
            var future = create.StartTime;
            var mapped = new StocktakingSheet { StartTime = future, StocktakingSheetId = "S1" };
            _mapperMock.Setup(m => m.Map<StocktakingSheet>(It.IsAny<StocktakingSheetCreate>())).Returns(mapped);
            _sheetRepoMock.Setup(r => r.IsDuplicationStartTimeStocktakingSheet(null, future)).ReturnsAsync(false);
            _sheetRepoMock.Setup(r => r.CreateStocktakingSheet(It.IsAny<StocktakingSheet>())).ReturnsAsync(1);
            _areaServiceMock.Setup(a => a.CreateStocktakingAreaBulk(mapped.StocktakingSheetId, create.AreaIds))
                .ReturnsAsync(("Areas failed", default(StocktakingSheeteResponse)));

            var (msg, resp) = await _service.CreateStocktakingSheet(create, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
            _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        #endregion

        #region UpdateStocktakingSheet tests

        [TestMethod]
        public async Task UpdateStocktakingSheet_NotExist_ReturnsError()
        {
            var update = new StocktakingSheetUpdate { StocktakingSheetId = "NotExist", AreaIds = new List<StocktakingAreaCreateDto>() };
            _sheetRepoMock.Setup(r => r.GetStocktakingSheetById(update.StocktakingSheetId)).ReturnsAsync((StocktakingSheet?)null);

            var (msg, resp) = await _service.UpdateStocktakingSheet(update, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task UpdateStocktakingSheet_CreatedByMismatch_ReturnsError()
        {
            var update = new StocktakingSheetUpdate { StocktakingSheetId = "S1", AreaIds = new List<StocktakingAreaCreateDto>() };
            var exist = new StocktakingSheet { StocktakingSheetId = "S1", CreatedBy = 99, Status = StocktakingStatus.Draft, StocktakingAreas = new List<StocktakingArea>() };
            _sheetRepoMock.Setup(r => r.GetStocktakingSheetById(update.StocktakingSheetId)).ReturnsAsync(exist);

            var (msg, resp) = await _service.UpdateStocktakingSheet(update, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task UpdateStocktakingSheet_DuplicationStartTime_ReturnsError()
        {
            var update = new StocktakingSheetUpdate { StocktakingSheetId = "S2", AreaIds = new List<StocktakingAreaCreateDto>(), StartTime = DateTimeUtility.Now().AddDays(1) };
            var exist = new StocktakingSheet { StocktakingSheetId = "S2", CreatedBy = 1, Status = StocktakingStatus.Draft, StocktakingAreas = new List<StocktakingArea>() };
            _sheetRepoMock.Setup(r => r.GetStocktakingSheetById(update.StocktakingSheetId)).ReturnsAsync(exist);
            _sheetRepoMock.Setup(r => r.IsDuplicationStartTimeStocktakingSheet(update.StocktakingSheetId, update.StartTime!)).ReturnsAsync(true);

            var (msg, resp) = await _service.UpdateStocktakingSheet(update, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task UpdateStocktakingSheet_UpdateRepoFails_ReturnsError()
        {
            var exist = new StocktakingSheet
            {
                StocktakingSheetId = "S4",
                CreatedBy = 1,
                Status = StocktakingStatus.Draft,
                // ensure start time far enough in future
                StartTime = DateTimeUtility.Now().AddHours(200),
                StocktakingAreas = new List<StocktakingArea>()
            };

            var update = new StocktakingSheetUpdate
            {
                StocktakingSheetId = "S4",
                AreaIds = new List<StocktakingAreaCreateDto>(),
                StartTime = DateTimeUtility.Now().AddHours(201)
            };

            _sheetRepoMock.Setup(r => r.GetStocktakingSheetById("S4")).ReturnsAsync(exist);
            _sheetRepoMock.Setup(r => r.IsDuplicationStartTimeStocktakingSheet("S4", update.StartTime!)).ReturnsAsync(false);
            _sheetRepoMock.Setup(r => r.UpdateStockingtakingSheet(It.IsAny<StocktakingSheet>())).ReturnsAsync(0);

            var (msg, resp) = await _service.UpdateStocktakingSheet(update, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        [TestMethod]
        public async Task UpdateStocktakingSheet_AreaServiceReturnsError_ReturnsError()
        {
            var exist = new StocktakingSheet
            {
                StocktakingSheetId = "S5",
                CreatedBy = 1,
                Status = StocktakingStatus.Draft,
                StartTime = DateTimeUtility.Now().AddHours(200),
                StocktakingAreas = new List<StocktakingArea>()
            };

            var update = new StocktakingSheetUpdate
            {
                StocktakingSheetId = "S5",
                AreaIds = new List<StocktakingAreaCreateDto> { new StocktakingAreaCreateDto { AreaId = 1 } },
                StartTime = DateTimeUtility.Now().AddHours(201)
            };

            _sheetRepoMock.Setup(r => r.GetStocktakingSheetById("S5")).ReturnsAsync(exist);
            _sheetRepoMock.Setup(r => r.IsDuplicationStartTimeStocktakingSheet("S5", update.StartTime!)).ReturnsAsync(false);
            _sheetRepoMock.Setup(r => r.UpdateStockingtakingSheet(It.IsAny<StocktakingSheet>())).ReturnsAsync(1);
            _areaServiceMock.Setup(a => a.UpdateStocktakingAreaBulk(update.StocktakingSheetId, update.AreaIds)).ReturnsAsync(("area update failed", default(StocktakingSheeteResponse)));

            var (msg, resp) = await _service.UpdateStocktakingSheet(update, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(resp);
        }

        #endregion
    }
}
