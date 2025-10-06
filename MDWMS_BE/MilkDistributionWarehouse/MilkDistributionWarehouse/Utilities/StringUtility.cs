namespace MilkDistributionWarehouse.Utilities
{
    public static class StringUtility
    {
        public static string ToMessageForUser(this string message)
        {
            return "[User] " + message;
        }
    }
}
