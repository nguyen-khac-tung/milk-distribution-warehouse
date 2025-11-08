namespace MilkDistributionWarehouse.Utilities
{
    public class PrimaryKeyUtility
    {
        public static string GenerateKey(string namePart, string typePart, long? customTimestamp = null)
        {
            long timestamp = customTimestamp ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            var customName = namePart.ToUpper().Trim().Replace(" ", "_");

            var customType = typePart.ToUpper().Trim();

            return $"{customName}_{customType}_{timestamp}";
        }

    }
}
