using AutoMapper;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Services;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using static MilkDistributionWarehouse.Models.DTOs.GoodsReceiptNoteDetailDto;

namespace MilkDistributionWarehouse.Tests.Services.Test
{
    [TestClass]
    public class GoodsReceiptNoteServiceTest
    {
        private Mock<IGoodsReceiptNoteRepository> _mockGrnRepo = null!;
        private Mock<IPurchaseOrderDetailRepository> _mockPodRepo = null!;
        private Mock<IGoodsReceiptNoteDetailRepository> _mockGrndRepo = null!;
        private Mock<IUnitOfWork> _mockUow = null!;
        private Mock<IGoodsReceiptNoteDetailService> _mockGrndService = null!;
        private Mock<IMapper> _mockMapper = null!;
        private GoodsReceiptNoteService _svc = null!;
        private GoodsReceiptNoteDetailService _grndSvc = null!; // will be constructed separately in some tests

        [TestInitialize]
        public void Setup()
        {
            _mockGrnRepo = new Mock<IGoodsReceiptNoteRepository>();
            _mockPodRepo = new Mock<IPurchaseOrderDetailRepository>();
            _mockGrndRepo = new Mock<IGoodsReceiptNoteDetailRepository>();
            _mockUow = new Mock<IUnitOfWork>();
            _mockGrndService = new Mock<IGoodsReceiptNoteDetailService>();
            _mockMapper = new Mock<IMapper>();

            _mockUow.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
            _mockUow.Setup(u => u.CommitTransactionAsync()).Returns(Task.CompletedTask);
            _mockUow.Setup(u => u.RollbackTransactionAsync()).Returns(Task.CompletedTask);

            _svc = new GoodsReceiptNoteService(
                _mockGrnRepo.Object,
                _mockMapper.Object,
                _mockPodRepo.Object,
                _mockGrndRepo.Object,
                _mockUow.Object,
                _mockGrndService.Object
            );

            // prepare GoodsReceiptNoteDetailService for isolated tests of detail logic
            // using mocked repository + mapper + uow
            _grndSvc = new GoodsReceiptNoteDetailService(_mockGrndRepo.Object, _mockMapper.Object, _mockUow.Object);
        }

        #region Helpers (EF Core async IQueryable)

        private class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
        {
            private readonly IQueryProvider _inner;
            public TestAsyncQueryProvider(IQueryProvider inner) => _inner = inner;
            public IQueryable CreateQuery(Expression expression) => new TestAsyncEnumerable<TEntity>(expression);
            public IQueryable<TElement> CreateQuery<TElement>(Expression expression) => new TestAsyncEnumerable<TElement>(expression);
            public object Execute(Expression expression) => _inner.Execute(expression);
            public TResult Execute<TResult>(Expression expression) => _inner.Execute<TResult>(expression);
            public IAsyncEnumerable<TResult> ExecuteAsync<TResult>(Expression expression) => new TestAsyncEnumerable<TResult>(expression);
            public Task<TResult> ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken) => Task.FromResult(Execute<TResult>(expression));

