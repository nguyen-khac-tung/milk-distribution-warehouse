using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IRetailerService
    {
        Task<(string, PageResult<RetailerDto>)> GetRetailers(PagedRequest request);
        Task<(string, RetailerDetail)> GetRetailerByRetailerId(int retailerId);
    }
    public class RetailerService : IRetailerService
    {
        private readonly IRetailerRepository _retailerRepository;
        private readonly IMapper _mapper;
        public RetailerService(IRetailerRepository retailerRepository, IMapper mapper)
        {
            _retailerRepository = retailerRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<RetailerDto>)> GetRetailers(PagedRequest request)
        {
            var retailerQuery = _retailerRepository.GetRetailers();

            var retailerDtos = retailerQuery.ProjectTo<RetailerDto>(_mapper.ConfigurationProvider);

            var items = await retailerDtos.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách nhà bán lẻ trống.".ToMessageForUser(), new PageResult<RetailerDto>());

            return ("", items);
        }

        public async Task<(string, RetailerDetail)> GetRetailerByRetailerId(int retailerId)
        {
            if(retailerId <= 0) 
                return ("RetailerId is invalid.", new RetailerDetail());

            var retailer = await _retailerRepository.GetRetailerByRetailerId(retailerId);

            if (retailer == null)
                return ("Không tìm thấy nhà bán lẻ.".ToMessageForUser(), new RetailerDetail());

            return ("", _mapper.Map<RetailerDetail>(retailer));
        }
    }
}
