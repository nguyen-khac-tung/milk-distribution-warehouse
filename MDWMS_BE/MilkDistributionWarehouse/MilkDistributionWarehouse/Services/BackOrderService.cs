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

            var backOrderDtos = backOrders.ProjectTo<BackOrderDto.BackOrderResponseDto>(_mapper.ConfigurationProvider);
            var pagedResult = await backOrderDtos.ToPagedResultAsync(request);
            return ("", pagedResult);
        }

        public async Task<(string, BackOrderDto.BackOrderResponseDto)> GetBackOrderById(Guid backOrderId)
        {
            var backOrder = await _backOrderRepository.GetBackOrderById(backOrderId);
            if (backOrder == null)
                return ("Không tìm thấy back order.".ToMessageForUser(), new BackOrderDto.BackOrderResponseDto());

            return ("", _mapper.Map<BackOrderDto.BackOrderResponseDto>(backOrder));
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
            return ("", _mapper.Map<BackOrderDto.BackOrderResponseDto>(updated));
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