using AutoMapper;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Security.Claims;

namespace MilkDistributionWarehouse.Services
{
    public interface IUserService
    {
        Task<(string, UserDto?)> GetUserProfile(int? userId);
        Task<(string, UserDetailDto?)> GetUserDetail(int? userId);
        Task<string> DeleteUser(int? userId);

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

        public async Task<(string, UserDto?)> GetUserProfile(int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null) return ("User not found.", null);

            return ("", _mapper.Map<UserDto>(user));
        }

        public async Task<(string, UserDetailDto?)> GetUserDetail(int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null) return ("Không tìm thấy người dùng!".ToMessageForUser(), null);

            var userDetail = _mapper.Map<UserDetailDto>(user);
            userDetail.Roles = user.Roles.Select(r => r.RoleName).ToList();

            return ("", userDetail);
        }

        public async Task<string> DeleteUser(int? userId)
        {
            if (userId == null) return "UserId is invalid.";
            var user = await _userRepository.GetUserByIdWithAssociations(userId);
            if (user == null) return "Không tìm thấy người dùng!".ToMessageForUser();

            if (user.GoodsIssueNotes.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu xuất hàng.".ToMessageForUser();
            if (user.GoodsReceiptNotes.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu nhập hàng.".ToMessageForUser();
            if (user.PurchaseOrders.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn đặt hàng mua.".ToMessageForUser();
            if (user.SalesOrders.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn hàng bán.".ToMessageForUser();
            if (user.Batches.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử các lô hàng.".ToMessageForUser();
            if (user.Pallets.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử các pallet.".ToMessageForUser();
            if (user.StocktakingSheets.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu kiểm kê.".ToMessageForUser();
           
            user.Status = CommonStatus.Deleted;
            user.UpdateAt = DateTime.Now;
            var msg = await _userRepository.UpdateUser(user);
            if (msg.Length > 0) return "Xoá người dùng thất bại.".ToMessageForUser();  

            return "";
        }
    }
}
