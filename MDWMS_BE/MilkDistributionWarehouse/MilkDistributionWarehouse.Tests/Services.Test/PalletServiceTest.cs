using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using FluentAssertions;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Models.DTOs;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests.Services.Test
{
    [TestClass]
    public class PalletServiceTest
    {
        private Mock<IPalletRepository> _palletRepoMock;
        private Mock<ILocationRepository> _locationRepoMock;
        private IMapper _mapper;
        private PalletService _service;

        [TestInitialize]
        public void Init()
        {
            _palletRepoMock = new Mock<IPalletRepository>();
            _locationRepoMock = new Mock<ILocationRepository>();

            var config = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<Pallet, PalletDto.PalletResponseDto>();
                cfg.CreateMap<PalletDto.PalletRequestDto, Pallet>();
                cfg.CreateMap<Pallet, PalletDto.PalletDetailDto>();
                cfg.CreateMap<Pallet, PalletDto.PalletActiveDto>();
                cfg.CreateMap<Pallet, PalletDto.PalletUpdateStatusDto>();
            });
            _mapper = config.CreateMapper();

            _service = new PalletService(_palletRepoMock.Object, _mapper, _locationRepoMock.Object);
        }

        [TestMethod]
        public async Task GetPalletById_ShouldReturnDto_WhenExist()
        {
            var pallet = new Pallet { PalletId = "P1" };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);

            var (msg, dto) = await _service.GetPalletById("P1");

            msg.Should().BeEmpty();
            dto.Should().NotBeNull();
            dto.PalletId.Should().Be("P1");
        }
        
        [TestMethod]
        public async Task GetPalletById_ShouldReturnError_WhenNotExist()
        {
            _palletRepoMock.Setup(r => r.GetPalletById("P2")).ReturnsAsync((Pallet)null);

            var (msg, dto) = await _service.GetPalletById("P2");

            msg.Should().NotBeEmpty();
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenUserNull()
        {
            var (msg, dto) = await _service.CreatePallet(new PalletDto.PalletRequestDto(), null);

            msg.Should().NotBeEmpty();
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task CreatePallet_ShouldCreate_WhenValid()
        {
            var dto = new PalletDto.PalletRequestDto { 
                BatchId = Guid.NewGuid(),
                GoodsPackingId = 1,
                LocationId = 1,
                PackageQuantity = 10,
                GoodsReceiptNoteId = Guid.NewGuid()
            };
            
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.ExistsLocation(It.IsAny<int?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.IsLocationAvailable(It.IsAny<int?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.ExistsGoodRecieveNote(It.IsAny<Guid?>())).ReturnsAsync(true);
            _locationRepoMock.Setup(r => r.UpdateIsAvailableAsync(It.IsAny<int?>(), false)).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.CreatePallet(It.IsAny<Pallet>())).ReturnsAsync(new Pallet { PalletId = "123" });
            _palletRepoMock.Setup(r => r.GetPalletById("123")).ReturnsAsync(new Pallet { PalletId = "123" });

            var (msg, created) = await _service.CreatePallet(dto, 1);

            msg.Should().BeEmpty();
            created.PalletId.Should().Be("123");
        }

        [TestMethod]
        public async Task CreatePalletBulk_ShouldReturnError_WhenUserNull()
        {
            var create = new PalletDto.PalletBulkCreate { Pallets = new List<PalletDto.PalletRequestDto>() };
            var (msg, result) = await _service.CreatePalletBulk(create, null);

            msg.Should().NotBeEmpty();
            result.Should().NotBeNull();
        }

        [TestMethod]
        public async Task UpdatePallet_ShouldReturnError_WhenPalletNotExist()
        {
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync((Pallet)null);

            var (msg, dto) = await _service.UpdatePallet("P1", new PalletDto.PalletRequestDto());

            msg.Should().NotBeEmpty();
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task DeletePallet_ShouldReturnError_WhenPalletNotExist()
        {
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync((Pallet)null);

            var (msg, dto) = await _service.DeletePallet("P1");

            msg.Should().NotBeEmpty();
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task DeletePallet_ShouldDelete_WhenValid()
        {
            var pallet = new Pallet { 
                PalletId = "P1",
                PackageQuantity = 0,
                LocationId = 1 
            };
            
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);
            _locationRepoMock.Setup(r => r.UpdateIsAvailableAsync(1, true)).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.UpdatePallet(It.IsAny<Pallet>())).ReturnsAsync(pallet);

            var (msg, deleted) = await _service.DeletePallet("P1");

            msg.Should().BeEmpty();
            deleted.Should().NotBeNull();
            deleted.PalletId.Should().Be("P1");
        }

        [TestMethod]
        public async Task GetPalletDropdown_ShouldReturnActivePallets()
        {
            var pallets = new List<Pallet> 
            { 
                new Pallet { PalletId = "P1" },
                new Pallet { PalletId = "P2" }
            };
            _palletRepoMock.Setup(r => r.GetActivePalletsAsync()).ReturnsAsync(pallets);

            var (msg, result) = await _service.GetPalletDropdown();

            msg.Should().BeEmpty();
            result.Should().HaveCount(2);
        }

        [TestMethod]
        public async Task GetPalletByGRNID_ShouldReturnPallets_WhenExist()
        {
            var grnId = Guid.NewGuid();
            var pallets = new List<Pallet> 
            { 
                new Pallet { PalletId = "P1", GoodsReceiptNoteId = grnId },
                new Pallet { PalletId = "P2", GoodsReceiptNoteId = grnId }
            };
            _palletRepoMock.Setup(r => r.GetPalletsByGRNID(grnId)).ReturnsAsync(pallets);

            var (msg, result) = await _service.GetPalletByGRNID(grnId);

            msg.Should().BeEmpty();
            result.Should().HaveCount(2);
        }

        [TestMethod]
        public async Task UpdatePalletStatus_ShouldReturnError_WhenPalletNotExist()
        {
            var update = new PalletDto.PalletUpdateStatusDto { PalletId = "P1", Status = 2 };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync((Pallet)null);

            var (msg, result) = await _service.UpdatePalletStatus(update);

            msg.Should().NotBeEmpty();
            result.Should().NotBeNull();
        }

        [TestMethod]
        public async Task UpdatePalletQuantity_ShouldReturnError_WhenPalletNotExist()
        {
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync((Pallet)null);

            var (msg, result) = await _service.UpdatePalletQuantity("P1", 1);

            msg.Should().NotBeEmpty();
            result.Should().NotBeNull();
        }

        [TestMethod]
        public async Task UpdatePalletQuantity_ShouldUpdate_WhenValid()
        {
            var pallet = new Pallet { 
                PalletId = "P1", 
                PackageQuantity = 10,
                LocationId = 1
            };
            
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);
            _palletRepoMock.Setup(r => r.UpdatePallet(It.IsAny<Pallet>())).ReturnsAsync(pallet);
            _locationRepoMock.Setup(r => r.UpdateIsAvailableAsync(1, true)).ReturnsAsync(true);
             
            var (msg, result) = await _service.UpdatePalletQuantity("P1", 5);

            msg.Should().BeEmpty();
            result.Should().NotBeNull();
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenLocationNotExist()
        {
            var dto = new PalletDto.PalletRequestDto { LocationId = 1, BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsLocation(1)).ReturnsAsync(false);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("Vị trí không tồn tại");
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenLocationNotAvailable()
        {
            var dto = new PalletDto.PalletRequestDto { LocationId = 1, BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsLocation(1)).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.IsLocationAvailable(1)).ReturnsAsync(false);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("Vị trí này đã có pallet khác");
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenGRNNotExist()
        {
            var dto = new PalletDto.PalletRequestDto { BatchId = Guid.NewGuid(), GoodsReceiptNoteId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.ExistsGoodRecieveNote(It.IsAny<Guid?>())).ReturnsAsync(false);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("GoodsReceiptNoteId do not exist");
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenBatchNotExist()
        {
            var dto = new PalletDto.PalletRequestDto { BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(false);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("Batch do not exist");
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenUpdateLocationFailed()
        {
            var dto = new PalletDto.PalletRequestDto { LocationId = 1, BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.ExistsLocation(1)).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.IsLocationAvailable(1)).ReturnsAsync(true);
            _locationRepoMock.Setup(r => r.UpdateIsAvailableAsync(1, false)).ReturnsAsync(false);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("Cập nhật trạng thái vị trí thất bại");
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenCreateReturnNull()
        {
            var dto = new PalletDto.PalletRequestDto { BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.CreatePallet(It.IsAny<Pallet>())).ReturnsAsync((Pallet)null);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("Create pallet failed");
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnError_WhenGetCreatedReturnNull()
        {
            var dto = new PalletDto.PalletRequestDto { BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.CreatePallet(It.IsAny<Pallet>())).ReturnsAsync(new Pallet { PalletId = "P1" });
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync((Pallet)null);

            var (msg, _) = await _service.CreatePallet(dto, 1);
            msg.Should().Contain("cannot load created record");
        }

        [TestMethod]
        public async Task UpdatePallet_ShouldReturnError_WhenLocationNotExist()
        {
            var pallet = new Pallet { PalletId = "P1", LocationId = 1 };
            var dto = new PalletDto.PalletRequestDto { LocationId = 2, BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);
            _palletRepoMock.Setup(r => r.ExistsLocation(2)).ReturnsAsync(false);

            var (msg, _) = await _service.UpdatePallet("P1", dto);
            msg.Should().Contain("Vị trí không tồn tại");
        }

        [TestMethod]
        public async Task DeletePallet_ShouldReturnError_WhenQuantityPositive()
        {
            var pallet = new Pallet { PalletId = "P1", PackageQuantity = 5 };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);

            var (msg, _) = await _service.DeletePallet("P1");
            msg.Should().Contain("Không thể xóa pallet còn hàng");
        }

        [TestMethod]
        public async Task UpdatePalletStatus_ShouldReturnError_WhenSameStatus()
        {
            var pallet = new Pallet { PalletId = "P1", Status = CommonStatus.Active };
            var update = new PalletDto.PalletUpdateStatusDto { PalletId = "P1", Status = CommonStatus.Active };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);

            var (msg, _) = await _service.UpdatePalletStatus(update);
            msg.Should().Contain("Trạng thái hiện tại và trạng thái update đang giống nhau");
        }

        [TestMethod]
        public async Task UpdatePalletQuantity_ShouldReturnError_WhenNegative()
        {
            var pallet = new Pallet { PalletId = "P1", PackageQuantity = 5 };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);

            var (msg, _) = await _service.UpdatePalletQuantity("P1", -2);
            msg.Should().Contain("Số lượng lấy ra không được âm");
        }

        [TestMethod]
        public async Task UpdatePalletQuantity_ShouldReturnError_WhenOverQuantity()
        {
            var pallet = new Pallet { PalletId = "P1", PackageQuantity = 3 };
            _palletRepoMock.Setup(r => r.GetPalletById("P1")).ReturnsAsync(pallet);

            var (msg, _) = await _service.UpdatePalletQuantity("P1", 5);
            msg.Should().Contain("Số lượng lấy ra vượt quá");
        }
    }
}
