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
        [Required(ErrorMessage = "Mã kiểm kê vị trí là bắt buộc.")]
        public Guid StocktakingLocationId { get; set; }
        [Required(ErrorMessage = "Mã vị trí là bắt buộc.")]
        public int LocationId { get; set; }
    }

    public class StocktakingPalletUpdateStatus
    {
        [Required(ErrorMessage = "Mã kiểm kê kệ kê hàng là bắt buộc.")]
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
        [Required(ErrorMessage = "Số lượng thực tế trong kệ kê hàng là bắt buộc.")]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng thực tế phải lớn hơn hoặc bằng 0.")]
        public int ActualPackageQuantity { get; set; }
    }

    public class StocktakingPalletMislocatedStatus : StocktakingPalletUpdateStatus
    {
        public string Note { get; set; }
        [Required(ErrorMessage = "Số lượng thực tế trong kệ kê hàng là bắt buộc.")]
        [Range(0, int.MaxValue, ErrorMessage = "Số lượng thực tế phải lớn hơn hoặc bằng 0.")]
        public int ActualPackageQuantity { get; set; }
    }


    public class StocktakingPalletScanner
    {
        [Required(ErrorMessage = "Mã kiểm kê vị trí là bắt buộc")]
        public Guid StocktakingLocationId { get; set; }
        [Required(ErrorMessage = "Mã kệ kê hàng là bắt buộc")]
        public string PalletId { get; set; }
    }

    public class StocktakingPalletInfo
    {
        public Guid? StocktakingLocationId { get; set; }
        public int? ActualPackageQuantity { get; set; }
        public int? Status { get; set; }
    }
}
