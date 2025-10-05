using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.Common;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;

namespace MilkDistributionWarehouse.Controllers
{
    public class UserController : Controller
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService) { 
            _userService = userService;
        }

        [HttpGet("Profile/{id}")]
        public IActionResult GetUserProfile(int id)
        {
            string msg = _userService.GetUserProfile(id, out UserProfileDto userProfile);
            if (msg.Length > 0) return BadRequest(ApiResponse<string>.ErrorResponse(msg));

            return Ok(ApiResponse<UserProfileDto>.SuccessResponse(userProfile));
        }
    }
}
