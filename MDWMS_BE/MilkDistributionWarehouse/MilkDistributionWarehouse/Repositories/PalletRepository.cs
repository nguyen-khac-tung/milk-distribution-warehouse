﻿using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IPalletRepository
    {
        IQueryable<Pallet>? GetPallets();
        Task<Pallet?> GetPalletById(Guid palletId);
        Task<Pallet?> CreatePallet(Pallet entity);
        Task<Pallet?> UpdatePallet(Pallet entity);
        Task<bool> HasDependencies(Guid palletId);
        Task<List<Pallet>> GetActivePalletsAsync();
        Task<bool> ExistsAsync(Guid batchId, int locationId, Guid? excludePalletId = null);
    }

    public class PalletRepository : IPalletRepository
    {
        private readonly WarehouseContext _context;

        public PalletRepository(WarehouseContext context)
        {
            _context = context;
        }

        public IQueryable<Pallet>? GetPallets()
        {
            return _context.Pallets
                .Include(p => p.Batch)
                .Include(p => p.Location)
                .Include(p => p.PurchaseOrder)
                .Where(p => p.Status != CommonStatus.Deleted)
                .OrderByDescending(p => p.CreateAt)
                .AsNoTracking();
        }

        public async Task<Pallet?> GetPalletById(Guid palletId)
        {
            return await _context.Pallets
                .Include(p => p.Batch)
                .Include(p => p.Location)
                .Include(p => p.PurchaseOrder)
                .FirstOrDefaultAsync(p => p.PalletId == palletId && p.Status != CommonStatus.Deleted);
        }

        public async Task<Pallet?> CreatePallet(Pallet entity)
        {
            await _context.Pallets.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Pallet?> UpdatePallet(Pallet entity)
        {
            _context.Pallets.Attach(entity);
            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> HasDependencies(Guid palletId)
        {
            return await _context.StocktakingPallets.AnyAsync(sp => sp.PalletId == palletId);
        }

        public async Task<List<Pallet>> GetActivePalletsAsync()
        {
            return await _context.Pallets
                .Where(p => p.Status == CommonStatus.Active)
                .OrderBy(p => p.CreateAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(Guid batchId, int locationId, Guid? excludePalletId = null)
        {
            var query = _context.Pallets
                .Where(p => p.Status != CommonStatus.Deleted
                            && p.BatchId == batchId
                            && p.LocationId == locationId);

            if (excludePalletId.HasValue)
                query = query.Where(p => p.PalletId != excludePalletId.Value);

            return await query.AnyAsync();
        }
    }
}
