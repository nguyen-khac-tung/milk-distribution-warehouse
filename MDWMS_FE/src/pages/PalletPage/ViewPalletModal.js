import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Button } from "../../components/ui/button";
import { X } from "lucide-react";
import { ComponentIcon } from "../../components/IconComponent/Icon";
import { getPalletDetail } from "../../services/PalletService";
import Loading from "../../components/Common/Loading";
import Barcode from "react-barcode";

export function PalletDetail({ palletId, onClose }) {
    const [pallet, setPallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBarcodeHovered, setIsBarcodeHovered] = useState(false);

    useEffect(() => {
        const fetchPalletDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getPalletDetail(palletId);

                if (response && response.success !== false && response.data) {
                    setPallet(response.data);
                } else {
                    setError(response?.message || "Không thể tải thông tin pallet");
                }
            } catch (err) {
                console.error("Error fetching pallet detail:", err);
                setError("Có lỗi xảy ra khi tải thông tin pallet");
            } finally {
                setLoading(false);
            }
        };

        if (palletId) {
            fetchPalletDetail();
        }
    }, [palletId]);

    // Don't render if no palletId
    if (!palletId) return null;

    const truncateUuid = (uuid) => {
        if (!uuid) return "N/A";
        if (uuid.length <= 10) return uuid;
        return `${uuid.substring(0, 6)}...${uuid.substring(uuid.length - 4)}`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 1:
            case "1":
                return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 border border-green-200">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-green-700">Đã đưa vào vị trí</span>
                    </div>
                );
            case 2:
            case "2":
                return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-50 border border-red-200">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-red-700">Chưa đưa vào vị trí</span>
                    </div>
                );
            case 3:
            case "3":
                return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span className="text-sm font-medium text-gray-700">Đã xóa</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span className="text-sm font-medium text-gray-700">Không xác định ({status})</span>
                    </div>
                );
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
                    <Loading size="large" text="Đang tải chi tiết pallet..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-red-600">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!pallet) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-slate-600">Không có dữ liệu để hiển thị</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-4 max-h-[75vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-slate-800">Chi tiết pallet</h1>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Pallet Info Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <ComponentIcon name="pallet" size={24} color="#3b82f6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Pallet</h2>
                                    <p className="text-slate-600 mt-1">Thông tin chi tiết pallet</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                {pallet.status !== undefined && pallet.status !== null ? getStatusBadge(pallet.status) : (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200">
                                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                        <span className="text-sm font-medium text-gray-700">Chưa xác định</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <ComponentIcon name="qrcode" size={20} color="#3b82f6" />
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Mã pallet</p>
                                        <p className="text-sm text-blue-800 font-semibold truncate">{truncateUuid(pallet.palletId)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                    <ComponentIcon name="package" size={20} color="#10b981" />
                                    <div>
                                        <p className="text-sm text-green-600 font-medium">Số lượng thùng</p>
                                        <p className="text-lg text-green-800 font-bold">{pallet.packageQuantity?.toLocaleString() || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-3">
                                    <ComponentIcon name="box" size={20} color="#8b5cf6" />
                                    <div>
                                        <p className="text-sm text-purple-600 font-medium">{pallet.unitOfMeasure || "Đơn vị"}/thùng</p>
                                        <p className="text-lg text-purple-800 font-bold">{pallet.unitPerPackage?.toLocaleString() || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                <div className="flex items-center gap-3">
                                    <ComponentIcon name="shoppingCart" size={20} color="#f97316" />
                                    <div>
                                        <p className="text-sm text-orange-600 font-medium">Tổng số {pallet.unitOfMeasure || "đơn vị"}/pallet</p>
                                        <p className="text-lg text-orange-800 font-bold">
                                            {pallet.packageQuantity && pallet.unitPerPackage
                                                ? `${(pallet.packageQuantity * pallet.unitPerPackage).toLocaleString()} ${pallet.unitOfMeasure || ""}`
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Mã vạch pallet */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <ComponentIcon name="qrcode" size={20} color="#475569" />
                                    </div>
                                    Mã pallet
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="bg-white p-4 rounded-lg border border-slate-200 relative"
                                    onMouseEnter={() => setIsBarcodeHovered(true)}
                                    onMouseLeave={() => setIsBarcodeHovered(false)}
                                >
                                    <div className="flex flex-col items-center justify-center">
                                        <div className={`transition-all duration-300 ${isBarcodeHovered ? 'scale-110' : 'scale-100'}`}>
                                            <Barcode
                                                value={pallet.palletId || ""}
                                                height={isBarcodeHovered ? 60 : 40}
                                                width={isBarcodeHovered ? 1.2 : 0.8}
                                                margin={5}
                                                displayValue={false}
                                                fontSize={isBarcodeHovered ? 14 : 12}
                                                textMargin={6}
                                                format="CODE128"
                                            />
                                        </div>
                                        <p className={`font-mono text-slate-800 break-all text-center mt-3 transition-all duration-300 ${isBarcodeHovered ? 'text-base font-bold' : 'text-sm'}`}>
                                            {pallet.palletId}
                                        </p>
                                    </div>

                                    {/* Overlay popup khi hover */}
                                    {isBarcodeHovered && (
                                        <div
                                            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                                            onMouseMove={(e) => {
                                                // Đóng khi chuột di chuyển vào vùng nền đen (không phải content box)
                                                if (e.target === e.currentTarget) {
                                                    setIsBarcodeHovered(false);
                                                }
                                            }}
                                        >
                                            <div
                                                className="bg-white rounded-xl shadow-2xl p-6 max-w-xl w-full mx-4 border-2 border-slate-300"
                                                onMouseLeave={() => setIsBarcodeHovered(false)}
                                            >
                                                <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">MÃ PALLET</h3>
                                                <div className="flex flex-col items-center justify-center">
                                                    <Barcode
                                                        value={pallet.palletId || ""}
                                                        height={70}
                                                        width={1.2}
                                                        margin={10}
                                                        displayValue={false}
                                                        fontSize={14}
                                                        textMargin={8}
                                                        format="CODE128"
                                                    />
                                                    <p className="text-base font-mono font-bold text-slate-800 break-all text-center mt-4">
                                                        {pallet.palletId}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thông tin người tạo */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <ComponentIcon name="user" size={20} color="#8b5cf6" />
                                    </div>
                                    Thông tin người tạo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-white p-4 rounded-lg border border-purple-200">
                                    <InfoRow
                                        icon="user"
                                        label="Người tạo"
                                        value={pallet.createByName || "N/A"}
                                        iconColor="#8b5cf6"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thông tin vị trí */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ComponentIcon name="mapPin" size={20} color="#3b82f6" />
                                    </div>
                                    Thông tin vị trí
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-white p-4 rounded-lg border border-blue-200 space-y-3">
                                    <InfoRow
                                        icon="mapPin"
                                        label="Mã vị trí"
                                        value={pallet?.locationCode || pallet?.LocationCode || "N/A"}
                                        iconColor="#3b82f6"
                                    />
                                    <InfoRow
                                        icon="building"
                                        label="Khu vực"
                                        value={pallet?.areaName || pallet?.AreaName || "N/A"}
                                        iconColor="#3b82f6"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thông tin lô hàng */}
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <ComponentIcon name="batch" size={20} color="#10b981" />
                                    </div>
                                    Thông tin lô hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
                                    <InfoRow
                                        icon="batch"
                                        label="Mã lô hàng"
                                        value={pallet.batchCode || "N/A"}
                                        iconColor="#10b981"
                                    />
                                    <InfoRow
                                        icon="package"
                                        label="Tên hàng hóa"
                                        value={pallet.goodsName || "N/A"}
                                        iconColor="#10b981"
                                    />
                                    <InfoRow
                                        icon="calendar"
                                        label="Ngày sản xuất"
                                        value={pallet.manufacturingDate ? new Date(pallet.manufacturingDate).toLocaleDateString('vi-VN') : "N/A"}
                                        iconColor="#10b981"
                                    />
                                    <InfoRow
                                        icon="calendar"
                                        label="Ngày hết hạn"
                                        value={pallet.expiryDate ? new Date(pallet.expiryDate).toLocaleDateString('vi-VN') : "N/A"}
                                        iconColor="#10b981"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Action Buttons - Fixed Footer */}
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

function InfoRow({ icon, label, value, iconColor = "#6b7280" }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
                <ComponentIcon name={icon} size={16} color={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
                <div className="text-sm text-slate-800 break-all font-medium">{value}</div>
            </div>
        </div>
    );
}
