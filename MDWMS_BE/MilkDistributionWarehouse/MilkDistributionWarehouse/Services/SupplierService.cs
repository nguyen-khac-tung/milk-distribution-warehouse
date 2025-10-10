using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface ISupplierService
    {
        Task<(string, PageResult<SupplierDto>)> GetSuppliers(PagedRequest request);
    }
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _supplierRepository;
        private readonly IMapper _mapper;
        public SupplierService(ISupplierRepository supplierRepository, IMapper mapper)
        {
            _supplierRepository = supplierRepository;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<SupplierDto>)> GetSuppliers(PagedRequest request)
        {
            var query = _supplierRepository.GetSuppliers();

            var supplierDtos = query.ProjectTo<SupplierDto>(_mapper.ConfigurationProvider);

            var items = await supplierDtos.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách nhà cung cấp trống.".ToMessageForUser(), new PageResult<SupplierDto>());

            return ("", items);
        }


    }
}
