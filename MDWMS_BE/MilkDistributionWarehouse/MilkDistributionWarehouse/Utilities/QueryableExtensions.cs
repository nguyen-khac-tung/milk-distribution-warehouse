using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using System.Linq.Expressions;
using System.Reflection;
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
        public static async Task<PageResult<T>> ToPagedResultAsync<T>(
            this IQueryable<T> query, PagedRequest request)
        {
            //Filtering
            if (request.Filters != null)
            {
                foreach (var filter in request.Filters)
                {
                    var property = typeof(T).GetProperty(filter.Key, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                    if (property != null)
                    {
                        var parameter = Expression.Parameter(typeof(T), "x");
                        var member = Expression.Property(parameter, property);
                        var value = Convert.ChangeType(filter.Value, property.PropertyType);
                        var constant = Expression.Constant(value);
                        var equal = Expression.Equal(member, constant);
                        var lambda = Expression.Lambda<Func<T, bool>>(equal, parameter);
                        query = query.Where(lambda);
                    }
                }
            }

            //Searching
            if (!string.IsNullOrEmpty(request.Search))
            {
                var stringProperties = typeof(T).GetProperties()
                    .Where(p => p.PropertyType == typeof(string));

                Expression? orExpression = null;
                var parameter = Expression.Parameter(typeof(T), "x");

                foreach (var prop in stringProperties)
                {
                    var member = Expression.Property(parameter, prop);
                    var method = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;
                    var constant = Expression.Constant(request.Search);
                    var call = Expression.Call(member, method, constant);
                    orExpression = orExpression == null ? call : Expression.OrElse(orExpression, call);
                }

                if (orExpression != null)
                {
                    var lambda = Expression.Lambda<Func<T, bool>>(orExpression, parameter);
                    query = query.Where(lambda);
                }
            }

            //Sorting
            if (!string.IsNullOrEmpty(request.SortField))
            {
                var property = typeof(T).GetProperty(request.SortField, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                if (property != null)
                {
                    var parameter = Expression.Parameter(typeof(T), "x");
                    var member = Expression.Property(parameter, property);
                    var keySelector = Expression.Lambda(member, parameter);

                    var methodName = request.SortAscending ? "OrderBy" : "OrderByDescending";
                    var method = typeof(Queryable).GetMethods()
                        .First(m => m.Name == methodName && m.GetParameters().Length == 2)
                        .MakeGenericMethod(typeof(T), property.PropertyType);

                    query = (IQueryable<T>)method.Invoke(null, new object[] { query, keySelector })!;
                }
            }

            //Pagination
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return new PageResult<T>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }
    }
}
