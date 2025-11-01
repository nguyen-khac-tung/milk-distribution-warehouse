using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Constants;
using System;
using System.Linq;
using System.Threading.Tasks;

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
                .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
                .Options;
            _context = new WarehouseContext(options);
            _repo = new PalletRepository(_context);
        }

        [TestMethod]
        public async Task CreatePallet_ShouldAddNewPallet()
        {
            var pallet = new Pallet
            {
                PalletId = Guid.NewGuid().ToString(),
                Status = CommonStatus.Active,
                PackageQuantity = 10,
                CreateAt = DateTime.Now
            };

            await _repo.CreatePallet(pallet);
            var result = await _repo.GetPalletById(pallet.PalletId);

            result.Should().NotBeNull();
            result!.PalletId.Should().Be(pallet.PalletId);
        }

        [TestMethod]
        public async Task GetActivePalletsAsync_ShouldReturnOnlyActive()
        {
            _context.Pallets.AddRange(
                new Pallet { PalletId = "1", Status = CommonStatus.Active },
                new Pallet { PalletId = "2", Status = CommonStatus.Deleted }
            );
            await _context.SaveChangesAsync();

            var result = await _repo.GetActivePalletsAsync();
            result.Should().HaveCount(1);
            result.First().PalletId.Should().Be("1");
        }
    }
}
