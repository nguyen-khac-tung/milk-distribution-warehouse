using System;

namespace MilkDistributionWarehouse.Utilities
{
    public static class DateTimeUtility
    {

        public static DateTime Now()
        {
            TimeZoneInfo timeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
        }
    }
}

