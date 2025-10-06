using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class CategoryDto
    {
        public string CategoryName { get; set; }
        public string Description { get; set; }
        public int Status { get; set; }
    }

    public class CategoryFilter
    {
        public string? CategorySearch { get; set; }
        public int? Status { get; set; }
    }

    public class CategoryCreate
    {
        [Required(ErrorMessage = "Category Name is require")]
        [MaxLength(100)]
        public string CategoryName { get; set; }
        [MaxLength(255)]
        public string Description { get; set; }
    }

    public class CategoryUpdate : CategoryCreate
    {
        [Required]
        public int CategoryId { get; set; }

        public int Status { get; set; }
    }
}
