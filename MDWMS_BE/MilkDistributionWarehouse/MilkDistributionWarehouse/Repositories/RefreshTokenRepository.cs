using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.Entities;

namespace MilkDistributionWarehouse.Repositories
{
    public interface IRefreshTokenRepository
    {
        public RefreshToken? GetRefreshTokenByUserId(int? userId);

        public RefreshToken? GetRefreshTokenByToken(string token);

        public void CreateRefreshToken(RefreshToken refreshToken);

        public void UpdateRefreshToken(RefreshToken refreshToken);
    }

    public class RefreshTokenRepository: IRefreshTokenRepository
    {
        private readonly WarehouseContext _context;

        public RefreshTokenRepository(WarehouseContext context)
        {
            _context = context;
        }

        public RefreshToken? GetRefreshTokenByUserId(int? userId)
        {
            return _context.RefreshTokens.Where(r => r.UserId == userId).FirstOrDefault();
        }

        public RefreshToken? GetRefreshTokenByToken(string token)
        {
            return _context.RefreshTokens
                .Include(r => r.User)
                .Where(r => r.Token == token)
                .FirstOrDefault();
        }

        public void CreateRefreshToken(RefreshToken refreshToken)
        {
            _context.RefreshTokens.Add(refreshToken);
            _context.SaveChanges();
        }

        public void UpdateRefreshToken(RefreshToken refreshToken)
        {
            _context.RefreshTokens.Update(refreshToken);
            _context.SaveChanges();
        }

    }
}
