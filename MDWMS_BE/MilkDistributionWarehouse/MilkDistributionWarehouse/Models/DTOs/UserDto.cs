using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{

    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public DateOnly? DoB { get; set; }
        public bool? Gender { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "Full Name cannot be empty")]
        [MaxLength(100, ErrorMessage = "Full Name cannot be over 100 characters")]
        public string FullName { get; set; }

        public DateOnly? DoB { get; set; }

        public bool? Gender { get; set; }

        [RegularExpression("^\\d{10,11}$", ErrorMessage = "Phone number is not valid")]
        public string? Phone { get; set; }

        public string? Address { get; set; }
    }
}
