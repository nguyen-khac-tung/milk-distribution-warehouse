import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import FloatingDropdown from "../../components/PurchaseOrderComponents/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"
import { updatePurchaseOrder, getGoodsDropDownBySupplierId, getPurchaseOrderDetail } from "../../services/PurchaseOrderService"
import { getSuppliersDropdown } from "../../services/SupplierService"

export default function UpdatePurchaseOrder() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [suppliers, setSuppliers] = useState([]);
    const [goods, setGoods] = useState([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [goodsLoading, setGoodsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        supplierName: ""
    });

    const [items, setItems] = useState([
        { id: 1, goodsName: "", quantity: "" },
    ])

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Load suppliers
                const suppliersResponse = await getSuppliersDropdown();
                const suppliersData = suppliersResponse?.data || suppliersResponse?.items || suppliersResponse || [];
                setSuppliers(suppliersData);

                // Load purchase order detail
                const orderResponse = await getPurchaseOrderDetail(id);
                const orderData = orderResponse?.data || orderResponse;
                
                if (orderData) {
                    // Set supplier
                    const supplier = suppliersData.find(s => s.supplierId === orderData.supplierId);
                    if (supplier) {
                        setFormData({ supplierName: supplier.companyName });
                        // Load goods for this supplier
                        await loadGoodsBySupplier(orderData.supplierId);
                    }

                    // Set items
                    if (orderData.purchaseOrderDetails && orderData.purchaseOrderDetails.length > 0) {
                        const formattedItems = orderData.purchaseOrderDetails.map((detail, index) => ({
                            id: index + 1,
                            goodsName: detail.goodsName || "",
                            quantity: detail.quantity || "",
                            purchaseOrderDetailId: detail.purchaseOrderDetailId
                        }));
                        setItems(formattedItems);
                    }
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [id]);

    const addItem = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const newItem = {
            id: Date.now(),
            goodsName: "",
            quantity: "",
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
    }

    const removeItem = (id) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const updateItem = (id, field, value) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === "supplierName" && value) {
            const selectedSupplier = suppliers.find(supplier => supplier.companyName === value);
            if (selectedSupplier) {
                loadGoodsBySupplier(selectedSupplier.supplierId);
            }
        }
    }

    const loadGoodsBySupplier = async (supplierId) => {
        setGoodsLoading(true);
        try {
            const response = await getGoodsDropDownBySupplierId(supplierId);
            const goodsData = response?.data || response?.items || response || [];
            setGoods(goodsData);
        } catch (error) {
            console.error("Error loading goods by supplier:", error);
            setGoods([]);
        } finally {
            setGoodsLoading(false);
        }
    };

    // Create options for dropdowns
    const supplierOptions = suppliers.map(supplier => ({
        value: supplier.companyName,
        label: supplier.companyName
    }));

    const goodsOptions = goods.map(good => ({
        value: good.goodsName,
        label: good.goodsName
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validItems = items.filter(item => item.goodsName && item.quantity);
        if (validItems.length === 0) {
            console.log("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin");
            return;
        }
        
        try {
            const itemsWithIds = validItems.map(item => {
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                return {
                    goodsId: selectedGood ? parseInt(selectedGood.goodsId) : null,
                    quantity: parseInt(item.quantity),
                    purchaseOrderDetailId: item.purchaseOrderDetailId || 0
                };
            }).filter(item => item.goodsId);

            if (itemsWithIds.length === 0) {
                console.log("Không tìm thấy hàng hóa hợp lệ");
                return;
            }

            // Cấu trúc đúng theo API documentation
            const submitData = {
                purchaseOderId: id, // Lưu ý: có typo "purchaseOderId" (thiếu 'r')
                purchaseOrderDetailUpdates: itemsWithIds
            };

            console.log("=== UPDATE DATA ===");
            console.log("Submit data:", submitData);
            console.log("Items with IDs:", itemsWithIds);
            console.log("Purchase Order ID:", id);

            await updatePurchaseOrder(submitData);
            window.showToast("Cập nhật đơn nhập thành công!", "success");
            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi cập nhật đơn nhập:", error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
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
                            Cập Nhật Đơn Nhập Hàng
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
                                    <FloatingDropdown
                                        value={formData.supplierName}
                                        onChange={(value) => handleInputChange("supplierName", value)}
                                        options={supplierOptions}
                                        placeholder="Chọn nhà cung cấp"
                                        loading={suppliersLoading}
                                        disabled={true}
                                    />
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

                            <div className="rounded-lg border border-gray-200 bg-white" style={{ overflow: 'visible' }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-gray-200 hover:bg-transparent">
                                            <TableHead className="text-slate-600 font-semibold">STT</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Tên Hàng Hóa</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Số Lượng</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Đơn Vị</TableHead>
                                            {items.length > 1 && (
                                                <TableHead className="text-right text-slate-600 font-semibold">Hành Động</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <TableCell className="text-slate-700">{index + 1}</TableCell>
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <FloatingDropdown
                                                        value={item.goodsName}
                                                        onChange={(value) => updateItem(item.id, "goodsName", value)}
                                                        options={goodsOptions}
                                                        placeholder={formData.supplierName ? "Chọn hàng hóa" : "Chọn nhà cung cấp trước"}
                                                        loading={goodsLoading}
                                                        disabled={!formData.supplierName}
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
                                                    <div className="h-[38px] flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600">
                                                        {(() => {
                                                            if (item.goodsName) {
                                                                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                                                                return selectedGood ? selectedGood.name : "Chưa chọn";
                                                            }
                                                            return "Chưa chọn";
                                                        })()}
                                                    </div>
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
                                Cập Nhật Đơn Nhập
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
