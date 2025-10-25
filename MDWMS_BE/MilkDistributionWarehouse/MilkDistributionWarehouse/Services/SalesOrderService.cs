using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface ISalesOrderService
    {
        Task<(string, PageResult<T>?)> GetSalesOrderList<T>(PagedRequest request, int? userId);
        Task<(string, SalesOrderDetailDto?)> GetSalesOrderDeatail(Guid? saleOrderId);
    }


    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public SalesOrderService(ISalesOrderRepository salesOrderRepository,
                                 IUserRepository userRepository,
                                 IMapper mapper)
        {
            _salesOrderRepository = salesOrderRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<T>?)> GetSalesOrderList<T>(PagedRequest request, int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null || user.Roles.IsNullOrEmpty()) return ("User is not valid", null);
            var userRoles = user.Roles.Select(r => r.RoleId).ToList();
            var salesOrders = _salesOrderRepository.GetAllSalesOrders();

            if (userRoles.Contains(RoleType.SalesRepresentative))
                salesOrders = salesOrders.Where(s => s.Status != null && s.Status != SalesOrderStatus.Deleted);

            if (userRoles.Contains(RoleType.SaleManager))
                salesOrders = salesOrders.Where(s => s.Status != null && s.Status != SalesOrderStatus.Draft && s.Status != SalesOrderStatus.Deleted);

            if (userRoles.Contains(RoleType.WarehouseManager))
            {
                int[] statusAllowed = [SalesOrderStatus.Approved, SalesOrderStatus.AssignedForPicking, SalesOrderStatus.Picking, SalesOrderStatus.Completed]; 
                salesOrders = salesOrders.Where(s => s.Status != null && statusAllowed.Contains((int)s.Status));
            }

            if (userRoles.Contains(RoleType.WarehouseStaff))
            {
                int[] statusAllowed = [SalesOrderStatus.AssignedForPicking, SalesOrderStatus.Picking, SalesOrderStatus.Completed];
                salesOrders = salesOrders.Where(s => s.Status != null && statusAllowed.Contains((int)s.Status) && s.AssignTo == userId);
            }

            var salesOrderDtos = salesOrders.ProjectTo<T>(_mapper.ConfigurationProvider);
            var result = await salesOrderDtos.ToPagedResultAsync(request);
            if (!result.Items.Any())
                return ("Danh sách đơn bán hàng trống.".ToMessageForUser(), null);

            return ("", result);
        }

        public async Task<(string, SalesOrderDetailDto?)> GetSalesOrderDeatail(Guid? saleOrderId)
        {
            if(saleOrderId == null) return ("SaleOrderId is invalid.", null);
            var salesOrder = await _salesOrderRepository.GetSalesOrderById(saleOrderId);
            if(salesOrder == null) return ("Không tìm thấy đơn bán hàng này.", null);

            var salesOrderDetail = _mapper.Map<SalesOrderDetailDto>(salesOrder);
            return ("", salesOrderDetail);
        }
    }
}
