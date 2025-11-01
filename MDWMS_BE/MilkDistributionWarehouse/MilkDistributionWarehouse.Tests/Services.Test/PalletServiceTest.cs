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
        public async Task CreatePallet_ShouldReturnError_WhenUserNull()
        {
            var (msg, dto) = await _service.CreatePallet(new PalletDto.PalletRequestDto(), null);

            msg.Should().NotBeEmpty();
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task CreatePallet_ShouldCreate_WhenValid()
        {
            var dto = new PalletDto.PalletRequestDto { BatchId = Guid.NewGuid() };
            _palletRepoMock.Setup(r => r.ExistsBatch(It.IsAny<Guid?>())).ReturnsAsync(true);
            _palletRepoMock.Setup(r => r.CreatePallet(It.IsAny<Pallet>())).ReturnsAsync(new Pallet { PalletId = "123" });
            _palletRepoMock.Setup(r => r.GetPalletById("123")).ReturnsAsync(new Pallet { PalletId = "123" });

            var (msg, created) = await _service.CreatePallet(dto, 1);

            msg.Should().BeEmpty();
            created.PalletId.Should().Be("123");
        }
    }
}
