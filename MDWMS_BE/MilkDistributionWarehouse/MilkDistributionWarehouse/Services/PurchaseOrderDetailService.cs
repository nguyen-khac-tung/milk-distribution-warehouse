using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IPurchaseOrderDetailService
    {
        Task<(string, List<PurchaseOrderDetailDto>?)> GetPurchaseOrderDetailByPurchaseOrderId(string purchaseOrderId);
    }
    public class PurchaseOrderDetailService : IPurchaseOrderDetailService
    {
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly IMapper _mapper;
        public PurchaseOrderDetailService(IPurchaseOrderDetailRepository purchaseOrderDetailRepository, IMapper mapper)
        {
            _mapper = mapper;
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
        }

        public async Task<(string, List<PurchaseOrderDetailDto>?)> GetPurchaseOrderDetailByPurchaseOrderId(string purchaseOrderId)
        {
            var purchaseOrderDetailQuery = _purchaseOrderDetailRepository.GetPurchaseOrderDetail();

            var purchaseOrderDetail = purchaseOrderDetailQuery.ProjectTo<PurchaseOrderDetailDto>(_mapper.ConfigurationProvider);

            var result = await purchaseOrderDetail.Where(pod => pod.PurchaseOderId.Equals(purchaseOrderId)).ToListAsync();

            if (!result.Any())
                return ("Danh sách đơn đặt hàng chi tiết trống".ToMessageForUser(), default);

            return ("",  result);  
        }
            

    }
}
