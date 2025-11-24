// Trạng thái của Phiếu Xuất Hủy (Disposal Note)
export const DISPOSAL_NOTE_STATUS = {
    Picking: 1,             // Đang lấy hàng
    PendingApproval: 2,     // Chờ duyệt
    Completed: 3            // Hoàn thành
};

// Export constants for use in other files
export { DISPOSAL_NOTE_STATUS as DN_STATUS };

// Trạng thái của từng dòng hàng hóa trong Phiếu Xuất Hủy (Disposal Note Item)
export const DISPOSAL_ITEM_STATUS = {
    Picking: 1,             // Đang lấy hàng
    Picked: 2,              // Đã lấy hàng
    PendingApproval: 3,     // Chờ duyệt
    Completed: 4            // Hoàn thành
};

// Trạng thái của PickAllocation (giống GoodsIssueNote)
export const PICK_ALLOCATION_STATUS = {
    UnScanned: 1,           // Chưa quét
    Scanned: 2              // Đã quét
};

export const DISPOSAL_NOTE_STATUS_META = {
    [DISPOSAL_NOTE_STATUS.Picking]: {
        label: 'Đang lấy hàng',
        color: 'bg-orange-100 text-orange-800'
    },
    [DISPOSAL_NOTE_STATUS.PendingApproval]: {
        label: 'Chờ duyệt',
        color: 'bg-yellow-100 text-yellow-800'
    },
    [DISPOSAL_NOTE_STATUS.Completed]: {
        label: 'Hoàn thành',
        color: 'bg-green-100 text-green-800'
    }
};

export const DISPOSAL_ITEM_STATUS_META = {
    [DISPOSAL_ITEM_STATUS.Picking]: {
        label: 'Đang lấy hàng',
        color: 'bg-orange-100 text-orange-800'
    },
    [DISPOSAL_ITEM_STATUS.Picked]: {
        label: 'Đã lấy hàng',
        color: 'bg-blue-100 text-blue-800'
    },
    [DISPOSAL_ITEM_STATUS.PendingApproval]: {
        label: 'Chờ duyệt',
        color: 'bg-yellow-100 text-yellow-800'
    },
    [DISPOSAL_ITEM_STATUS.Completed]: {
        label: 'Hoàn thành',
        color: 'bg-green-100 text-green-800'
    }
};

export const PICK_ALLOCATION_STATUS_META = {
    [PICK_ALLOCATION_STATUS.UnScanned]: {
        label: 'Chưa quét',
        color: 'bg-gray-100 text-gray-800'
    },
    [PICK_ALLOCATION_STATUS.Scanned]: {
        label: 'Đã quét',
        color: 'bg-green-100 text-green-800'
    }
};

export const getDisposalNoteStatusMeta = (status) =>
    DISPOSAL_NOTE_STATUS_META[Number(status)] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };

export const getDisposalItemStatusMeta = (status) =>
    DISPOSAL_ITEM_STATUS_META[Number(status)] || { label: `Trạng thái ${status}`, color: 'bg-gray-100 text-gray-800' };

export const getPickAllocationStatusMeta = (status) =>
    PICK_ALLOCATION_STATUS_META[Number(status)] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };

