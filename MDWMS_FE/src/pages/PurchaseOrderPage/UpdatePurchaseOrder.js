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
    const [fieldErrors, setFieldErrors] = useState({}) // Lỗi theo từng trường

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
        
        // Chỉ kiểm tra khi đã có danh sách hàng hóa từ nhà cung cấp
        if (goods.length > 0) {
            // Đếm số mặt hàng đã được chọn
            const selectedGoodsCount = items.filter(item => item.goodsName && item.goodsName !== "").length;
            
            // Kiểm tra xem còn mặt hàng nào để thêm không
            if (selectedGoodsCount >= goods.length) {
                window.showToast("Đã thêm hết tất cả mặt hàng từ nhà cung cấp này!", "error");
                return;
            }
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
        if (field === "goodsName") {
            // Kiểm tra xem sản phẩm đã được chọn ở hàng khác chưa
            const isDuplicate = items.some(item => item.id !== id && item.goodsName === value && value !== "");
            if (isDuplicate) {
                window.showToast("Mặt hàng này đã được thêm vào danh sách!", "error");
                return;
            }
        }
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
        
        // Xóa lỗi validation khi người dùng sửa
        if (fieldErrors[`${id}-${field}`]) {
            const newErrors = { ...fieldErrors };
            delete newErrors[`${id}-${field}`];
            setFieldErrors(newErrors);
        }
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

    // Lọc danh sách hàng hóa để không hiển thị những mặt hàng đã được chọn
    const getAvailableGoodsOptions = (currentItemId) => {
        const selectedGoodsNames = items
            .filter(item => item.id !== currentItemId && item.goodsName)
            .map(item => item.goodsName);
        
        return goods
            .filter(good => !selectedGoodsNames.includes(good.goodsName))
            .map(good => ({
                value: good.goodsName,
                label: good.goodsName
            }));
    };

    const goodsOptions = goods.map(good => ({
        value: good.goodsName,
        label: good.goodsName
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset validation errors
        setFieldErrors({});
        const newFieldErrors = {};
        
        // Kiểm tra từng mặt hàng
        items.forEach((item, index) => {
            if (!item.goodsName) {
                newFieldErrors[`${item.id}-goodsName`] = "Vui lòng chọn tên hàng hóa";
            }
            if (!item.quantity || item.quantity <= 0) {
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số lượng lớn hơn 0";
            }
        });
        
        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }
        
        const validItems = items.filter(item => item.goodsName && item.quantity);
        if (validItems.length === 0) {
            window.showToast("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin", "error");
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
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            // Cấu trúc đúng theo API documentation
            const submitData = {
                purchaseOderId: id, // Lưu ý: có typo "purchaseOderId" (thiếu 'r')
                purchaseOrderDetailUpdates: itemsWithIds
            };

            await updatePurchaseOrder(submitData);
            window.showToast("Cập nhật đơn nhập thành công!", "success");
            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi cập nhật đơn nhập:", error);
            const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật đơn nhập!";
            window.showToast(errorMessage, "error");
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
                                                    <div>
                                                        <FloatingDropdown
                                                            value={item.goodsName}
                                                            onChange={(value) => updateItem(item.id, "goodsName", value)}
                                                            options={getAvailableGoodsOptions(item.id)}
                                                            placeholder={formData.supplierName ? "Chọn hàng hóa" : "Chọn nhà cung cấp trước"}
                                                            loading={goodsLoading}
                                                            disabled={!formData.supplierName}
                                                        />
                                                        {fieldErrors[`${item.id}-goodsName`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`${item.id}-goodsName`]}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                                            className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${fieldErrors[`${item.id}-quantity`] ? 'border-red-500' : ''}`}
                                                        />
                                                        {fieldErrors[`${item.id}-quantity`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`${item.id}-quantity`]}</p>
                                                        )}
                                                    </div>
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
                            
                            {/* Add Item Text - Centered below table */}
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={(e) => addItem(e)}
                                    className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Thêm mặt hàng
                                </button>
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
