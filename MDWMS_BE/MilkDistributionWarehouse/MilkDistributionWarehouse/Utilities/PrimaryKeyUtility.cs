using System.Globalization;
using System.Text;

namespace MilkDistributionWarehouse.Utilities
{
    public class PrimaryKeyUtility
    {
        public static string GenerateKey(string namePart, string typePart, long? customTimestamp = null)
        {
            long timestamp = customTimestamp ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            var customName = RemoveDiacritics(namePart.ToUpper().Trim().Replace(" ", "_"));

            var customType = RemoveDiacritics(typePart.ToUpper().Trim());

            return $"{customName}_{customType}_{timestamp}";
        }
        public static string GenerateStocktakingKey(long? customTimestamp = null)
        {
            string datePart = DateTime.UtcNow.ToString("yyyyMMdd");

            return GenerateKey("STK", datePart, customTimestamp);
        }

        public static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;

            string normalized = text.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();

            foreach (var c in normalized)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(c);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

    }
}
