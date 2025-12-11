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
    public class StocktakingPalletRepositoriesTest
    {
        private DbContextOptions<WarehouseContext> CreateNewInMemoryOptions()
        {
            return new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [TestMethod]
        public async Task CreateStocktakingPalletBulk_AddsEntitiesAndReturnsCount()
        {
            // Arrange - in-memory context
            var options = CreateNewInMemoryOptions();
            using (var context = new WarehouseContext(options))
            {
                var repo = new StocktakingPalletRepository(context);

                var creates = new List<StocktakingPallet>
                {
                    new StocktakingPallet { StocktakingPalletId = Guid.NewGuid(), PalletId = "P1", StocktakingLocationId = Guid.NewGuid() },
                    new StocktakingPallet { StocktakingPalletId = Guid.NewGuid(), PalletId = "P2", StocktakingLocationId = Guid.NewGuid() }
                };

                // Act
                var result = await repo.CreateStocktakingPalletBulk(creates);

                // Assert
                Assert.AreEqual(2, result);
                var stored = await context.StocktakingPallets.ToListAsync();
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
        public async Task CreateStocktakingPalletBulk_OnException_ReturnsZero()
        {
            // Arrange - context that throws on SaveChangesAsync
            var options = CreateNewInMemoryOptions();
            using (var context = new ThrowingWarehouseContext(options))
            {
                var repo = new StocktakingPalletRepository(context);

                var creates = new List<StocktakingPallet>
                {
                    new StocktakingPallet { StocktakingPalletId = Guid.NewGuid(), PalletId = "P1", StocktakingLocationId = Guid.NewGuid() }
                };

                // Act
                var result = await repo.CreateStocktakingPalletBulk(creates);

                // Assert
                Assert.AreEqual(0, result);
            }
        }
    }
}
