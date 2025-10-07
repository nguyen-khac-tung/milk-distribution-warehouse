using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Utilities
{
    public static class QueryableExtensions
    {
        public static async Task<PageResult<T>> ToPagedResultAsync<T>(
            this IQueryable<T> query, int pageNumber, int pageSize)
        {
            var totalCount = await query.CountAsync();

            var items = await query
                            .Skip((pageNumber - 1) * pageSize)
                            .Take(pageSize)
                            .ToListAsync();

            return new PageResult<T> {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
    }
}
