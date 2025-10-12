using System.ComponentModel.DataAnnotations;
using MilkDistributionWarehouse.Constants;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StorageConditionDto
    {
        public class StorageConditionResponseDto
        {
            public int StorageConditionId { get; set; }

            public decimal TemperatureMin { get; set; }

            public decimal TemperatureMax { get; set; }

            public decimal HumidityMin { get; set; }

            public decimal HumidityMax { get; set; }

            public string LightLevel { get; set; }

            public int Status { get; set; }
        }

        public class StorageConditionCreateDto : IValidatableObject
        {
            [Required(ErrorMessage = "Nhiệt độ tối thiểu không được để trống!")]
            [Range(-50, 100, ErrorMessage = "Nhiệt độ tối thiểu phải nằm trong khoảng -50 đến 100°C!")]
            public decimal TemperatureMin { get; set; }

            [Required(ErrorMessage = "Nhiệt độ tối đa không được để trống!")]
            [Range(-50, 100, ErrorMessage = "Nhiệt độ tối đa phải nằm trong khoảng -50 đến 100°C!")]
            public decimal TemperatureMax { get; set; }

            [Required(ErrorMessage = "Độ ẩm tối thiểu không được để trống!")]
            [Range(0, 100, ErrorMessage = "Độ ẩm tối thiểu phải nằm trong khoảng 0% đến 100%!")]
            public decimal HumidityMin { get; set; }

            [Required(ErrorMessage = "Độ ẩm tối đa không được để trống!")]
            [Range(0, 100, ErrorMessage = "Độ ẩm tối đa phải nằm trong khoảng 0% đến 100%!")]
            public decimal HumidityMax { get; set; }

            [Required(ErrorMessage = "Mức độ sáng không được để trống!")]
            [RegularExpression("^(Low|Normal|High)$", ErrorMessage = "Mức độ sáng chỉ có thể là: Low, Normal hoặc High!")]
            public string LightLevel { get; set; }

            public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
            {
                if (TemperatureMin > TemperatureMax)
                    yield return new ValidationResult("Nhiệt độ tối thiểu không được lớn hơn nhiệt độ tối đa!", new[] { nameof(TemperatureMin), nameof(TemperatureMax) });

                if (HumidityMin > HumidityMax)
                    yield return new ValidationResult("Độ ẩm tối thiểu không được lớn hơn độ ẩm tối đa!", new[] { nameof(HumidityMin), nameof(HumidityMax) });
            }
        }

        public class StorageConditionUpdateDto : IValidatableObject
        {
            [Required(ErrorMessage = "Nhiệt độ tối thiểu không được để trống!")]
            [Range(-50, 100, ErrorMessage = "Nhiệt độ tối thiểu phải nằm trong khoảng -50 đến 100°C!")]
            public decimal TemperatureMin { get; set; }

            [Required(ErrorMessage = "Nhiệt độ tối đa không được để trống!")]
            [Range(-50, 100, ErrorMessage = "Nhiệt độ tối đa phải nằm trong khoảng -50 đến 100°C!")]
            public decimal TemperatureMax { get; set; }

            [Required(ErrorMessage = "Độ ẩm tối thiểu không được để trống!")]
            [Range(0, 100, ErrorMessage = "Độ ẩm tối thiểu phải nằm trong khoảng 0% đến 100%!")]
            public decimal HumidityMin { get; set; }

            [Required(ErrorMessage = "Độ ẩm tối đa không được để trống!")]
            [Range(0, 100, ErrorMessage = "Độ ẩm tối đa phải nằm trong khoảng 0% đến 100%!")]
            public decimal HumidityMax { get; set; }

            [Required(ErrorMessage = "Mức độ sáng không được để trống!")]
            [RegularExpression("^(Low|Normal|High)$", ErrorMessage = "Mức độ sáng chỉ có thể là: Low, Normal hoặc High!")]
            public string LightLevel { get; set; }

            [Range(CommonStatus.Active, CommonStatus.Deleted, ErrorMessage = "Trạng thái không hợp lệ (chỉ chấp nhận Active, Inactive, Deleted)!")]
            public int? Status { get; set; }

            public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
            {
                if (TemperatureMin >= TemperatureMax)
                    yield return new ValidationResult("Nhiệt độ tối thiểu không được lớn hơn nhiệt độ tối đa!", new[] { nameof(TemperatureMin), nameof(TemperatureMax) });

                if (HumidityMin >= HumidityMax)
                    yield return new ValidationResult("Độ ẩm tối thiểu không được lớn hơn độ ẩm tối đa!", new[] { nameof(HumidityMin), nameof(HumidityMax) });
            }
        }
    }
}
