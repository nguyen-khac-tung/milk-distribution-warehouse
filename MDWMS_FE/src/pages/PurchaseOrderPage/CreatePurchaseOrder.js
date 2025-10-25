import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"
import { createPurchaseOrder, getGoodsDropDownBySupplierId } from "../../services/PurchaseOrderService"
import { getSuppliersDropdown } from "../../services/SupplierService"

export default function CreatePurchaseOrder({
    isEditMode = false,
    initialData = null
}) {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [goods, setGoods] = useState([]);
    const [formData, setFormData] = useState({
        supplierName: initialData?.supplierName || ""
    });

    const [items, setItems] = useState(
        initialData?.items || [
            { id: 1, goodsName: "", quantity: "" },
        ],
    )

    // Load suppliers on component mount
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const response = await getSuppliersDropdown();
                console.log("Suppliers response:", response);
                // Try different possible response structures
                const suppliersData = response?.data || response?.items || response || [];
                setSuppliers(suppliersData);
            } catch (error) {
                console.error("Error loading suppliers:", error);
                setSuppliers([]);
            }
        };

        loadSuppliers();
    }, []);

    const addItem = (e) => {
        // Ngăn chặn mọi event propagation
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log("=== THÊM HÀNG HÓA ===");
        console.log("Trước khi thêm:", items);

        // Chỉ thêm vào local state, không gọi API
        const newItem = {
            id: Date.now(), // Sử dụng timestamp để tránh trùng ID
            goodsName: "",
            quantity: "",
        };

        const updatedItems = [...items, newItem];
        setItems(updatedItems);

        console.log("Sau khi thêm:", updatedItems);
        console.log("=== KHÔNG GỌI API ===");
    }

    const removeItem = (id) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const updateItem = (id, field, value) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Load goods when supplier changes
        if (field === "supplierName" && value) {
            // Find supplier ID by name
            const selectedSupplier = suppliers.find(supplier => supplier.companyName === value);
            if (selectedSupplier) {
                loadGoodsBySupplier(selectedSupplier.supplierId);
            }
        }
    }

    // Load goods by supplier ID
    const loadGoodsBySupplier = async (supplierId) => {
        try {
            const response = await getGoodsDropDownBySupplierId(supplierId);
            console.log("Goods response:", response);
            // Try different possible response structures
            const goodsData = response?.data || response?.items || response || [];
            setGoods(goodsData);
        } catch (error) {
            console.error("Error loading goods by supplier:", error);
            setGoods([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("=== BẮT ĐẦU TẠO ĐƠN NHẬP ===");
        console.log("Form data:", formData);
        console.log("Items:", items);

        // Validate form
        if (!formData.supplierName) {
            console.log("Vui lòng chọn nhà cung cấp");
            return;
        }

        // Find supplier ID by name
        const selectedSupplier = suppliers.find(supplier => supplier.companyName === formData.supplierName);
        if (!selectedSupplier) {
            console.log("Không tìm thấy nhà cung cấp");
            return;
        }

        // Validate items - chỉ lấy những item có đầy đủ thông tin
        const validItems = items.filter(item => item.goodsName && item.quantity);
        console.log("Valid items:", validItems);

        if (validItems.length === 0) {
            console.log("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin");
            return;
        }

        try {
            // Convert goods names to IDs
            const itemsWithIds = validItems.map(item => {
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                return {
                    goodsId: selectedGood ? parseInt(selectedGood.goodsId) : null,
                    quantity: parseInt(item.quantity)
                };
            }).filter(item => item.goodsId);

            if (itemsWithIds.length === 0) {
                console.log("Không tìm thấy hàng hóa hợp lệ");
                return;
            }

            // Chuẩn bị dữ liệu để gửi API
            const submitData = {
                supplierId: parseInt(selectedSupplier.supplierId),
                purchaseOrderDetailCreate: itemsWithIds
            };


            // Gọi API tạo đơn nhập
            await createPurchaseOrder(submitData);


            // Chuyển về trang danh sách sau khi tạo thành công
            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi tạo đơn nhập:", error);
        }
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
                                    <Select value={formData.supplierName} onValueChange={(value) => handleInputChange("supplierName", value)}>
                                        <SelectTrigger id="supplier" className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg">
                                            <SelectValue placeholder="Chọn nhà cung cấp" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.length > 0 ? (
                                                suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.supplierId} value={supplier.companyName}>
                                                        {supplier.companyName}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <>
                                                    <SelectItem value="Công ty TNHH Sữa Việt Nam">Công ty TNHH Sữa Việt Nam</SelectItem>
                                                    <SelectItem value="Công ty CP Sữa TH True Milk">Công ty CP Sữa TH True Milk</SelectItem>
                                                    <SelectItem value="Công ty TNHH Sữa Vinamilk">Công ty TNHH Sữa Vinamilk</SelectItem>
                                                    <SelectItem value="Công ty CP Sữa Mộc Châu">Công ty CP Sữa Mộc Châu</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-600">Chi Tiết Hàng Hóa</h3>
                                <Button
                                    type="button"
                                    onClick={(e) => addItem(e)}
                                    className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white"
                                >
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
                                                    <Select value={item.goodsName} onValueChange={(value) => updateItem(item.id, "goodsName", value)}>
                                                        <SelectTrigger className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg">
                                                            <SelectValue placeholder="Chọn hàng hóa" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {goods.length > 0 ? (
                                                                goods.map((good) => (
                                                                    <SelectItem key={good.goodsId} value={good.goodsName}>
                                                                        {good.goodsName}
                                                                    </SelectItem>
                                                                ))
                                                            ) : (
                                                                <>
                                                                    <SelectItem value="Sữa tươi Vinamilk 100%">Sữa tươi Vinamilk 100%</SelectItem>
                                                                    <SelectItem value="Sữa chua Vinamilk">Sữa chua Vinamilk</SelectItem>
                                                                    <SelectItem value="Sữa TH True Milk">Sữa TH True Milk</SelectItem>
                                                                    <SelectItem value="Sữa Mộc Châu">Sữa Mộc Châu</SelectItem>
                                                                </>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
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
                                                {items.length > 1 && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
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


                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Button
                                type="button"
                                onClick={handleSubmit}
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
