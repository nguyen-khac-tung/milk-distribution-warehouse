using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Tests
{
    [TestClass]
    public class StockTakingAreaRepositoryTest
    {
        private DbContextOptions<WarehouseContext> CreateNewInMemoryOptions()
        {
            return new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [TestMethod]
        public async Task CreateStocktakingAreaBulk_AddsEntitiesAndReturnsCount()
        {
            // Arrange
            var options = CreateNewInMemoryOptions();
            using (var context = new WarehouseContext(options))
            {
                var repo = new StocktakingAreaRepository(context);

                var creates = new List<StocktakingArea>
                {
                    new StocktakingArea { StocktakingAreaId = Guid.NewGuid(), AreaId = 1, StocktakingSheetId = "S-A" },
                    new StocktakingArea { StocktakingAreaId = Guid.NewGuid(), AreaId = 2, StocktakingSheetId = "S-A" }
                };

                // Act
                var result = await repo.CreateStocktakingAreaBulk(creates);

                // Assert
                Assert.IsNotNull(result);
                Assert.AreEqual(2, result);
                var stored = await context.StocktakingAreas.ToListAsync();
                Assert.AreEqual(2, stored.Count);
            }
        }

        // Fake context to simulate SaveChangesAsync throwing an exception
        private class ThrowingWarehouseContext : WarehouseContext
        {
            public ThrowingWarehouseContext(DbContextOptions<WarehouseContext> options) : base(options) { }

            public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            {
                throw new InvalidOperationException("Simulated DB failure");
            }
        }

        [TestMethod]
        public async Task CreateStocktakingAreaBulk_OnException_ReturnsNullOrZero()
        {
            // Arrange
            var options = CreateNewInMemoryOptions();
            using (var context = new ThrowingWarehouseContext(options))
            {
                var repo = new StocktakingAreaRepository(context);

                var creates = new List<StocktakingArea>
                {
                    new StocktakingArea { StocktakingAreaId = Guid.NewGuid(), AreaId = 1, StocktakingSheetId = "S-B" }
                };

                // Act
                var result = await repo.CreateStocktakingAreaBulk(creates);

                // Assert
                // repository signature may return null or 0 on failure; ensure it does not throw
                Assert.IsTrue(result == null || result == 0);
            }
        }
    }
}
