"use client"

import { useState } from "react"
import {
    Search,
    Plus,
    Edit,
    Trash,
    ChevronDown,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"

const recentOrdersData = [
    {
        id: 1,
        customerName: "Công ty ABC",
        phone: "0901234567",
        orderId: "ORD001",
        quantity: 50,
        productType: "Sữa tươi Vinamilk",
        area: "Khu vực A",
        status: "Đang xử lý",
        avatar: "/placeholder.svg?height=32&width=32",
    },
    {
        id: 2,
        customerName: "Siêu thị XYZ",
        phone: "0907654321",
        orderId: "ORD002",
        quantity: 100,
        productType: ["Sữa chua", "Phô mai"],
        area: "Khu vực B",
        status: "Hoàn thành",
        avatar: "/placeholder.svg?height=32&width=32",
    },
    {
        id: 3,
        customerName: "Nhà hàng DEF",
        phone: "0909876543",
        orderId: "ORD003",
        quantity: 30,
        productType: ["Bơ", "Sữa tươi"],
        area: "Khu vực C",
        status: "Đang giao",
        avatar: "/placeholder.svg?height=32&width=32",
    },
    {
        id: 4,
        customerName: "Cửa hàng GHI",
        phone: "0904567890",
        orderId: "ORD004",
        quantity: 75,
        productType: "Sữa tươi TH True Milk",
        area: "Khu vực A",
        status: "Chờ xử lý",
        avatar: "/placeholder.svg?height=32&width=32",
    },
]

export default function RecentOrders() {
    const [activeTab, setActiveTab] = useState("processing")

    return (
        <div className="space-y-4">
            <Tabs defaultValue="processing" className="w-full">
                <TabsList className="mb-4 border-b w-full justify-start rounded-none bg-transparent p-0">
                    <TabsTrigger
                        value="processing"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        onClick={() => setActiveTab("processing")}
                    >
                        Đang xử lý
                    </TabsTrigger>
                    <TabsTrigger
                        value="completed"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        onClick={() => setActiveTab("completed")}
                    >
                        Hoàn thành
                    </TabsTrigger>
                    <TabsTrigger
                        value="shipping"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        onClick={() => setActiveTab("shipping")}
                    >
                        Đang giao
                    </TabsTrigger>
                    <TabsTrigger
                        value="pending"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        onClick={() => setActiveTab("pending")}
                    >
                        Chờ xử lý
                    </TabsTrigger>
                </TabsList>

                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên khách hàng, số điện thoại hoặc mã đơn hàng"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-[400px] text-sm"
                        />
                    </div>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo đơn hàng
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">
                                    <div className="flex items-center">
                                        KHÁCH HÀNG <ChevronDown className="h-4 w-4 ml-1" />
                                    </div>
                                </TableHead>
                                <TableHead className="whitespace-nowrap">MÃ ĐƠN HÀNG</TableHead>
                                <TableHead className="whitespace-nowrap">SỐ LƯỢNG</TableHead>
                                <TableHead className="whitespace-nowrap">LOẠI SẢN PHẨM</TableHead>
                                <TableHead className="whitespace-nowrap">KHU VỰC</TableHead>
                                <TableHead className="whitespace-nowrap">TRẠNG THÁI</TableHead>
                                <TableHead className="whitespace-nowrap">THAO TÁC</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentOrdersData.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Avatar className="h-8 w-8 mr-3">
                                                <AvatarImage src={order.avatar} alt={order.customerName} />
                                                <AvatarFallback>
                                                    {order.customerName
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{order.customerName}</p>
                                                <p className="text-xs text-gray-500">{order.phone}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.orderId}</TableCell>
                                    <TableCell>{order.quantity}</TableCell>
                                    <TableCell>
                                        {Array.isArray(order.productType) ? (
                                            <div>
                                                {order.productType.map((type, index) => (
                                                    <p key={index}>{type}</p>
                                                ))}
                                            </div>
                                        ) : (
                                            order.productType
                                        )}
                                    </TableCell>
                                    <TableCell>{order.area}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                order.status === "Hoàn thành"
                                                    ? "success"
                                                    : order.status === "Đang xử lý"
                                                        ? "warning"
                                                        : order.status === "Đang giao"
                                                            ? "default"
                                                            : "outline"
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end mt-4">
                    <Button variant="link" className="text-blue-500 hover:text-blue-600">
                        Xem tất cả đơn hàng
                    </Button>
                </div>
            </Tabs>
        </div>
    )
}

