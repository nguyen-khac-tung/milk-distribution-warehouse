using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore.Query;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests.Services
{
    [TestClass]
    public class PurchaseOrderServiceTest
    {
        private Mock<IPurchaseOrderRepositoy> _mockPoRepo = null!;
        private Mock<IPurchaseOrderDetailService> _mockPoDetailService = null!;
        private Mock<IPurchaseOrderDetailRepository> _mockPoDetailRepo = null!;
        private Mock<IUnitOfWork> _mockUnitOfWork = null!;
        private Mock<IMapper> _mockMapper = null!;
        private Mock<IGoodsReceiptNoteService> _mockGrnService = null!;
        private Mock<IUserRepository> _mockUserRepo = null!;
        private Mock<IPalletRepository> _mockPalletRepo = null!;
        private Mock<ISalesOrderRepository> _mockSaleOrderRepo = null!;

        [TestInitialize]
        public void Setup()
        {
            _mockPoRepo = new Mock<IPurchaseOrderRepositoy>();
            _mockPoDetailService = new Mock<IPurchaseOrderDetailService>();
            _mockPoDetailRepo = new Mock<IPurchaseOrderDetailRepository>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            _mockGrnService = new Mock<IGoodsReceiptNoteService>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockPalletRepo = new Mock<IPalletRepository>();
            _mockSaleOrderRepo = new Mock<ISalesOrderRepository>();

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.CommitTransactionAsync()).Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.RollbackTransactionAsync()).Returns(Task.CompletedTask);
        }

        private PurchaseOrderService CreateService()
        {
            return new PurchaseOrderService(
                _mockPoRepo.Object,
                _mockMapper.Object,
                _mockPoDetailService.Object,
                _mockPoDetailRepo.Object,
                _mockUnitOfWork.Object,
                _mockGrnService.Object,
                _mockUserRepo.Object,
                _mockPalletRepo.Object,
                _mockSaleOrderRepo.Object
            );
        }

        #region CreatePurchaseOrder tests

        [TestMethod]
        public async Task CreatePurchaseOrder_ReturnsError_WhenCreateIsNull()
        {
            var svc = CreateService();

            var (msg, result) = await svc.CreatePurchaseOrder(null!, 1, "user");

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(), Times.Never);
        }

        [TestMethod]
        public async Task CreatePurchaseOrder_ReturnsError_WhenRepoCreateFails()
        {
            var svc = CreateService();
            var createDto = new PurchaseOrderCreate { SupplierId = 1, PurchaseOrderDetailCreate = new List<PurchaseOrderDetailCreate>() };

            var mappedPo = new PurchaseOrder { PurchaseOderId = Guid.NewGuid() };
            _mockMapper.Setup(m => m.Map<PurchaseOrder>(createDto)).Returns(mappedPo);
            _mockPoRepo.Setup(r => r.CreatePurchaseOrder(It.IsAny<PurchaseOrder>())).ReturnsAsync((PurchaseOrder?)null);

            var (msg, result) = await svc.CreatePurchaseOrder(createDto, 1, "user");

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task CreatePurchaseOrder_ReturnsError_WhenPODetailCreateFails()
        {
            var svc = CreateService();
            var createDto = new PurchaseOrderCreate
            {
                SupplierId = 2,
                PurchaseOrderDetailCreate = new List<PurchaseOrderDetailCreate> { new() { GoodsId = 1, GoodsPackingId = 1, PackageQuantity = 1 } }
            };

            var mappedPo = new PurchaseOrder { PurchaseOderId = Guid.NewGuid() };
            _mockMapper.Setup(m => m.Map<PurchaseOrder>(createDto)).Returns(mappedPo);
            _mockPoRepo.Setup(r => r.CreatePurchaseOrder(It.IsAny<PurchaseOrder>())).ReturnsAsync(mappedPo);
            _mockMapper.Setup(m => m.Map<List<PurchaseOderDetail>>(createDto.PurchaseOrderDetailCreate))
                       .Returns(new List<PurchaseOderDetail> { new PurchaseOderDetail() });
            _mockPoDetailRepo.Setup(r => r.CreatePODetailBulk(It.IsAny<List<PurchaseOderDetail>>())).ReturnsAsync(0);

            var (msg, result) = await svc.CreatePurchaseOrder(createDto, 5, "tester");

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task CreatePurchaseOrder_ReturnsOk_WhenAllSucceeds()
        {
            var svc = CreateService();
            var createDto = new PurchaseOrderCreate
            {
                SupplierId = 2,
                Note = "n",
                PurchaseOrderDetailCreate = new List<PurchaseOrderDetailCreate> { new() { GoodsId = 1, GoodsPackingId = 1, PackageQuantity = 1 } }
            };

            var newId = Guid.NewGuid();
            var mappedPo = new PurchaseOrder { PurchaseOderId = newId };
            _mockMapper.Setup(m => m.Map<PurchaseOrder>(createDto)).Returns(mappedPo);
            _mockPoRepo.Setup(r => r.CreatePurchaseOrder(It.IsAny<PurchaseOrder>())).ReturnsAsync(mappedPo);
            _mockMapper.Setup(m => m.Map<List<PurchaseOderDetail>>(createDto.PurchaseOrderDetailCreate))
                       .Returns(new List<PurchaseOderDetail> { new() });
            _mockPoDetailRepo.Setup(r => r.CreatePODetailBulk(It.IsAny<List<PurchaseOderDetail>>())).ReturnsAsync(1);
            _mockPoRepo.Setup(r => r.UpdatePurchaseOrder(It.IsAny<PurchaseOrder>())).ReturnsAsync(mappedPo);

            var (msg, result) = await svc.CreatePurchaseOrder(createDto, 10, "u");

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(mappedPo.PurchaseOderId, result!.PurchaseOderId);
            _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }

        #endregion

        #region UpdateStatus tests (various branches)

        [TestMethod]
        public async Task UpdateStatus_ReturnsError_WhenPurchaseOrderNotFound()
        {
            var svc = CreateService();
            var dto = new PurchaseOrderPendingApprovalDto { PurchaseOrderId = Guid.NewGuid() };

            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(dto.PurchaseOrderId)).ReturnsAsync((PurchaseOrder?)null);

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateStatus_PendingApproval_ReturnsError_WhenCreatedByMismatch()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Draft, CreatedBy = 99 };

            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderPendingApprovalDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateStatus_PendingApproval_ReturnsError_WhenCheckPendingFails()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder
            {
                PurchaseOderId = id,
                Status = PurchaseOrderStatus.Draft,
                CreatedBy = 1,
                SupplierId = 10,
                PurchaseOderDetails = new List<PurchaseOderDetail>()
            };

            var otherPo = new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), SupplierId = 10, Status = PurchaseOrderStatus.PendingApproval, CreatedBy = 1 };

            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);
            _mockPoRepo.Setup(r => r.GetPurchaseOrder()).Returns(new TestAsyncEnumerable<PurchaseOrder>(new[] { otherPo }));

            var dto = new PurchaseOrderPendingApprovalDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateStatus_Reject_Succeeds()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.PendingApproval };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderRejectDto { PurchaseOrderId = id, RejectionReason = "bad" };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 2);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.Rejected, po.Status);
            Assert.AreEqual(2, po.ApprovalBy);
        }

        [TestMethod]
        public async Task UpdateStatus_Approve_Succeeds()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.PendingApproval };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderApprovalDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 3);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.Approved, po.Status);
            Assert.AreEqual(3, po.ApprovalBy);
        }

        [TestMethod]
        public async Task UpdateStatus_Ordered_InvalidDate_ReturnsError()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Approved };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderOrderedDto { PurchaseOrderId = id, EstimatedTimeArrival = DateTime.Now.AddDays(-1) };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateStatus_Ordered_Succeeds()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Approved };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderOrderedDto { PurchaseOrderId = id, EstimatedTimeArrival = DateTime.Now.AddDays(3) };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.Ordered, po.Status);
        }

        [TestMethod]
        public async Task UpdateStatus_GoodsReceived_Succeeds_WhenETAAbsentOrPast()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Ordered, EstimatedTimeArrival = null };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderGoodsReceivedDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 11);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.GoodsReceived, po.Status);
            Assert.AreEqual(11, po.ArrivalConfirmedBy);
        }

        [TestMethod]
        public async Task UpdateStatus_AssignedForReceiving_Succeeds()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.GoodsReceived };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderAssignedForReceivingDto { PurchaseOrderId = id, AssignTo = 20 };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 5);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.AwaitingArrival, po.Status);
            Assert.AreEqual(20, po.AssignTo);
        }

        [TestMethod]
        public async Task UpdateStatus_ReAssignForReceiving_ReturnsError_WhenSameAssignTo()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.AssignedForReceiving, AssignTo = 30 };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);

            var dto = new PurchaseOrderReAssignForReceivingDto { PurchaseOrderId = id, ReAssignTo = 30 };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateStatus_Receiving_ReturnsError_WhenCreateGRNFails()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.AssignedForReceiving };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);
            _mockGrnService.Setup(g => g.CreateGoodsReceiptNote(It.IsAny<GoodsReceiptNoteCreate>(), It.IsAny<int?>()))
                           .ReturnsAsync(("grn error", (GoodsReceiptNoteDto?)null));

            var dto = new PurchaseOrderReceivingDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateStatus_Receiving_Succeeds_WhenCreateGRNSucceeds()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.AssignedForReceiving };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);
            _mockGrnService.Setup(g => g.CreateGoodsReceiptNote(It.IsAny<GoodsReceiptNoteCreate>(), It.IsAny<int?>()))
                           .ReturnsAsync(("", new GoodsReceiptNoteDto { PurchaseOderId = id }));
            _mockPoRepo.Setup(r => r.UpdatePurchaseOrder(It.IsAny<PurchaseOrder>())).ReturnsAsync(po);

            var dto = new PurchaseOrderReceivingDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.Receiving, po.Status);
        }

        [TestMethod]
        public async Task UpdateStatus_Complete_Succeeds_WhenGrnCompletedAndPalletsOk()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();

            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), Status = GoodsReceiptNoteStatus.Completed, PurchaseOderId = id };
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Inspected, GoodsReceiptNotes = new List<GoodsReceiptNote> { grn } };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);
            _mockPalletRepo.Setup(p => p.IsAnyDiffActivePalletByGRNId(grn.GoodsReceiptNoteId)).ReturnsAsync(false);

            var dto = new PurchaseOrderCompletedDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(PurchaseOrderStatus.Completed, po.Status);
        }

        [TestMethod]
        public async Task UpdateStatus_Complete_ReturnsError_WhenPalletsNotArranged()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();

            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), Status = GoodsReceiptNoteStatus.Completed, PurchaseOderId = id };
            var po = new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Inspected, GoodsReceiptNotes = new List<GoodsReceiptNote> { grn } };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);
            _mockPalletRepo.Setup(p => p.IsAnyDiffActivePalletByGRNId(grn.GoodsReceiptNoteId)).ReturnsAsync(true);

            var dto = new PurchaseOrderCompletedDto { PurchaseOrderId = id };

            var (msg, result) = await svc.UpdateStatusPurchaseOrder(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUnitOfWork.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        #endregion

        #region Delete tests

        [TestMethod]
        public async Task DeletePurchaseOrder_ReturnsError_WhenInvalidIdOrNotFound()
        {
            var svc = CreateService();
            var id = Guid.Empty;

            var (msg1, r1) = await svc.DeletePurchaseOrder(id, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg1));
            Assert.IsNull(r1);

            var id2 = Guid.NewGuid();
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id2)).ReturnsAsync((PurchaseOrder?)null);
            var (msg2, r2) = await svc.DeletePurchaseOrder(id2, 1);
            Assert.IsFalse(string.IsNullOrEmpty(msg2));
            Assert.IsNull(r2);
        }

        [TestMethod]
        public async Task DeletePurchaseOrder_Succeeds_WhenAllChecksPass()
        {
            var svc = CreateService();
            var id = Guid.NewGuid();

            var po = new PurchaseOrder { PurchaseOderId = id, CreatedBy = 5, Status = PurchaseOrderStatus.Draft };
            var poDetails = new List<PurchaseOderDetail> { new() };
            _mockPoRepo.Setup(r => r.GetPurchaseOrderByPurchaseOrderId(id)).ReturnsAsync(po);
            _mockPoDetailRepo.Setup(r => r.GetPurchaseOrderDetailsByPurchaseOrderId(id)).ReturnsAsync(poDetails);
            _mockPoDetailRepo.Setup(r => r.DeletePODetailBulk(poDetails)).ReturnsAsync(1);
            _mockPoRepo.Setup(r => r.DeletePurchaseOrder(po)).ReturnsAsync(po);

            var (msg, result) = await svc.DeletePurchaseOrder(id, 5);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
        }

        #endregion

        #region Test helpers (EF Core async IQueryable support)

        // Minimal EF Core async queryable support used by repository mocks in tests.
        private class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
        {
            private readonly IQueryProvider _inner;
            public TestAsyncQueryProvider(IQueryProvider inner)
            {
                _inner = inner;
            }

            public IQueryable CreateQuery(Expression expression)
                => new TestAsyncEnumerable<TEntity>(expression);

            public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
                => new TestAsyncEnumerable<TElement>(expression);

            public object Execute(Expression expression)
                => _inner.Execute(expression);

            public TResult Execute<TResult>(Expression expression)
                => _inner.Execute<TResult>(expression);

            public IAsyncEnumerable<TResult> ExecuteAsync<TResult>(Expression expression)
                => new TestAsyncEnumerable<TResult>(expression);

            // ✅ đây là bản duy nhất cần giữ lại, implement đúng interface EF Core yêu cầu
            TResult IAsyncQueryProvider.ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken)
                => Execute<TResult>(expression);
        }

        private class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
        {
            public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable) { }
            public TestAsyncEnumerable(Expression expression) : base(expression) { }

            public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default) => new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
            IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
        }

        private class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
        {
            private readonly IEnumerator<T> _inner;
            public TestAsyncEnumerator(IEnumerator<T> inner) { _inner = inner; }
            public T Current => _inner.Current;
            public ValueTask DisposeAsync() { _inner.Dispose(); return ValueTask.CompletedTask; }
            public ValueTask<bool> MoveNextAsync() => new ValueTask<bool>(_inner.MoveNext());
        }

        #endregion
    }
}
