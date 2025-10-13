using MilkDistributionWarehouse.Models.Entities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class SupplierDto
    {
        [JsonPropertyOrder(0)]
        public int SupplierId { get; set; }
        [JsonPropertyOrder(1)]
        public string CompanyName { get; set; }
        [JsonPropertyOrder(2)]
        public string BrandName { get; set; }
        [JsonPropertyOrder(3)]
        public int Status { get; set; }
    }

    public class SupplierDetail : SupplierDto
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

    public class SupplierCreate
    {
        [Required(ErrorMessage = "Tên công ty không được bỏ trống.")]
        [MaxLength(255, ErrorMessage = "Độ dài tên công ty không được vượt quá 255 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên công ty không được chứa các ký tự đặc biệt")]
        public string CompanyName { get; set; }

        [Required(ErrorMessage = "Tên thương hiệu không được bỏ trống.")]
        [MaxLength(150, ErrorMessage = "Độ dài tên thương hiệu không được vượt quá 150 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên thương hiệu không được chứa các ký tự đặc biệt")]
        public string BrandName { get; set; }

        [Required(ErrorMessage = "Email không được bỏ trống.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [MaxLength(255, ErrorMessage = "Độ dài email không được vượt quá 255 ký tự.")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Số điện thoại không được bỏ trống.")]
        [RegularExpression(@"^(0|\+84)(\d{9})$", ErrorMessage = "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).")]
        public string Phone { get; set; }

        [Required(ErrorMessage = "Mã số thuế không được bỏ trống.")]
        [RegularExpression(@"^\d{10}(\d{3})?$", ErrorMessage = "Mã số thuế phải gồm 10 hoặc 13 chữ số.")]
        public string TaxCode { get; set; }

        [Required(ErrorMessage = "Địa chỉ nhà cung cấp không được bỏ trống.")]
        [MaxLength(255, ErrorMessage = "Độ dài địa chỉ không được vượt quá 255 ký tự.")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên địa chỉ không được chứa các ký tự đặc biệt")]
        public string Address { get; set; }
    }

    public class SupplierUpdate : SupplierCreate
    {
        [Required]
        public int SupplierId { get; set; }

        public int? Status { get; set; }
    }
}
