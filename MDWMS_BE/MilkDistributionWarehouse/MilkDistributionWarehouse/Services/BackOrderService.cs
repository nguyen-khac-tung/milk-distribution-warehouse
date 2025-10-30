using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IBackOrderService
    {
        Task<(string, PageResult<BackOrderDto.BackOrderResponseDto>)> GetBackOrders(PagedRequest request);
        Task<(string, BackOrderDto.BackOrderResponseDto)> GetBackOrderById(Guid backOrderId);
        Task<(string, BackOrderDto.BackOrderResponseDto)> CreateBackOrder(BackOrderDto.BackOrderRequestDto dto, int? userId);
        Task<(string, BackOrderDto.BackOrderResponseDto)> UpdateBackOrder(Guid backOrderId, BackOrderDto.BackOrderRequestDto dto);
        Task<(string, BackOrderDto.BackOrderResponseDto)> DeleteBackOrder(Guid backOrderId);
    }

    public class BackOrderService : IBackOrderService
    {
        private readonly IBackOrderRepository _backOrderRepository;
        private readonly IMapper _mapper;

        public BackOrderService(IBackOrderRepository backOrderRepository, IMapper mapper)
        {
            _backOrderRepository = backOrderRepository;
            _mapper = mapper;
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
            return ("", _mapper.Map<BackOrderDto.BackOrderResponseDto>(createdResponse));
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

            _mapper.Map(dto, backOrder);
            backOrder.UpdateAt = DateTime.Now;

            var updated = await _backOrderRepository.UpdateBackOrder(backOrder);
            var updateResponse = await _backOrderRepository.GetBackOrderById(updated.BackOrderId);
            return ("", _mapper.Map<BackOrderDto.BackOrderResponseDto>(updateResponse));
        }

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> DeleteBackOrder(Guid backOrderId)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Back order do not exist.", new BackOrderDto.BackOrderResponseDto());

            var deleted = await _backOrderRepository.DeleteBackOrder(backOrderId);
            return ("", _mapper.Map<BackOrderDto.BackOrderResponseDto>(deleted));
        }
    }
}