using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class StocktakingAreaDetail
    {
        public Guid StocktakingAreaId { get; set; }
        public AreaDto.StocktakingAreaDto AreaDetail { get; set; }
        public int AssignTo { get; set; }
        public string AssignToName { get; set; }    
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

    public class StocktakingAreaDetailDto : StocktakingAreaDetail
    {
        public List<StocktakingLocationDto> StocktakingLocations { get; set; }
    }

}
