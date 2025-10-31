// Trạng thái của Phiếu Nhập Kho (Goods Receipt Note)
export const GOODS_RECEIPT_NOTE_STATUS = {
    Draft: 1,            // Nháp
    PendingApproval: 2,  // Chờ duyệt
    Completed: 3         // Hoàn thành
};

// Trạng thái của từng dòng sản phẩm trong Phiếu Nhập Kho (Goods Receipt Note Item)
export const RECEIPT_ITEM_STATUS = {
    Receiving: 1,         // Đang kiểm nhập
    Inspected: 2,         // Đã kiểm tra
    PendingApproval: 3,   // Chờ duyệt
    Completed: 4          // Hoàn thành
};

export const GOODS_RECEIPT_NOTE_STATUS_META = {
    [GOODS_RECEIPT_NOTE_STATUS.Draft]: {
        label: 'Đang tiếp nhận',
        color: 'bg-gray-100 text-gray-800'
    },
    [GOODS_RECEIPT_NOTE_STATUS.PendingApproval]: {
        label: 'Chờ duyệt',
        color: 'bg-yellow-100 text-yellow-800'
    },
    [GOODS_RECEIPT_NOTE_STATUS.Completed]: {
        label: 'Hoàn thành',
        color: 'bg-green-100 text-green-800'
    }
};

export const RECEIPT_ITEM_STATUS_META = {
    [RECEIPT_ITEM_STATUS.Receiving]: {
        label: 'Đang kiểm nhập',
        color: 'bg-blue-100 text-blue-800'
    },
    [RECEIPT_ITEM_STATUS.Inspected]: {
        label: 'Đã kiểm tra',
        color: 'bg-green-100 text-green-800'
    },
    [RECEIPT_ITEM_STATUS.PendingApproval]: {
        label: 'Chờ duyệt',
        color: 'bg-yellow-100 text-yellow-800'
    },
    [RECEIPT_ITEM_STATUS.Completed]: {
        label: 'Hoàn thành',
        color: 'bg-emerald-100 text-emerald-800'
    }
};

export const getGoodsReceiptNoteStatusMeta = (status) =>
    GOODS_RECEIPT_NOTE_STATUS_META[Number(status)] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };

export const getReceiptItemStatusMeta = (status) =>
    RECEIPT_ITEM_STATUS_META[Number(status)] || { label: `Trạng thái ${status}`, color: 'bg-gray-100 text-gray-800' };
