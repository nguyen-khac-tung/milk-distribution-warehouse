using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface ISalesOrderService
    {
        Task<(string, PageResult<T>?)> GetSalesOrderList<T>(PagedRequest request, int? userId);
        Task<(string, SalesOrderDetailDto?)> GetSalesOrderDetail(Guid? saleOrderId);
        Task<(string, SalesOrderCreateDto?)> CreateSalesOrder(SalesOrderCreateDto salesOrderCreate, int? userId);
    }


    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IRetailerRepository _retailerRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public SalesOrderService(ISalesOrderRepository salesOrderRepository,
                                 IRetailerRepository retailerRepository,
                                 IUserRepository userRepository,
                                 IUnitOfWork unitOfWork,
                                 IMapper mapper)
        {
            _salesOrderRepository = salesOrderRepository;
            _retailerRepository = retailerRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
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
                salesOrders = salesOrders.Where(s => s.Status != null &&
                                                    (s.Status != SalesOrderStatus.Draft || (s.Status == SalesOrderStatus.Draft && s.CreatedBy == userId)));

            if (userRoles.Contains(RoleType.SaleManager))
                salesOrders = salesOrders.Where(s => s.Status != null && s.Status != SalesOrderStatus.Draft);

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

            if (request.Filters != null && request.Filters.Any())
            {
                var fromDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "fromdate");
                var toDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "todate");
                DateTime.TryParse(fromDate.Value, out DateTime startDate);
                DateTime.TryParse(toDate.Value, out DateTime endDate);
                salesOrders = salesOrders.Where(s => (startDate == default || s.EstimatedTimeDeparture >= startDate) &&
                                                     (endDate == default || s.EstimatedTimeDeparture <= endDate));
                if (fromDate.Key != null) request.Filters.Remove(fromDate.Key);
                if (toDate.Key != null) request.Filters.Remove(toDate.Key);
            }

            var salesOrderDtos = salesOrders.ProjectTo<T>(_mapper.ConfigurationProvider);
            var result = await salesOrderDtos.ToPagedResultAsync(request);
            if (!result.Items.Any())
                return ("Danh sách đơn bán hàng trống.".ToMessageForUser(), null);

            return ("", result);
        }

        public async Task<(string, SalesOrderDetailDto?)> GetSalesOrderDetail(Guid? saleOrderId)
        {
            if (saleOrderId == null) return ("SaleOrderId is invalid.", null);
            var salesOrder = await _salesOrderRepository.GetSalesOrderById(saleOrderId);
            if (salesOrder == null) return ("Không tìm thấy đơn bán hàng này.".ToMessageForUser(), null);

            var salesOrderDetail = _mapper.Map<SalesOrderDetailDto>(salesOrder);
            return ("", salesOrderDetail);
        }

        public async Task<(string, SalesOrderCreateDto?)> CreateSalesOrder(SalesOrderCreateDto salesOrderCreate, int? userId)
        {
            if (salesOrderCreate == null) return ("Data sales order create is null.", null);

            if (salesOrderCreate.RetailerId != null && (await _retailerRepository.GetRetailerByRetailerId((int)salesOrderCreate.RetailerId)) == null)
                return ("Nhà bán lẻ không hợp lệ.".ToMessageForUser(), null);

            if(salesOrderCreate.EstimatedTimeDeparture!.Value.Date <= DateTime.Now.Date)
                return ("Ngày giao hàng không hợp lệ. Vui lòng chọn một ngày trong tương lai.".ToMessageForUser(), null);

            if (salesOrderCreate.SalesOrderItemDetailCreateDtos.IsNullOrEmpty()) 
                return ("Danh sách hàng hóa không được bỏ trống.".ToMessageForUser(), null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var salesOrder = _mapper.Map<SalesOrder>(salesOrderCreate);
                salesOrder.CreatedBy = userId;

                await _salesOrderRepository.CreateSalesOrder(salesOrder);

                await _unitOfWork.CommitTransactionAsync();
                return ("", salesOrderCreate);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Lưu đơn hàng thất bại.".ToMessageForUser(), null);
            }
        }
    }
}
