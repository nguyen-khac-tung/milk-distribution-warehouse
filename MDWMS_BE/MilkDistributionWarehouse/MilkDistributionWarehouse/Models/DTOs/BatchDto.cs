using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class BatchDto
    {
        public Guid BatchId { get; set; }

        public string BatchCode { get; set; }

        public int GoodsId { get; set; }

        public string GoodsName { get; set; }

        public DateOnly ManufacturingDate { get; set; }

        public DateOnly ExpiryDate { get; set; }

        public string? Description { get; set; }

        public int Status { get; set; }
    }

    public class BatchDropDownDto
    {
        public Guid BatchId { get; set; }
        public string BatchCode { get; set; }
    }

    public class BatchCreateDto
    {
        [Required(ErrorMessage = "Mã lô không được để trống")]
        [MaxLength(50, ErrorMessage = "Mã lô không được vượt quá 50 ký tự")]
        [RegularExpression(@"^[a-zA-Z0-9\-]+$", ErrorMessage = "Mã lô chỉ được chứa chữ, số và dấu gạch nối")]
        public string BatchCode { get; set; }

        [Required(ErrorMessage = "Sản phẩm không được để trống")]
        public int GoodsId { get; set; }

        [JsonConverter(typeof(NullableDateOnlyConverter))]
        [Required(ErrorMessage = "Ngày sản xuất không được để trống")]
        public DateOnly? ManufacturingDate { get; set; }

        [JsonConverter(typeof(NullableDateOnlyConverter))]
        [Required(ErrorMessage = "Ngày hết hạn không được để trống")]
        public DateOnly? ExpiryDate { get; set; }

        [MaxLength(250, ErrorMessage = "Mô tả không được vượt quá 250 ký tự")]
        public string? Description { get; set; }
    }

    public class BatchUpdateDto : BatchCreateDto
    {
        [Required(ErrorMessage = "Cần phải chọn lô để cập nhật")]
        public Guid BatchId { get; set; }
    }

    public class BatchUpdateStatusDto
    {
        [Required(ErrorMessage = "Mã lô không được để trống")]
        public Guid BatchId { get; set; }

        [Required(ErrorMessage = "Trạng thái không được để trống")]
        public int Status { get; set; }
    }
}
