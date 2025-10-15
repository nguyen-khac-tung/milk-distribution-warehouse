using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;

namespace MilkDistributionWarehouse.Services
{
    public interface IRoleService
    {
        Task<(string, List<RoleDto>?)> GetRoles();
    }

    public class RoleService : IRoleService
    {
        private readonly IRoleRepository _roleRepository;
        private readonly IMapper _mapper;

        public RoleService(IRoleRepository roleRepository, IMapper mapper)
        {
            _roleRepository = roleRepository;
            _mapper = mapper;
        }

        public async Task<(string, List<RoleDto>?)> GetRoles()
        {
            var roles = await _roleRepository.GetRoles();

            if (roles == null || !roles.Any()) return ("Danh sách vai trò trống", null);

            return ("", _mapper.Map<List<RoleDto>>(roles));
        }
    }
}
