using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Constants;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace MilkDistributionWarehouse.Tests.Repositories.Test
{
    [TestClass]
    public class PalletRepositoryTest
    {
        private WarehouseContext _context;
        private PalletRepository _repo;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(databaseName: "RepoDb_" + Guid.NewGuid())
                .Options;
            _context = new WarehouseContext(options);
            _repo = new PalletRepository(_context);
        }

        [TestMethod]
        public async Task ExistsBatch_ShouldReturnFalse_WhenNull()
        {
            var result = await _repo.ExistsBatch(null);
            result.Should().BeFalse();
        }

        [TestMethod]
        public async Task ExistsLocation_ShouldReturnFalse_WhenNull()
        {
            var result = await _repo.ExistsLocation(null);
            result.Should().BeFalse();
        }

        [TestMethod]
        public async Task ExistsGoodRecieveNote_ShouldReturnFalse_WhenNull()
        {
            var result = await _repo.ExistsGoodRecieveNote(null);
            result.Should().BeFalse();
        }

        [TestMethod]
        public async Task IsLocationAvailable_ShouldReturnFalse_WhenNull()
        {
            var result = await _repo.IsLocationAvailable(null);
            result.Should().BeFalse();
        }

        [TestMethod]
        public async Task HasDependencies_ShouldReturnTrue_WhenDependentExists()
        {
            var palletId = "P1";
            _context.StocktakingPallets.Add(new StocktakingPallet { PalletId = palletId });
            await _context.SaveChangesAsync();

            var result = await _repo.HasDependencies(palletId);
            result.Should().BeTrue();
        }
    }
}
