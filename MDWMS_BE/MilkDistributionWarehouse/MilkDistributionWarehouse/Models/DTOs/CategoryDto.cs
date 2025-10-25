using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class CategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Description { get; set; }
        public int Status { get; set; }
    }

    public class CategoryCreate
    {
        [Required(ErrorMessage = "Tên danh mục không được để trống")]
        [MaxLength(100)]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên danh mục không được chứa các ký tự đặc biệt")]
        public string CategoryName { get; set; }
        [MaxLength(100, ErrorMessage = "Độ dài của mô tả không được vượt quá 100 ký tự")]
        public string Description { get; set; }
    }

    public class CategoryUpdate : CategoryCreate
    {
        [Required(ErrorMessage = "Cần phải chọn danh mục để cập nhật")]
        public int CategoryId { get; set; }
    }
    public class CategoryDropDown
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
    }

    public class CategoryUpdateStatus
    {
        public int CategoryId { get;set; }
        public int Status { get; set; }
    }
}
