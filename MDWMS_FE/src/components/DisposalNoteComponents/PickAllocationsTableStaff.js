import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Barcode, RefreshCw, CheckCircle } from 'lucide-react';
import { getPickAllocationStatusMeta, DISPOSAL_ITEM_STATUS, DISPOSAL_NOTE_STATUS } from '../../pages/DisposalNotePage/DisposalNoteStatus';

const PickAllocationsTableStaff = ({
    pickAllocations = [],
    statusCode,
    onProceedPick,
    confirmingPickId,
    isWarehouseStaff,
    disposalNoteStatus // Disposal note status để kiểm tra
}) => {
    if (!pickAllocations || pickAllocations.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">Không có thông tin lấy hàng</div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-white">
                        <TableHead className="w-16 text-center font-semibold">STT</TableHead>
                        <TableHead className="font-semibold text-center">Kệ</TableHead>
                        <TableHead className="font-semibold text-center">Hàng</TableHead>
                        <TableHead className="font-semibold text-center">Cột</TableHead>
                        <TableHead className="font-semibold">Khu vực</TableHead>
                        <TableHead className="font-semibold text-left">Mã vị trí</TableHead>
                        <TableHead className="font-semibold text-center">Số lượng</TableHead>
                        <TableHead className="font-semibold text-center">Trạng thái</TableHead>
                        {statusCode !== DISPOSAL_ITEM_STATUS.Completed && (
                            <TableHead className="font-semibold text-center w-32">Hành động</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pickAllocations.map((pick, pickIndex) => {
                        const pickStatusInfo = getPickAllocationStatusMeta(pick.status);
                        const isPicked = pick.status === 2;

                        return (
                            <TableRow
                                key={pick.pickAllocationId}
                                className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${isPicked ? 'bg-green-50' : ''
                                    }`}
                            >
                                <TableCell className="text-center text-gray-900 font-medium">
                                    {pickIndex + 1}
                                </TableCell>
                                <TableCell className="text-center text-gray-900 font-semibold">
                                    {pick.rack}
                                </TableCell>
                                <TableCell className="text-center text-gray-900 font-semibold">
                                    {pick.row}
                                </TableCell>
                                <TableCell className="text-center text-gray-900 font-semibold">
                                    {pick.column}
                                </TableCell>
                                <TableCell className="text-gray-900 font-medium">
                                    {pick.areaName}
                                </TableCell>
                                <TableCell className="text-gray-700">
                                    {pick.locationCode}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-gray-900">
                                    {pick.pickPackageQuantity} thùng
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${pickStatusInfo.color}`}>
                                        {pickStatusInfo.label}
                                    </span>
                                </TableCell>
                                {statusCode !== DISPOSAL_ITEM_STATUS.Completed && (
                                    <TableCell className="text-center">
                                        {/* Nhân viên kho có thể quét pallet khi: 
                                            - Pick allocation chưa được quét (!isPicked)
                                            - Disposal note đang ở trạng thái "Picking" 
                                            (không cần kiểm tra detail status vì có thể detail đã chuyển sang "Picked" nhưng disposal note vẫn đang "Picking")
                                        */}
                                        {!isPicked && 
                                         disposalNoteStatus === DISPOSAL_NOTE_STATUS.Picking && 
                                         isWarehouseStaff && (
                                            <Button
                                                onClick={() => onProceedPick(pick.pickAllocationId)}
                                                disabled={confirmingPickId === pick.pickAllocationId}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-auto"
                                                size="sm"
                                            >
                                                {confirmingPickId === pick.pickAllocationId ? (
                                                    <>
                                                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                        Đang xử lý...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Barcode className="h-3 w-3 mr-1" />
                                                        Lấy hàng
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {isPicked && <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />}
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default PickAllocationsTableStaff;

