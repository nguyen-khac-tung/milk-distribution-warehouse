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
        Task<(string, BackOrderDto.BackOrderResponseDto)> CreateBackOrder(BackOrderDto.BackOrderRequestDto dto, int? userId);
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

            // Apply search filter before projection to reduce memory usage
            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                backOrders = backOrders.Where(bo =>
                    bo.Retailer.RetailerName.Contains(request.Search) ||
                    bo.Goods.GoodsName.Contains(request.Search));
            }

            var backOrderDtos = await backOrders
                .ProjectTo<BackOrderDto.BackOrderResponseDto>(_mapper.ConfigurationProvider)
                .ToPagedResultAsync(request);

            // Optimize by getting only distinct pairs
            var pairs = backOrderDtos.Items
                .Select(x => (x.GoodsId, x.GoodsPackingId))
                .Distinct()
                .ToList();

            var availableDict = await _backOrderRepository.GetAvailableQuantitiesAsync(pairs);

            // Update status in memory
            foreach (var item in backOrderDtos.Items)
            {
                item.StatusDinamic = availableDict.TryGetValue((item.GoodsId, item.GoodsPackingId), out var qty)
                    ? (qty > item.PackageQuantity ? BackOrderStatus.Available : BackOrderStatus.Unavailable)
                    : BackOrderStatus.Unavailable;
            }

            return ("", backOrderDtos);
        }

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> GetBackOrderById(Guid backOrderId)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Không tìm thấy back order.".ToMessageForUser(), new BackOrderDto.BackOrderResponseDto());

            var response = _mapper.Map<BackOrderDto.BackOrderResponseDto>(backOrder);

            var availableQuantity = await _backOrderRepository.GetAvailableQuantity(backOrder.GoodsId, backOrder.GoodsPackingId);
            response.StatusDinamic = availableQuantity > backOrder.PackageQuantity
                ? BackOrderStatus.Available
                : BackOrderStatus.Unavailable;

            return ("", response);
        }

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> CreateBackOrder(BackOrderDto.BackOrderRequestDto dto, int? userId)
        {
            if (userId == null)
                return ("The user is not logged into the system.".ToMessageForUser(), new BackOrderDto.BackOrderResponseDto());

            if (!await _backOrderRepository.ExistsRetailer(dto.RetailerId))
                return ("Retailer do not exist.", new BackOrderDto.BackOrderResponseDto());

            if (!await _backOrderRepository.ExistsGoods(dto.GoodsId))
                return ("Goods do not exist.", new BackOrderDto.BackOrderResponseDto());

            var entity = _mapper.Map<BackOrder>(dto);
            entity.BackOrderId = Guid.NewGuid();
            entity.CreatedBy = userId;
            entity.CreatedAt = DateTime.Now;
            var created = await _backOrderRepository.CreateBackOrder(entity);
            var createdResponse = await _backOrderRepository.GetBackOrderById(created.BackOrderId);
            var response = _mapper.Map<BackOrderDto.BackOrderResponseDto>(createdResponse);

            var availableQuantity = await _backOrderRepository.GetAvailableQuantity(created.GoodsId, created.GoodsPackingId);
            response.StatusDinamic = availableQuantity > created.PackageQuantity
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
            response.StatusDinamic = availableQuantity > backOrder.PackageQuantity
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
                var validEntities = new List<BackOrder>();

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

                    validEntities.Add(entity);
                }

                // Insert valid entities
                if (validEntities.Any())
                {
                    foreach (var entity in validEntities)
                    {
                        var created = await _backOrderRepository.CreateBackOrder(entity);
                        if (created == null)
                        {
                            // mark failure for this insert
                            result.FailedItems.Add(new BackOrderDto.FailedItem { Index = -1, Code = "", Error = "Create backorder failed.".ToMessageForUser() });
                            result.TotalFailed++;
                        }
                        else
                        {
                            result.TotalInserted++;
                        }
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