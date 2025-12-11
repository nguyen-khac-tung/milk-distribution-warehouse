using Castle.Components.DictionaryAdapter.Xml;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class PurchaseOrderControllerTest
    {
        private Mock<IPurchaseOrderService> _mockService = null!;
        private PurchaseOrderController _controller = null!;
        private const int TestUserId = 1;

        [TestInitialize]
        public void Setup()
        {
            _mockService = new Mock<IPurchaseOrderService>();
            _controller = new PurchaseOrderController(_mockService.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
                new Claim(ClaimTypes.Name, "Test User"),
                new Claim(ClaimTypes.Role, "Sales Representative")
            }, "mock"));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [DataTestMethod]
        [DataRow(null, null, null, 400, DisplayName = "Nhà cung cấp không được bỏ trống, Danh sách chi tiết đơn mua hàng trống")]
        [DataRow(1, "note", null, 400, DisplayName = "Danh sách chi tiết đơn mua hàng trống")]
        [DataRow(1, null, null, 400, DisplayName = "Danh sách chi tiết đơn mua hàng trống")]
        [DataRow(1, "note", "invalidGoodsId", 400, DisplayName = "Hàng hoá không được bỏ trống")]
        [DataRow(1, "note", "invalidPackingId", 400, DisplayName = "Số lượng đóng gói hàng hoá không được bỏ trống")]
        [DataRow(1, "note", "invalidPackingQuantity", 400, DisplayName = "Số lượng phải lớn hơn 0")]
        [DataRow(1, "note", "valid", 200, DisplayName = "")]
        [DataRow(999, "note", "valid", 400, DisplayName = "Không tìm thấy nhà cung cấp này")]
        public async Task CreatePurchaseOrder_ReturnsExpectedResult(
            int supplierId,
            string? note,
            string? detailCase,
            int expectedStatus)
        {
            List<PurchaseOrderDetailCreate>? details = null;
            switch (detailCase)
            {
                case null:
                    details = null;
                    break;
                case "invalidGoodsId":
                    details = new List<PurchaseOrderDetailCreate>
                    {
                        new PurchaseOrderDetailCreate { GoodsId = 0, GoodsPackingId = 18, PackageQuantity = 500 }
                    };
                    break;
                case "invalidPackingId":
                    details = new List<PurchaseOrderDetailCreate>
                    {
                        new PurchaseOrderDetailCreate { GoodsId = 1, GoodsPackingId = 0, PackageQuantity = 500 }
                    };
                    break;
                case "invalidPackingQuantity":
                    details = new List<PurchaseOrderDetailCreate>
                    {
                        new PurchaseOrderDetailCreate { GoodsId = 1, GoodsPackingId = 18, PackageQuantity = 0 }
                    };
                    break;
                case "valid":
                    details = new List<PurchaseOrderDetailCreate>
                    {
                        new PurchaseOrderDetailCreate { GoodsId = 1, GoodsPackingId = 18, PackageQuantity = 500 }
                    };
                    break;
            }

            var createDto = new PurchaseOrderCreate
            {
                SupplierId = supplierId,
                Note = note,
                PurchaseOrderDetailCreate = details
            };

            // Mock service behavior
            if (supplierId == 1 && detailCase == "valid")
            {
                var response = new PurchaseOrderCreateResponse { PurchaseOderId = Guid.NewGuid().ToString() };
                _mockService
                    .Setup(s => s.CreatePurchaseOrder(It.IsAny<PurchaseOrderCreate>(), It.IsAny<int?>(), It.IsAny<string?>()))
                    .ReturnsAsync(("", response));
            }
            else if (supplierId == 999)
            {
                _mockService
                    .Setup(s => s.CreatePurchaseOrder(It.IsAny<PurchaseOrderCreate>(), It.IsAny<int?>(), It.IsAny<string?>()))
                    .ReturnsAsync(("Supplier not found", null));
            }
            else
            {
                _mockService
                    .Setup(s => s.CreatePurchaseOrder(It.IsAny<PurchaseOrderCreate>(), It.IsAny<int?>(), It.IsAny<string?>()))
                    .ReturnsAsync(("Invalid input", null));
            }

            var result = await _controller.CreatePurchaseOrder(createDto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var objectResult = (ObjectResult)result;
            Assert.AreEqual(expectedStatus, objectResult.StatusCode);
        }

        [DataTestMethod]
        [DataRow(null, null, null, 400, DisplayName = "Mã đơn mua hàng không được bỏ trống.,Danh sách chi tiết đơn mua hàng trống")]
        [DataRow("99999", null, "valid", 400, DisplayName = "Không tìm thấy đơn hàng có mã đơn hàng này")]
        [DataRow("VINAMILK_PO_1762610356300", "Hang de vo", null, 400, DisplayName = "Danh sách chi tiết đơn mua hàng trống")]
        [DataRow("VINAMILK_PO_1762610356300", null, "invalidDetailId", 400, DisplayName = "Mã đơn mua hàng chi tiết không hợp lệ")]
        [DataRow("VINAMILK_PO_1762610356300", null, "invalidGoodsId", 400, DisplayName = "Hàng hoá không được bỏ trống")]
        [DataRow("VINAMILK_PO_1762610356300", null, "invalidPackingId", 400, DisplayName = "Số lượng đóng gói hàng hoá không được bỏ trống")]
        [DataRow("VINAMILK_PO_1762610356300", null, "invalidPackingQuantity", 400, DisplayName = "Số lượng phải lớn hơn 0")]
        [DataRow("VINAMILK_PO_1762610356300", null, "valid", 200, DisplayName = "")]
        public async Task UpdatePurchaseOrder_ReturnsExpectedResult(
            string purchaseOrderId,
            string? note,
            string? detailCase,
            int expectedStatus)
        {
            List<PurchaseOrderDetailUpdate>? details = null;
            switch (detailCase)
            {
                case null:
                    details = null;
                    break;
                case "invalidDetailId":
                    details = new List<PurchaseOrderDetailUpdate>
                    {
                        new PurchaseOrderDetailUpdate { PurchaseOrderDetailId = 0, GoodsId = 1, GoodsPackingId = 18, PackageQuantity = 500 }
                    };
                    break;
                case "invalidGoodsId":
                    details = new List<PurchaseOrderDetailUpdate>
                    {
                        new PurchaseOrderDetailUpdate { PurchaseOrderDetailId = 1, GoodsId = 0, GoodsPackingId = 18, PackageQuantity = 500 }
                    };
                    break;
                case "invalidPackingId":
                    details = new List<PurchaseOrderDetailUpdate>
                    {
                        new PurchaseOrderDetailUpdate { PurchaseOrderDetailId = 1, GoodsId = 1, GoodsPackingId = 0, PackageQuantity = 500 }
                    };
                    break;
                case "invalidPackingQuantity":
                    details = new List<PurchaseOrderDetailUpdate>
                    {
                        new PurchaseOrderDetailUpdate { PurchaseOrderDetailId = 1, GoodsId = 1, GoodsPackingId = 18, PackageQuantity = 0 }
                    };
                    break;
                case "valid":
                    details = new List<PurchaseOrderDetailUpdate>
                    {
                        new PurchaseOrderDetailUpdate { PurchaseOrderDetailId = 1, GoodsId = 1, GoodsPackingId = 18, PackageQuantity = 500 }
                    };
                    break;
            }

            var updateDto = new PurchaseOrderUpdate
            {
                PurchaseOderId = purchaseOrderId,
                Note = note,
                PurchaseOrderDetailUpdates = details ?? new List<PurchaseOrderDetailUpdate>()
            };

            // Mock service behavior
            if (purchaseOrderId == "VINAMILK_PO_1762610356300" && detailCase == "valid")
            {
                _mockService
                    .Setup(s => s.UpdatePurchaseOrder(It.IsAny<PurchaseOrderUpdate>(), It.IsAny<int?>()))
                    .ReturnsAsync(("", updateDto));
            }
            else if (purchaseOrderId == "99999")
            {
                _mockService
                    .Setup(s => s.UpdatePurchaseOrder(It.IsAny<PurchaseOrderUpdate>(), It.IsAny<int?>()))
                    .ReturnsAsync(("Purchase order not found", null));
            }
            else
            {
                _mockService
                    .Setup(s => s.UpdatePurchaseOrder(It.IsAny<PurchaseOrderUpdate>(), It.IsAny<int?>()))
                    .ReturnsAsync(("Invalid input", null));
            }

            var result = await _controller.UpdatePurchaseOrder(updateDto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var objectResult = (ObjectResult)result;
            Assert.AreEqual(expectedStatus, objectResult.StatusCode);
        }

        [DataTestMethod]
        [DataRow(null, "PurchaseOrderId is invalid.", 400, DisplayName = "Null purchaseOrderId")]
        [DataRow("VINAMILK_PO_1762610356320", "PurchaseOrderId is invalid.", 400, DisplayName = "Empty purchaseOrderId")]
        [DataRow("NOT_EXIST", "PurchaseOrder is not exist.", 400, DisplayName = "Nonexistent purchaseOrderId")]
        [DataRow("NO_PERMISSION", "No PO delete permission.", 400, DisplayName = "No permission to delete")]
        [DataRow("NOT_DRAFT", "Chỉ được xoá khi đơn hàng ở trạng thái Nháp.", 400, DisplayName = "Not in deletable status")]
        [DataRow("SUCCESS", "", 200, DisplayName = "Delete success")]
        public async Task DeletePurchaseOrder_ReturnsExpectedResult(string purchaseOrderId, string expectedMsg, int expectedStatus)
        {
            // Arrange
            PurchaseOrder? returnedOrder = null;

            if (expectedStatus == 200)
            {
                int status = purchaseOrderId == "SUCCESS_DRAFT" ? 1 : 3; // 1 = Draft, 3 = Rejected
                returnedOrder = new PurchaseOrder
                {
                    PurchaseOderId = purchaseOrderId,
                    CreatedBy = TestUserId,
                    Status = status
                };
            }

            _mockService
                .Setup(s => s.DeletePurchaseOrder(purchaseOrderId, It.IsAny<int?>()))
                .ReturnsAsync((expectedMsg, returnedOrder));

            // Act
            var result = await _controller.DeletePurchaseOrder(purchaseOrderId);

            // Assert
            Assert.IsInstanceOfType(result, typeof(ObjectResult));

            var objectResult = (ObjectResult)result;
            Assert.AreEqual(expectedStatus, objectResult.StatusCode);

            if (expectedStatus == 200)
            {
                Assert.IsInstanceOfType(objectResult.Value, typeof(ApiResponse<PurchaseOrder>));
                var apiResponse = (ApiResponse<PurchaseOrder>)objectResult.Value!;
                Assert.IsNotNull(apiResponse.Data);
                var po = apiResponse.Data!;
                Assert.AreEqual(purchaseOrderId, po.PurchaseOderId);
            }
            else
            {
                Assert.IsInstanceOfType(objectResult.Value, typeof(ApiResponse<string>));
                var apiResponse = (ApiResponse<string>)objectResult.Value!;
                Assert.AreEqual(expectedMsg, apiResponse.Message);
            }
        }

    }
}