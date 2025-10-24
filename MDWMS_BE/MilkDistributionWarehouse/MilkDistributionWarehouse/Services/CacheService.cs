using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace MilkDistributionWarehouse.Services
{
    public interface ICacheService
    {
        //Lay gia tri tu cache
        bool TryGetValue<T>(string key, out T? value);

        //Luu gia tri vao cache
        void Set<T>(string key, T value);
        void Set<T>(string key, T value, int absoluteExpirationMinutes, int slidingExpirationMinutes);

        //Xoa cache
        void Remove(string key);
        void RemoveByPattern(string pattern);

        //Lay hoac tao cache 
        Task<T> GetOrCreatedAsync<T>(string key, Func<Task<T>> factory, int absoluteExpirationMinutes, int slidingExpirationMinutes);

        //Helper methods cho dropdown
        string GenerateDropdownCacheKey(string entityType, string filterType, object? filterValue);
        void InvalidateDropdownCache(string entityType, string filterType, object? filterValue);
    }
    public class CacheService : ICacheService
    {
        private readonly IMemoryCache _cache;
        private readonly ConcurrentDictionary<string, object> _cacheKeys;
        private const int DEFAULT_ABSOLUTE_EXPIRATION_MINUTES = 30;
        private const int DEFAULT_SLIDING_EXPIRATION_MINUTES = 10;
        public CacheService(IMemoryCache cache)
        {
            _cache = cache;
            _cacheKeys = new ConcurrentDictionary<string, object>();
        }

        public string GenerateDropdownCacheKey(string entityType, string filterType, object? filterValue)
        {
            return $"dropdown_{entityType}_{filterType}_{filterValue ?? "null"}";
        }

        public async Task<T> GetOrCreatedAsync<T>(string key, Func<Task<T>> factory, int absoluteExpirationMinutes, int slidingExpirationMinutes)
        {
            if (TryGetValue<T>(key, out var cachedValue))
            {
                return cachedValue!;
            }

            var newValue = await factory();
            Set(key, newValue, absoluteExpirationMinutes, slidingExpirationMinutes);
            return newValue;
        }

        public void InvalidateDropdownCache(string entityType, string filterType, object? filterValue)
        {
            var key = GenerateDropdownCacheKey(entityType, filterType, filterValue);
            Remove(key);
        }

        public void Remove(string key)
        {
            _cache.Remove(key);
            _cacheKeys.TryRemove(key, out _);
        }

        public void RemoveByPattern(string pattern)
        {
            var regex = new Regex(pattern, RegexOptions.IgnoreCase);
            var keysToRemove = _cacheKeys.Keys.Where(key => regex.IsMatch(key)).ToList();

            foreach (var key in keysToRemove)
            {
                Remove(key);
            }
        }

        public void Set<T>(string key, T value)
        {
            Set(key, value, DEFAULT_ABSOLUTE_EXPIRATION_MINUTES, DEFAULT_SLIDING_EXPIRATION_MINUTES);
        }

        public void Set<T>(string key, T value, int absoluteExpirationMinutes, int slidingExpirationMinutes)
        {
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(absoluteExpirationMinutes),
                SlidingExpiration = TimeSpan.FromMinutes(slidingExpirationMinutes),
                Priority = CacheItemPriority.Normal
            };

            _cache.Set(key, value, cacheOptions);
            _cacheKeys.TryAdd(key, value);
        }

        public bool TryGetValue<T>(string key, out T? value)
        {
            if(_cache.TryGetValue(key, out var cachedValue) && cachedValue is T typedValue)
            {
                value = typedValue;
                return true;
            }

            value = default;
            return false;
        }

    }
}
