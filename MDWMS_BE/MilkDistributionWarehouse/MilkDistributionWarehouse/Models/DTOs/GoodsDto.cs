using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsDto
    {
        public int GoodsId { get; set; }
        public string GoodsCode { get; set; }
        public string GoodsName { get; set; }
        public int CategoryId { get; set; }
        public int SupplierId { get; set; }
        public int StorageConditionId { get; set; }
        public int UnitMeasureId { get; set; }  
        public int Status { get; set; }
    }

    public class GoodsCreate
    {
        [Required(ErrorMessage = "Mã sản phẩm không được để trống")]
        [MaxLength(255, ErrorMessage = "Độ dài mã sản phẩm không được vượt quá 255 ký tự")]
        [RegularExpression(@"^[a-zA-Z0-9\s_-]+$", ErrorMessage = "Mã sản phẩm không được chứa các ký tự đặc biệt")]
        public string GoodsCode { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
        [MaxLength(255, ErrorMessage = "Độ dài tên sản phẩm không được vượt quá 255 ký tự")]
        [RegularExpression(@"^[a-zA-Z0-9\s_-]+$", ErrorMessage = "Tên sản phẩm không được chứa các ký tự đặc biệt")]
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

    public class GoodsUpdate : GoodsCreate
    {
        [Required(ErrorMessage = "Cần phải chọn sản phẩm để cập nhật")]
        public int GoodsId { get; set; }    
        public int Status { get; set; }
    }
}
