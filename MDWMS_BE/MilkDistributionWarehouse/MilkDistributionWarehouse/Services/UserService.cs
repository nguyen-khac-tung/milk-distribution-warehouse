using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System.Security.Claims;

namespace MilkDistributionWarehouse.Services
{
    public interface IUserService
    {
        public string GetUserProfile(int userId, out UserProfileDto userProfile);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public string GetUserProfile(int userId, out UserProfileDto userProfile)
        {
            userProfile = null;

            var user = _userRepository.GetUserById(userId);
            if (user == null)
            {
                return "User not found.";
            }

            userProfile = new UserProfileDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                DoB = user.DoB,
                Gender = user.Gender,
                Phone = user.Phone,
                Address = user.Address,
            };

            return "";
        }
    }
}
