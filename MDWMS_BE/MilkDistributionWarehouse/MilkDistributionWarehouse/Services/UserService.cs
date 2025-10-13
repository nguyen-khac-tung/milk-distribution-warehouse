using AutoMapper;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using System.Security.Claims;

namespace MilkDistributionWarehouse.Services
{
    public interface IUserService
    {
        Task<(string, UserDto? userProfile)> GetUserProfile(int? userId);
    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public UserService(IUserRepository userRepository, IMapper mapper)
        {
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<(string, UserDto? userProfile)> GetUserProfile(int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null) return ("User not found.", null);

            return ("", _mapper.Map<UserDto>(user));
        }
    }
}
