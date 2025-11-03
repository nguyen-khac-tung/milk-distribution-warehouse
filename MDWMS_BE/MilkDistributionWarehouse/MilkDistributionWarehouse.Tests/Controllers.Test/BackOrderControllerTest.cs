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
    public class BackOrderControllerTest
    {
        private Mock<IBackOrderService> _serviceMock;
        private BackOrderController _controller;

        [TestInitialize]
        public void Setup()
        {
            _serviceMock = new Mock<IBackOrderService>();
            _controller = new BackOrderController(_serviceMock.Object);
        }

        [TestMethod]
        public async Task GetBackOrders_ShouldReturnOk()
        {
            _serviceMock.Setup(s => s.GetBackOrders(It.IsAny<PagedRequest>()))
                .ReturnsAsync(("", new PageResult<BackOrderDto.BackOrderResponseDto>()));
            var result = await _controller.GetBackOrders(new PagedRequest()) as ObjectResult;
            result!.StatusCode.Should().Be(200);
        }

        [TestMethod]
        public async Task GetBackOrders_ShouldReturnError_WhenMsg()
        {
            _serviceMock.Setup(s => s.GetBackOrders(It.IsAny<PagedRequest>()))
                .ReturnsAsync(("Lỗi", new PageResult<BackOrderDto.BackOrderResponseDto>()));
            var result = await _controller.GetBackOrders(new PagedRequest()) as ObjectResult;
            result!.StatusCode.Should().Be(400);
        }

        [TestMethod]
        public async Task CreateBackOrder_ShouldReturnError_WhenModelInvalid()
        {
            _controller.ModelState.AddModelError("e", "invalid");
            var result = await _controller.CreateBackOrder(new BackOrderDto.BackOrderRequestDto()) as ObjectResult;
            result!.StatusCode.Should().Be(400);
        }

        [TestMethod]
        public async Task DeleteBackOrder_ShouldReturnError_WhenServiceError()
        {
            _serviceMock.Setup(s => s.DeleteBackOrder(It.IsAny<Guid>()))
                .ReturnsAsync(("Lỗi xóa", new BackOrderDto.BackOrderResponseDto()));
            var result = await _controller.DeleteBackOrder(Guid.NewGuid()) as ObjectResult;
            result!.StatusCode.Should().Be(400);
        }

        [TestMethod]
        public async Task UpdateBackOrder_ShouldReturnError_WhenModelInvalid()
        {
            _controller.ModelState.AddModelError("e", "invalid");
            var result = await _controller.UpdateBackOrder(Guid.NewGuid(), new BackOrderDto.BackOrderRequestDto()) as ObjectResult;
            result!.StatusCode.Should().Be(400);
        }
    }
}
