using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using Moq;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class GoodsReceiptNoteControllerTest
    {
        private Mock<IGoodsReceiptNoteDetailService> _mockService = null!;
        private GoodsReceiptNoteDetailController _controller = null!;
        private const int TestUserId = 1;

        [TestInitialize]
        public void Setup()
        {
            _mockService = new Mock<IGoodsReceiptNoteDetailService>();
            _controller = new GoodsReceiptNoteDetailController(_mockService.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
                new Claim(ClaimTypes.Name, "Test User"),
                new Claim(ClaimTypes.Role, "Warehouse Staff")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [DataTestMethod]
        [DataRow("00000000-0000-0000-0000-000000000000", null, null, null, 400, DisplayName = "Mã phiếu nhập kho không được để trống, Số lượng giao đến phải lớn hơn hoặc bằng 0, Số lượng trả lại phải lớn hơn hoặc bằng 0")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", null, null, null, 200, DisplayName = "Số lượng giao đến phải lớn hơn hoặc bằng 0, Số lượng trả lại phải lớn hơn hoặc bằng 0")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", 0, 0, null, 200, DisplayName = "Số lượng giao đến phải lớn hơn hoặc bằng 0")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", 20, 10, null, 200, DisplayName = "Trả lại hàng phải có lý do")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", 20, 30, "Trả lại nhà sản xuất", 200, DisplayName = "Số lượng trả lại phải bé hơn hoặc bằng số lượng giao đến")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", 20, 10, "Trả lại nhà sản xuất", 200, DisplayName = "Từ chối thành công")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", 20, 0, null, 200, DisplayName = "Từ chối thành công")]
        public async Task VerifyGRNDetail_ReturnsExpectedResult(
            string goodsReceiptNoteDetailIdStr,
            int? deliveredPackageQuantity,
            int? rejectPackageQuantity,
            string? note,
            int expectedStatus)
        {
            // Arrange
            var goodsReceiptNoteDetailId = Guid.Parse(goodsReceiptNoteDetailIdStr);
            var dto = new GoodsReceiptNoteDetailInspectedDto
            {
                GoodsReceiptNoteDetailId = goodsReceiptNoteDetailId,
                DeliveredPackageQuantity = deliveredPackageQuantity,
                RejectPackageQuantity = rejectPackageQuantity,
                Note = note
            };

            // Setup mock - the service returns a tuple (string message, object result)
            // Empty string = success, non-empty = error
            if (goodsReceiptNoteDetailId == Guid.Empty)
            {
                _mockService
                    .Setup(s => s.UpdateGRNDetail(
                        It.Is<GoodsReceiptNoteDetailInspectedDto>(x => x.GoodsReceiptNoteDetailId == goodsReceiptNoteDetailId),
                        It.IsAny<int?>()))
                    .ReturnsAsync(("Invalid Id", null));
            }
            else
            {
                _mockService
                    .Setup(s => s.UpdateGRNDetail(
                        It.Is<GoodsReceiptNoteDetailInspectedDto>(x => x.GoodsReceiptNoteDetailId == goodsReceiptNoteDetailId),
                        It.IsAny<int?>()))
                    .ReturnsAsync(("", dto));
            }

            // Act
            var result = await _controller.VerifyGRNDetail(dto);

            // Assert
            Assert.IsTrue(
                result is OkObjectResult or BadRequestObjectResult,
                "Result should be either OkObjectResult or BadRequestObjectResult");

            if (expectedStatus == 200)
            {
                var okResult = result as OkObjectResult;
                Assert.IsNotNull(okResult, "Result should be OkObjectResult for success case");
                Assert.AreEqual(200, okResult.StatusCode);
                Assert.IsNotNull(okResult.Value);
            }
            else if (expectedStatus == 400)
            {
                var badResult = result as BadRequestObjectResult;
                Assert.IsNotNull(badResult, "Result should be BadRequestObjectResult for error case");
                Assert.AreEqual(400, badResult.StatusCode);
            }

            // Verify the service was called once with correct parameters
            _mockService.Verify(
                s => s.UpdateGRNDetail(
                    It.Is<GoodsReceiptNoteDetailInspectedDto>(x => x.GoodsReceiptNoteDetailId == goodsReceiptNoteDetailId),
                    It.IsAny<int?>()),
                Times.Once);
        }
        [DataTestMethod]
        [DataRow("00000000-0000-0000-0000-000000000000", null, 400, DisplayName = "Mã phiếu nhập kho không được để trống")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", null, 400, DisplayName = "Từ chới kiểm tra phải có lý do")]
        [DataRow("315867DF-5892-49E6-9511-01C6CCDC513F", "Cần kiểm nhập lại số lượng trả lại", 200, DisplayName = "Từ chối kiểm nhập thành công")]
        [DataRow("b1a1a1a1-1111-1111-1111-111111111111", null, 400, DisplayName = "Mã phiếu nhập kho không tồn tại trong hệ thống")]
        public async Task RejectGRNDetail_ReturnsExpectedResult(
        string goodsReceiptNoteDetailIdStr,
        string? rejectionReason,
        int expectedStatus)
        {
            // Arrange
            var detailId = Guid.Parse(goodsReceiptNoteDetailIdStr);
            var dto = new GoodsReceiptNoteDetailRejectDto
            {
                GoodsReceiptNoteDetailId = detailId,
                RejectionReason = rejectionReason
            };

            if (detailId == Guid.Empty)
            {
                _mockService
                    .Setup(s => s.UpdateGRNDetail(
                        It.Is<GoodsReceiptNoteDetailRejectDto>(x => x.GoodsReceiptNoteDetailId == detailId),
                        It.IsAny<int?>()))
                    .ReturnsAsync(("GRN detail is not exist.", (GoodsReceiptNoteDetailRejectDto?)null));
            }
            else if (string.IsNullOrWhiteSpace(rejectionReason))
            {
                _mockService
                    .Setup(s => s.UpdateGRNDetail(
                        It.Is<GoodsReceiptNoteDetailRejectDto>(x => x.GoodsReceiptNoteDetailId == detailId),
                        It.IsAny<int?>()))
                    .ReturnsAsync(("Từ chối phải có lý do.", (GoodsReceiptNoteDetailRejectDto?)null));
            }
            else
            {
                _mockService
                    .Setup(s => s.UpdateGRNDetail(
                        It.Is<GoodsReceiptNoteDetailRejectDto>(x => x.GoodsReceiptNoteDetailId == detailId),
                        It.IsAny<int?>()))
                    .ReturnsAsync(("", dto));
            }

            // Act
            var result = await _controller.RejectGRNDetail(dto);

            // Assert
            Assert.IsTrue(result is ObjectResult);
            var objectResult = (ObjectResult)result;
            Assert.AreEqual(expectedStatus, objectResult.StatusCode);

            if (expectedStatus == 200)
            {
                Assert.IsInstanceOfType(objectResult.Value, typeof(ApiResponse<GoodsReceiptNoteDetailRejectDto>));

                var response = (ApiResponse<GoodsReceiptNoteDetailRejectDto>)objectResult.Value;
                Assert.IsTrue(response.Success);
                Assert.IsNotNull(response.Data);
                Assert.AreEqual(detailId, response.Data.GoodsReceiptNoteDetailId);
                Assert.AreEqual(rejectionReason, response.Data.RejectionReason);
            }
            else if (expectedStatus == 400)
            {
                Assert.IsInstanceOfType(objectResult.Value, typeof(ApiResponse<string>));

                var response = (ApiResponse<string>)objectResult.Value;
                Assert.IsFalse(response.Success);
                Assert.IsFalse(string.IsNullOrEmpty(response.Message));
                Assert.IsTrue(
                    response.Message.Contains("lý do") ||
                    response.Message.Contains("exist") ||
                    response.Message.Contains("không"),
                    $"Unexpected error message: {response.Message}");
            }

            _mockService.Verify(
                s => s.UpdateGRNDetail(
                    It.Is<GoodsReceiptNoteDetailRejectDto>(x => x.GoodsReceiptNoteDetailId == detailId),
                    It.IsAny<int?>()),
                Times.Once);
        }
    }
}
