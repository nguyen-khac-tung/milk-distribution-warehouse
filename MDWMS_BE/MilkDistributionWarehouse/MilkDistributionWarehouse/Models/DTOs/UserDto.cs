using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public int Status { get; set; }
        public DateTime? CreateAt { get; set; }
        public List<RoleDto> Roles { get; set; }
    }

    public class UserDetailDto : UserDto
    {
        public DateOnly? DoB { get; set; }
        public bool? Gender { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public DateTime? UpdateAt { get; set; }
    }

    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public DateOnly? DoB { get; set; }
        public bool? Gender { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
    }

    public class UserCreateDto
    {
        [Required(ErrorMessage = "Email không được bỏ trống.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [MaxLength(255, ErrorMessage = "Độ dài email không được vượt quá 255 ký tự.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Tên người dùng không được bỏ trống.")]
        [MaxLength(255, ErrorMessage = "Độ dài tên không được vượt quá 255 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên không được chứa các ký tự đặc biệt")]
        public string FullName { get; set; }

        [JsonConverter(typeof(NullableDateOnlyConverter))]
        [Required(ErrorMessage = "Ngày sinh không được bỏ trống.")]
        [DateOfBirthValidation(MinimumAge = 18, MaximumAge = 100)]
        public DateOnly? DoB { get; set; }

        public bool? Gender { get; set; } = true;

        [Required(ErrorMessage = "Số điện thoại không được bỏ trống.")]
        [RegularExpression(@"^(0|\+84)(\d{9})$", ErrorMessage = "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).")]
        public string Phone { get; set; }

        [Required(ErrorMessage = "Địa chỉ người dùng không được bỏ trống.")]
        [MaxLength(255, ErrorMessage = "Độ dài địa chỉ không được vượt quá 255 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,/]+$", ErrorMessage = "Địa chỉ không được chứa các ký tự đặc biệt không hợp lệ")]
        public string Address { get; set; }

        public int RoleId { get; set; }
    }

    public class UserUpdateDto : UserCreateDto
    {
        public int UserId { get; set; }
    }

    public class UserStatusUpdateDto
    {
        public int UserId { get; set; }
        public int Status { get; set; }
    }

    public class UserDropDown
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
    }

    public class UserAssignedDropDown
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
        public int PendingPurchaseOrders { get; set; }
        public int ProcessingPurchaseOrders { get; set; }
        public int PendingSalesOrders { get; set; }
        public int ProcessingSalesOrders { get; set; }
        public int PendingDisposalRequests { get; set; }
        public int ProcessingDisposalRequests { get; set; }
    }
}
