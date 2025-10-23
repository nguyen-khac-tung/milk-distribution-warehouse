using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using Online_Learning.Services.Ultilities;
using System.Security.Claims;
using System.Threading.Tasks;
using static System.Net.WebRequestMethods;

namespace MilkDistributionWarehouse.Services
{
    public interface IUserService
    {
        Task<(string, PageResult<UserDto>?)> GetUserList(PagedRequest request);
        Task<(string, UserProfileDto?)> GetUserProfile(int? userId);
        Task<(string, UserDetailDto?)> GetUserDetail(int? userId);
        Task<(string, UserDto?)> CreateUser(UserCreateDto userCreate);
        Task<(string, UserDto?)> UpdateUser(UserUpdateDto userUpdate);
        Task<string> UpdateUserStatus(UserStatusUpdateDto userUpdate);
        Task<string> DeleteUser(int? userId);

    }

    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly EmailUtility _emailUtility;
        private readonly IMapper _mapper;

        public UserService(IUserRepository userRepository,
                           IRoleRepository roleRepository,
                           EmailUtility emailUtility,
                           IMapper mapper)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _emailUtility = emailUtility;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<UserDto>?)> GetUserList(PagedRequest request)
        {
            var users = _userRepository.GetUsers();

            var userDtos = users.ProjectTo<UserDto>(_mapper.ConfigurationProvider);

            var userDtosResult = await userDtos.ToPagedResultAsync(request);

            if (!userDtosResult.Items.Any())
                return ("Danh sách người dùng trống".ToMessageForUser(), null);

            return ("", userDtosResult);
        }

        public async Task<(string, UserProfileDto?)> GetUserProfile(int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null) return ("User not found.", null);

            return ("", _mapper.Map<UserProfileDto>(user));
        }

        public async Task<(string, UserDetailDto?)> GetUserDetail(int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);
            var user = await _userRepository.GetUserById(userId);
            if (user == null) return ("Không tìm thấy người dùng!".ToMessageForUser(), null);

            var userDetail = _mapper.Map<UserDetailDto>(user);
            return ("", userDetail);
        }

        public async Task<(string, UserDto?)> CreateUser(UserCreateDto userCreate)
        {
            var msg = string.Empty;
            if (userCreate == null) return ("Data user create is null.", null);

            var userExist = await _userRepository.GetUserByEmail(userCreate.Email);
            if (userExist != null) return ("Email người dùng đã tồn tại trong hệ thống.".ToMessageForUser(), null);

            var userRole = await _roleRepository.GetRoleById(userCreate.RoleId);
            if (userRole == null) return ("Selected role is null.", null);

            var newUser = _mapper.Map<User>(userCreate);
            await AddRoleToUser(newUser, userRole);
            var password = GenerateRandomPassword();
            newUser.Password = BCrypt.Net.BCrypt.HashPassword(password);

            msg = await _userRepository.CreateUser(newUser);
            if (msg.Length > 0) return ("Thêm mới người dùng thất bại.", null);

            SendUserCredentialByEmail(newUser.Email, password);

            return ("", _mapper.Map<UserDto>(newUser));
        }

        public async Task<(string, UserDto?)> UpdateUser(UserUpdateDto userUpdate)
        {
            var msg = string.Empty;
            var userDuplicatedEmail = await _userRepository.GetUserByEmail(userUpdate.Email);
            if (userDuplicatedEmail != null && userUpdate.UserId != userDuplicatedEmail.UserId)
                return ("Email này đã có người dùng khác sử dụng.".ToMessageForUser(), null);

            var userExist = await _userRepository.GetUserById(userUpdate.UserId);
            if (userExist == null) return ("Updated user is null.", null);

            var userRole = await _roleRepository.GetRoleById(userUpdate.RoleId);
            if (userRole == null) return ("Selected role is null.", null);

            _mapper.Map(userUpdate, userExist);
            await AddRoleToUser(userExist, userRole);

            msg = await _userRepository.UpdateUser(userExist);
            if (msg.Length > 0) return ("Cập nhật người dùng thất bại.", null);

            return ("", _mapper.Map<UserDto>(userExist));
        }

        public async Task<string> UpdateUserStatus(UserStatusUpdateDto userUpdate)
        {
            var msg = string.Empty;
            var userExist = await _userRepository.GetUserById(userUpdate.UserId);
            if (userExist == null) return "Updated user is null.";

            if (userUpdate.Status != CommonStatus.Active && userUpdate.Status != CommonStatus.Inactive)
                return "Updated status is not found.";

            userExist.Status = userUpdate.Status;
            msg = await _userRepository.UpdateUser(userExist);
            if (msg.Length > 0) return "Cập nhật người dùng thất bại.";

            return "";
        }

        public async Task<string> DeleteUser(int? userId)
        {
            if (userId == null) return "UserId is invalid.";
            var user = await _userRepository.GetUserByIdWithAssociations(userId);
            if (user == null) return "Không tìm thấy người dùng!".ToMessageForUser();

            if (user.GoodsIssueNotes.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu xuất hàng.".ToMessageForUser();
            if (user.GoodsReceiptNotes.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu nhập hàng.".ToMessageForUser();
            if (user.PurchaseOrderCreatedByNavigations.Any() || user.PurchaseOrderApprovalByNavigations.Any() 
                || user.PurchaseOrderArrivalConfirmedByNavigations.Any() || user.PurchaseOrderAssignToNavigations.Any()) 
                return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn đặt hàng mua.".ToMessageForUser();
            if (user.SalesOrderCreatedByNavigations.Any() || user.SalesOrderAcknowledgedByNavigations.Any() 
                || user.SalesOrderApprovalByNavigations.Any() || user.SalesOrderAssignToNavigations.Any()) 
                return "Không thể xóa do người dùng này có liên quan đến lịch sử đơn hàng bán.".ToMessageForUser();
            if (user.Batches.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử các lô hàng.".ToMessageForUser();
            if (user.Pallets.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử các pallet.".ToMessageForUser();
            if (user.StocktakingSheets.Any()) return "Không thể xóa do người dùng này có liên quan đến lịch sử phiếu kiểm kê.".ToMessageForUser();

            user.Status = CommonStatus.Deleted;
            user.UpdateAt = DateTime.Now;
            var msg = await _userRepository.UpdateUser(user);
            if (msg.Length > 0) return "Xoá người dùng thất bại.".ToMessageForUser();

            return "";
        }

        private async Task AddRoleToUser(User? user, Role? role)
        {
            user.Roles.Clear();
            user.Roles.Add(role);

            if (role.RoleId == RoleType.BusinessOwner)
            {
                var roleAdministrator = await _roleRepository.GetRoleById(RoleType.Administrator);
                user.Roles.Add(roleAdministrator);
            }
        }


        private string GenerateRandomPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(chars => chars[random.Next(chars.Length)]).ToArray());
        }

        private async Task SendUserCredentialByEmail(string email, string password)
        {
            string emailBody = $@"
            <table cellpadding=""0"" cellspacing=""0"" border=""0"" style=""font-family: Arial, sans-serif;"">
                <tr>
                    <td>
                        <h3>Chào mừng bạn đến với hệ thống kho sữa Hoàng Hà,</h3>
                        <p>Tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập của bạn:</p>
                        <p><strong>Email (Tên đăng nhập):</strong> {email}</p>
                        <p><strong>Mật khẩu:</strong> <h2>{password}</h2></p>
                        <p>Vui lòng đăng nhập vào hệ thống theo đường link http://localhost:3000/login và đổi mật khẩu của bạn để đảm bảo an toàn.</p>
                        <br>
                        <p>Trân trọng,</p>
                        <p>Đội ngũ quản trị hệ thống kho sữa Hoàng Hà.</p>
                    </td>
                </tr>
            </table>";
            await _emailUtility.SendMail(email, "Thông tin tài khoản hệ thống kho sữa Hoàng Hà của bạn", emailBody);
        }
    }
}
