import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ComponentIcon } from "../../../components/IconComponent/Icon";
import { X } from "lucide-react";

export function ModalAreaDetail({ area, onClose }) {
    const getStatusBadge = (status) => {
        switch (status) {
            case 1:
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Đang hoạt động
                    </span>
                );
            case 2:
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Ngừng hoạt động
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Không xác định
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-slate-800">Chi tiết khu vực</h1>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Area Info */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <ComponentIcon name="warehouse" size={20} color="#6b7280" />
                            <h2 className="text-xl font-semibold text-slate-800">
                                {area?.areaName}
                            </h2>
                            {getStatusBadge(area.status)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <ComponentIcon name="qrcode" size={16} color="#6b7280" />
                            <span className="text-sm font-medium">Mã khu vực:</span>{" "}
                            {area?.areaCode || "N/A"}
                        </div>
                    </div>

                    {/* Info Card */}
                    <Card className="bg-gray-50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <ComponentIcon name="info" size={20} color="#374151" />
                                Thông tin khu vực
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow
                                icon={<ComponentIcon name="warehouse" size={16} color="#6b7280" />}
                                label="Tên khu vực"
                                value={area?.areaName || "N/A"}
                            />
                            <InfoRow
                                icon={<ComponentIcon name="description" size={16} color="#6b7280" />}
                                label="Mô tả"
                                value={area?.description || "Không có mô tả"}
                            />
                        </CardContent>
                    </Card>

                    {/* Storage Condition */}
                    <Card className="bg-gray-50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                <ComponentIcon name="storageCondition" size={20} color="#374151" />
                                Điều kiện bảo quản
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Temperature */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ComponentIcon name="thermometer" size={40} color="#6b7280" />
                                        <span className="text-sm font-medium">Nhiệt độ</span>
                                    </div>
                                    <div className="rounded-lg bg-white p-4 border border-gray-200">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-slate-800">
                                                {area.temperatureMin ?? "N/A"}°C
                                            </span>
                                            <span className="text-slate-500">-</span>
                                            <span className="text-2xl font-bold text-slate-800">
                                                {area.temperatureMax ?? "N/A"}°C
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Khoảng nhiệt độ khuyến nghị
                                        </p>
                                    </div>
                                </div>

                                {/* Humidity */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ComponentIcon name="droplets" size={40} color="#6b7280" />
                                        <span className="text-sm font-medium">Độ ẩm</span>
                                    </div>
                                    <div className="rounded-lg bg-white p-4 border border-gray-200">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-slate-800">
                                                {area.humidityMin ?? "N/A"}%
                                            </span>
                                            <span className="text-slate-500">-</span>
                                            <span className="text-2xl font-bold text-slate-800">
                                                {area.humidityMax ?? "N/A"}%
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Khoảng độ ẩm khuyến nghị
                                        </p>
                                    </div>
                                </div>

                                {/* Light Level */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ComponentIcon name="sun" size={40} color="#6b7280" />
                                        <span className="text-sm font-medium">Ánh sáng</span>
                                    </div>
                                    <div className="rounded-lg bg-white p-4 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-slate-800">
                                                {area.lightLevel || "N/A"}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">Mức độ ánh sáng</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 text-right">
                {value}
            </span>
        </div>
    );
}
