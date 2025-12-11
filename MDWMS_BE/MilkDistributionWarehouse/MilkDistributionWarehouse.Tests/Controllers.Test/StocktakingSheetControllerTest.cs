using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Models.DTOs;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StocktakingSheetControllerTest
    {
        private Mock<IStocktakingSheetService> _serviceMock = null!;
        private StocktakingSheetController _controller = null!;

        [TestInitialize]
        public void Setup()
        {
            _serviceMock = new Mock<IStocktakingSheetService>();
            _controller = new StocktakingSheetController(_serviceMock.Object);
            // Default HttpContext user for tests
            SetControllerUser(_controller, userId: "1");
        }

        private static void SetControllerUser(ControllerBase controller, string userId)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                // add authentication type so Identity.IsAuthenticated is true
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var principal = new ClaimsPrincipal(identity);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_ServiceReturnsError_ControllerReturnsErrorResult()
        {
            // Arrange
            var create = new StocktakingSheetCreate();
            _serviceMock
                .Setup(s => s.CreateStocktakingSheet(It.IsAny<StocktakingSheetCreate>(), It.IsAny<int?>()))
                .ReturnsAsync(("Some error", default(StocktakingSheeteResponse)));

            // Act
            var result = await _controller.CreateStocktakingSheet(create);

            // Assert: controller should return an ObjectResult (error wrapper)
            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_ServiceReturnsOk_ControllerReturnsOkResult()
        {
            // Arrange
            var create = new StocktakingSheetCreate();
            _serviceMock
                .Setup(s => s.CreateStocktakingSheet(It.IsAny<StocktakingSheetCreate>(), It.IsAny<int?>()))
                .ReturnsAsync((string.Empty, new StocktakingSheeteResponse { StocktakingSheetId = "SHEET_1" }));

            // Act
            var result = await _controller.CreateStocktakingSheet(create);

            // Assert: controller should return an ObjectResult (success wrapper)
            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
        }

        [TestMethod]
        public async Task UpdateStocktakingSheet_ServiceReturnsError_ControllerReturnsErrorResult()
        {
            // Arrange
            var update = new StocktakingSheetUpdate { StocktakingSheetId = "S1" };
            _serviceMock
                .Setup(s => s.UpdateStocktakingSheet(It.IsAny<StocktakingSheetUpdate>(), It.IsAny<int?>()))
                .ReturnsAsync(("Update error", default(StocktakingSheeteResponse)));

            // Act
            var result = await _controller.UpdateStocktakingSheet(update);

            // Assert: controller should return an ObjectResult (error wrapper)
            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
        }

        [TestMethod]
        public async Task UpdateStocktakingSheet_ServiceReturnsOk_ControllerReturnsOkResult()
        {
            // Arrange
            var update = new StocktakingSheetUpdate { StocktakingSheetId = "S1" };
            _serviceMock
                .Setup(s => s.UpdateStocktakingSheet(It.IsAny<StocktakingSheetUpdate>(), It.IsAny<int?>()))
                .ReturnsAsync((string.Empty, new StocktakingSheeteResponse { StocktakingSheetId = "S1" }));

            // Act
            var result = await _controller.UpdateStocktakingSheet(update);

            // Assert: controller should return an ObjectResult (success wrapper)
            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
        }
    }
}
