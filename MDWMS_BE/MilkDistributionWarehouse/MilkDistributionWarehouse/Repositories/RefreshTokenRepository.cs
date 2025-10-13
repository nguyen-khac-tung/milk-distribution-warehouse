using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshToken?> GetRefreshTokenByUserId(int? userId);

        Task<RefreshToken?> GetRefreshTokenByToken(string token);

        Task<string> CreateRefreshToken(RefreshToken refreshToken);

        Task<string> UpdateRefreshToken(RefreshToken refreshToken);
    }

    public class RefreshTokenRepository: IRefreshTokenRepository
    {
        private readonly WarehouseContext _context;

        public RefreshTokenRepository(WarehouseContext context)
        {
            _context = context;
        }

        public async Task<RefreshToken?> GetRefreshTokenByUserId(int? userId)
        {
            return await _context.RefreshTokens.Where(r => r.UserId == userId).FirstOrDefaultAsync();
        }

        public async Task<RefreshToken?> GetRefreshTokenByToken(string token)
        {
            return await _context.RefreshTokens
                .Include(r => r.User)
                .Where(r => r.Token == token)
                .FirstOrDefaultAsync();
        }

        public async Task<string> CreateRefreshToken(RefreshToken refreshToken)
        {
            try
            {
                await _context.RefreshTokens.AddAsync(refreshToken);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        public async Task<string> UpdateRefreshToken(RefreshToken refreshToken)
        {
            try
            {
                _context.RefreshTokens.Update(refreshToken);
                await _context.SaveChangesAsync();
                return "";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

    }
}
