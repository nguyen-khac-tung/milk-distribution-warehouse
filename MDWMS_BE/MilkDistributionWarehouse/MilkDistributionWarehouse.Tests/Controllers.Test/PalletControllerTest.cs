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
using Microsoft.AspNetCore.Http;

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
        public async Task GetPallets_ShouldReturnOk()
        {
            _serviceMock.Setup(s => s.GetPallets(It.IsAny<PagedRequest>()))
                .ReturnsAsync(("", new PageResult<PalletDto.PalletResponseDto>()));

            var result = await _controller.GetPallets(new PagedRequest()) as ObjectResult;
            result!.StatusCode.Should().Be(StatusCodes.Status200OK);
        }

        [TestMethod]
        public async Task GetPallets_ShouldReturnError_WhenServiceError()
        {
            _serviceMock.Setup(s => s.GetPallets(It.IsAny<PagedRequest>()))
                .ReturnsAsync(("Có lỗi", new PageResult<PalletDto.PalletResponseDto>()));

            var result = await _controller.GetPallets(new PagedRequest()) as ObjectResult;
            result!.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }

        [TestMethod]
        public async Task DeletePallet_ShouldReturnError_WhenServiceError()
        {
            _serviceMock.Setup(s => s.DeletePallet("P1")).ReturnsAsync(("Lỗi xóa", new PalletDto.PalletResponseDto()));
            var result = await _controller.DeletePallet("P1") as ObjectResult;
            result!.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }

        [TestMethod]
        public async Task UpdateStatus_ShouldReturnError_WhenServiceError()
        {
            _serviceMock.Setup(s => s.UpdatePalletStatus(It.IsAny<PalletDto.PalletUpdateStatusDto>()))
                .ReturnsAsync(("Lỗi", new PalletDto.PalletUpdateStatusDto()));
            var result = await _controller.UpdateStatus(new PalletDto.PalletUpdateStatusDto()) as ObjectResult;
            result!.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }
    }
}
