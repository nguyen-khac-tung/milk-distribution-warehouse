using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using System.Collections.Generic;

namespace MilkDistributionWarehouse.Tests.Controllers.Test
{
    [TestClass]
    public class SalesOrderControllerTest
    {
        private Mock<ISalesOrderService> _mockService;
        private SalesOrderController _controller;
        private const int TestUserId = 1;

        [TestInitialize]
        public void Setup()
        {
            _mockService = new Mock<ISalesOrderService>();
            _controller = new SalesOrderController(_mockService.Object);

            var userPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
                new Claim(ClaimTypes.Role, "Sales Representative")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = userPrincipal }
            };
        }

        // Test cho UTCID09 (Success -> 200 OK)
        [TestMethod]
        public async Task CreateSalesOrder_ReturnsOk_WhenServiceSucceeds()
        {
            // Arrange
            var dto = new SalesOrderCreateDto { RetailerId = 1 };

            // Mock Service trả về thành công
            _mockService.Setup(s => s.CreateSalesOrder(dto, TestUserId))
                .ReturnsAsync(("", dto));

            // Act
            var result = await _controller.CreateSalesOrder(dto);

            // Assert
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var obj = (ObjectResult)result;
            Assert.AreEqual(200, obj.StatusCode);
            Assert.IsNotNull(obj.Value);
        }

        // Test cho các UTCID lỗi (01 -> 08) -> 400 Bad Request
        [TestMethod]
        public async Task CreateSalesOrder_ReturnsBadRequest_WhenServiceFails()
        {
            // Arrange
            var dto = new SalesOrderCreateDto { RetailerId = 1 };

            // Mock Service trả về lỗi
            _mockService.Setup(s => s.CreateSalesOrder(dto, TestUserId))
                .ReturnsAsync(("Lỗi tồn kho", null));

            // Act
            var result = await _controller.CreateSalesOrder(dto);

            // Assert
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var obj = (ObjectResult)result;
            Assert.AreEqual(400, obj.StatusCode);
        }
    }
}