import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { ComponentIcon } from "../../../components/IconComponent/Icon";

export function ModalAreaDetail({ area, onClose }) {
    const getStatusBadge = (status) => {
        switch (status) {
            case 1:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Đang hoạt động</span>;
            case 2:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Ngừng hoạt động</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Không xác định</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">

                {/* Nút đóng góc trên */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="fixed top-6 right-6 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center z-20 bg-white shadow-lg border border-gray-200"
                        aria-label="Đóng"
                    >
                        <ComponentIcon name="close" size={16} color="#6b7280" />
                    </button>
                )}

                <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
                    {/* Header */}
                    <div className="mb-8 md:mb-12 relative">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <ComponentIcon name="warehouse" size={20} color="#6b7280" />
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{area?.areaName}</h1>
                                {getStatusBadge(area.status)}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ComponentIcon name="qrcode" size={20} color="#6b7280" />
                                <span className="font-mono text-sm">{area.areaCode}</span>
                            </div>
                        </div>
                    </div>

                    <Separator className="mb-8 md:mb-12" />

                    {/* Thông tin chung */}
                    <Card className="shadow-sm mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <ComponentIcon name="info" size={40} color="#374151" />
                                Thông tin khu vực
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow
                                icon={<ComponentIcon name="warehouse" size={20} color="#6b7280" />}
                                label="Tên khu vực"
                                value={area?.areaName || "N/A"}
                            />
                            <InfoRow
                                icon={<ComponentIcon name="description" size={20} color="#6b7280" />}
                                label="Mô tả"
                                value={area.description || "Không có mô tả"}
                            />
                            {/* <InfoRow
                                icon={<ComponentIcon name="calendar" size={20} color="#6b7280" />}
                                label="Ngày tạo"
                                value={new Date(area.createdAt).toLocaleString("vi-VN")}
                            />
                            <InfoRow
                                icon={<ComponentIcon name="calendar" size={20} color="#6b7280" />}
                                label="Ngày cập nhật"
                                value={new Date(area.updateAt).toLocaleString("vi-VN")}
                            /> */}
                        </CardContent>
                    </Card>

                    {/* Điều kiện bảo quản */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <ComponentIcon name="storageCondition" size={40} color="#374151" />
                                Điều kiện bảo quản
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-3">
                                {/* Nhiệt độ */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ComponentIcon name="thermometer" size={40} color="#6b7280" />
                                        <span className="text-sm font-medium">Nhiệt độ</span>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-foreground">{area.temperatureMin ?? "N/A"}°C</span>
                                            <span className="text-muted-foreground">-</span>
                                            <span className="text-2xl font-bold text-foreground">{area.temperatureMax ?? "N/A"}°C</span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">Khoảng nhiệt độ khuyến nghị</p>
                                    </div>
                                </div>

                                {/* Độ ẩm */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ComponentIcon name="droplets" size={40} color="#6b7280" />
                                        <span className="text-sm font-medium">Độ ẩm</span>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-foreground">{area.humidityMin ?? "N/A"}%</span>
                                            <span className="text-muted-foreground">-</span>
                                            <span className="text-2xl font-bold text-foreground">{area.humidityMax ?? "N/A"}%</span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">Khoảng độ ẩm khuyến nghị</p>
                                    </div>
                                </div>

                                {/* Ánh sáng */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ComponentIcon name="sun" size={40} color="#6b7280" />
                                        <span className="text-sm font-medium">Ánh sáng</span>
                                    </div>
                                    <div className="rounded-lg bg-muted/50 p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-foreground">{area.lightLevel || "N/A"}</span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">Mức độ ánh sáng khuyến nghị</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Nút đóng cuối trang */}
                {onClose && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-pink-50 border border-red-300 text-red-600 rounded-md hover:bg-pink-100 hover:border-red-400 transition-colors shadow-sm"
                        >
                            Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-sm font-semibold text-foreground text-right">{value}</span>
        </div>
    );
}
