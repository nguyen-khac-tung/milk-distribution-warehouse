using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        //[Authorize(Roles = "Administrator, Business Owner")]
        [HttpGet("GetRoles")]
        public async Task<IActionResult> GetRoles()
        {
            var (msg, roles) = await _roleService.GetRoles();
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<List<RoleDto>>.ToResultOk(roles);
        }
    }
}
