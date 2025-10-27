using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsDto
    {
        [JsonPropertyOrder(1)]
        public int GoodsId { get; set; }

        [JsonPropertyOrder(2)]
        public string GoodsCode { get; set; }

        [JsonPropertyOrder(3)]
        public string GoodsName { get; set; }

        [JsonPropertyOrder(4)]
        public int UnitMeasureId { get; set; }

        [JsonPropertyOrder(5)]
        public string UnitMeasureName { get; set; }

        [JsonPropertyOrder(6)]
        public int CategoryId { get; set; }

        [JsonPropertyOrder(7)]
        public string CategoryName { get; set; }

        [JsonPropertyOrder(8)]
        public int SupplierId { get; set; }

        [JsonPropertyOrder(9)]
        public string CompanyName { get; set; }

        [JsonPropertyOrder(10)]
        public int StorageConditionId { get; set; }

        [JsonPropertyOrder(11)]
        public int Status { get; set; }
    }

    public class GoodsDetail : GoodsDto
    {
        [JsonPropertyOrder(12)]
        public string BrandName { get; set; }

        [JsonPropertyOrder(13)]
        public string Address { get; set; }

        [JsonPropertyOrder(14)]
        public decimal? TemperatureMin { get; set; }

        [JsonPropertyOrder(15)]
        public decimal? TemperatureMax { get; set; }

        [JsonPropertyOrder(16)]
        public decimal? HumidityMin { get; set; }

        [JsonPropertyOrder(17)]
        public decimal? HumidityMax { get; set; }

        [JsonPropertyOrder(18)]
        public string? LightLevel { get; set; }
        public List<GoodsPackingDto> GoodsPackings { get;set; }
        [JsonPropertyOrder(19)]
        public bool IsDisable { get; set; }
    }

    public class GoodsCommonChange
    {
        [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
        [MaxLength(255, ErrorMessage = "Độ dài tên sản phẩm không được vượt quá 255 ký tự")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên sản phẩm không được chứa các ký tự đặc biệt")]
        public string GoodsName { get; set; }
        [Required(ErrorMessage = "Loại sản phẩm không được để trống")]
        public int CategoryId { get; set; }
        [Required(ErrorMessage = "Nhà cung cấp không được để trống")]
        public int SupplierId { get; set; }
        [Required(ErrorMessage = "Điều kiện lưu trữ không được để trống")]
        public int StorageConditionId { get; set; }
        [Required(ErrorMessage = "Đơn vị sản phẩm không được để trống")]
        public int UnitMeasureId { get; set; }
    }

    public class GoodsCreate : GoodsCommonChange
    {
        [Required(ErrorMessage = "Mã sản phẩm không được để trống")]
        [MaxLength(255, ErrorMessage = "Độ dài mã sản phẩm không được vượt quá 255 ký tự")]
        [RegularExpression(@"^[a-zA-Z0-9\s_-]+$", ErrorMessage = "Mã sản phẩm không được chứa các ký tự đặc biệt")]
        public string GoodsCode { get; set; }
        public List<GoodsPackingCreate> GoodsPackingCreates { get; set; }
    }

    public class GoodsUpdate : GoodsCommonChange
    {
        [Required(ErrorMessage = "Cần phải chọn sản phẩm để cập nhật")]
        public int GoodsId { get; set; }
    }

    public class GoodsDropDown
    {
        public int GoodsId { get; set; }
        public string GoodsName { get; set; }
    }

    public class GoodsDropDownAndUnitMeasure : GoodsDropDown
    {
        public int UnitMeasureId { get; set; }
        public string Name { get; set; }
    }

    public class GoodsUpdateStatus
    {
        public int GoodsId { get; set; }
        public int Status { get; set; }
    }

    public class GoodsCreateBulkDto
    {
        public string GoodsCode { get; set; }
        public string GoodsName { get; set; }
        public int CategoryId { get; set; }
        public int SupplierId { get; set; }
        public int StorageConditionId { get; set; }
        public int UnitMeasureId { get; set; }
    }

    public class GoodsBulkCreate
    {
        [Required]
        [MinLength(1, ErrorMessage = "Danh sách hàng hoá không được rỗng")]
        [MaxLength(1000, ErrorMessage = "Số lượng hàng hoá tối đa 1000 sản phẩm")]
        public List<GoodsCreateBulkDto> Goods { get; set; } = new();
    }

    public class GoodsBulkdResponse
    {
        public int TotalInserted { get; set; }
        public int TotalFailed { get; set; }
        public List<FailedItem> FailedItems { get; set; } = new();
    }
    public class FailedItem
    {
        public int Index { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
    }
}
