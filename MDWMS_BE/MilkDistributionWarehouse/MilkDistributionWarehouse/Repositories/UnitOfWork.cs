using Microsoft.EntityFrameworkCore.Storage;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IUnitOfWork
    {
        IGoodsRepository Goods { get; }
        ILocationRepository Locations { get; }
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
    public class UnitOfWork : IUnitOfWork
    {
        private readonly WarehouseContext _context;
        private IDbContextTransaction? _transaction;
        public IGoodsRepository Goods { get; }
        public ILocationRepository Locations { get; }

        public UnitOfWork(WarehouseContext context)
        {
            _context = context;
            Goods = new GoodsRepository(_context);
            Locations = new LocationRepository(context);
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            try
            {
                await SaveChangesAsync();
                if (_transaction != null)
                {
                    await _transaction.CommitAsync();
                }
            }
            catch
            {
                await RollbackTransactionAsync();
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if( _transaction != null )
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
            }
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context?.Dispose();
        }
    }
}
