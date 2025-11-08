using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class PurchaseOrderRepositoryTest
    {
        private DbContextOptions<WarehouseContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [TestMethod]
        public async Task Create_and_GetPurchaseOrderByPurchaseOrderId_ReturnsCreated()
        {
            var options = CreateNewContextOptions();
            var id = Guid.NewGuid();

            // Seed purchase order with details and GRN to validate Include() behavior
            using (var context = new WarehouseContext(options))
            {
                var po = new PurchaseOrder
                {
                    PurchaseOderId = id,
                    SupplierId = 11,
                    Status = PurchaseOrderStatus.Draft,
                    CreatedAt = DateTime.UtcNow
                };

                // add related entities
                var pod = new PurchaseOderDetail
                {
                    PurchaseOrderDetailId = 1,
                    PurchaseOderId = id
                };
                var grn = new GoodsReceiptNote
                {
                    GoodsReceiptNoteId = Guid.NewGuid(),
                    PurchaseOderId = id,
                    Status = GoodsReceiptNoteStatus.Completed
                };

                context.PurchaseOrders.Add(po);
                context.PurchaseOderDetails.Add(pod);
                context.GoodsReceiptNotes.Add(grn);
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);

                var fetched = await repo.GetPurchaseOrderByPurchaseOrderId(id);

                Assert.IsNotNull(fetched);
                Assert.AreEqual(id, fetched!.PurchaseOderId);
                // Includes: details and GRNs should be loaded (InMemory will load navigation if added)
                Assert.IsTrue(fetched.PurchaseOderDetails != null);
                Assert.IsTrue(fetched.GoodsReceiptNotes != null);
            }
        }

        [TestMethod]
        public async Task GetPurchaseOrder_ReturnsOrderedDescending()
        {
            var options = CreateNewContextOptions();

            using (var context = new WarehouseContext(options))
            {
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddHours(-2) });
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow.AddHours(-1) });
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow });
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);
                var list = repo.GetPurchaseOrder().ToList();

                Assert.IsTrue(list.Count >= 3);
                // first item should have the latest CreatedAt
                Assert.IsTrue(list[0].CreatedAt >= list[1].CreatedAt);
            }
        }

        [TestMethod]
        public async Task UpdatePurchaseOrder_UpdatesEntity()
        {
            var options = CreateNewContextOptions();
            var id = Guid.NewGuid();

            using (var context = new WarehouseContext(options))
            {
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Draft });
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);

                var toUpdate = await repo.GetPurchaseOrderByPurchaseOrderId(id);
                Assert.IsNotNull(toUpdate);

                toUpdate!.Status = PurchaseOrderStatus.Approved;
                var updated = await repo.UpdatePurchaseOrder(toUpdate);

                Assert.IsNotNull(updated);
                Assert.AreEqual(PurchaseOrderStatus.Approved, updated!.Status);
            }
        }

        [TestMethod]
        public async Task DeletePurchaseOrder_RemovesEntity()
        {
            var options = CreateNewContextOptions();
            var id = Guid.NewGuid();

            using (var context = new WarehouseContext(options))
            {
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = id, Status = PurchaseOrderStatus.Draft });
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);
                var po = await repo.GetPurchaseOrderByPurchaseOrderId(id);
                Assert.IsNotNull(po);

                var deleted = await repo.DeletePurchaseOrder(po!);
                Assert.IsNotNull(deleted);

                var after = await repo.GetPurchaseOrderByPurchaseOrderId(id);
                Assert.IsNull(after);
            }
        }

        [TestMethod]
        public async Task HasActivePurchaseOrder_ReturnsTrue_WhenNonDraftNonCompletedExists()
        {
            var options = CreateNewContextOptions();

            using (var context = new WarehouseContext(options))
            {
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), SupplierId = 5, Status = PurchaseOrderStatus.PendingApproval });
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);
                var hasActive = await repo.HasActivePurchaseOrder(5);
                Assert.IsTrue(hasActive);

                var hasActiveOther = await repo.HasActivePurchaseOrder(999);
                Assert.IsFalse(hasActiveOther);
            }
        }

        [TestMethod]
        public async Task IsAllPurchaseOrderDraftOrEmpty_BehavesCorrectly()
        {
            var options = CreateNewContextOptions();

            using (var context = new WarehouseContext(options))
            {
                // supplier 10 : all draft
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), SupplierId = 10, Status = PurchaseOrderStatus.Draft });
                // supplier 20 : has non-draft
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), SupplierId = 20, Status = PurchaseOrderStatus.Approved });
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);
                var allDraft10 = await repo.IsAllPurchaseOrderDraftOrEmpty(10);
                var allDraft20 = await repo.IsAllPurchaseOrderDraftOrEmpty(20);
                var allDraftMissing = await repo.IsAllPurchaseOrderDraftOrEmpty(9999); // empty supplier

                Assert.IsTrue(allDraft10);
                Assert.IsFalse(allDraft20);
                Assert.IsTrue(allDraftMissing);
            }
        }

        [TestMethod]
        public async Task HasUserAssignedToOtherReceivingPOAsync_ReturnsExpected()
        {
            var options = CreateNewContextOptions();

            using (var context = new WarehouseContext(options))
            {
                // assignTo 42 with AssignedForReceiving status
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), AssignTo = 42, Status = PurchaseOrderStatus.AssignedForReceiving });
                // assignTo 43 with different status
                context.PurchaseOrders.Add(new PurchaseOrder { PurchaseOderId = Guid.NewGuid(), AssignTo = 43, Status = PurchaseOrderStatus.Draft });
                await context.SaveChangesAsync();
            }

            using (var context = new WarehouseContext(options))
            {
                var repo = new PurchaseOrderRepository(context);
                var isAssigned42 = await repo.HasUserAssignedToOtherReceivingPOAsync(42);
                var isAssigned43 = await repo.HasUserAssignedToOtherReceivingPOAsync(43);
                var isAssigned99 = await repo.HasUserAssignedToOtherReceivingPOAsync(99);

                Assert.IsTrue(isAssigned42);
                Assert.IsFalse(isAssigned43);
                Assert.IsFalse(isAssigned99);
            }
        }
    }
}
