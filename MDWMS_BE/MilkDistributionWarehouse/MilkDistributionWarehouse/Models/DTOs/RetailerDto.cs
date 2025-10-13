using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class RetailerDto
    {
        [JsonPropertyOrder(0)]
        public int RetailerId { get; set; }
        [JsonPropertyOrder(1)]
        public string RetailerName { get; set; }
        [JsonPropertyOrder(2)]
        public string Phone { get; set; }
        [JsonPropertyOrder(3)]
        public int Status { get; set; }
    }

    public class RetailerDetail : RetailerDto
    {
        [JsonPropertyOrder(4)]
        public string Email { get; set; }
        [JsonPropertyOrder(5)]
        public string Phone { get; set; }
        [JsonPropertyOrder(6)]
        public string TaxCode { get; set; }
        [JsonPropertyOrder(7)]
        public string Address { get; set; }
    }

    public class RetailerCreate
    {
        [Required(ErrorMessage = "Tên nhà bán lẻ không được bỏ trống.")]
        [MaxLength(255, ErrorMessage = "Độ dài tên nhà bán lẻ không được vượt quá 255 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên nhà bán lẻ không được chứa các ký tự đặc biệt")]
        public string RetailerName { get; set; }
        [Required(ErrorMessage = "Mã số thuế không được bỏ trống.")]
        [RegularExpression(@"^\d{10}(\d{3})?$", ErrorMessage = "Mã số thuế phải gồm 10 hoặc 13 chữ số.")]
        public string TaxCode { get; set; }
        [Required(ErrorMessage = "Email không được bỏ trống.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [MaxLength(255, ErrorMessage = "Độ dài email không được vượt quá 255 ký tự.")]
        public string Email { get; set; }
        [Required(ErrorMessage = "Địa chỉ nhà cung cấp không được bỏ trống.")]
        [MaxLength(255, ErrorMessage = "Độ dài địa chỉ không được vượt quá 255 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên địa chỉ không được chứa các ký tự đặc biệt")]
        public string Address { get; set; }
        [Required(ErrorMessage = "Số điện thoại không được bỏ trống.")]
        [RegularExpression(@"^(0|\+84)(\d{9})$", ErrorMessage = "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).")]
        public string Phone { get; set; }

    }

    public class RetailerUpdate : RetailerCreate
    {
        [Required]
        public int RetailerId { get; set; }
        public int? Status { get; set; }
    }
}
