import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { getAreaDropdown } from "../../../services/AreaServices";
import { createLocation } from "../../../services/LocationServices";
import CustomDropdown from "../../../components/Common/CustomDropdown";
import { extractErrorMessage } from "../../../utils/Validation";

export default function BulkCreateLocationModal({ isOpen, onClose, onSuccess }) {
    const [areas, setAreas] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [areaId, setAreaId] = useState("");
    const [rack, setRack] = useState("");
    const [rows, setRows] = useState([
        { rowName: "", columns: [""] } // Hàng mặc định
    ]);

    // Load khu vực dropdown khi mở modal
    useEffect(() => {
        if (isOpen) {
            loadAreas();
        }
    }, [isOpen]);

    const loadAreas = async () => {
        try {
            setLoadingData(true);
            const res = await getAreaDropdown({ pageNumber: 1, pageSize: 100 });
            setAreas(res?.items || res?.data?.items || res?.data || []);
        } catch (error) {
            const msg = extractErrorMessage(error, "Lỗi khi tải khu vực");
            window.showToast(msg, "error");
        } finally {
            setLoadingData(false);
        }
    };

    // Thêm hàng mới
    const handleAddRow = () => {
        setRows([...rows, { rowName: "", columns: [""] }]);
    };

    // Xóa hàng
    const handleRemoveRow = (index) => {
        const updated = rows.filter((_, i) => i !== index);
        setRows(updated);
    };

    // Cập nhật tên hàng
    const handleRowNameChange = (index, value) => {
        const updated = [...rows];
        updated[index].rowName = value;
        setRows(updated);
    };

    // Thêm cột
    const handleAddColumn = (rowIndex) => {
        const updated = [...rows];
        updated[rowIndex].columns.push("");
        setRows(updated);
    };

    // Xóa cột
    const handleRemoveColumn = (rowIndex, colIndex) => {
        const updated = [...rows];
        updated[rowIndex].columns.splice(colIndex, 1);
        setRows(updated);
    };

    // Cập nhật giá trị cột
    const handleColumnChange = (rowIndex, colIndex, value) => {
        const updated = [...rows];
        updated[rowIndex].columns[colIndex] = value;
        setRows(updated);
    };

    // Tổng số vị trí được tạo
    const totalPositions = rows.reduce((sum, r) => sum + r.columns.length, 0);

    // Submit
    const handleSubmit = async () => {
        if (!areaId || !rack) {
            window.showToast("Vui lòng chọn khu vực và nhập tên kệ", "error");
            return;
        }

        try {
            setLoading(true);

            // Gọi API tạo nhiều vị trí
            for (const row of rows) {
                for (const col of row.columns) {
                    const payload = {
                        areaId: parseInt(areaId),
                        rack,
                        row: parseInt(row.rowName),
                        column: parseInt(col),
                        isAvailable: true,
                    };
                    await createLocation(payload);
                }
            }

            window.showToast(`Tạo thành công ${totalPositions} vị trí`, "success");
            onSuccess?.();
            onClose?.();
        } catch (error) {
            const msg = extractErrorMessage(error, "Lỗi khi tạo vị trí");
            window.showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl mx-4 h-[650px] bg-white rounded-xl shadow-2xl overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h1 className="text-xl font-semibold text-slate-800">
                        Tạo Nhiều Vị Trí Cùng Lúc
                    </h1>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <ComponentIcon name="close" size={20} color="#6b7280" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Thông tin chung */}
                    <div className="bg-orange-50 border border-blue-100 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <p className="text-orange-800 font-medium">
                            Tạo nhiều vị trí cho cùng một kệ. Tổng số vị trí sẽ được tạo:{" "}
                            <span className="font-semibold">{totalPositions}</span>
                        </p>
                    </div>

                    {/* Khu vực & Kệ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Khu vực <span className="text-red-500">*</span>
                            </Label>
                            <CustomDropdown
                                value={areaId}
                                onChange={setAreaId}
                                options={[
                                    { value: "", label: "Chọn khu vực..." },
                                    ...areas.map((a) => ({
                                        value: a.areaId.toString(),
                                        label: a.areaName,
                                    })),
                                ]}
                                loading={loadingData}
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-slate-700">
                                Kệ <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="Nhập tên kệ..."
                                value={rack}
                                onChange={(e) => setRack(e.target.value)}
                                className="h-10 border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Cấu hình hàng và cột */}
                    <div className="space-y-5">
                        <h2 className="font-semibold text-slate-800 border-b pb-2">
                            Cấu hình hàng và cột
                        </h2>

                        {rows.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="border rounded-lg p-4 shadow-sm bg-white space-y-4"
                            >
                                {/* Header hàng */}
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-slate-700">
                                        Hàng {rowIndex + 1}
                                    </h3>
                                    {rows.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRow(rowIndex)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <ComponentIcon name="delete" size={18} color="red" />
                                        </button>
                                    )}
                                </div>

                                {/* Nhập tên hàng */}
                                <Input
                                    placeholder="Tên hàng (VD: 1, 2, 3...)"
                                    value={row.rowName}
                                    onChange={(e) =>
                                        handleRowNameChange(rowIndex, e.target.value)
                                    }
                                    className="h-10 border-slate-300 rounded-lg"
                                />

                                {/* Các cột */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-600">Các cột:</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {row.columns.map((col, colIndex) => (
                                            <div key={colIndex} className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder={`Cột ${colIndex + 1}`}
                                                    value={col}
                                                    onChange={(e) =>
                                                        handleColumnChange(
                                                            rowIndex,
                                                            colIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-20 text-center h-9"
                                                />
                                                {row.columns.length > 1 && (
                                                    <button
                                                        onClick={() =>
                                                            handleRemoveColumn(rowIndex, colIndex)
                                                        }
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <ComponentIcon name="trash" size={18} color="red" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-9 text-orange-600 border-orange-300 hover:bg-orange-50"
                                            onClick={() => handleAddColumn(rowIndex)}
                                        >
                                            + Thêm Cột
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-center">
                            <Button
                                type="button"
                                className="bg-orange-300 hover:bg-orange-400 text-white px-6 py-2 rounded-lg"
                                onClick={handleAddRow}
                            >
                                + Thêm Hàng
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 p-6 border-t bg-gray-50 rounded-b-xl">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg"
                        onClick={onClose}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={handleSubmit}
                        className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg disabled:opacity-50"
                    >
                        {loading ? "Đang tạo..." : `Tạo ${totalPositions} Vị Trí`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
