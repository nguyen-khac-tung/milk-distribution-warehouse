using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingAreaDto
    {
    }


    public class StocktakingAreaCreate
    {
        [Required(ErrorMessage = "AreaId là bắt buộc.")]
        [Range(1, int.MaxValue, ErrorMessage = "AreaId phải lớn hơn 0.")]
        public int AreaId { get; set; }

        [Required(ErrorMessage = "AssignTo là bắt buộc.")]
        [Range(1, int.MaxValue, ErrorMessage = "AssignTo phải lớn hơn 0.")]
        public int AssignTo { get; set; }
    }

    public class StocktakingAreaUpdate : StocktakingAreaCreate
    {
        public Guid StocktakingAreaId { get; set; }
    }

}
