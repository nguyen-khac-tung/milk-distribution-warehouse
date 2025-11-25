using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Controllers;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using static MilkDistributionWarehouse.Models.DTOs.GoodsReceiptNoteDetailDto;

namespace MilkDistributionWarehouse.Tests.Controllers
{
    [TestClass]
    public class GoodsReceiptNoteControllerTest
    {
        private Mock<IGoodsReceiptNoteService> _mockGrnService = null!;
        private Mock<IGoodsReceiptNoteDetailService> _mockGrndService = null!;
        private GoodsReceiptNoteController _grnController = null!;
        private GoodsReceiptNoteDetailController _grndController = null!;
        private const int TestUserId = 42;

        [TestInitialize]
        public void Setup()
        {
            _mockGrnService = new Mock<IGoodsReceiptNoteService>();
            _mockGrndService = new Mock<IGoodsReceiptNoteDetailService>();

            _grnController = new GoodsReceiptNoteController(_mockGrnService.Object);
            _grndController = new GoodsReceiptNoteDetailController(_mockGrndService.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, TestUserId.ToString()),
                new Claim(ClaimTypes.Name, "Test User"),
                // include both roles for different endpoints — controller methods do not enforce roles at test runtime
                new Claim(ClaimTypes.Role, "Warehouse Staff"),
                new Claim(ClaimTypes.Role, "Warehouse Manager")
            }, "mock"));

            var ctx = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            _grnController.ControllerContext = ctx;
            _grndController.ControllerContext = ctx;
        }

        #region GoodsReceiptNoteController tests

        [TestMethod]
        public async Task GetGRNByPurchaseOrderId_ReturnsOk_WhenServiceSucceeds()
        {
            var poId = Guid.NewGuid();
            var dto = new GoodsReceiptNoteDto { GoodsReceiptNoteId = Guid.NewGuid() };
            _mockGrnService.Setup(s => s.GetGRNByPurchaseOrderId(poId)).ReturnsAsync(("", dto));

            var result = await _grnController.GetGRNByPurchaseOrderId(poId);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            var obj = (ObjectResult)result;
            Assert.AreEqual(200, obj.StatusCode);
            Assert.IsNotNull(obj.Value);
            _mockGrnService.Verify(s => s.GetGRNByPurchaseOrderId(poId), Times.Once);
        }

        [TestMethod]
        public async Task GetGRNByPurchaseOrderId_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var poId = Guid.NewGuid();
            _mockGrnService.Setup(s => s.GetGRNByPurchaseOrderId(poId)).ReturnsAsync(("not found", null));

            var result = await _grnController.GetGRNByPurchaseOrderId(poId);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrnService.Verify(s => s.GetGRNByPurchaseOrderId(poId), Times.Once);
        }

        [TestMethod]
        public async Task SubmitGoodsReceiptNote_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = Guid.NewGuid() };
            _mockGrnService
                .Setup(s => s.UpdateGRNStatus(It.Is<GoodsReceiptNoteSubmitDto>(d => d.GoodsReceiptNoteId == dto.GoodsReceiptNoteId), It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _grnController.SubmitGoodsReceiptNote(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrnService.Verify(s => s.UpdateGRNStatus(It.IsAny<GoodsReceiptNoteSubmitDto>(), It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task SubmitGoodsReceiptNote_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = Guid.NewGuid() };
            _mockGrnService
                .Setup(s => s.UpdateGRNStatus(dto, It.IsAny<int?>()))
                .ReturnsAsync(("error", null));

            var result = await _grnController.SubmitGoodsReceiptNote(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrnService.Verify(s => s.UpdateGRNStatus(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task ApprovalGoodsReceiptNote_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new GoodsReceiptNoteCompletedDto { GoodsReceiptNoteId = Guid.NewGuid() };
            _mockGrnService
                .Setup(s => s.UpdateGRNStatus(It.Is<GoodsReceiptNoteCompletedDto>(d => d.GoodsReceiptNoteId == dto.GoodsReceiptNoteId), It.IsAny<int?>()))
                .ReturnsAsync(("", dto));

            var result = await _grnController.ApprovalGoodsReceiptNote(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrnService.Verify(s => s.UpdateGRNStatus(It.IsAny<GoodsReceiptNoteCompletedDto>(), It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task ApprovalGoodsReceiptNote_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new GoodsReceiptNoteCompletedDto { GoodsReceiptNoteId = Guid.NewGuid() };
            _mockGrnService
                .Setup(s => s.UpdateGRNStatus(dto, It.IsAny<int?>()))
                .ReturnsAsync(("error", null));

            var result = await _grnController.ApprovalGoodsReceiptNote(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrnService.Verify(s => s.UpdateGRNStatus(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        #endregion

        #region GoodsReceiptNoteDetailController tests

        [TestMethod]
        public async Task GetGRNDPallet_ReturnsOk_WhenServiceSucceeds()
        {
            var grnId = Guid.NewGuid();
            var list = new List<GoodsReceiptNoteDetailPalletDto> { new() };
            _mockGrndService.Setup(s => s.GetListGRNDByGRNId(grnId)).ReturnsAsync(("", list));

            var result = await _grndController.GetGRNDPallet(grnId);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.GetListGRNDByGRNId(grnId), Times.Once);
        }

        [TestMethod]
        public async Task GetGRNDPallet_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var grnId = Guid.NewGuid();
            _mockGrndService.Setup(s => s.GetListGRNDByGRNId(grnId)).ReturnsAsync(("error", null));

            var result = await _grndController.GetGRNDPallet(grnId);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.GetListGRNDByGRNId(grnId), Times.Once);
        }

        [TestMethod]
        public async Task VerifyGRNDetail_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new GoodsReceiptNoteDetailInspectedDto { GoodsReceiptNoteDetailId = Guid.NewGuid() };
            _mockGrndService.Setup(s => s.UpdateGRNDetail(dto, It.IsAny<int?>())).ReturnsAsync(("", dto));

            var result = await _grndController.VerifyGRNDetail(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNDetail(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task VerifyGRNDetail_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new GoodsReceiptNoteDetailInspectedDto { GoodsReceiptNoteDetailId = Guid.NewGuid() };
            _mockGrndService.Setup(s => s.UpdateGRNDetail(dto, It.IsAny<int?>())).ReturnsAsync(("error", null));

            var result = await _grndController.VerifyGRNDetail(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNDetail(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task CancelGRNDetail_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new GoodsReceiptNoteDetailCancelDto { GoodsReceiptNoteDetailId = Guid.NewGuid() };
            _mockGrndService.Setup(s => s.UpdateGRNDetail(dto, It.IsAny<int?>())).ReturnsAsync(("", dto));

            var result = await _grndController.CancelGRNDetail(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNDetail(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task CancelGRNDetail_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new GoodsReceiptNoteDetailCancelDto { GoodsReceiptNoteDetailId = Guid.NewGuid() };
            _mockGrndService.Setup(s => s.UpdateGRNDetail(dto, It.IsAny<int?>())).ReturnsAsync(("error", null));

            var result = await _grndController.CancelGRNDetail(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNDetail(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task RejectGRNDetail_ReturnsOk_WhenServiceSucceeds()
        {
            var dto = new GoodsReceiptNoteDetailRejectDto { GoodsReceiptNoteDetailId = Guid.NewGuid() };
            _mockGrndService.Setup(s => s.UpdateGRNDetail(dto, It.IsAny<int?>())).ReturnsAsync(("", dto));

            var result = await _grndController.RejectGRNDetail(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNDetail(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task RejectGRNDetail_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var dto = new GoodsReceiptNoteDetailRejectDto { GoodsReceiptNoteDetailId = Guid.NewGuid() };
            _mockGrndService.Setup(s => s.UpdateGRNDetail(dto, It.IsAny<int?>())).ReturnsAsync(("error", null));

            var result = await _grndController.RejectGRNDetail(dto);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNDetail(dto, It.Is<int?>(id => id == TestUserId)), Times.Once);
        }

        [TestMethod]
        public async Task RejectListGRNDetail_ReturnsOk_WhenServiceSucceeds()
        {
            var list = new List<GoodsReceiptNoteDetailRejectDto> { new() { GoodsReceiptNoteDetailId = Guid.NewGuid() } };
            _mockGrndService.Setup(s => s.UpdateGRNReject(list)).ReturnsAsync(("", list));

            var result = await _grndController.RejectListGRNDetail(list);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(200, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNReject(list), Times.Once);
        }

        [TestMethod]
        public async Task RejectListGRNDetail_ReturnsBadRequest_WhenServiceReturnsMessage()
        {
            var list = new List<GoodsReceiptNoteDetailRejectDto> { new() { GoodsReceiptNoteDetailId = Guid.NewGuid() } };
            _mockGrndService.Setup(s => s.UpdateGRNReject(list)).ReturnsAsync(("error", null));

            var result = await _grndController.RejectListGRNDetail(list);

            Assert.IsInstanceOfType(result, typeof(ObjectResult));
            Assert.AreEqual(400, ((ObjectResult)result).StatusCode);
            _mockGrndService.Verify(s => s.UpdateGRNReject(list), Times.Once);
        }

        #endregion
    }
}