using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using FluentAssertions;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Tests.Controllers.Test
{
    [TestClass]
    public class PalletControllerTest
    {
        private Mock<IPalletService> _serviceMock;
        private PalletController _controller;

        [TestInitialize]
        public void Setup()
        {
            _serviceMock = new Mock<IPalletService>();
            _controller = new PalletController(_serviceMock.Object);
        }

        [TestMethod]
        public async Task GetPallet_ShouldReturnOk_WhenFound()
        {
            _serviceMock.Setup(s => s.GetPalletById("P1"))
                .ReturnsAsync(("", new PalletDto.PalletDetailDto { PalletId = "P1" }));

            var result = await _controller.GetPallet("P1") as ObjectResult;

            result.Should().NotBeNull();
            result!.StatusCode.Should().Be(200);
        }

        [TestMethod]
        public async Task GetPallet_ShouldReturnError_WhenNotFound()
        {
            _serviceMock.Setup(s => s.GetPalletById("P2"))
                .ReturnsAsync(("Không tìm thấy pallet.", new PalletDto.PalletDetailDto()));

            var result = await _controller.GetPallet("P2") as ObjectResult;

            result.Should().NotBeNull();
            result!.StatusCode.Should().Be(400);
        }

        [TestMethod]
        public async Task CreatePallet_ShouldReturnOk_WhenValid()
        {
            var req = new PalletDto.PalletRequestDto { BatchId = Guid.NewGuid() };
            var res = new PalletDto.PalletResponseDto { PalletId = "PX" };
            _serviceMock.Setup(s => s.CreatePallet(It.IsAny<PalletDto.PalletRequestDto>(), It.IsAny<int?>()))
                .ReturnsAsync(("", res));

            var result = await _controller.CreatePallet(req) as ObjectResult;

            result.Should().NotBeNull();
            result!.StatusCode.Should().Be(200);
        }
    }
}
