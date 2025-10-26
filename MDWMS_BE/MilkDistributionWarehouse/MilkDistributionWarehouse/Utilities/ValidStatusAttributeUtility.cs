using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace MilkDistributionWarehouse.Utilities
{
    public class ValidStatusAttributeUtility : ValidationAttribute
    {
        private readonly Type _statusClassType;
        public ValidStatusAttributeUtility(Type statusClassType)
        {
            _statusClassType = statusClassType;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null)
                return new ValidationResult("Giá trị trạng thái không được để trống!");

            if (value is not int statusValue)
                return new ValidationResult("Giá trị trạng thái phải là số nguyên.");

            var validValues = _statusClassType
                .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
                .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(int))
                .Select(f => (int)f.GetRawConstantValue()!)
                .ToList();

            if (validValues.Contains(statusValue))
                return ValidationResult.Success!;

            var message = $"Giá trị trạng thái không hợp lệ. ";

            return new ValidationResult(message);
        }
    }
}
