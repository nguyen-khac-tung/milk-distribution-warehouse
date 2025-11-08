using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;

namespace MilkDistributionWarehouse.Services
{
    public interface IBackOrderService
    {
        Task<(string, PageResult<BackOrderDto.BackOrderResponseDto>)> GetBackOrders(PagedRequest request);
        Task<(string, BackOrderDto.BackOrderResponseDto)> GetBackOrderById(Guid backOrderId);
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

            // Extract and remove StatusDinamic filter before database query
            string? statusFilter = null;
            if (request.Filters != null && request.Filters.ContainsKey("StatusDinamic"))
            {
                statusFilter = request.Filters["StatusDinamic"]?.ToString();
                request.Filters.Remove("StatusDinamic");
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

            // Apply other filters (excluding StatusDinamic and search)
            if (request.Filters != null && request.Filters.Any())
            {
                foreach (var filter in request.Filters)
                {
                    // Apply database-level filters here if needed
                    // For now, we'll let ToPagedResultAsync handle them
                }
            }

            // Fetch ALL data (without pagination) if StatusDinamic filter is present
            List<BackOrderDto.BackOrderResponseDto> allItems;

            if (!string.IsNullOrWhiteSpace(statusFilter))
            {
                // Fetch all items for status calculation
                allItems = await backOrders
                    .ProjectTo<BackOrderDto.BackOrderResponseDto>(_mapper.ConfigurationProvider)
                    .ToListAsync();
            }
            else
            {
                // Normal pagination without StatusDinamic filter
                var requestWithoutSearch = new PagedRequest
                {
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize,
                    SortField = request.SortField,
                    SortAscending = request.SortAscending,
                    Filters = request.Filters,
                    Search = null
                };

                var pagedResult = await backOrders
                    .ProjectTo<BackOrderDto.BackOrderResponseDto>(_mapper.ConfigurationProvider)
                    .ToPagedResultAsync(requestWithoutSearch);

                allItems = pagedResult.Items.ToList();

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

                return ("", pagedResult);
            }

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
            var filteredItems = allItems
                .Where(x => x.StatusDinamic.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Apply sorting in memory
            if (!string.IsNullOrWhiteSpace(request.SortField))
            {
                var property = typeof(BackOrderDto.BackOrderResponseDto).GetProperty(request.SortField,
                    System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);

                if (property != null)
                {
                    filteredItems = request.SortAscending
                        ? filteredItems.OrderBy(x => property.GetValue(x)).ToList()
                        : filteredItems.OrderByDescending(x => property.GetValue(x)).ToList();
                }
            }

            // Apply pagination in memory
            var totalCount = filteredItems.Count;
            var pagedItems = filteredItems
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

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> GetBackOrderById(Guid backOrderId)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Không tìm thấy back order.".ToMessageForUser(), new BackOrderDto.BackOrderResponseDto());

            var response = _mapper.Map<BackOrderDto.BackOrderResponseDto>(backOrder);

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
            entity.CreatedAt = DateTime.Now;

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
            backOrder.UpdateAt = DateTime.Now;

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
                    entity.CreatedAt = DateTime.Now;

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

                await _unitOfWork.CommitTransactionAsync();
                return ("", result);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}