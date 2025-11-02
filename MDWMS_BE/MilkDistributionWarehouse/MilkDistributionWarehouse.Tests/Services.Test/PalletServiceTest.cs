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
        s
        [TestMethod]
        public async Task GetPalletById_ShouldReturnError_WhenNotExist()
        {
            _palletRepoMock.Setup(r => r.GetPalletById("P2")).ReturnsAsync((Pallet)null);

            var (msg, dto) = await _service.GetPalletById("P2");

            msg.Should().NotBeEmpty();
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task GetPallets_ShouldReturnPagedResult_WhenPalletsExist()
        {
            var pallets = new List<Pallet>
            {
                new Pallet { PalletId = "P1" },
                new Pallet { PalletId = "P2" }
            }.AsQueryable();

            _palletRepoMock.Setup(r => r.GetPallets()).Returns(pallets);

            var request = new PagedRequest { PageNumber = 1, PageSize = 10 };
            var (msg, result) = await _service.GetPallets(request);

            msg.Should().BeEmpty();
            result.Should().NotBeNull();
            result.Items.Should().HaveCount(2);
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
    }
}
