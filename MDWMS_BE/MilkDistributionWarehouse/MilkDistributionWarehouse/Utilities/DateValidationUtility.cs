using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Utilities
{
    public class DateOfBirthValidationAttribute : ValidationAttribute
    {
        public int MinimumAge { get; set; } = 13;
        public int MaximumAge { get; set; } = 120;

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value == null)
                return new ValidationResult("Ngày sinh không được bỏ trống.");

            if (value is not DateOnly dob)
                return new ValidationResult("Định dạng ngày sinh không hợp lệ.");

            var today = DateOnly.FromDateTime(DateTime.Today);

            if (dob > today)
                return new ValidationResult("Ngày sinh không được là ngày trong tương lai.");

            var age = today.Year - dob.Year;

            if (age < MinimumAge)
                return new ValidationResult($"Người dùng phải từ {MinimumAge} tuổi trở lên.");

            if (age > MaximumAge)
                return new ValidationResult($"Ngày sinh không hợp lệ (tuổi không được vượt quá {MaximumAge}).");

            return ValidationResult.Success;
        }
    }
}
