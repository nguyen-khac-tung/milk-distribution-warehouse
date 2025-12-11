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
    public class SalesOrderRepositoryTest
    {
        private WarehouseContext _context;
        private SalesOrderRepository _repository;

        [TestInitialize]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<WarehouseContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new WarehouseContext(options);
            _repository = new SalesOrderRepository(_context);
        }

        [TestCleanup]
        public void Cleanup()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // UTCID09 (Part): Kiểm tra xem có lưu được đơn hàng vào DB không
        [TestMethod]
        public async Task CreateSalesOrder_ShouldPersistData()
        {
            // Arrange
            var order = new SalesOrder
            {
                SalesOrderId = "SO-TEST-01",
                RetailerId = 1,
                Status = SalesOrderStatus.Draft,
                CreatedAt = DateTime.Now
            };

            // Act
            await _repository.CreateSalesOrder(order);
            await _context.SaveChangesAsync();

            // Assert
            var dbOrder = await _context.SalesOrders.FindAsync("SO-TEST-01");
            Assert.IsNotNull(dbOrder);
            Assert.AreEqual(1, dbOrder.RetailerId);
        }

        // Hỗ trợ UTCID08: Kiểm tra logic tính hàng đã cam kết (để Service tính tồn kho)
        [TestMethod]
        public async Task GetCommittedSaleOrderQuantities_ShouldFilterCorrectStatus()
        {
            // Arrange
            var goodsId = 100;
            var packingId = 10;

            // 1. Đơn Pending -> TÍNH (20)
            _context.SalesOrders.Add(new SalesOrder
            {
                SalesOrderId = "SO1",
                Status = SalesOrderStatus.PendingApproval,
                SalesOrderDetails = new List<SalesOrderDetail> { new SalesOrderDetail { GoodsId = goodsId, GoodsPackingId = packingId, PackageQuantity = 20 } }
            });
            // 2. Đơn Approved -> TÍNH (30)
            _context.SalesOrders.Add(new SalesOrder
            {
                SalesOrderId = "SO2",
                Status = SalesOrderStatus.Approved,
                SalesOrderDetails = new List<SalesOrderDetail> { new SalesOrderDetail { GoodsId = goodsId, GoodsPackingId = packingId, PackageQuantity = 30 } }
            });
            // 3. Đơn Draft -> KHÔNG TÍNH
            _context.SalesOrders.Add(new SalesOrder
            {
                SalesOrderId = "SO3",
                Status = SalesOrderStatus.Draft,
                SalesOrderDetails = new List<SalesOrderDetail> { new SalesOrderDetail { GoodsId = goodsId, GoodsPackingId = packingId, PackageQuantity = 500 } }
            });

            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetCommittedSaleOrderQuantities(new List<int> { goodsId });

            // Assert
            var totalCommitted = result.Sum(x => x.PackageQuantity);
            Assert.AreEqual(50, totalCommitted); // 20 + 30
        }
    }
}