            TResult IAsyncQueryProvider.ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken)
            {
                // Trả về kết quả đồng bộ được wrap trong Task
                var result = Execute<TResult>(expression);

                // Nếu TResult là Task<T>, trả về trực tiếp
                if (result is Task)
                    return result;

                // Nếu TResult là giá trị thuần, wrap trong Task.FromResult
                return (TResult)(object)Task.FromResult(result);
            }
        }

        private class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
        {
            private readonly IQueryProvider _queryProvider;

            public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable)
            {
                _queryProvider = new TestAsyncQueryProvider<T>(this);
            }

            public TestAsyncEnumerable(Expression expression) : base(expression)
            {
                _queryProvider = new TestAsyncQueryProvider<T>(this);
            }

            public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
                => new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());

            IQueryProvider IQueryable.Provider => _queryProvider;
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

        #region GoodsReceiptNoteService - Create / GetGRNByPurchaseOrderId

        [TestMethod]
        public async Task CreateGoodsReceiptNote_ReturnsError_WhenPurchaseOrderDetailsEmpty()
        {
            var create = new GoodsReceiptNoteCreate { PurchaseOderId = Guid.NewGuid() };
            // repository returns empty purchase order details
            _mockPodRepo.Setup(r => r.GetPurchaseOrderDetail()).Returns(new TestAsyncEnumerable<PurchaseOderDetail>(Array.Empty<PurchaseOderDetail>()));

            var (msg, result) = await _svc.CreateGoodsReceiptNote(create, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task CreateGoodsReceiptNote_ReturnsError_WhenCreateRepoFails()
        {
            var poId = Guid.NewGuid();
            var create = new GoodsReceiptNoteCreate { PurchaseOderId = poId };

            // prepare a purchase order detail list
            var pod = new PurchaseOderDetail { PurchaseOrderDetailId = 1, GoodsId = 5 };
            _mockPodRepo.Setup(r => r.GetPurchaseOrderDetail()).Returns(new TestAsyncEnumerable<PurchaseOderDetail>(new[] { pod }));

            // mapper: map purchaseOrderDetail -> grn detail list
            var mappedDetails = new List<GoodsReceiptNoteDetail> { new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), GoodsId = pod.GoodsId } };
            _mockMapper.Setup(m => m.Map<List<GoodsReceiptNoteDetail>>(It.IsAny<IEnumerable<PurchaseOderDetail>>())).Returns(mappedDetails);

            // map create -> grn entity
            var mappedGrn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), PurchaseOderId = poId, GoodsReceiptNoteDetails = mappedDetails };
            _mockMapper.Setup(m => m.Map<GoodsReceiptNote>(create)).Returns(mappedGrn);

            // create repo returns null -> fail
            _mockGrnRepo.Setup(r => r.CreateGoodsReceiptNote(It.IsAny<GoodsReceiptNote>())).ReturnsAsync((GoodsReceiptNote?)null);

            var (msg, result) = await _svc.CreateGoodsReceiptNote(create, 7);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task CreateGoodsReceiptNote_ReturnsError_WhenGetGRNNotFoundAfterCreate()
        {
            var poId = Guid.NewGuid();
            var create = new GoodsReceiptNoteCreate { PurchaseOderId = poId };
            var pod = new PurchaseOderDetail { PurchaseOrderDetailId = 1, GoodsId = 5 };
            _mockPodRepo.Setup(r => r.GetPurchaseOrderDetail()).Returns(new TestAsyncEnumerable<PurchaseOderDetail>(new[] { pod }));

            var mappedDetails = new List<GoodsReceiptNoteDetail> { new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), GoodsId = pod.GoodsId } };
            _mockMapper.Setup(m => m.Map<List<GoodsReceiptNoteDetail>>(It.IsAny<IEnumerable<PurchaseOderDetail>>())).Returns(mappedDetails);

            var mappedGrn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), PurchaseOderId = poId, GoodsReceiptNoteDetails = mappedDetails };
            _mockMapper.Setup(m => m.Map<GoodsReceiptNote>(create)).Returns(mappedGrn);

            _mockGrnRepo.Setup(r => r.CreateGoodsReceiptNote(It.IsAny<GoodsReceiptNote>())).ReturnsAsync(mappedGrn);

            // simulate GetGRNByPurchaseOrderId returning no GRN by returning empty repository GetGRN
            _mockGrnRepo.Setup(r => r.GetGRN()).Returns(new TestAsyncEnumerable<GoodsReceiptNote>(Array.Empty<GoodsReceiptNote>()));

            var (msg, result) = await _svc.CreateGoodsReceiptNote(create, 9);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        //[TestMethod]
        //public async Task CreateGoodsReceiptNote_Succeeds()
        //{
        //    var poId = Guid.NewGuid();
        //    var create = new GoodsReceiptNoteCreate { PurchaseOderId = poId };

        //    // ensure PurchaseOderId on the seeded PO detail matches the create.PurchaseOderId
        //    var pod = new PurchaseOderDetail { PurchaseOrderDetailId = 1, GoodsId = 5, GoodsPackingId = 2, PurchaseOderId = poId };
        //    _mockPodRepo.Setup(r => r.GetPurchaseOrderDetail()).Returns(new TestAsyncEnumerable<PurchaseOderDetail>(new[] { pod }));

        //    var mappedDetails = new List<GoodsReceiptNoteDetail>
        //    {
        //        new GoodsReceiptNoteDetail
        //        {
        //            GoodsReceiptNoteDetailId = Guid.NewGuid(),
        //            GoodsId = pod.GoodsId,
        //            GoodsReceiptNoteId = Guid.NewGuid(),
        //            Status = ReceiptItemStatus.Receiving
        //        }
        //    };
        //    _mockMapper.Setup(m => m.Map<List<GoodsReceiptNoteDetail>>(It.IsAny<IEnumerable<PurchaseOderDetail>>())).Returns(mappedDetails);

        //    var mappedGrn = new GoodsReceiptNote
        //    {
        //        GoodsReceiptNoteId = Guid.NewGuid(),
        //        PurchaseOderId = poId,
        //        GoodsReceiptNoteDetails = mappedDetails,
        //        CreatedBy = 0
        //    };
        //    _mockMapper.Setup(m => m.Map<GoodsReceiptNote>(create)).Returns(mappedGrn);

        //    _mockGrnRepo.Setup(r => r.CreateGoodsReceiptNote(It.IsAny<GoodsReceiptNote>())).ReturnsAsync(mappedGrn);

        //    // When GetGRN called, return an IQueryable that ProjectTo() can project.
        //    _mockGrnRepo.Setup(r => r.GetGRN()).Returns(new TestAsyncEnumerable<GoodsReceiptNote>(new[] { mappedGrn }));

        //    // For ProjectTo to succeed, set up mapper.ConfigurationProvider (ProjectTo uses it).
        //    var cfg = new MapperConfiguration(cfg =>
        //    {
        //        cfg.CreateMap<GoodsReceiptNote, GoodsReceiptNoteDto>()
        //            .ForMember(d => d.GoodsReceiptNoteId, o => o.MapFrom(s => s.GoodsReceiptNoteId))
        //            .ForMember(d => d.PurchaseOderId, o => o.MapFrom(s => s.PurchaseOderId))
        //            .ForMember(d => d.GoodsReceiptNoteDetails, o => o.MapFrom(s => s.GoodsReceiptNoteDetails));
        //    });
        //    _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(cfg);

        //    var (msg, result) = await _svc.CreateGoodsReceiptNote(create, 11);

        //    Assert.IsTrue(string.IsNullOrEmpty(msg));
        //    Assert.IsNotNull(result);
        //    Assert.AreEqual(poId, result!.PurchaseOderId);
        //}

        [TestMethod]
        public async Task GetGRNByPurchaseOrderId_ReturnsError_WhenInvalidId()
        {
            var (msg, result) = await _svc.GetGRNByPurchaseOrderId(Guid.Empty);
            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        //[TestMethod]
        //public async Task GetGRNByPurchaseOrderId_ReturnsError_WhenNotFound()
        //{
        //    var id = Guid.NewGuid();
        //    _mockGrnRepo.Setup(r => r.GetGRN()).Returns(new TestAsyncEnumerable<GoodsReceiptNote>(Array.Empty<GoodsReceiptNote>()));

        //    // mapper config for ProjectTo
        //    var cfg = new MapperConfiguration(cfg => cfg.CreateMap<GoodsReceiptNote, GoodsReceiptNoteDto>());
        //    _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(cfg);

        //    var (msg, result) = await _svc.GetGRNByPurchaseOrderId(id);

        //    Assert.IsFalse(string.IsNullOrEmpty(msg));
        //    Assert.IsNull(result);
        //}

        //[TestMethod]
        //public async Task GetGRNByPurchaseOrderId_ReturnsOk_WhenFound()
        //{
        //    var poId = Guid.NewGuid();
        //    var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), PurchaseOderId = poId };
        //    _mockGrnRepo.Setup(r => r.GetGRN()).Returns(new TestAsyncEnumerable<GoodsReceiptNote>(new[] { grn }));

        //    var cfg = new MapperConfiguration(cfg => cfg.CreateMap<GoodsReceiptNote, GoodsReceiptNoteDto>());
        //    _mockMapper.SetupGet(m => m.ConfigurationProvider).Returns(cfg);

        //    var (msg, result) = await _svc.GetGRNByPurchaseOrderId(poId);

        //    Assert.IsTrue(string.IsNullOrEmpty(msg));
        //    Assert.IsNotNull(result);
        //    Assert.AreEqual(poId, result!.PurchaseOderId);
        //}

        #endregion

        #region GoodsReceiptNoteService - UpdateGRNStatus tests

        [TestMethod]
        public async Task UpdateGRNStatus_ReturnsError_WhenGrnNotFound()
        {
            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = Guid.NewGuid() };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(dto.GoodsReceiptNoteId)).ReturnsAsync((GoodsReceiptNote?)null);

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Submit_ReturnsError_WhenStatusInvalid()
        {
            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), Status = GoodsReceiptNoteStatus.PendingApproval, CreatedBy = 1 };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Submit_ReturnsError_WhenCreatedByMismatch()
        {
            var grn = new GoodsReceiptNote
            {
                GoodsReceiptNoteId = Guid.NewGuid(),
                Status = GoodsReceiptNoteStatus.Receiving,
                CreatedBy = 99,
                GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail> { new GoodsReceiptNoteDetail { Status = ReceiptItemStatus.Inspected } }
            };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Submit_ReturnsError_WhenDetailUpdateFails()
        {
            var grn = new GoodsReceiptNote
            {
                GoodsReceiptNoteId = Guid.NewGuid(),
                Status = GoodsReceiptNoteStatus.Receiving,
                CreatedBy = 7,
                GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail> { new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), Status = ReceiptItemStatus.Inspected } }
            };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            // detail service returns error for UpdateGRNDetail
            _mockGrndService.Setup(s => s.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetailPendingApprovalDto>(), It.IsAny<int?>()))
                            .ReturnsAsync(("some error", (GoodsReceiptNoteDetailPendingApprovalDto?)null));

            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, grn.CreatedBy);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUow.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Submit_Succeeds()
        {
            var userId = 21;
            var grn = new GoodsReceiptNote
            {
                GoodsReceiptNoteId = Guid.NewGuid(),
                Status = GoodsReceiptNoteStatus.Receiving,
                CreatedBy = userId,
                GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail>
                {
                    new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), Status = ReceiptItemStatus.Inspected }
                }
            };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            // detail service returns success for each pending-approval update
            _mockGrndService.Setup(s => s.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetailPendingApprovalDto>(), It.IsAny<int?>()))
                            .ReturnsAsync(("", new GoodsReceiptNoteDetailPendingApprovalDto { GoodsReceiptNoteDetailId = grn.GoodsReceiptNoteDetails.First().GoodsReceiptNoteDetailId }));

            _mockGrnRepo.Setup(r => r.UpdateGoodsReceiptNote(It.IsAny<GoodsReceiptNote>())).ReturnsAsync(grn);

            var dto = new GoodsReceiptNoteSubmitDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, userId);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(GoodsReceiptNoteSubmitDto));
            _mockUow.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Complete_ReturnsError_WhenStatusInvalid()
        {
            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), Status = GoodsReceiptNoteStatus.Receiving };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            var dto = new GoodsReceiptNoteCompletedDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Complete_ReturnsError_WhenDetailUpdateFails()
        {
            var po = new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), Status = PurchaseOrderStatus.Receiving };
            var grn = new GoodsReceiptNote
            {
                GoodsReceiptNoteId = Guid.NewGuid(),
                Status = GoodsReceiptNoteStatus.PendingApproval,
                ApprovalBy = null,
                PurchaseOder = po,
                GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail>
                {
                    new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), Status = ReceiptItemStatus.PendingApproval }
                }
            };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            // detail service returns error when marking completed
            _mockGrndService.Setup(s => s.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetailCompletedDto>(), It.IsAny<int?>()))
                            .ReturnsAsync(("err", (GoodsReceiptNoteDetailCompletedDto?)null));

            var dto = new GoodsReceiptNoteCompletedDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 2);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUow.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Complete_ReturnsError_WhenPurchaseOrderStatusNotReceiving()
        {
            var po = new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), Status = PurchaseOrderStatus.Approved };
            var grn = new GoodsReceiptNote
            {
                GoodsReceiptNoteId = Guid.NewGuid(),
                Status = GoodsReceiptNoteStatus.PendingApproval,
                PurchaseOder = po,
                GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail>
                {
                    new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), Status = ReceiptItemStatus.PendingApproval }
                }
            };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            _mockGrndService.Setup(s => s.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetailCompletedDto>(), It.IsAny<int?>()))
                            .ReturnsAsync(("", new GoodsReceiptNoteDetailCompletedDto { GoodsReceiptNoteDetailId = grn.GoodsReceiptNoteDetails.First().GoodsReceiptNoteDetailId }));

            var dto = new GoodsReceiptNoteCompletedDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 3);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
            _mockUow.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateGRNStatus_Complete_Succeeds()
        {
            var po = new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), Status = PurchaseOrderStatus.Receiving };
            var grn = new GoodsReceiptNote
            {
                GoodsReceiptNoteId = Guid.NewGuid(),
                Status = GoodsReceiptNoteStatus.PendingApproval,
                PurchaseOder = po,
                GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail>
                {
                    new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), Status = ReceiptItemStatus.PendingApproval }
                }
            };
            _mockGrnRepo.Setup(r => r.GetGoodsReceiptNoteById(grn.GoodsReceiptNoteId)).ReturnsAsync(grn);

            _mockGrndService.Setup(s => s.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetailCompletedDto>(), It.IsAny<int?>()))
                            .ReturnsAsync(("", new GoodsReceiptNoteDetailCompletedDto { GoodsReceiptNoteDetailId = grn.GoodsReceiptNoteDetails.First().GoodsReceiptNoteDetailId }));

            _mockGrnRepo.Setup(r => r.UpdateGoodsReceiptNote(It.IsAny<GoodsReceiptNote>())).ReturnsAsync(grn);

            var dto = new GoodsReceiptNoteCompletedDto { GoodsReceiptNoteId = grn.GoodsReceiptNoteId };

            var (msg, result) = await _svc.UpdateGRNStatus(dto, 5);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.IsInstanceOfType(result, typeof(GoodsReceiptNoteCompletedDto));
            Assert.AreEqual(PurchaseOrderStatus.Inspected, po.Status);
            _mockUow.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }

        #endregion

        #region GoodsReceiptNoteDetailService tests (partial coverage)

        [TestMethod]
        public async Task GetListGRNDByGRNId_ReturnsEmpty_WhenRepoEmpty()
        {
            var grnId = Guid.NewGuid();
            _mockGrndRepo.Setup(r => r.GetListByGRNId(grnId)).ReturnsAsync(new List<GoodsReceiptNoteDetail>());

            var (msg, list) = await _grndSvc.GetListGRNDByGRNId(grnId);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(list);
            Assert.AreEqual(0, list.Count);
        }

        [TestMethod]
        public async Task GetListGRNDByGRNId_ReturnsList_WhenRepoHasItems()
        {
            var grnId = Guid.NewGuid();
            var grnDetail = new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = Guid.NewGuid(), GoodsReceiptNoteId = grnId, GoodsId = 1, GoodsPackingId = 2 };
            _mockGrndRepo.Setup(r => r.GetListByGRNId(grnId)).ReturnsAsync(new List<GoodsReceiptNoteDetail> { grnDetail });

            _mockMapper.Setup(m => m.Map<List<GoodsReceiptNoteDetailPalletDto>>(It.IsAny<IEnumerable<GoodsReceiptNoteDetail>>()))
                       .Returns(new List<GoodsReceiptNoteDetailPalletDto> { new GoodsReceiptNoteDetailPalletDto { GoodsReceiptNoteDetailId = grnDetail.GoodsReceiptNoteDetailId, GoodsId = 1 } });

            var (msg, list) = await _grndSvc.GetListGRNDByGRNId(grnId);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(list);
            Assert.AreEqual(1, list.Count);
        }

        [TestMethod]
        public async Task UpdateGRNDetail_ReturnsError_WhenDetailNotFound()
        {
            var dto = new GoodsReceiptNoteDetailInspectedDto { GoodsReceiptNoteDetailId = Guid.NewGuid(), DeliveredPackageQuantity = 1, RejectPackageQuantity = 0 };
            _mockGrndRepo.Setup(r => r.GetGRNDetailById(dto.GoodsReceiptNoteDetailId)).ReturnsAsync((GoodsReceiptNoteDetail?)null);

            var (msg, result) = await _grndSvc.UpdateGRNDetail(dto, 1);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNDetail_Inspected_ReturnsError_WhenCurrentStatusInvalid()
        {
            var detailId = Guid.NewGuid();
            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), CreatedBy = 2 };
            var grnd = new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = detailId, Status = ReceiptItemStatus.PendingApproval, GoodsReceiptNote = grn, ExpectedPackageQuantity = 5 };

            _mockGrndRepo.Setup(r => r.GetGRNDetailById(detailId)).ReturnsAsync(grnd);

            var dto = new GoodsReceiptNoteDetailInspectedDto { GoodsReceiptNoteDetailId = detailId, DeliveredPackageQuantity = 5, RejectPackageQuantity = 0, Note = "ok" };

            var (msg, result) = await _grndSvc.UpdateGRNDetail(dto, grn.CreatedBy);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNDetail_Inspected_ReturnsError_WhenValidationFails_RejectedGreaterThanDelivered()
        {
            var detailId = Guid.NewGuid();
            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), CreatedBy = 2 };
            var grnd = new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = detailId, Status = ReceiptItemStatus.Receiving, GoodsReceiptNote = grn, ExpectedPackageQuantity = 5 };

            _mockGrndRepo.Setup(r => r.GetGRNDetailById(detailId)).ReturnsAsync(grnd);

            var dto = new GoodsReceiptNoteDetailInspectedDto { GoodsReceiptNoteDetailId = detailId, DeliveredPackageQuantity = 5, RejectPackageQuantity = 6, Note = "bad" };

            var (msg, result) = await _grndSvc.UpdateGRNDetail(dto, grn.CreatedBy);

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNDetail_Inspected_Succeeds()
        {
            var detailId = Guid.NewGuid();
            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), CreatedBy = 77 };
            var grnd = new GoodsReceiptNoteDetail
            {
                GoodsReceiptNoteDetailId = detailId,
                Status = ReceiptItemStatus.Receiving,
                GoodsReceiptNote = grn,
                ExpectedPackageQuantity = 5
            };

            _mockGrndRepo.Setup(r => r.GetGRNDetailById(detailId)).ReturnsAsync(grnd);
            _mockMapper.Setup(m => m.Map(It.IsAny<GoodsReceiptNoteDetailInspectedDto>(), It.IsAny<GoodsReceiptNoteDetail>()))
                       .Returns((GoodsReceiptNoteDetailInspectedDto src, GoodsReceiptNoteDetail dest) =>
                       {
                           dest.DeliveredPackageQuantity = src.DeliveredPackageQuantity;
                           dest.RejectPackageQuantity = src.RejectPackageQuantity;
                           dest.Note = src.Note;
                           dest.Status = ReceiptItemStatus.Inspected;
                           return dest;
                       });

            _mockGrndRepo.Setup(r => r.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetail>())).ReturnsAsync(grnd);

            var dto = new GoodsReceiptNoteDetailInspectedDto { GoodsReceiptNoteDetailId = detailId, DeliveredPackageQuantity = 5, RejectPackageQuantity = 0, Note = "ok" };
            var (msg, result) = await _grndSvc.UpdateGRNDetail(dto, grn.CreatedBy);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNReject_ReturnsError_WhenListEmpty()
        {
            var (msg, result) = await _grndSvc.UpdateGRNReject(new List<GoodsReceiptNoteDetailRejectDto>());

            Assert.IsFalse(string.IsNullOrEmpty(msg));
            Assert.IsNull(result);
        }

        [TestMethod]
        public async Task UpdateGRNReject_Succeeds()
        {
            var detailId = Guid.NewGuid();
            var grn = new GoodsReceiptNote { GoodsReceiptNoteId = Guid.NewGuid(), CreatedBy = 2 };
            var grnd = new GoodsReceiptNoteDetail { GoodsReceiptNoteDetailId = detailId, Status = ReceiptItemStatus.PendingApproval, GoodsReceiptNote = grn };

            var rejects = new List<GoodsReceiptNoteDetailRejectDto>
            {
                new GoodsReceiptNoteDetailRejectDto { GoodsReceiptNoteDetailId = detailId, RejectionReason = "bad" }
            };

            _mockGrndRepo.Setup(r => r.GetGRNDetailById(detailId)).ReturnsAsync(grnd);
            _mockMapper.Setup(m => m.Map(It.IsAny<GoodsReceiptNoteDetailRejectDto>(), It.IsAny<GoodsReceiptNoteDetail>()))
                       .Returns((GoodsReceiptNoteDetailRejectDto src, GoodsReceiptNoteDetail dest) =>
                       {
                           dest.RejectionReason = src.RejectionReason;
                           dest.Status = ReceiptItemStatus.PendingApproval;
                           dest.GoodsReceiptNote.Status = GoodsReceiptNoteStatus.Receiving;
                           return dest;
                       });
            _mockGrndRepo.Setup(r => r.UpdateGRNDetail(It.IsAny<GoodsReceiptNoteDetail>())).ReturnsAsync(grnd);

            var (msg, result) = await _grndSvc.UpdateGRNReject(rejects);

            Assert.IsTrue(string.IsNullOrEmpty(msg));
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result!.Count);
            _mockUow.Verify(u => u.CommitTransactionAsync(), Times.Once);
        }

        #endregion
    }
}