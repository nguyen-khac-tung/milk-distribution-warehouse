import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"
import { createPurchaseOrder, getGoodsDropDownBySupplierId, getDraftPurchaseOrdersBySupplier, updatePurchaseOrder, getPurchaseOrderDetail, getGoodsPackingByGoodsId } from "../../services/PurchaseOrderService"
import { extractErrorMessage } from '../../utils/Validation';
import { getSuppliersDropdown } from "../../services/SupplierService"

export default function CreatePurchaseOrder({
    isEditMode = false,
    initialData = null
}) {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [goods, setGoods] = useState([]);
    const [goodsPackingsMap, setGoodsPackingsMap] = useState({});
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [goodsLoading, setGoodsLoading] = useState(false);
    const [packingLoading, setPackingLoading] = useState(false);
    const [formData, setFormData] = useState({
        supplierName: initialData?.supplierName || ""
    });

    const [items, setItems] = useState(
        initialData?.items || [
            { id: 1, goodsName: "", quantity: "", goodsPackingId: "" },
        ],
    )
    const [fieldErrors, setFieldErrors] = useState({}) // Lỗi theo từng trường

    // Load suppliers on component mount
    useEffect(() => {
        const loadSuppliers = async () => {
            setSuppliersLoading(true);
            try {
                const response = await getSuppliersDropdown();
                const suppliersData = response?.data || response?.items || response || [];
                setSuppliers(suppliersData);
            } catch (error) {
                console.error("Error loading suppliers:", error);
                setSuppliers([]);
            } finally {
                setSuppliersLoading(false);
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
            goodsPackingId: "",
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

            // Load goods packing khi chọn goods (chỉ load nếu chưa có trong map)
            if (value) {
                const selectedGood = goods.find(good => good.goodsName === value);
                if (selectedGood && !goodsPackingsMap[selectedGood.goodsId]) {
                    loadGoodsPacking(selectedGood.goodsId);
                }
            }
        }

        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))

        // Xóa lỗi validation khi người dùng sửa
        if (fieldErrors[`${id}-${field}`]) {
            const newErrors = { ...fieldErrors };
            delete newErrors[`${id}-${field}`];
            setFieldErrors(newErrors);
        }

        // Validate real-time cho số lượng
        if (field === "quantity" || field === "goodsPackingId") {
            const updatedItem = items.find(item => item.id === id);
            if (updatedItem) {
                const tempItem = { ...updatedItem, [field]: value };
                const quantityError = validateQuantity(tempItem);
                if (quantityError) {
                    setFieldErrors(prev => ({
                        ...prev,
                        [`${id}-quantity`]: quantityError
                    }));
                } else {
                    setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[`${id}-quantity`];
                        return newErrors;
                    });
                }
            }
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

    const loadGoodsPacking = async (goodsId) => {
        setPackingLoading(true);
        try {
            const response = await getGoodsPackingByGoodsId(goodsId);
            const packingData = response?.data || [];
            // Lưu vào map theo goodsId
            setGoodsPackingsMap(prev => ({
                ...prev,
                [goodsId]: packingData
            }));
        } catch (error) {
            console.error("Error loading goods packing:", error);
            // Lưu mảng rỗng vào map
            setGoodsPackingsMap(prev => ({
                ...prev,
                [goodsId]: []
            }));
        } finally {
            setPackingLoading(false);
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

    // Tạo options cho goods packing dropdown
    const getGoodsPackingOptions = (currentItemId) => {
        const currentItem = items.find(item => item.id === currentItemId);
        if (!currentItem || !currentItem.goodsName) {
            return [{ value: "", label: "Chọn hàng hóa trước" }];
        }

        // Lấy thông tin hàng hóa để có unitMeasureName và goodsId
        const selectedGood = goods.find(good => good.goodsName === currentItem.goodsName);
        if (!selectedGood) {
            return [{ value: "", label: "Không tìm thấy hàng hóa" }];
        }

        const unitMeasureName = selectedGood?.name || "đơn vị";
        const goodsId = selectedGood.goodsId;

        // Lấy goodsPackings từ map theo goodsId
        const goodsPackings = goodsPackingsMap[goodsId] || [];

        return [
            { value: "", label: "Chọn đóng gói..." },
            ...goodsPackings.map(packing => ({
                value: packing.goodsPackingId.toString(),
                label: `${packing.unitPerPackage} ${unitMeasureName}/thùng`
            }))
        ];
    };


    // Tính tổng số đơn vị (số thùng × đơn vị đóng gói)
    const calculateTotalUnits = (item) => {
        if (!item.quantity || !item.goodsPackingId) return 0;

        const selectedGood = goods.find(good => good.goodsName === item.goodsName);
        if (!selectedGood) return 0;

        const goodsPackings = goodsPackingsMap[selectedGood.goodsId] || [];
        const selectedPacking = goodsPackings.find(packing =>
            packing.goodsPackingId.toString() === item.goodsPackingId
        );

        if (!selectedPacking) return 0;

        return parseInt(item.quantity) * selectedPacking.unitPerPackage;
    };

    // Kiểm tra validation cho số thùng
    const validateQuantity = (item) => {
        if (!item.quantity || !item.goodsPackingId) return null;

        const quantity = parseInt(item.quantity);

        if (quantity <= 0) {
            return "Số thùng phải lớn hơn 0";
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset validation errors
        setFieldErrors({});
        const newFieldErrors = {};

        // Kiểm tra từng mặt hàng
        items.forEach((item, index) => {
            const rowNumber = index + 1;
            if (!item.goodsName) {
                newFieldErrors[`${item.id}-goodsName`] = "Vui lòng chọn tên hàng hóa";
            }
            if (!item.quantity || item.quantity <= 0) {
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
            }
            if (!item.goodsPackingId) {
                newFieldErrors[`${item.id}-goodsPackingId`] = "Vui lòng chọn đóng gói";
            }

            // Kiểm tra validation số thùng
            const quantityError = validateQuantity(item);
            if (quantityError) {
                newFieldErrors[`${item.id}-quantity`] = quantityError;
            }
        });

        // Kiểm tra nhà cung cấp
        if (!formData.supplierName) {
            window.showToast("Vui lòng chọn nhà cung cấp", "error");
            if (Object.keys(newFieldErrors).length > 0) {
                setFieldErrors(newFieldErrors);
            }
            return;
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        const selectedSupplier = suppliers.find(supplier => supplier.companyName === formData.supplierName);
        if (!selectedSupplier) {
            window.showToast("Không tìm thấy nhà cung cấp", "error");
            return;
        }

        const validItems = items.filter(item => item.goodsName && item.quantity && item.goodsPackingId);
        if (validItems.length === 0) {
            window.showToast("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin", "error");
            return;
        }

        try {
            const itemsWithIds = validItems.map(item => {
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                const goodsPackings = goodsPackingsMap[selectedGood?.goodsId] || [];
                const selectedPacking = goodsPackings.find(packing =>
                    packing.goodsPackingId.toString() === item.goodsPackingId
                );

                // Tính packageQuantity = số thùng × đơn vị đóng gói
                const packageQuantity = selectedPacking ?
                    parseInt(item.quantity) * selectedPacking.unitPerPackage :
                    parseInt(item.quantity);

                return {
                    goodsId: selectedGood ? parseInt(selectedGood.goodsId) : null,
                    packageQuantity: packageQuantity,
                    goodsPackingId: parseInt(item.goodsPackingId)
                };
            }).filter(item => item.goodsId);

            if (itemsWithIds.length === 0) {
                console.log("Không tìm thấy hàng hóa hợp lệ");
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            // Kiểm tra đơn nháp của nhà cung cấp
            const draftOrdersResponse = await getDraftPurchaseOrdersBySupplier(parseInt(selectedSupplier.supplierId));
            const draftOrders = draftOrdersResponse?.data || [];

            if (draftOrders.length > 0) {
                // Tìm đơn nháp gần nhất
                const latestDraftOrder = draftOrders[0];

                // Lấy chi tiết đơn nháp
                const draftOrderDetail = await getPurchaseOrderDetail(latestDraftOrder.purchaseOderId);
                console.log("Chi tiết đơn nháp từ API:", draftOrderDetail);
                const existingItems = draftOrderDetail?.data?.purchaseOrderDetails || draftOrderDetail?.purchaseOrderDetails || [];
                console.log("Danh sách sản phẩm hiện có:", existingItems);

                // Debug: Kiểm tra từng sản phẩm có số lượng hợp lệ không
                existingItems.forEach((item, index) => {
                    console.log(`Sản phẩm ${index + 1} - Toàn bộ dữ liệu:`, item);
                    console.log(`Sản phẩm ${index + 1} - Các trường số lượng:`, {
                        quantity: item.quantity,
                        packageQuantity: item.packageQuantity,
                        unitQuantity: item.unitQuantity,
                        amount: item.amount,
                        totalQuantity: item.totalQuantity
                    });
                });

                // Kết hợp các sản phẩm mới với sản phẩm cũ
                const allItemsMap = new Map();
                let hasMergedItems = false; // Đánh dấu có sản phẩm bị cộng
                let hasNewItems = false; // Đánh dấu có sản phẩm mới thêm vào

                // Thêm tất cả sản phẩm cũ vào map (kiểm tra nhiều trường có thể chứa số lượng)
                existingItems.forEach(item => {
                    // Kiểm tra các trường có thể chứa số lượng
                    const quantity = parseInt(item.quantity) || parseInt(item.packageQuantity) || parseInt(item.unitQuantity) || 0;

                    console.log(`Xử lý sản phẩm hiện có:`, {
                        goodsId: item.goodsId,
                        quantity: item.quantity,
                        packageQuantity: item.packageQuantity,
                        unitQuantity: item.unitQuantity,
                        finalQuantity: quantity
                    });

                    // Thêm sản phẩm vào map (ngay cả khi số lượng = 0 để giữ lại thông tin)
                    allItemsMap.set(item.goodsId, {
                        purchaseOrderDetailId: item.purchaseOrderDetailId,
                        goodsId: item.goodsId,
                        packageQuantity: quantity,
                        goodsPackingId: item.goodsPackingId
                    });
                });

                // Cộng hoặc thêm sản phẩm mới
                itemsWithIds.forEach(newItem => {
                    // Validate dữ liệu trước khi xử lý
                    if (!newItem.goodsId || !newItem.packageQuantity || !newItem.goodsPackingId) {
                        console.error("Dữ liệu sản phẩm không hợp lệ:", newItem);
                        return;
                    }

                    if (allItemsMap.has(newItem.goodsId)) {
                        // Cùng sản phẩm - cộng số lượng
                        const existing = allItemsMap.get(newItem.goodsId);
                        const oldQuantity = existing.packageQuantity;
                        const newQuantity = parseInt(newItem.packageQuantity) || 0;
                        existing.packageQuantity = existing.packageQuantity + newQuantity;
                        hasMergedItems = true;
                        console.log(`Đã cộng ${newQuantity} vào sản phẩm hiện có (từ ${oldQuantity} thành ${existing.packageQuantity})`);
                    } else {
                        // Sản phẩm mới - thêm vào map
                        allItemsMap.set(newItem.goodsId, {
                            purchaseOrderDetailId: 0, // Sản phẩm mới có ID = 0
                            goodsId: newItem.goodsId,
                            packageQuantity: parseInt(newItem.packageQuantity) || 0,
                            goodsPackingId: newItem.goodsPackingId
                        });
                        hasNewItems = true;
                        console.log(`Đã thêm sản phẩm mới: ${newItem.goodsId} với số lượng ${newItem.packageQuantity}`);
                    }
                });

                // Chuyển map thành mảng cho API update theo đúng schema
                const itemsToUpdate = Array.from(allItemsMap.values())
                    .map(item => ({
                        goodsId: item.goodsId,
                        goodsPackingId: item.goodsPackingId,
                        packageQuantity: item.packageQuantity,
                        purchaseOrderDetailId: item.purchaseOrderDetailId
                    }));

                console.log("Tất cả sản phẩm sẽ được gửi lên API:", itemsToUpdate);

                // Cập nhật đơn nháp với tất cả sản phẩm theo đúng schema API
                const updateData = {
                    purchaseOderId: latestDraftOrder.purchaseOderId,
                    purchaseOrderDetailUpdates: itemsToUpdate
                };

                // Kiểm tra có sản phẩm để cập nhật không
                if (itemsToUpdate.length === 0) {
                    window.showToast("Không có sản phẩm để cập nhật!", "error");
                    return;
                }

                // Kiểm tra có sản phẩm mới được thêm không
                const hasNewProducts = itemsToUpdate.some(item => item.purchaseOrderDetailId === 0);
                if (!hasNewProducts && !hasMergedItems) {
                    window.showToast("Không có sản phẩm mới hoặc thay đổi để cập nhật!", "error");
                    return;
                }

                // Log dữ liệu để debug
                console.log("Dữ liệu gửi lên API:", JSON.stringify(updateData, null, 2));

                await updatePurchaseOrder(updateData);

                // Hiển thị thông báo chi tiết
                let message = "Đã bổ sung vào đơn nháp thành công! ";
                if (hasMergedItems && hasNewItems) {
                    message += "Đã cộng thêm số lượng cho sản phẩm trùng và thêm sản phẩm mới.";
                } else if (hasMergedItems) {
                    message += "Đã cộng thêm số lượng cho sản phẩm trùng khớp.";
                } else if (hasNewItems) {
                    message += "Đã thêm sản phẩm mới vào đơn nháp.";
                }

                window.showToast(message, "success");
            } else {
                // Không có đơn nháp - tạo đơn mới
                const submitData = {
                    supplierId: parseInt(selectedSupplier.supplierId),
                    purchaseOrderDetailCreate: itemsWithIds
                };
                await createPurchaseOrder(submitData);
                window.showToast("Tạo đơn nhập thành công!", "success");
            }

            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi xử lý đơn nhập:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi xử lý đơn nhập!";
            window.showToast(errorMessage, "error");
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
                            <div className="space-y-6">
                                <div className="space-y-2 max-w-md">
                                    <Label htmlFor="supplier" className="text-slate-600 font-medium">
                                        Nhà Cung Cấp <span className="text-red-500">*</span>
                                    </Label>
                                    <FloatingDropdown
                                        value={formData.supplierName || undefined}
                                        onChange={(value) => handleInputChange("supplierName", value)}
                                        options={supplierOptions}
                                        placeholder="Chọn nhà cung cấp"
                                        loading={suppliersLoading}
                                    />
                                </div>
                                
                                {/* Thông tin nhà cung cấp đã chọn */}
                                {formData.supplierName && (() => {
                                    const selectedSupplier = suppliers.find(supplier => supplier.companyName === formData.supplierName);
                                    return selectedSupplier ? (
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-orange-800 mb-3">Thông Tin Nhà Cung Cấp</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Tên Công Ty</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedSupplier.companyName}</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Thương Hiệu</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedSupplier.brandName}</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Địa Chỉ</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedSupplier.address}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Người Liên Hệ</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedSupplier.contactPersonName}</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Số Điện Thoại</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedSupplier.contactPersonPhone}</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Email</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedSupplier.contactPersonEmail}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
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
                                            <TableHead className="text-slate-600 font-semibold">Quy Cách Đóng Gói</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Số Lượng Thùng</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Tổng Số Đơn Vị</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Đơn Vị</TableHead>
                                            {items.length > 1 && (
                                                <TableHead className="text-right text-slate-600 font-semibold">Hành Động</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50 py-4">
                                                <TableCell className="text-slate-700">{index + 1}</TableCell>
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <div>
                                                        <FloatingDropdown
                                                            value={item.goodsName || undefined}
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
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <div>
                                                        <FloatingDropdown
                                                            value={item.goodsPackingId || undefined}
                                                            onChange={(value) => updateItem(item.id, "goodsPackingId", value)}
                                                            options={getGoodsPackingOptions(item.id)}
                                                            placeholder={item.goodsName ? "Chọn đóng gói" : "Chọn hàng hóa trước"}
                                                            loading={packingLoading}
                                                            disabled={!item.goodsName}
                                                        />
                                                        {fieldErrors[`${item.id}-goodsPackingId`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`${item.id}-goodsPackingId`]}</p>
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
                                                    <div className="h-[38px] flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 font-medium">
                                                        {(() => {
                                                            const totalUnits = calculateTotalUnits(item);
                                                            if (totalUnits === 0) return "0";
                                                            return totalUnits.toString();
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-[38px] flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600">
                                                        {(() => {
                                                            if (item.goodsName) {
                                                                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                                                                return selectedGood ? selectedGood.name : "Trống";
                                                            }
                                                            return "Trống";
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
                                        <TableRow className="border-b border-gray-200">
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
                                        </TableRow>
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


                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    {isEditMode ? "Cập Nhật Đơn Nhập" : "Tạo Đơn Nhập"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
