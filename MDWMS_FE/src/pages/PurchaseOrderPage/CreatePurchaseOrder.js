import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Label } from "../../components/ui/label"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"
import { createPurchaseOrder, getGoodsDropDownBySupplierId, getGoodsPackingByGoodsId, submitPurchaseOrder } from "../../services/PurchaseOrderService"
import { extractErrorMessage } from '../../utils/Validation';
import { getSuppliersDropdown } from "../../services/SupplierService"
import { ComponentIcon } from '../../components/IconComponent/Icon';

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
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formData, setFormData] = useState({
        supplierName: initialData?.supplierName || "",
        note: initialData?.note || ""
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

            // Lấy thông tin mặt hàng cũ để so sánh
            const currentItem = items.find(item => item.id === id);
            const oldGoodsName = currentItem?.goodsName;

            // Nếu thay đổi mặt hàng (bao gồm cả khi xóa/chọn lại), reset goodsPackingId và quantity
            if (value !== oldGoodsName) {
                if (value) {
                    // Chọn mặt hàng mới - Load goods packing cho mặt hàng mới
                    const selectedGood = goods.find(good => good.goodsName === value);
                    if (selectedGood) {
                        // Load goods packing (load lại ngay cả khi đã có trong map để đảm bảo data mới nhất)
                        loadGoodsPacking(selectedGood.goodsId);

                        // Reset goodsPackingId và quantity khi đổi mặt hàng
                        setItems(items.map((item) =>
                            item.id === id
                                ? { ...item, goodsName: value, goodsPackingId: "", quantity: "" }
                                : item
                        ));

                        // Xóa lỗi validation liên quan đến packing và quantity khi đổi mặt hàng
                        setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`${id}-goodsPackingId`];
                            delete newErrors[`${id}-quantity`];
                            return newErrors;
                        });
                        return;
                    }
                } else {
                    // Xóa mặt hàng - Reset tất cả các trường liên quan
                    setItems(items.map((item) =>
                        item.id === id
                            ? { ...item, goodsName: "", goodsPackingId: "", quantity: "" }
                            : item
                    ));

                    // Xóa lỗi validation liên quan
                    setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[`${id}-goodsPackingId`];
                        delete newErrors[`${id}-quantity`];
                        return newErrors;
                    });
                    return;
                }
            } else if (value) {
                // Lần đầu chọn mặt hàng (chưa có oldGoodsName), chỉ load packing nếu chưa có trong map
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
        // Lấy nhà cung cấp cũ để so sánh
        const oldSupplierName = formData.supplierName;

        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === "supplierName") {
            if (value) {
                const selectedSupplier = suppliers.find(supplier => supplier.companyName === value);
                if (selectedSupplier) {
                    // Nếu đổi nhà cung cấp (không phải lần đầu chọn), reset items và goodsPackingsMap
                    if (oldSupplierName && oldSupplierName !== value) {
                        // Reset items về mặc định (1 item trống)
                        setItems([{ id: Date.now(), goodsName: "", quantity: "", goodsPackingId: "" }]);
                        // Clear goodsPackingsMap
                        setGoodsPackingsMap({});
                        // Clear validation errors
                        setFieldErrors({});
                    }
                    // Load lại danh sách hàng hóa từ nhà cung cấp mới
                    loadGoodsBySupplier(selectedSupplier.supplierId);
                }
            } else {
                // Nếu xóa nhà cung cấp, reset tất cả
                setGoods([]);
                setItems([{ id: Date.now(), goodsName: "", quantity: "", goodsPackingId: "" }]);
                setGoodsPackingsMap({});
                setFieldErrors({});
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

                // packageQuantity là số thùng nhập vào (không nhân với unitPerPackage)
                const packageQuantity = parseInt(item.quantity);

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

            // Tạo đơn hàng mới
            const submitData = {
                supplierId: parseInt(selectedSupplier.supplierId),
                purchaseOrderDetailCreate: itemsWithIds,
                note: formData.note || ""
            };
            const response = await createPurchaseOrder(submitData);
            window.showToast("Tạo đơn mua hàng thành công!", "success");

            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi xử lý đơn mua hàng:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi xử lý đơn mua hàng!";
            window.showToast(errorMessage, "error");
        }
    }

    const handleSubmitForApproval = async (e) => {
        e.preventDefault();

        // Reset validation errors
        setFieldErrors({});
        const newFieldErrors = {};

        // Kiểm tra từng mặt hàng
        items.forEach((item, index) => {
            if (!item.goodsName) {
                newFieldErrors[`${item.id}-goodsName`] = "Vui lòng chọn tên hàng hóa";
            }
            if (!item.goodsPackingId) {
                newFieldErrors[`${item.id}-goodsPackingId`] = "Vui lòng chọn đóng gói";
            }
            if (!item.quantity || item.quantity <= 0) {
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
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

        setSubmitLoading(true);
        try {
            const itemsWithIds = validItems.map(item => {
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);

                // packageQuantity là số thùng nhập vào (không nhân với unitPerPackage)
                const packageQuantity = parseInt(item.quantity);

                return {
                    goodsId: selectedGood ? parseInt(selectedGood.goodsId) : null,
                    packageQuantity: packageQuantity,
                    goodsPackingId: parseInt(item.goodsPackingId)
                };
            }).filter(item => item.goodsId);

            if (itemsWithIds.length === 0) {
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            // Tạo đơn hàng mới trước
            const submitData = {
                supplierId: parseInt(selectedSupplier.supplierId),
                purchaseOrderDetailCreate: itemsWithIds,
                note: formData.note || ""
            };
            
            const createResponse = await createPurchaseOrder(submitData);
            
            // Lấy purchaseOrderId từ response (có thể từ data hoặc response trực tiếp)
            const purchaseOrderId = createResponse?.data?.purchaseOrderId || 
                                   createResponse?.purchaseOrderId || 
                                   createResponse?.data?.purchaseOderId || 
                                   createResponse?.purchaseOderId;
            
            if (!purchaseOrderId) {
                console.error("Không tìm thấy purchaseOrderId từ response:", createResponse);
                window.showToast("Tạo đơn hàng thành công nhưng không thể gửi phê duyệt. Vui lòng thử lại.", "error");
                navigate("/purchase-orders");
                return;
            }

            // Sau đó gửi phê duyệt
            await submitPurchaseOrder(purchaseOrderId);
            
            window.showToast("Tạo đơn và gửi phê duyệt thành công!", "success");
            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi tạo và gửi phê duyệt đơn mua hàng:", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi tạo và gửi phê duyệt đơn mua hàng!";
            window.showToast(errorMessage, "error");
        } finally {
            setSubmitLoading(false);
        }
    }
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/purchase-orders")}
                            className="flex items-center justify-center hover:opacity-80 transition-opacity p-0"
                        >
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-600 m-0">
                            {isEditMode ? "Cập Nhật Đơn Mua Hàng" : "Tạo Đơn Mua Hàng Mới"}
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

                            {/* Ghi chú */}
                            <div className="space-y-2">
                                <Label htmlFor="note" className="text-slate-600 font-medium">
                                    Ghi chú
                                </Label>
                                <Textarea
                                    id="note"
                                    value={formData.note}
                                    onChange={(e) => handleInputChange("note", e.target.value)}
                                    placeholder="Nhập ghi chú cho đơn hàng (tùy chọn)"
                                    className="min-h-[100px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg resize-none"
                                    rows={4}
                                />
                            </div>


                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Lưu bản nháp
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmitForApproval}
                                    disabled={submitLoading}
                                    className="h-[38px] px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitLoading ? "Đang xử lý..." : "Gửi Phê Duyệt"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
