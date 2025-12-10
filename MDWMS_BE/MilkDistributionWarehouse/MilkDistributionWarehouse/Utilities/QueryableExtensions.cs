using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using System.Linq.Expressions;
using System.Reflection;

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

        return new PageResult<T>
        {
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

                    var propertyType = property.PropertyType;
                    var underlyingType = Nullable.GetUnderlyingType(propertyType) ?? propertyType;

                    var filterValue = filter.Value?.ToString() ?? "";

                    // Xử lý Date Range: "2024-01-01~2024-12-31"
                    if (filterValue.Contains("~") && (underlyingType == typeof(DateTime) || underlyingType == typeof(DateTimeOffset)))
                    {
                        var dates = filterValue.Split('~', StringSplitOptions.None);

                        var hasStart = dates.Length > 0 && !string.IsNullOrWhiteSpace(dates[0]);
                        var hasEnd = dates.Length > 1 && !string.IsNullOrWhiteSpace(dates[1]);

                        Expression? expression = null;

                        // FROM DATE
                        if (hasStart)
                        {
                            var startDate = Convert.ChangeType(dates[0].Trim(), underlyingType);
                            var startConstant = Expression.Constant(startDate, propertyType);

                            var greaterThanOrEqual = Expression.GreaterThanOrEqual(member, startConstant);
                            expression = greaterThanOrEqual;
                        }

                        // TO DATE
                        if (hasEnd)
                        {
                            var endDate = Convert.ChangeType(dates[1].Trim(), underlyingType);
                            var endConstant = Expression.Constant(endDate, propertyType);

                            var lessThanOrEqual = Expression.LessThanOrEqual(member, endConstant);

                            // Nếu có FROM thì AND thêm
                            expression = expression == null ? lessThanOrEqual : Expression.AndAlso(expression, lessThanOrEqual);
                        }

                        if (expression != null)
                        {
                            var lambda = Expression.Lambda<Func<T, bool>>(expression, parameter);
                            query = query.Where(lambda);
                        }

                        continue;
                    }
                    // Xử lý Multiple Values: "16,17,18"
                    else if (filterValue.Contains(","))
                    {
                        var values = filterValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
                            .Select(v => Convert.ChangeType(v.Trim(), underlyingType))
                            .ToList();

                        var listType = typeof(List<>).MakeGenericType(underlyingType);
                        var list = Activator.CreateInstance(listType);
                        var addMethod = listType.GetMethod("Add");

                        foreach (var val in values)
                        {
                            addMethod!.Invoke(list, new[] { val });
                        }

                        var containsMethod = listType.GetMethod("Contains", new[] { underlyingType })!;
                        var listConstant = Expression.Constant(list);

                        Expression memberExpression = member;
                        if (Nullable.GetUnderlyingType(propertyType) != null)
                        {
                            memberExpression = Expression.Property(member, "Value");
                        }

                        var containsCall = Expression.Call(listConstant, containsMethod, memberExpression);

                        Expression finalExpression = containsCall;
                        if (Nullable.GetUnderlyingType(propertyType) != null)
                        {
                            var hasValue = Expression.Property(member, "HasValue");
                            finalExpression = Expression.AndAlso(hasValue, containsCall);
                        }

                        var lambda = Expression.Lambda<Func<T, bool>>(finalExpression, parameter);
                        query = query.Where(lambda);
                    }
                    // Xử lý Single Value
                    else
                    {
                        object? value;
                        if (string.IsNullOrEmpty(filterValue))
                        {
                            value = null;
                        }
                        else
                        {
                            value = Convert.ChangeType(filterValue, underlyingType);
                        }

                        var constant = Expression.Constant(value, propertyType);
                        var equal = Expression.Equal(member, constant);
                        var lambda = Expression.Lambda<Func<T, bool>>(equal, parameter);
                        query = query.Where(lambda);
                    }
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