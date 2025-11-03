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
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests.Services.Test
{
    [TestClass]
    public class BackOrderServiceTest
    {
        private Mock<IBackOrderRepository> _repoMock;
        private Mock<IUnitOfWork> _uowMock;
        private IMapper _mapper;
        private BackOrderService _service;

        [TestInitialize]
        public void Init()
        {
            _repoMock = new Mock<IBackOrderRepository>();
            _uowMock = new Mock<IUnitOfWork>();
            var config = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<BackOrder, BackOrderDto.BackOrderResponseDto>();
                cfg.CreateMap<BackOrderDto.BackOrderRequestDto, BackOrder>();
            });
            _mapper = config.CreateMapper();
            _service = new BackOrderService(_repoMock.Object, _mapper, _uowMock.Object);
        }

        [TestMethod]
        public async Task GetBackOrderById_ShouldReturnError_WhenNotExist()
        {
            _repoMock.Setup(r => r.GetBackOrderById(It.IsAny<Guid>())).ReturnsAsync((BackOrder)null);
            var (msg, dto) = await _service.GetBackOrderById(Guid.NewGuid());
            msg.Should().Contain("Không tìm thấy");
            dto.Should().NotBeNull();
        }

        [TestMethod]
        public async Task CreateBackOrder_ShouldReturnError_WhenUserNull()
        {
            var (msg, _) = await _service.CreateBackOrder(new BackOrderDto.BackOrderRequestDto(), null);
            msg.Should().Contain("not logged into");
        }

        [TestMethod]
        public async Task CreateBackOrder_ShouldReturnError_WhenRetailerNotExist()
        {
            var dto = new BackOrderDto.BackOrderRequestDto { RetailerId = 1, GoodsId = 1 };
            _repoMock.Setup(r => r.ExistsRetailer(1)).ReturnsAsync(false);
            var (msg, _) = await _service.CreateBackOrder(dto, 10);
            msg.Should().Contain("Retailer do not exist");
        }

        [TestMethod]
        public async Task CreateBackOrder_ShouldReturnError_WhenGoodsNotExist()
        {
            var dto = new BackOrderDto.BackOrderRequestDto { RetailerId = 1, GoodsId = 1 };
            _repoMock.Setup(r => r.ExistsRetailer(1)).ReturnsAsync(true);
            _repoMock.Setup(r => r.ExistsGoods(1)).ReturnsAsync(false);
            var (msg, _) = await _service.CreateBackOrder(dto, 10);
            msg.Should().Contain("Goods do not exist");
        }

        [TestMethod]
        public async Task UpdateBackOrder_ShouldReturnError_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetBackOrderById(It.IsAny<Guid>())).ReturnsAsync((BackOrder)null);
            var (msg, _) = await _service.UpdateBackOrder(Guid.NewGuid(), new BackOrderDto.BackOrderRequestDto());
            msg.Should().Contain("do not exist");
        }

        [TestMethod]
        public async Task DeleteBackOrder_ShouldReturnError_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetBackOrderById(It.IsAny<Guid>())).ReturnsAsync((BackOrder)null);
            var (msg, _) = await _service.DeleteBackOrder(Guid.NewGuid());
            msg.Should().Contain("do not exist");
        }

        [TestMethod]
        public async Task CreateBackOrderBulk_ShouldReturnError_WhenUserNull()
        {
            var bulk = new BackOrderDto.BackOrderBulkCreate { BackOrders = new List<BackOrderDto.BackOrderRequestDto>() };
            var (msg, _) = await _service.CreateBackOrderBulk(bulk, null);
            msg.Should().Contain("not logged into");
        }

        [TestMethod]
        public async Task CreateBackOrderBulk_ShouldReturnError_WhenEmptyList()
        {
            var bulk = new BackOrderDto.BackOrderBulkCreate { BackOrders = new List<BackOrderDto.BackOrderRequestDto>() };
            var (msg, _) = await _service.CreateBackOrderBulk(bulk, 1);
            msg.Should().Contain("trống");
        }
    }
}
