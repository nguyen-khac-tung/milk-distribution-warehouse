// ==================== BackOrderService.cs ====================
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Linq.Expressions;
using System.Reflection;

namespace MilkDistributionWarehouse.Services
{
    public interface IBackOrderService
    {
        Task<(string, PageResult<BackOrderDto.BackOrderResponseDto>)> GetBackOrders(PagedRequest request);
        Task<(string, BackOrderDto.BackOrderDetailDto)> GetBackOrderById(Guid backOrderId);
        Task<(string, BackOrderDto.BackOrderResponseCreateDto)> CreateBackOrder(BackOrderDto.BackOrderRequestDto dto, int? userId);
        Task<(string, BackOrderDto.BackOrderResponseDto)> UpdateBackOrder(Guid backOrderId, BackOrderDto.BackOrderRequestDto dto);
        Task<(string, BackOrderDto.BackOrderResponseDto)> DeleteBackOrder(Guid backOrderId);
        Task<(string, BackOrderDto.BackOrderBulkResponse)> CreateBackOrderBulk(BackOrderDto.BackOrderBulkCreate create, int? userId);
    }

    public class BackOrderService : IBackOrderService
    {
        private readonly IBackOrderRepository _backOrderRepository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public BackOrderService(IBackOrderRepository backOrderRepository, IMapper mapper, IUnitOfWork unitOfWork)
        {
            _backOrderRepository = backOrderRepository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        public async Task<(string, PageResult<BackOrderDto.BackOrderResponseDto>)> GetBackOrders(PagedRequest request)
        {
            var backOrders = _backOrderRepository.GetBackOrders();
            if (backOrders == null)
                return ("Không có back order nào.".ToMessageForUser(), new PageResult<BackOrderDto.BackOrderResponseDto>());

            // Extract StatusDinamic filter
            string? statusFilter = null;
            if (request.Filters != null && request.Filters.ContainsKey("StatusDinamic"))
            {
                statusFilter = request.Filters["StatusDinamic"]?.ToString();
            }

            // Apply search filter BEFORE projection
            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var searchTerm = request.Search.Trim();
                backOrders = backOrders.Where(bo =>
                    (bo.Retailer != null && bo.Retailer.RetailerName.Contains(searchTerm)) ||
                    (bo.Goods != null && bo.Goods.GoodsName.Contains(searchTerm)) ||
                    (bo.Goods != null && bo.Goods.UnitMeasure != null && bo.Goods.UnitMeasure.Name.Contains(searchTerm)) ||
                    (bo.CreatedByNavigation != null && bo.CreatedByNavigation.FullName.Contains(searchTerm)));
            }

            // Apply database-level filters manually (excluding StatusDinamic)
            if (request.Filters != null)
            {
                foreach (var filter in request.Filters)
                {
                    // Skip StatusDinamic as it's not a database column
                    if (filter.Key.Equals("StatusDinamic", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var property = typeof(BackOrder).GetProperty(filter.Key, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                    if (property != null)
                    {
                        var parameter = Expression.Parameter(typeof(BackOrder), "x");
                        var member = Expression.Property(parameter, property);
                        var propertyType = property.PropertyType;
                        var underlyingType = Nullable.GetUnderlyingType(propertyType) ?? propertyType;
                        var filterValue = filter.Value?.ToString() ?? "";

                        if (!string.IsNullOrEmpty(filterValue))
                        {
                            var value = Convert.ChangeType(filterValue, underlyingType);
                            var constant = Expression.Constant(value, propertyType);
                            var equal = Expression.Equal(member, constant);
                            var lambda = Expression.Lambda<Func<BackOrder, bool>>(equal, parameter);
                            backOrders = backOrders.Where(lambda);
                        }
                    }
                }
            }

            // Apply sorting at database level
            if (!string.IsNullOrWhiteSpace(request.SortField))
            {
                // Try to find a direct property on BackOrder first
                var property = typeof(BackOrder).GetProperty(request.SortField, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                if (property != null)
                {
                    var parameter = Expression.Parameter(typeof(BackOrder), "x");
                    var member = Expression.Property(parameter, property);
                    var keySelector = Expression.Lambda(member, parameter);

                    var methodName = request.SortAscending ? "OrderBy" : "OrderByDescending";
                    var method = typeof(Queryable).GetMethods()
                        .First(m => m.Name == methodName && m.GetParameters().Length == 2)
                        .MakeGenericMethod(typeof(BackOrder), property.PropertyType);

                    backOrders = (IQueryable<BackOrder>)method.Invoke(null, new object[] { backOrders, keySelector })!;
                }
                else
                {
                    // Map common DTO/consumer sort fields to entity navigation properties
                    var sort = request.SortField.Trim().ToLowerInvariant();
                    var methodName = request.SortAscending ? "OrderBy" : "OrderByDescending";

                    ParameterExpression param = Expression.Parameter(typeof(BackOrder), "x");
                    Expression? member = null;
                    Type? memberType = null;

                    switch (sort)
                    {
                        case "retailername":
                            member = Expression.Property(Expression.Property(param, "Retailer"), "RetailerName");
                            memberType = typeof(string);
                            break;
                        case "goodsname":
                            member = Expression.Property(Expression.Property(param, "Goods"), "GoodsName");
                            memberType = typeof(string);
                            break;
                        case "unitmeasurename":
                        case "unitmeasure":
                            // Goods.UnitMeasure.Name
                            member = Expression.Property(Expression.Property(Expression.Property(param, "Goods"), "UnitMeasure"), "Name");
                            memberType = typeof(string);
                            break;
                        case "createdbyname":
                        case "createdby":
                            member = Expression.Property(Expression.Property(param, "CreatedByNavigation"), "FullName");
                            memberType = typeof(string);
                            break;
                        default:
                            member = null;
                            break;
                    }

                    if (member != null && memberType != null)
                    {
                        var keySelector = Expression.Lambda(member, param);
                        var method = typeof(Queryable).GetMethods()
                            .First(m => m.Name == methodName && m.GetParameters().Length == 2)
                            .MakeGenericMethod(typeof(BackOrder), memberType);

                        backOrders = (IQueryable<BackOrder>)method.Invoke(null, new object[] { backOrders, keySelector })!;
                    }
                }
            }

            List<BackOrderDto.BackOrderResponseDto> allItems;

            if (!string.IsNullOrWhiteSpace(statusFilter))
            {
                // Fetch ALL filtered data (not paginated) for status calculation
                allItems = await backOrders
                    .ProjectTo<BackOrderDto.BackOrderResponseDto>(_mapper.ConfigurationProvider)
                    .ToListAsync();

                // Calculate status for all items
                var allPairs = allItems
                    .Select(x => (x.GoodsId, x.GoodsPackingId))
                    .Distinct()
                    .ToList();

                var allAvailableDict = await _backOrderRepository.GetAvailableQuantitiesAsync(allPairs);

                foreach (var item in allItems)
                {
                    item.StatusDinamic = allAvailableDict.TryGetValue((item.GoodsId, item.GoodsPackingId), out var qty)
                        ? (qty >= item.PackageQuantity ? BackOrderStatus.Available : BackOrderStatus.Unavailable)
                        : BackOrderStatus.Unavailable;
                }

                // Filter by StatusDinamic in memory
                allItems = allItems
                    .Where(x => x.StatusDinamic.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                // Apply pagination in memory
                var totalCount = allItems.Count;
                var pagedItems = allItems
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToList();

                return ("", new PageResult<BackOrderDto.BackOrderResponseDto>
                {
                    Items = pagedItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                });
            }
            else
            {
                // Normal pagination without StatusDinamic filter
                var totalCount = await backOrders.CountAsync();

                allItems = await backOrders
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ProjectTo<BackOrderDto.BackOrderResponseDto>(_mapper.ConfigurationProvider)
                    .ToListAsync();

                // Calculate status for paginated items
                var pairs = allItems
                    .Select(x => (x.GoodsId, x.GoodsPackingId))
                    .Distinct()
                    .ToList();

                var availableDict = await _backOrderRepository.GetAvailableQuantitiesAsync(pairs);

                foreach (var item in allItems)
                {
                    item.StatusDinamic = availableDict.TryGetValue((item.GoodsId, item.GoodsPackingId), out var qty)
                        ? (qty >= item.PackageQuantity ? BackOrderStatus.Available : BackOrderStatus.Unavailable)
                        : BackOrderStatus.Unavailable;
                }

                return ("", new PageResult<BackOrderDto.BackOrderResponseDto>
                {
                    Items = allItems,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                });
            }
        }



        public async Task<(string, BackOrderDto.BackOrderDetailDto)> GetBackOrderById(Guid backOrderId)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Không tìm thấy back order.".ToMessageForUser(), new BackOrderDto.BackOrderDetailDto());

            var response = _mapper.Map<BackOrderDto.BackOrderDetailDto>(backOrder);

            var availableQuantity = await _backOrderRepository.GetAvailableQuantity(backOrder.GoodsId, backOrder.GoodsPackingId);
            response.StatusDinamic = availableQuantity >= backOrder.PackageQuantity
                ? BackOrderStatus.Available
                : BackOrderStatus.Unavailable;

            return ("", response);
        }

        public async Task<(string, BackOrderDto.BackOrderResponseCreateDto)> CreateBackOrder(BackOrderDto.BackOrderRequestDto dto, int? userId)
        {
            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), new BackOrderDto.BackOrderResponseCreateDto());

            if (!await _backOrderRepository.ExistsRetailer(dto.RetailerId))
                return ("Retailer do not exist.", new BackOrderDto.BackOrderResponseCreateDto());

            if (!await _backOrderRepository.ExistsGoods(dto.GoodsId))
                return ("Goods do not exist.", new BackOrderDto.BackOrderResponseCreateDto());

            var entity = _mapper.Map<BackOrder>(dto);
            entity.BackOrderId = Guid.NewGuid();
            entity.CreatedBy = userId;
            entity.CreatedAt = DateTimeUtility.Now();

            var (createdBackOrder, isNew, previousQty) = await _backOrderRepository.CreateBackOrder(entity);
            if (createdBackOrder == null)
                return ("Tạo backorder thất bại.".ToMessageForUser(), new BackOrderDto.BackOrderResponseCreateDto());

            var createdResponse = await _backOrderRepository.GetBackOrderById(createdBackOrder.BackOrderId);
            var response = _mapper.Map<BackOrderDto.BackOrderResponseCreateDto>(createdResponse);

            response.IsNew = isNew;
            response.IsUpdated = !isNew;
            response.PreviousPackageQuantity = previousQty;

            var availableQuantity = await _backOrderRepository.GetAvailableQuantity(createdBackOrder.GoodsId, createdBackOrder.GoodsPackingId);
            response.StatusDinamic = availableQuantity >= createdBackOrder.PackageQuantity
                ? BackOrderStatus.Available
                : BackOrderStatus.Unavailable;

            return ("", response);
        }

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> UpdateBackOrder(Guid backOrderId, BackOrderDto.BackOrderRequestDto dto)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Back order do not exist.", new BackOrderDto.BackOrderResponseDto());

            if (!await _backOrderRepository.ExistsRetailer(dto.RetailerId))
                return ("Retailer do not exist.", new BackOrderDto.BackOrderResponseDto());

            if (!await _backOrderRepository.ExistsGoods(dto.GoodsId))
                return ("Goods do not exist.", new BackOrderDto.BackOrderResponseDto());

            backOrder.RetailerId = dto.RetailerId;
            backOrder.GoodsId = dto.GoodsId;
            backOrder.GoodsPackingId = dto.GoodsPackingId;
            backOrder.PackageQuantity = dto.PackageQuantity;
            backOrder.UpdateAt = DateTimeUtility.Now();

            var updated = await _backOrderRepository.UpdateBackOrder(backOrder);
            var updateResponse = await _backOrderRepository.GetBackOrderById(updated.BackOrderId);
            var response = _mapper.Map<BackOrderDto.BackOrderResponseDto>(updateResponse);

            var availableQuantity = await _backOrderRepository.GetAvailableQuantity(backOrder.GoodsId, backOrder.GoodsPackingId);
            response.StatusDinamic = availableQuantity >= backOrder.PackageQuantity
                ? BackOrderStatus.Available
                : BackOrderStatus.Unavailable;

            return ("", response);
        }

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> DeleteBackOrder(Guid backOrderId)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Back order do not exist.", new BackOrderDto.BackOrderResponseDto());

            var deleted = await _backOrderRepository.DeleteBackOrder(backOrderId);
            return ("", _mapper.Map<BackOrderDto.BackOrderResponseDto>(deleted));
        }

