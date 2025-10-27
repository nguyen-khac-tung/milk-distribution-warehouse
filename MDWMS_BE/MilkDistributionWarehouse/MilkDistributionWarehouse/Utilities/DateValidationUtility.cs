using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

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

    public class NullableDateTimeConverter : JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String && string.IsNullOrEmpty(reader.GetString()))
            {
                return null;
            }

            if (DateTime.TryParse(reader.GetString(), out var date))
            {
                return date;
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                writer.WriteStringValue(value.Value);
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }

    public class NullableDateOnlyConverter : JsonConverter<DateOnly?>
    {
        public override DateOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String && string.IsNullOrEmpty(reader.GetString()))
            {
                return null;
            }

            if (DateOnly.TryParse(reader.GetString(), out var date))
            {
                return date;
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, DateOnly? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                writer.WriteStringValue(value.Value.ToString("O", CultureInfo.InvariantCulture));
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }
}
