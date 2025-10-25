using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class UnitMeasureDto
    {
        public int UnitMeasureId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int Status { get; set; }
    }

    public class UnitMeasureCreate
    {
        [Required(ErrorMessage = "Tên đơn vị không được để trống")]
        [MaxLength(100, ErrorMessage = "Độ dài của tên đơn vị không được quá 100 ký tự")]
        [RegularExpression(@"^[\p{L}0-9\s_\-.,]+$", ErrorMessage = "Tên đơn vị không được chứa các ký tự đặc biệt")]
        public string Name { get; set; }
        [MaxLength(100, ErrorMessage = "Độ dài của mô tả không được vượt quá 100 ký tự")]
        public string Description { get; set; }
    }

    public class UnitMeasureUpdate : UnitMeasureCreate
    {
        [Required(ErrorMessage = "Cần phải chọn đơn vị để cập nhật")]
        public int UnitMeasureId { get; set; }
    }

    public class UnitMeasureDropDown
    {
        public int UnitMeasureId { get; set; }
        public string Name { get; set; }
    }

    public class UnitMeasureUpdateStatusDto
    {
        public int UnitMeasureId { get; set; }

        public int Status { get; set; }
    }
}
