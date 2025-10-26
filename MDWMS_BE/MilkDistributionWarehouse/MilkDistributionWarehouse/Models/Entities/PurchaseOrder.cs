using System;
using System.Collections.Generic;

namespace MilkDistributionWarehouse.Models.Entities;

public partial class PurchaseOrder
{
    public Guid PurchaseOderId { get; set; }

    public int? Status { get; set; }

    public int? SupplierId { get; set; }

    public int? ApprovalBy { get; set; }

    public int? CreatedBy { get; set; }

    public int? ArrivalConfirmedBy { get; set; }

    public int? AssignTo { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User ApprovalByNavigation { get; set; }

    public virtual User ArrivalConfirmedByNavigation { get; set; }

    public virtual User AssignToNavigation { get; set; }

    public virtual User CreatedByNavigation { get; set; }

    public virtual ICollection<GoodsReceiptNote> GoodsReceiptNotes { get; set; } = new List<GoodsReceiptNote>();
    
    public virtual ICollection<Pallet> Pallets { get; set; } = new List<Pallet>();

    public virtual ICollection<PurchaseOderDetail> PurchaseOderDetails { get; set; } = new List<PurchaseOderDetail>();

    public virtual Supplier Supplier { get; set; }
}