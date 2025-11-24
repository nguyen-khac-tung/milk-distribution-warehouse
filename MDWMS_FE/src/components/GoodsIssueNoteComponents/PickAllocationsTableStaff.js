import React, { useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Barcode, RefreshCw, CheckCircle } from 'lucide-react';
import { getPickAllocationStatusMeta } from '../../pages/GoodsIssueNotePage/goodsIssueNoteStatus';
import { ISSUE_ITEM_STATUS } from '../../pages/GoodsIssueNotePage/goodsIssueNoteStatus';

const PickAllocationsTableStaff = ({
    pickAllocations = [],
    statusCode,
    onProceedPick,
    confirmingPickId,
    isWarehouseStaff,
    highlightedPickAllocationId // ID của pick allocation được highlight
}) => {
    // Refs để scroll đến row được highlight
    const rowRefs = useRef({});

    // Scroll đến row được highlight khi có thay đổi
    useEffect(() => {
        if (highlightedPickAllocationId && rowRefs.current[highlightedPickAllocationId]) {
            const rowElement = rowRefs.current[highlightedPickAllocationId];
            // Scroll đến row với smooth behavior
            rowElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [highlightedPickAllocationId]);

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
                        {statusCode !== ISSUE_ITEM_STATUS.Completed && (
                            <TableHead className="font-semibold text-center w-32">Hành động</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pickAllocations.map((pick, pickIndex) => {
                        const pickStatusInfo = getPickAllocationStatusMeta(pick.status);
                        const isPicked = pick.status === 2;
                        const isHighlighted = highlightedPickAllocationId === pick.pickAllocationId;

                        return (
                            <TableRow
                                key={pick.pickAllocationId}
                                ref={(el) => {
                                    if (el) {
                                        rowRefs.current[pick.pickAllocationId] = el;
                                    }
                                }}
                                className={`border-b border-gray-200 hover:bg-blue-50 transition-all duration-300 ${isPicked ? 'bg-green-50' : ''
                                    } ${isHighlighted ? 'bg-green-100 border-green-400 border-2 shadow-md' : ''
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
                                {statusCode !== ISSUE_ITEM_STATUS.Completed && (
                                    <TableCell className="text-center">
                                        {!isPicked && statusCode === ISSUE_ITEM_STATUS.Picking && isWarehouseStaff && (
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


