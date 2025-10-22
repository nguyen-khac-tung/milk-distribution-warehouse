import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"

export default function CreatePurchaseOrder({
    isEditMode = false,
    initialData = null
}) {
    const navigate = useNavigate();
    const [items, setItems] = useState(
        initialData?.items || [
            { id: 1, goodsName: "", quantity: "", unitsPerPackage: "", note: "" },
        ],
    )

    const addItem = () => {
        setItems([
            ...items,
            {
                id: items.length + 1,
                goodsName: "",
                quantity: "",
                unitsPerPackage: "",
                note: "",
            },
        ])
    }

    const removeItem = (id) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const updateItem = (id, field, value) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")} className="text-slate-600 hover:bg-slate-50">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay Lại
                        </Button>
                        <h1 className="text-2xl font-bold text-slate-600">
                            {isEditMode ? "Cập Nhật Đơn Nhập Hàng" : "Tạo Đơn Nhập Hàng Mới"}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">

                {/* Form Card */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-6 space-y-6">
                        {/* Header Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-600 mb-4">Thông Tin Đơn Hàng</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier" className="text-slate-600 font-medium">
                                        Nhà Cung Cấp *
                                    </Label>
                                    <Select defaultValue={initialData?.supplier || ""}>
                                        <SelectTrigger id="supplier" className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg">
                                            <SelectValue placeholder="Chọn nhà cung cấp" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ncc1">Công ty TNHH Sữa Việt Nam</SelectItem>
                                            <SelectItem value="ncc2">Công ty CP Sữa TH True Milk</SelectItem>
                                            <SelectItem value="ncc3">Công ty TNHH Sữa Vinamilk</SelectItem>
                                            <SelectItem value="ncc4">Công ty CP Sữa Mộc Châu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="poNumber" className="text-slate-600 font-medium">
                                        Số PO *
                                    </Label>
                                    <Input
                                        id="poNumber"
                                        placeholder="Nhập số PO"
                                        defaultValue={initialData?.poNumber || ""}
                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="orderDate" className="text-slate-600 font-medium">
                                        Ngày Đặt Hàng *
                                    </Label>
                                    <Input
                                        id="orderDate"
                                        type="date"
                                        defaultValue={initialData?.orderDate || ""}
                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expectedDate" className="text-slate-600 font-medium">
                                        Ngày Dự Kiến Nhập *
                                    </Label>
                                    <Input
                                        id="expectedDate"
                                        type="date"
                                        defaultValue={initialData?.expectedDate || ""}
                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                    />
                                </div>


                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-600">Chi Tiết Hàng Hóa</h3>
                                <Button onClick={addItem} className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white">
                                    <Plus className="mr-2 h-4 w-4 text-white" />
                                    Thêm Hàng
                                </Button>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-gray-200 hover:bg-transparent">
                                            <TableHead className="text-slate-600 font-semibold">STT</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Tên Hàng Hóa</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Số Lượng</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Đơn Vị</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Ghi Chú</TableHead>
                                            {items.length > 1 && (
                                                <TableHead className="text-right text-slate-600 font-semibold">Hành Động</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <TableCell className="text-slate-700">{index + 1}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Tên hàng"
                                                        value={item.goodsName}
                                                        onChange={(e) => updateItem(item.id, "goodsName", e.target.value)}
                                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.unitsPerPackage}
                                                        onChange={(e) => updateItem(item.id, "unitsPerPackage", e.target.value)}
                                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Ghi chú"
                                                        value={item.note}
                                                        onChange={(e) => updateItem(item.id, "note", e.target.value)}
                                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                                    />
                                                </TableCell>
                                                {items.length > 1 && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-slate-600 font-medium">
                                Ghi Chú
                            </Label>
                            <textarea
                                id="notes"
                                placeholder="Nhập ghi chú..."
                                defaultValue={initialData?.notes || ""}
                                className="w-full h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                                rows={3}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                onClick={() => navigate("/purchase-orders")}
                            >
                                Hủy
                            </Button>
                            <Button 
                                type="submit"
                                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                {isEditMode ? "Cập Nhật Đơn Nhập" : "Tạo Đơn Nhập"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
