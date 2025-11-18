using System.ComponentModel.DataAnnotations;

namespace MilkDistributionWarehouse.Models.DTOs
{
    public class NotificationDto
    {
        public Guid NotificationId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public int? Category { get; set; }
        public int? Status { get; set; }
        public int? UserId { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class NotificationMarkAsReadDto
    {
        [Required(ErrorMessage = "Danh sách ID thông báo không được để trống.")]
        [MinLength(1, ErrorMessage = "Phải chọn ít nhất một thông báo.")]
        public List<Guid>? NotificationIds { get; set; }
    }
}
