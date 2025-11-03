using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Constants;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Tests.Repositories.Test
{
    [TestClass]
    public class BackOrderRepositoryTest
    {
        private WarehouseContext _context;
        private BackOrderRepository _repo;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase("BackOrderDb_" + Guid.NewGuid())
                .Options;
            _context = new WarehouseContext(options);
            _repo = new BackOrderRepository(_context);
        }

        [TestMethod]
        public async Task CreateBackOrder_ShouldAddEntity()
        {
            var entity = new BackOrder { BackOrderId = Guid.NewGuid(), PackageQuantity = 5 };
            await _repo.CreateBackOrder(entity);
            var result = await _repo.GetBackOrderById(entity.BackOrderId);
            result.Should().NotBeNull();
        }

        [TestMethod]
        public async Task GetAvailableQuantity_ShouldReturnZero_WhenIdsNull()
        {
            var result = await _repo.GetAvailableQuantity(null, null);
            result.Should().Be(0);
        }

        [TestMethod]
        public async Task GetAvailableQuantitiesAsync_ShouldReturnEmpty_WhenPairsNullOrEmpty()
        {
            var result1 = await _repo.GetAvailableQuantitiesAsync(null);
            var result2 = await _repo.GetAvailableQuantitiesAsync(new List<(int, int)>());
            result1.Should().BeEmpty();
            result2.Should().BeEmpty();
        }

        [TestMethod]
        public async Task DeleteBackOrder_ShouldRemove_WhenExists()
        {
            var entity = new BackOrder { BackOrderId = Guid.NewGuid() };
            _context.BackOrders.Add(entity);
            await _context.SaveChangesAsync();

            var deleted = await _repo.DeleteBackOrder(entity.BackOrderId);
            deleted.Should().NotBeNull();
            (await _context.BackOrders.FindAsync(entity.BackOrderId)).Should().BeNull();
        }

        [TestMethod]
        public async Task ExistsRetailer_ShouldReturnFalse_WhenNotExist()
        {
            var result = await _repo.ExistsRetailer(999);
            result.Should().BeFalse();
        }

        [TestMethod]
        public async Task ExistsGoods_ShouldReturnFalse_WhenNotExist()
        {
            var result = await _repo.ExistsGoods(999);
            result.Should().BeFalse();
        }
    }
}
