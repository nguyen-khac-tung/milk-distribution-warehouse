using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class GoodsDto
    {
        public int GoodsId { get; set; }
        public string GoodsCode { get; set; }
        public string GoodsName { get; set; }
        public int CategoryId { get; set; }
        public int SupplierId { get; set; }
        public int StorageConditionId { get; set; }
        public int UnitMeasureId { get; set; }  
        public int Status { get; set; }
    }

    public class GoodsCreate
    {
        [Required, MaxLength(255)]
        public string GoodsCode { get; set; }
        [Required, MaxLength(255)]
        public string GoodsName { get; set; }
        [Required]
        public int CategoryId { get; set; }
        [Required]
        public int SupplierId { get; set; }
        [Required]
        public int StorageConditionId { get; set; }
        [Required]
        public int UnitMeasureId { get; set; }
    }

    public class GoodsUpdate : GoodsCreate
    {
        [Required]
        public int GoodsId { get; set; }    
        public int Status { get; set; }
    }
}
