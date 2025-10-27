import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { SALE_ORDER_STATUS, STATUS_LABELS } from "./StatusDisplaySaleOrder";

export default function SaleOrderStatsChart({
    saleOrderStats = {
        totalOrders: 0,
        draftOrders: 0,
        pendingOrders: 0,
        rejectedOrders: 0,
        approvedOrders: 0,
        assignedOrders: 0,
        pickingOrders: 0,
        completedOrders: 0,
        statusStats: [],
    },
    className = "",
}) {
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    const { totalOrders } = saleOrderStats;
    console.log("toorng", totalOrders)
    const toggleDetails = () => setIsDetailsExpanded(!isDetailsExpanded);

    return (
        <div className={`${className}`}>
            {/* Dynamic color safety for Tailwind JIT */}
            <div className="hidden bg-gray-500 bg-yellow-500 bg-blue-500 bg-red-500 bg-purple-500 bg-orange-500 bg-emerald-500"></div>

            <Card className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 py-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-sm font-semibold text-slate-700">
                            <div className="p-1.5 bg-orange-100 rounded-lg mr-2">
                                <Activity className="h-4 w-4 text-orange-600" />
                            </div>
                            Phân tích đơn hàng bán
                        </CardTitle>
                        <button
                            onClick={toggleDetails}
                            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-all duration-200 group text-sm h-[38px]"
                            title={isDetailsExpanded ? "Ẩn chi tiết" : "Hiện chi tiết"}
                        >
                            <span className="font-medium">
                                {isDetailsExpanded ? "Ẩn" : "Hiện"}
                            </span>
                            {isDetailsExpanded ? (
                                <ChevronUp className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
                            ) : (
                                <ChevronDown className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" />
                            )}
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-3">
                    <div
                        className={`transition-all duration-500 ease-in-out ${isDetailsExpanded
                            ? "opacity-100 max-h-[800px] overflow-visible"
                            : "opacity-0 max-h-0 overflow-hidden"
                            }`}
                    >
                        {/* Flowchart for Sale Order */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-md p-3 border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                                    <Activity className="h-4 w-4 mr-1.5 text-slate-500" />
                                    Trạng thái đơn hàng bán
                                </h3>
                                <div className="text-xs text-slate-500">
                                    Tổng:{" "}
                                    <span className="font-semibold text-slate-700">
                                        {totalOrders}
                                    </span>{" "}
                                    đơn
                                </div>
                            </div>

                            <div className="relative w-full h-auto bg-gradient-to-br from-slate-50 to-white rounded-md p-2 overflow-x-auto shadow-sm">
                                <svg
                                    className="w-full h-auto"
                                    viewBox="0 0 1000 250"
                                    preserveAspectRatio="xMidYMid meet"
                                >
                                    <defs>
                                        <filter id="dropshadow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feDropShadow
                                                dx="2"
                                                dy="2"
                                                stdDeviation="3"
                                                floodColor="#000000"
                                                floodOpacity="0.2"
                                            />
                                        </filter>
                                    </defs>

                                    {/* Grid background */}
                                    <defs>
                                        <pattern
                                            id="grid"
                                            width="50"
                                            height="50"
                                            patternUnits="userSpaceOnUse"
                                        >
                                            <path
                                                d="M 50 0 L 0 0 0 50"
                                                fill="none"
                                                stroke="#e2e8f0"
                                                strokeWidth="0.5"
                                                opacity="0.3"
                                            />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />

                                    {[
                                        {
                                            status: SALE_ORDER_STATUS.Draft,
                                            count: saleOrderStats.draftOrders || 0,
                                            x: 150,
                                            y: 80,
                                            color: "#6b7280",
                                            textColor: "#374151",
                                        },
                                        {
                                            status: SALE_ORDER_STATUS.PendingApproval,
                                            count: saleOrderStats.pendingOrders || 0,
                                            x: 320,
                                            y: 80,
                                            color: "#eab308",
                                            textColor: "#ca8a04",
                                        },
                                        {
                                            status: SALE_ORDER_STATUS.Approved,
                                            count: saleOrderStats.approvedOrders || 0,
                                            x: 490,
                                            y: 80,
                                            color: "#3b82f6",
                                            textColor: "#2563eb",
                                        },
                                        {
                                            status: SALE_ORDER_STATUS.AssignedForPicking,
                                            count: saleOrderStats.assignedOrders || 0,
                                            x: 660,
                                            y: 80,
                                            color: "#a855f7",
                                            textColor: "#9333ea",
                                        },
                                        {
                                            status: SALE_ORDER_STATUS.Picking,
                                            count: saleOrderStats.pickingOrders || 0,
                                            x: 830,
                                            y: 80,
                                            color: "#f97316",
                                            textColor: "#ea580c",
                                        },
                                        {
                                            status: SALE_ORDER_STATUS.Completed,
                                            count: saleOrderStats.completedOrders || 0,
                                            x: 400,
                                            y: 190,
                                            color: "#10b981",
                                            textColor: "#059669",
                                        },
                                        {
                                            status: SALE_ORDER_STATUS.Rejected,
                                            count: saleOrderStats.rejectedOrders || 0,
                                            x: 600,
                                            y: 190,
                                            color: "#ef4444",
                                            textColor: "#dc2626",
                                        },
                                    ].map((item) => {
                                        const percentage =
                                            totalOrders > 0
                                                ? Math.round((item.count / totalOrders) * 100)
                                                : 0;

                                        return (
                                            <g key={item.status}>
                                                {/* Outer Circle */}
                                                <circle
                                                    cx={item.x}
                                                    cy={item.y}
                                                    r="40"
                                                    fill="white"
                                                    stroke={item.color}
                                                    strokeWidth="3"
                                                    opacity="0.9"
                                                    filter="url(#dropshadow)"
                                                />

                                                {/* Count */}
                                                <text
                                                    x={item.x}
                                                    y={item.y + 5}
                                                    textAnchor="middle"
                                                    className="text-sm font-bold"
                                                    fill={item.textColor}
                                                >
                                                    {item.count}
                                                </text>

                                                {/* Label */}
                                                <text
                                                    x={item.x}
                                                    y={item.y + 50}
                                                    textAnchor="middle"
                                                    className="text-xs font-semibold"
                                                    fill={item.textColor}
                                                >
                                                    {STATUS_LABELS[item.status]}
                                                </text>

                                                {/* Percentage Badge */}
                                                <circle
                                                    cx={item.x + 35}
                                                    cy={item.y - 30}
                                                    r="12"
                                                    fill={item.color}
                                                    opacity="0.9"
                                                    filter="url(#dropshadow)"
                                                />
                                                <text
                                                    x={item.x + 35}
                                                    y={item.y - 25}
                                                    textAnchor="middle"
                                                    className="text-[10px] font-bold fill-white"
                                                >
                                                    {percentage}%
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
