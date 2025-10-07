namespace MilkDistributionWarehouse.Models.DTOs
{

    public class PageResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
    }
    public class Filter
    {
        public string? Search { get; set; }
        public int? Status { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
    }

}
