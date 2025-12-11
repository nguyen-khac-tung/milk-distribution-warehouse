using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Models.DTOs;
using AutoMapper;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StocktakingPalletServiceTest
    {
        private Mock<IMapper> _mapperMock = null!;
        private Mock<IStocktakingPalletRepository> _stocktakingPalletRepoMock = null!;
        private Mock<IPalletRepository> _palletRepoMock = null!;
        private Mock<IStocktakingLocationRepository> _stocktakingLocationRepoMock = null!;
        private Mock<IStocktakingStatusDomainService> _stocktakingStatusDomainServiceMock = null!;
        private StocktakingPalletService _service = null!;

        [TestInitialize]
        public void Init()
        {
            _mapperMock = new Mock<IMapper>();
            _stocktakingPalletRepoMock = new Mock<IStocktakingPalletRepository>();
            _palletRepoMock = new Mock<IPalletRepository>();
            _stocktakingLocationRepoMock = new Mock<IStocktakingLocationRepository>();
            _stocktakingStatusDomainServiceMock = new Mock<IStocktakingStatusDomainService>();

            // Default mapper behaviour: map Pallet -> StocktakingPallet (minimal)
            _mapperMock.Setup(m => m.Map<StocktakingPallet>(It.IsAny<Pallet>()))
                .Returns((Pallet p) => new StocktakingPallet
                {
                    PalletId = p?.PalletId,
                    // keep LocationId in Pallet, mapping does not set StocktakingLocationId
                });

            _service = new StocktakingPalletService(
                _mapperMock.Object,
                _stocktakingPalletRepoMock.Object,
                _palletRepoMock.Object,
                _stocktakingLocationRepoMock.Object,
                _stocktakingStatusDomainServiceMock.Object
            );
        }

        [TestMethod]
        public async Task CreateStocktakingPalletBulk_EmptyInput_ReturnsInvalidDataMessage()
        {
            // Arrange
            var creates = new List<StocktakingPalletCreate>();

            // Act
            var (msg, result) = await _service.CreateStocktakingPalletBulk(creates);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Dữ liệu tạo kiểm kê kệ hàng không hợp lệ");
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task CreateStocktakingPalletBulk_NoActivePallets_ReturnsEmptyPalettesMessage()
        {
            // Arrange
            var creates = new List<StocktakingPalletCreate>
            {
                new StocktakingPalletCreate { StocktakingLocationId = Guid.NewGuid(), LocationId = 1 },
                new StocktakingPalletCreate { StocktakingLocationId = Guid.NewGuid(), LocationId = 2 }
            };

            _palletRepoMock
                .Setup(r => r.GetActivePalletIdsByLocationId(It.IsAny<List<int>>()))
                .ReturnsAsync(new List<Pallet>());

            // Act
            var (msg, result) = await _service.CreateStocktakingPalletBulk(creates);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Dữ liệu kệ kê hàng trống");
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task CreateStocktakingPalletBulk_CreateBulkReturnsZero_ReturnsFailureMessage()
        {
            // Arrange
            var locationId = 10;
            var stocktakingLocationId = Guid.NewGuid();
            var creates = new List<StocktakingPalletCreate>
            {
                new StocktakingPalletCreate { StocktakingLocationId = stocktakingLocationId, LocationId = locationId }
            };

            // Return one pallet that matches LocationId
            var pallets = new List<Pallet>
            {
                new Pallet { PalletId = "P1", LocationId = locationId }
            };

            _palletRepoMock.Setup(r => r.GetActivePalletIdsByLocationId(It.IsAny<List<int>>()))
                .ReturnsAsync(pallets);

            // repository returns 0 to indicate failure
            _stocktakingPalletRepoMock.Setup(r => r.CreateStocktakingPalletBulk(It.IsAny<List<StocktakingPallet>>()))
                .ReturnsAsync(0);

            // Act
            var (msg, result) = await _service.CreateStocktakingPalletBulk(creates);

            // Assert
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            StringAssert.Contains(msg, "Tạo kiểm kê kệ kê hàng thất bại");
            Assert.IsNull(result);
            _stocktakingPalletRepoMock.Verify(r => r.CreateStocktakingPalletBulk(It.IsAny<List<StocktakingPallet>>()), Times.Once);
        }

        [TestMethod]
        public async Task CreateStocktakingPalletBulk_Success_ReturnsCreates()
        {
            // Arrange
            var locationIdA = 11;
            var locationIdB = 12;
            var stocktakingLocationA = Guid.NewGuid();
            var stocktakingLocationB = Guid.NewGuid();

            var creates = new List<StocktakingPalletCreate>
            {
                new StocktakingPalletCreate { StocktakingLocationId = stocktakingLocationA, LocationId = locationIdA },
                new StocktakingPalletCreate { StocktakingLocationId = stocktakingLocationB, LocationId = locationIdB }
            };

            // Return pallets for both locations, plus an unrelated location (should be ignored)
            var pallets = new List<Pallet>
            {
                new Pallet { PalletId = "PA", LocationId = locationIdA },
                new Pallet { PalletId = "PB", LocationId = locationIdB },
                new Pallet { PalletId = "PX", LocationId = 99 } // should be ignored
            };

            _palletRepoMock.Setup(r => r.GetActivePalletIdsByLocationId(It.IsAny<List<int>>()))
                .ReturnsAsync(pallets);

            // repository returns the number of created items (2)
            _stocktakingPalletRepoMock.Setup(r => r.CreateStocktakingPalletBulk(It.IsAny<List<StocktakingPallet>>()))
                .ReturnsAsync(2);

            // Act
            var (msg, result) = await _service.CreateStocktakingPalletBulk(creates);

            // Assert
            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result!.Count);
            _stocktakingPalletRepoMock.Verify(r => r.CreateStocktakingPalletBulk(It.Is<List<StocktakingPallet>>(l => l.Count == 2)), Times.Once);
        }
    }
}
