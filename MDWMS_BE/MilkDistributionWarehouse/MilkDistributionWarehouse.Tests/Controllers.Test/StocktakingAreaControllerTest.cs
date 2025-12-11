using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StocktakingAreaControllerTest
    {
        private Mock<IStocktakingAreaService> _serviceMock = null!;
        private StocktakingAreaController _controller = null!;

        [TestInitialize]
        public void Init()
        {
            _serviceMock = new Mock<IStocktakingAreaService>();
            _controller = new StocktakingAreaController(_serviceMock.Object);
        }

        [TestMethod]
        public async Task ApprovalStocktakingArea_CallsServiceAndReturnsResult()
        {
            // Arrange
            var update = new StocktakingAreaApprovalStatus { StocktakingAreaId = Guid.NewGuid() };
            _serviceMock.Setup(s => s.UpdateStocktakingAreaApprovalStatus(update))
                .ReturnsAsync(("", new StocktakingAreaApprovalResponse()));

            var controller = new StocktakingAreaController(_serviceMock.Object);

            // Act
            var result = await controller.ApprovalStocktakingArea(update);

            // Assert
            _serviceMock.Verify(s => s.UpdateStocktakingAreaApprovalStatus(update), Times.Once);
            Assert.IsInstanceOfType(result, typeof(IActionResult));
        }
    }
}
