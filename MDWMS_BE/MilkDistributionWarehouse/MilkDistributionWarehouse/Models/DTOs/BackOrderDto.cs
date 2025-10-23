using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class BackOrderDto
    {
        public class BackOrderResponseDto
        {
            public Guid BackOrderId { get; set; }
            public int RetailerId { get; set; }
            public string RetailerName { get; set; }
            public int GoodsId { get; set; }
            public string GoodsName { get; set; }
            public int Quantity { get; set; }
            public int CreatedBy { get; set; }
            public int Status { get; set; }
        }

        public class BackOrderRequestDto
        {
            [Required(ErrorMessage = "RetailerId không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "RetailerId phải là số nguyên dương")]
            public int RetailerId { get; set; }

            [Required(ErrorMessage = "GoodsId không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "GoodsId phải là số nguyên dương")]
            public int GoodsId { get; set; }

            [Required(ErrorMessage = "Quantity không được để trống")]
            [Range(1, int.MaxValue, ErrorMessage = "Quantity phải lớn hơn 0")]
            public int Quantity { get; set; }
        }

        public class BackOrderActiveDto
        {
            public Guid BackOrderId { get; set; }
            public string DisplayName { get; set; }
        }

        public class BackOrderUpdateStatusDto
        {
            public Guid BackOrderId { get; set; }
            public int Status { get; set; }
        }
    }
}