using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{

    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public DateOnly? DoB { get; set; }
        public bool? Gender { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
    }

    public class UserDetailDto : UserDto
    {
        public int? Status { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

}
