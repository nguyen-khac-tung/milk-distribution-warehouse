using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StocktakingSheetRepositoryTest
    {
        private DbContextOptions<WarehouseContext> CreateNewContextOptions()
        {
            return new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
        }

        [TestMethod]
        public async Task CreateStocktakingSheet_AddsEntity_ReturnsOne()
        {
            var options = CreateNewContextOptions();

            using (var context = new WarehouseContext(options))
            {
                var repo = new StocktakingSheetRepository(context);
                var sheet = new StocktakingSheet
                {
                    StocktakingSheetId = Guid.NewGuid().ToString(),
                    CreatedAt = DateTime.UtcNow
                };

                var result = await repo.CreateStocktakingSheet(sheet);
                Assert.AreEqual(1, result);

                var persisted = context.StocktakingSheets.FirstOrDefault(s => s.StocktakingSheetId == sheet.StocktakingSheetId);
                Assert.IsNotNull(persisted);
            }
        }

        [TestMethod]
        public async Task UpdateStockingtakingSheet_ExistingTrackedEntity_UpdatesFields_ReturnsOne()
        {
            var options = CreateNewContextOptions();
            var id = Guid.NewGuid().ToString();

            // Seed in same context to ensure the entity is tracked
            using (var context = new WarehouseContext(options))
            {
                context.StocktakingSheets.Add(new StocktakingSheet
                {
                    StocktakingSheetId = id,
                    Status = StocktakingStatus.Draft,
                    Note = "Old",
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                var repo = new StocktakingSheetRepository(context);

                var update = new StocktakingSheet
                {
                    StocktakingSheetId = id,
                    Status = StocktakingStatus.Assigned,
                    Note = "New note",
                    UpdateAt = DateTime.UtcNow
                };

                var result = await repo.UpdateStockingtakingSheet(update);
                Assert.AreEqual(1, result);

                var persisted = await context.StocktakingSheets.FirstOrDefaultAsync(s => s.StocktakingSheetId == id);
                Assert.IsNotNull(persisted);
                Assert.AreEqual(StocktakingStatus.Assigned, persisted!.Status);
                Assert.AreEqual("New note", persisted.Note);
            }
        }

        [TestMethod]
        public async Task UpdateStockingtakingSheet_UntrackedEntity_AttachAndUpdateProperties_ReturnsOne()
        {
            var options = CreateNewContextOptions();
            var id = Guid.NewGuid().ToString();

            // Seed entity in a separate context so it exists in DB but is not tracked by the next context
            using (var seedContext = new WarehouseContext(options))
            {
                seedContext.StocktakingSheets.Add(new StocktakingSheet
                {
                    StocktakingSheetId = id,
                    Status = StocktakingStatus.Draft,
                    Note = "Seeded",
                    CreatedAt = DateTime.UtcNow
                });
                await seedContext.SaveChangesAsync();
            }

            // Now create a new context instance so the entity is not tracked in this context (attach path exercised)
            using (var context = new WarehouseContext(options))
            {
                var repo = new StocktakingSheetRepository(context);

                var update = new StocktakingSheet
                {
                    StocktakingSheetId = id,
                    Status = StocktakingStatus.Assigned,
                    StartTime = DateTime.UtcNow.AddDays(1),
                    Note = "New attached",
                    UpdateAt = DateTime.UtcNow
                };

                var result = await repo.UpdateStockingtakingSheet(update);
                Assert.AreEqual(1, result);

                var persisted = await context.StocktakingSheets.FirstOrDefaultAsync(s => s.StocktakingSheetId == id);
                Assert.IsNotNull(persisted);
                Assert.AreEqual(StocktakingStatus.Assigned, persisted!.Status);
                Assert.AreEqual("New attached", persisted.Note);
            }
        }
    }
}
