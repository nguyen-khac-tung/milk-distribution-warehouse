using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Services;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService) { 
            _userService = userService;
        }

        [Authorize]
        [HttpGet("GetUserProfile")]
        public async Task<IActionResult> GetUserProfile()
        {
            var (msg, userProfile) = await _userService.GetUserProfile(User.GetUserId());
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<UserProfileDto>.ToResultOk(userProfile);
        }

        [HttpGet("GetUserDetail/{id}")]
        public async Task<IActionResult> GetUserDetail(int? id)
        {
            var (msg, userDetail) = await _userService.GetUserDetail(id);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<UserDetailDto>.ToResultOk(userDetail);
        }

        [HttpPost("GetUserList")]
        public async Task<IActionResult> GetUserList(PagedRequest request)
        {
            var (msg, users) = await _userService.GetUserList(request);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<PageResult<UserDto>>.ToResultOk(users);
        }

        [HttpPost("CreateUser")]
        public async Task<IActionResult> CreateUser(UserCreateDto userCreate)
        {
            var (msg, user) = await _userService.CreateUser(userCreate);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<UserDto>.ToResultOk(user);
        }

        [HttpPut("UpdateUser")]
        public async Task<IActionResult> UpdateUser(UserUpdateDto userUpdate)
        {
            var (msg, user) = await _userService.UpdateUser(userUpdate);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<UserDto>.ToResultOk(user);
        }

        [HttpPut("UpdateUserStatus")]
        public async Task<IActionResult> UpdateUserStatus(UserStatusUpdateDto userUpdate)
        {
            var msg = await _userService.UpdateUserStatus(userUpdate);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }

        [HttpDelete("DeleteUser/{id}")]
        public async Task<IActionResult> DeleteUser(int? id)
        {
            var msg = await _userService.DeleteUser(id);
            if (msg.Length > 0) return ApiResponse<string>.ToResultError(msg);

            return ApiResponse<string>.ToResultOkMessage();
        }
    }
}
