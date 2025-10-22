import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card } from "../../../components/ui/card";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { getAreaDropdown } from "../../../services/AreaServices";
import { createMultipleLocations } from "../../../services/LocationServices";
import CustomDropdown from "../../../components/Common/CustomDropdown";
import { extractErrorMessage, cleanErrorMessage } from "../../../utils/Validation";

export default function BulkCreateLocationModal({ isOpen, onClose, onSuccess, formData, setFormData }) {
    const [areas, setAreas] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loading, setLoading] = useState(false);
    // const [areaId, setAreaId] = useState("");
    // const [rack, setRack] = useState("");
    // const [rows, setRows] = useState([
    //     { rowName: "", columns: [""] }
    // ]);
    const { areaId, rack, rows } = formData;
    const setAreaId = (val) => setFormData((prev) => ({ ...prev, areaId: val }));
    const setRack = (val) => setFormData((prev) => ({ ...prev, rack: val }));
    const setRows = (val) => setFormData((prev) => ({ ...prev, rows: val }));

    const [errors, setErrors] = useState({});
    const [hasBackendErrors, setHasBackendErrors] = useState(false);
    const [successfulLocations, setSuccessfulLocations] = useState(new Set());
    const [failedLocations, setFailedLocations] = useState(new Map());

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

            const locations = [];
            const locationKeyMap = new Map(); // map index request -> key `${row}-${col}`
            let i = 0;

            for (const row of rows) {
                const parsedRow = parseInt(row.rowName);
                if (Number.isNaN(parsedRow)) continue;

                for (const col of row.columns) {
                    const parsedCol = parseInt(col);
                    if (Number.isNaN(parsedCol)) continue;

                    const key = `${parsedRow}-${parsedCol}`;

                    //Bỏ qua vị trí đã thành công
                    if (successfulLocations.has(key)) continue;

                    locations.push({
                        areaId: parseInt(areaId),
                        rack,
                        row: parsedRow,
                        column: parsedCol,
                        isAvailable: true,
                    });

                    locationKeyMap.set(i, key);
                    i++;
                }
            }

            if (locations.length === 0) {
                window.showToast("Không có vị trí mới hoặc bị lỗi cần tạo lại.", "info");
                return;
            }

            const response = await createMultipleLocations(locations);
            const failedItems = response?.failedItems || response?.data?.failedItems || [];

            const newSuccess = new Set(successfulLocations);
            const newFailed = new Map(failedLocations);

            // Mặc định: tất cả vị trí mới coi như thành công
            locationKeyMap.forEach((key) => {
                newSuccess.add(key);
                newFailed.delete(key);
            });

            // Cập nhật lại các lỗi
            failedItems.forEach((item) => {
                const key = locationKeyMap.get(item.index);
                const msg = cleanErrorMessage(item.error);
                newFailed.set(key, { error: msg });
                newSuccess.delete(key);
            });

            setSuccessfulLocations(newSuccess);
            setFailedLocations(newFailed);
            setHasBackendErrors(newFailed.size > 0);

            if (failedItems.length === 0) {
                window.showToast(`Tạo thành công ${locations.length} vị trí mới!`, "success");
                onSuccess?.();
                onClose?.();
            } else {
                window.showToast(
                    `Tạo thành công ${locations.length - failedItems.length}/${locations.length} vị trí. Còn ${failedItems.length} lỗi.`,
                    "warning"
                );
            }
        } catch (error) {
            const msg = extractErrorMessage(error, "Có lỗi xảy ra khi tạo vị trí");
            window.showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle close with error check
    const handleClose = () => {
        if (hasBackendErrors) {
            window.showToast("Vui lòng sửa lỗi trước khi đóng modal hoặc nhấn Hủy để bỏ qua", "warning");
            return;
        }
        onSuccess?.();
        onClose?.();
    };

    // Handle reset
    const handleReset = () => {
        setFormData({
            areaId: "",
            rack: "",
            rows: [{ rowName: "", columns: [""] }],
        });
        setErrors({});
        setHasBackendErrors(false);
        setSuccessfulLocations(new Set());
        setFailedLocations(new Map());
        onClose?.();
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
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <ComponentIcon name="close" size={20} color="#6b7280" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Thông tin chung */}
                    <div className={`border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${hasBackendErrors
                        ? 'bg-red-50 border-red-200'
                        : 'bg-orange-50 border-blue-100'
                        }`}>
                        <p className={`font-medium ${hasBackendErrors ? 'text-red-800' : 'text-orange-800'
                            }`}>
                            Tạo nhiều vị trí cho cùng một kệ. Tổng số vị trí sẽ được tạo:{" "}
                            <span className="font-semibold">{totalPositions}</span>
                            {hasBackendErrors && (
                                <span className="block mt-2 text-red-600 font-medium">
                                    Có lỗi cần sửa. Vui lòng sửa lỗi trước khi có thể đóng modal hoặc nhấn "Hủy" để bỏ qua.
                                </span>
                            )}
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

                        {rows.map((row, rowIndex) => {
                            // Check if this row has any failed locations
                            const rowHasErrors = row.columns.some((col, colIndex) => {
                                const globalIndex = rows.slice(0, rowIndex).reduce((sum, r) => sum + r.columns.length, 0) + colIndex;
                                return failedLocations.has(globalIndex);
                            });

                            return (
                                <Card
                                    key={rowIndex}
                                    className={`p-4 shadow-sm space-y-4 ${rowHasErrors ? 'border-red-200 bg-red-50' : 'border-slate-200'
                                        }`}
                                >
                                    {/* Header hàng */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-medium text-slate-700">
                                                Hàng {rowIndex + 1}
                                            </h3>
                                            {rowHasErrors && (
                                                <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                                    Có lỗi
                                                </span>
                                            )}
                                        </div>
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
                                            {row.columns.map((col, colIndex) => {
                                                // tạo key cố định theo hàng–cột (VD: "1-2")
                                                const rowValue = row.rowName;
                                                const key = `${rowValue}-${col}`;
                                                const failedLocation = failedLocations.get(key);
                                                const isDuplicateError = failedLocation?.error?.includes("tồn tại");

                                                return (
                                                    <div key={colIndex} className="flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                placeholder={`Cột ${colIndex + 1}`}
                                                                value={col}
                                                                onChange={(e) =>
                                                                    handleColumnChange(rowIndex, colIndex, e.target.value)
                                                                }
                                                                className={`w-20 text-center h-9 ${isDuplicateError
                                                                    ? "border-red-500"
                                                                    : successfulLocations.has(key)
                                                                        ? "border-green-500 bg-green-50"
                                                                        : ""
                                                                    }`}
                                                            />
                                                            {row.columns.length > 1 && (
                                                                <button
                                                                    onClick={() => handleRemoveColumn(rowIndex, colIndex)}
                                                                    className="text-red-500 hover:text-red-600"
                                                                >
                                                                    <ComponentIcon name="trash" size={18} color="red" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {isDuplicateError && (
                                                            <div className="text-xs text-red-600">Vị trí đã tồn tại</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                                </Card>
                            );
                        })}

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
                        onClick={handleReset}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={handleSubmit}
                        className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg disabled:opacity-50"
                    >
                        {loading ? "Đang tạo..." :
                            hasBackendErrors ? `Tạo ${totalPositions - successfulLocations.size} Vị Trí Còn Lại` :
                                `Tạo ${totalPositions} Vị Trí`}
                    </Button>
                </div>
            </div>
        </div>
    );
}

