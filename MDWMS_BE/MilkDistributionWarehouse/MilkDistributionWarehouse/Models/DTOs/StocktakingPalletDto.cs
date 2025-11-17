using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingPalletDto
    {
        public Guid StocktakingPalletId { get; set; }
        public string PalletId { get; set; }
        public string GoodsCode { get; set; }
        public string GooodsName { get; set; }
        public string BatchCode { get; set; }
        public int? ExpectedPackageQuantity { get; set; }
        public int? ActualPackageQuantity { get; set; }
        public int? Status { get; set; }
        public string Note { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class StocktakingPalletCreate
    {
        public Guid StocktakingLocationId { get; set; }
        public int LocationId { get; set; }
    }

    public class StocktakingPalletUpdateStatus
    {
        public Guid StocktakingPalletId { get; set; }
    }

    public class StocktakingPalletResponse
    {
        public Guid StocktakingPalletId { get; set; }
    }

    public class StocktakingPalletMissingStatus : StocktakingPalletUpdateStatus
    {
        public string Note { get; set; }
    }

    public class StocktakingPalletMatchStatus : StocktakingPalletUpdateStatus
    {
        public string Note { get; set; }
        [Required(ErrorMessage = "Số lượng thực tế trong kệ kê hàng là bắt buộc.")]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng thực tế phải lớn hơn hoặc bằng 0.")]
        public int ActualPackageQuantity { get; set; }
    }

    public class StocktakingPalletSurplusStatus : StocktakingPalletUpdateStatus
    {
        public string Note { get; set; }
        public int ActualPackageQuantity { get; set; }
    }

    public class StocktakingPalletScanner
    {
        public Guid StocktakingLocationId { get; set; }
        public string PalletId { get; set; }
    }

}
