import React from 'react';
import { CheckCircle } from 'lucide-react';
import { getPickAllocationStatusMeta } from '../../pages/GoodsIssueNotePage/goodsIssueNoteStatus';

const PickAllocationsTableManager = ({
    pickAllocations = []
}) => {
    if (!pickAllocations || pickAllocations.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">Không có thông tin lấy hàng</div>
        );
    }

    // Tính tổng số lượng
    const totalQuantity = pickAllocations.reduce((sum, pick) => sum + (pick.pickPackageQuantity || 0), 0);
    const pickedCount = pickAllocations.filter(p => p.status === 2).length;
    const totalCount = pickAllocations.length;

    return (
        <div className="space-y-4">
            {/* Tóm tắt */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Tổng số vị trí</div>
                        <div className="text-lg font-bold text-gray-900">{totalCount}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Đã lấy</div>
                        <div className="text-lg font-bold text-green-600">{pickedCount}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-600 mb-1">Tổng số lượng</div>
                        <div className="text-lg font-bold text-blue-600">{totalQuantity} thùng</div>
                    </div>
                </div>
            </div>

            {/* Danh sách vị trí dạng card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pickAllocations.map((pick, index) => {
                    const pickStatusInfo = getPickAllocationStatusMeta(pick.status);
                    const isPicked = pick.status === 2;

                    return (
                        <div
                            key={pick.pickAllocationId}
                            className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${isPicked
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">Vị trí #{index + 1}</div>
                                    <div className="font-semibold text-gray-900 text-sm mb-2">
                                        {pick.locationCode || 'N/A'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isPicked ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Số lượng:</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {pick.pickPackageQuantity} thùng
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Trạng thái:</span>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${pickStatusInfo.color}`}>
                                        {pickStatusInfo.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PickAllocationsTableManager;