        public async Task<(string, BackOrderDto.BackOrderBulkResponse)> CreateBackOrderBulk(BackOrderDto.BackOrderBulkCreate create, int? userId)
        {
            var result = new BackOrderDto.BackOrderBulkResponse();

            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), result);

            if (create == null || create.BackOrders == null || !create.BackOrders.Any())
                return ("Danh sách backorder trống.".ToMessageForUser(), result);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                for (int i = 0; i < create.BackOrders.Count; i++)
                {
                    var dto = create.BackOrders[i];

                    if (!await _backOrderRepository.ExistsRetailer(dto.RetailerId))
                    {
                        result.FailedItems.Add(new BackOrderDto.FailedItem { Index = i, Code = dto.RetailerId.ToString(), Error = "Retailer do not exist.".ToMessageForUser() });
                        result.TotalFailed++;
                        continue;
                    }

                    if (!await _backOrderRepository.ExistsGoods(dto.GoodsId))
                    {
                        result.FailedItems.Add(new BackOrderDto.FailedItem { Index = i, Code = dto.GoodsId.ToString(), Error = "Goods do not exist.".ToMessageForUser() });
                        result.TotalFailed++;
                        continue;
                    }

                    var entity = _mapper.Map<BackOrder>(dto);
                    entity.BackOrderId = Guid.NewGuid();
                    entity.CreatedBy = userId;
                    entity.CreatedAt = DateTimeUtility.Now();

                    var (createdBackOrder, isNew, previousQty) = await _backOrderRepository.CreateBackOrder(entity);
                    if (createdBackOrder == null)
                    {
                        result.FailedItems.Add(new BackOrderDto.FailedItem { Index = i, Code = "", Error = "Create backorder failed.".ToMessageForUser() });
                        result.TotalFailed++;
                        continue;
                    }

                    if (isNew)
                    {
                        result.TotalInserted++;
                        result.InsertedItems.Add(new BackOrderDto.InsertedItem { Index = i, BackOrderId = createdBackOrder.BackOrderId, Quantity = createdBackOrder.PackageQuantity });
                    }
                    else
                    {
                        result.TotalUpdated++;
                        result.UpdatedItems.Add(new BackOrderDto.UpdatedItem
                        {
                            Index = i,
                            BackOrderId = createdBackOrder.BackOrderId,
                            PreviousPackageQuantity = previousQty,
                            NewPackageQuantity = createdBackOrder.PackageQuantity
                        });
                    }
                }
                if (create.BackOrders.Count == 1 && result.TotalFailed == 1 && result.TotalInserted == 0 && result.TotalUpdated == 0)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return ("Tạo backorder thất bại.".ToMessageForUser(), result);
                }
                await _unitOfWork.CommitTransactionAsync();
                return ("", result);
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}