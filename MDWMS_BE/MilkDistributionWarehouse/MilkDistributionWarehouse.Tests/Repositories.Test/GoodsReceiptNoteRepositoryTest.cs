using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Tests.Repositories.Test
{
    [TestClass]
    public class GoodsReceiptNoteRepositoryTest
    {
        private DbContextOptions<WarehouseContext> CreateOptions(string dbName)
        {
            return new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
        }

        private WarehouseContext CreateContext(string dbName)
        {
            var opts = CreateOptions(dbName);
            return new WarehouseContext(opts);
        }

        [TestMethod]
        public async Task CreateGoodsReceiptNote_AddsEntity_AndReturnsCreated()
        {
            var dbName = Guid.NewGuid().ToString();
            using (var ctx = CreateContext(dbName))
            {
                var repo = new GoodsReceiptNoteRepository(ctx);

                var grn = new GoodsReceiptNote
                {
                    GoodsReceiptNoteId = Guid.NewGuid(),
                    PurchaseOderId = Guid.NewGuid(),
                    Status = GoodsReceiptNoteStatus.Receiving,
                    GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail>
                    {
                        new GoodsReceiptNoteDetail
                        {
                            GoodsReceiptNoteDetailId = Guid.NewGuid(),
                            GoodsId = 1,
                            Status = ReceiptItemStatus.Receiving
                        }
                    }
                };

                var result = await repo.CreateGoodsReceiptNote(grn);

                Assert.IsNotNull(result);
                Assert.AreEqual(grn.GoodsReceiptNoteId, result!.GoodsReceiptNoteId);

                // verify persisted
                var persisted = await ctx.GoodsReceiptNotes.FindAsync(grn.GoodsReceiptNoteId);
                Assert.IsNotNull(persisted);
            }
        }

        [TestMethod]
        public async Task GetGRN_ReturnsQueryableContainingSeededItems()
        {
            var dbName = Guid.NewGuid().ToString();
            var grnId = Guid.NewGuid();
            using (var ctx = CreateContext(dbName))
            {
                // seed
                ctx.GoodsReceiptNotes.Add(new GoodsReceiptNote
                {
                    GoodsReceiptNoteId = grnId,
                    PurchaseOderId = Guid.NewGuid(),
                    Status = GoodsReceiptNoteStatus.Receiving
                });
                await ctx.SaveChangesAsync();
            }

            using (var ctx = CreateContext(dbName))
            {
                var repo = new GoodsReceiptNoteRepository(ctx);
                var list = await repo.GetGRN().ToListAsync();

                Assert.IsTrue(list.Any());
                Assert.IsTrue(list.Any(g => g.GoodsReceiptNoteId == grnId));
            }
        }

        [TestMethod]
        public async Task GetGoodsReceiptNoteById_ReturnsEntityWithDetailsAndPurchaseOrder()
        {
            var dbName = Guid.NewGuid().ToString();
            var grnId = Guid.NewGuid();
            var poId = Guid.NewGuid();

            using (var ctx = CreateContext(dbName))
            {
                var grn = new GoodsReceiptNote
                {
                    GoodsReceiptNoteId = grnId,
                    PurchaseOderId = poId,
                    Status = GoodsReceiptNoteStatus.Receiving,
                    GoodsReceiptNoteDetails = new List<GoodsReceiptNoteDetail>
                    {
                        new GoodsReceiptNoteDetail
                        {
                            GoodsReceiptNoteDetailId = Guid.NewGuid(),
                            GoodsId = 10,
                            Status = ReceiptItemStatus.Receiving
                        }
                    },
                    PurchaseOder = new PurchaseOrder
                    {
                        PurchaseOderId = poId,
                        Status = PurchaseOrderStatus.Ordered
                    }
                };

                ctx.GoodsReceiptNotes.Add(grn);
                await ctx.SaveChangesAsync();
            }

            using (var ctx = CreateContext(dbName))
            {
                var repo = new GoodsReceiptNoteRepository(ctx);
                var got = await repo.GetGoodsReceiptNoteById(grnId);

                Assert.IsNotNull(got);
                Assert.AreEqual(grnId, got!.GoodsReceiptNoteId);
                Assert.IsNotNull(got.GoodsReceiptNoteDetails);
                Assert.IsTrue(got.GoodsReceiptNoteDetails.Any());
                Assert.IsNotNull(got.PurchaseOder);
                Assert.AreEqual(poId, got.PurchaseOder.PurchaseOderId);
            }
        }

        [TestMethod]
        public async Task GetGoodsReceiptNoteById_ReturnsNull_WhenNotFound()
        {
            var dbName = Guid.NewGuid().ToString();
            using (var ctx = CreateContext(dbName))
            {
                var repo = new GoodsReceiptNoteRepository(ctx);
                var msgId = Guid.NewGuid();
                var got = await repo.GetGoodsReceiptNoteById(msgId);
                Assert.IsNull(got);
            }
        }

        [TestMethod]
        public async Task UpdateGoodsReceiptNote_UpdatesAndReturnsEntity()
        {
            var dbName = Guid.NewGuid().ToString();
            var grnId = Guid.NewGuid();

            using (var ctx = CreateContext(dbName))
            {
                var grn = new GoodsReceiptNote
                {
                    GoodsReceiptNoteId = grnId,
                    PurchaseOderId = Guid.NewGuid(),
                    Status = GoodsReceiptNoteStatus.Receiving
                };
                ctx.GoodsReceiptNotes.Add(grn);
                await ctx.SaveChangesAsync();
            }

            using (var ctx = CreateContext(dbName))
            {
                var repo = new GoodsReceiptNoteRepository(ctx);
                var existing = await ctx.GoodsReceiptNotes.FindAsync(grnId);
                Assert.IsNotNull(existing);
                existing!.Status = GoodsReceiptNoteStatus.PendingApproval;

                var updated = await repo.UpdateGoodsReceiptNote(existing);

                Assert.IsNotNull(updated);
                Assert.AreEqual(GoodsReceiptNoteStatus.PendingApproval, updated!.Status);

                // verify persisted
                var persisted = await ctx.GoodsReceiptNotes.FindAsync(grnId);
                Assert.IsNotNull(persisted);
                Assert.AreEqual(GoodsReceiptNoteStatus.PendingApproval, persisted!.Status);
            }
        }
    }
}