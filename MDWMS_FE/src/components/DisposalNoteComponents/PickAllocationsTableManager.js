import React from "react";
import { CheckCircle } from "lucide-react";
import { getPickAllocationStatusMeta } from "../../pages/DisposalNotePage/DisposalNoteStatus";

const PickAllocationsTableManager = ({
    pickAllocations = [],
}) => {
    if (!pickAllocations || pickAllocations.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Không có thông tin lấy hàng
            </div>
        );
    }

    // Tổng số lượng
    const totalQuantity = pickAllocations.reduce(
        (sum, pick) => sum + (pick.pickPackageQuantity || 0),
        0
    );
    const pickedCount = pickAllocations.filter((p) => p.status === 2).length;

    return (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">#</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">
                            Mã vị trí
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">
                            Số lượng (thùng)
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-800">
                            Trạng thái
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-800">
                            Đã lấy
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pickAllocations.map((pick, index) => {
                        const pickStatusInfo = getPickAllocationStatusMeta(pick.status);
                        const isPicked = pick.status === 2;

                        return (
                            <tr
                                key={pick.pickAllocationId}
                                className={`border-b hover:bg-gray-50 transition ${isPicked ? "bg-green-50" : ""
                                    }`}
                            >
                                <td className="px-4 py-2">{index + 1}</td>
                                <td className="px-4 py-2 font-medium text-gray-900">
                                    {pick.locationCode || "N/A"}
                                </td>
                                <td className="px-4 py-2 text-gray-900">
                                    {pick.pickPackageQuantity || 0}
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${pickStatusInfo.color}`}
                                    >
                                        {pickStatusInfo.label}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    {isPicked ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                    ) : (
                                        <div className="w-5 h-5 mx-auto rounded-full border-2 border-gray-300" />
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="bg-gray-50">
                    <tr>
                        <td colSpan={3} className="px-4 py-3 font-semibold text-gray-800">
                            Tổng cộng
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                            {totalQuantity} thùng
                        </td>
                        <td colSpan={2} className="px-4 py-3 text-gray-700 text-right">
                            Đã lấy: {pickedCount}/{pickAllocations.length}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default PickAllocationsTableManager;

