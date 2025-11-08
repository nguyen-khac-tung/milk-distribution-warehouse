using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;

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

        [TestMethod]
        public async Task GetPurchaseOrderByPurchaseOrderId_ReturnsOk_WhenServiceReturnsDetail()
        {
            var id = Guid.NewGuid();
            _mockService
                .Setup(s => s.GetPurchaseOrderDetailById(id, It.IsAny<int?>(), It.IsAny<List<string>?>()))
                .ReturnsAsync(("", new PurchaseOrdersDetail()));

            var result = await _controller.GetPurchaseOrderByPurchaseOrderId(id);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var obj = (ObjectResult)result;
            Assert.AreEqual(200, obj.StatusCode);
            Assert.IsNotNull(obj.Value);
        }

        [TestMethod]
        public async Task GetPurchaseOrderByPurchaseOrderId_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var id = Guid.NewGuid();
            _mockService
                .Setup(s => s.GetPurchaseOrderDetailById(id, It.IsAny<int?>(), It.IsAny<List<string>?>()))
                .ReturnsAsync(("error message", null));

            var result = await _controller.GetPurchaseOrderByPurchaseOrderId(id);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var obj = (ObjectResult)result;
            Assert.AreEqual(400, obj.StatusCode);
        }

        [TestMethod]
        public async Task GetPurchaseOrderSaleRepresentatives_CallsService_WithPagedRequest()
        {
            var req = new PagedRequest { PageNumber = 1, PageSize = 10 };
            var page = new PageResult<PurchaseOrderDtoSaleRepresentative>
            {
                Items = new List<PurchaseOrderDtoSaleRepresentative> { new() { PurchaseOderId = Guid.NewGuid(), SupplierId = 5, Status = 1, CreatedBy = TestUserId } },
                TotalCount = 1,
                PageNumber = 1,
                PageSize = 10
            };

            _mockService
                .Setup(s => s.GetPurchaseOrderSaleRepresentatives(req, It.IsAny<int?>()))
                .ReturnsAsync(("", page));

            var result = await _controller.GetPurchaseOrderSaleRepresentatives(req);

            _mockService.Verify(s => s.GetPurchaseOrderSaleRepresentatives(req, It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task CreatePurchaseOrder_ReturnsOk_AndPassesDtoToService()
        {
            var create = new PurchaseOrderCreate
            {
                SupplierId = 123,
                Note = "note",
                PurchaseOrderDetailCreate = new List<PurchaseOrderDetailCreate>
                {
                    new PurchaseOrderDetailCreate { GoodsId = 1, GoodsPackingId = 1, PackageQuantity = 10 }
                }
            };

            // IPurchaseOrderService.CreatePurchaseOrder returns Task<(string, PurchaseOrderCreateResponse?)>
            var response = new PurchaseOrderCreateResponse { PurchaseOderId = Guid.NewGuid() };

            _mockService
                .Setup(s => s.CreatePurchaseOrder(It.Is<PurchaseOrderCreate>(c => c.SupplierId == 123 && c.PurchaseOrderDetailCreate.Count == 1), It.IsAny<int?>(), It.IsAny<string?>()))
                .ReturnsAsync(("", response));

            var result = await _controller.CreatePurchaseOrder(create);

            _mockService.Verify(s => s.CreatePurchaseOrder(It.IsAny<PurchaseOrderCreate>(), It.IsAny<int?>(), It.IsAny<string?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task UpdatePurchaseOrder_ReturnsOk_WhenServiceSucceeds()
        {
            var update = new PurchaseOrderUpdate
            {
                PurchaseOderId = Guid.NewGuid(),
                Note = "updated",
                PurchaseOrderDetailUpdates = new List<PurchaseOrderDetailUpdate>()
            };

            _mockService
                .Setup(s => s.UpdatePurchaseOrder(update, It.IsAny<int?>()))
                .ReturnsAsync(("", update));

            var result = await _controller.UpdatePurchaseOrder(update);

            _mockService.Verify(s => s.UpdatePurchaseOrder(update, It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task SubmitPurchaseOrder_CallsUpdateStatus_WithPendingApprovalDto()
        {
            var id = Guid.NewGuid();
            var dto = new PurchaseOrderPendingApprovalDto { PurchaseOrderId = id };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _controller.SubmitPurchaseOrder(dto);

            _mockService.Verify(s => s.UpdateStatusPurchaseOrder(It.Is<PurchaseOrderPendingApprovalDto>(d => d.PurchaseOrderId == id), It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task ApprovalPurchaseOrder_CallsUpdateStatus_WithApprovalDto()
        {
            var id = Guid.NewGuid();
            var dto = new PurchaseOrderApprovalDto { PurchaseOrderId = id };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _controller.ApprovalPurchaseOrder(dto);

            _mockService.Verify(s => s.UpdateStatusPurchaseOrder(It.Is<PurchaseOrderApprovalDto>(d => d.PurchaseOrderId == id), It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task RejectedPurchaseOrder_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new PurchaseOrderRejectDto { PurchaseOrderId = Guid.NewGuid(), RejectionReason = "no reason" };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("reject error", null));

            var result = await _controller.RejectedPurchaseOrder(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task OrderedPurchaseOrder_PassesEstimatedTimeArrival_ToService()
        {
            var id = Guid.NewGuid();
            var dto = new PurchaseOrderOrderedDto
            {
                PurchaseOrderId = id,
                EstimatedTimeArrival = DateTime.Now.AddDays(5)
            };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(It.Is<PurchaseOrderOrderedDto>(d => d.EstimatedTimeArrival.Date == dto.EstimatedTimeArrival.Date && d.PurchaseOrderId == id), It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _controller.OrderedPurchaseOrder(dto);

            _mockService.Verify(s => s.UpdateStatusPurchaseOrder(It.IsAny<PurchaseOrderOrderedDto>(), It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task GoodsReceivedPurchaseOrder_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new PurchaseOrderGoodsReceivedDto { PurchaseOrderId = Guid.NewGuid() };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _controller.GoodsReceivedPurchaseOrder(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task AssignForReceivingPurchaseOrder_VerifyServiceCalled()
        {
            var dto = new PurchaseOrderAssignedForReceivingDto { PurchaseOrderId = Guid.NewGuid(), AssignTo = 10 };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _controller.AssignForReceivingPurchaseOrder(dto);

            _mockService.Verify(s => s.UpdateStatusPurchaseOrder(It.Is<PurchaseOrderAssignedForReceivingDto>(d => d.AssignTo == 10), It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task StartReceivingPurchaseOrder_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new PurchaseOrderReceivingDto { PurchaseOrderId = Guid.NewGuid() };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("grn error", null));

            var result = await _controller.StartReceivingPurchaseOrder(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task CompletePurchaseOrder_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new PurchaseOrderCompletedDto { PurchaseOrderId = Guid.NewGuid() };

            _mockService
                .Setup(s => s.UpdateStatusPurchaseOrder(dto, It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _controller.CompletePurchaseOrder(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task DeletePurchaseOrder_ReturnsOk_WhenServiceDeletes()
        {
            var id = Guid.NewGuid();

            _mockService
                .Setup(s => s.DeletePurchaseOrder(id, It.IsAny<int?>()))
                .ReturnsAsync(("", new PurchaseOrder()));

            var result = await _controller.DeletePurchaseOrder(id);

            _mockService.Verify(s => s.DeletePurchaseOrder(id, It.IsAny<int?>()), Times.Once);
            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
        }

        [TestMethod]
        public async Task DeletePurchaseOrder_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var id = Guid.NewGuid();

            _mockService
                .Setup(s => s.DeletePurchaseOrder(id, It.IsAny<int?>()))
                .ReturnsAsync(("delete failed", null));

            var result = await _controller.DeletePurchaseOrder(id);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
        }
    }
}