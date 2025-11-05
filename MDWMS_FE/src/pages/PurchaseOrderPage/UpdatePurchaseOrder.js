import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Label } from "../../components/ui/label"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"
import { updatePurchaseOrder, getGoodsDropDownBySupplierId, getPurchaseOrderDetail, getGoodsPackingByGoodsId, submitPurchaseOrder } from "../../services/PurchaseOrderService"
import { extractErrorMessage } from '../../utils/Validation';
import { getSuppliersDropdown } from "../../services/SupplierService"

export default function UpdatePurchaseOrder() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [suppliers, setSuppliers] = useState([]);
    const [goods, setGoods] = useState([]);
    const [goodsPacking, setGoodsPacking] = useState({});
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [goodsLoading, setGoodsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formData, setFormData] = useState({
        supplierName: "",
        note: ""
    });

    const [items, setItems] = useState([
        { id: 1, goodsName: "", quantity: "", goodsPackingId: 0 },
    ])
    const [fieldErrors, setFieldErrors] = useState({})

    // Trigger re-calculation when goodsPacking changes
    useEffect(() => {
        // Force re-render when goodsPacking is updated
        if (Object.keys(goodsPacking).length > 0) {
            console.log("GoodsPacking updated, triggering re-calculation");
        }
    }, [goodsPacking]);

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
                console.log("=== LOADING UPDATE DATA ===");
                console.log("Order data:", orderData);
                console.log("Purchase order details:", orderData?.purchaseOrderDetails);

                if (orderData) {
                    // Set supplier
                    const supplier = suppliersData.find(s => s.supplierId === orderData.supplierId);
                    if (supplier) {
                        setFormData({
                            supplierName: supplier.companyName,
                            note: orderData.note || ""
                        });
                        // Load goods for this supplier để có thể edit
                        await loadGoodsBySupplier(orderData.supplierId);
                    }

                    // Set items - giữ nguyên dữ liệu từ detail
                    if (orderData.purchaseOrderDetails && orderData.purchaseOrderDetails.length > 0) {
                        const formattedItems = orderData.purchaseOrderDetails.map((detail, index) => {
                            // packageQuantity giờ đã là số thùng (không phải số đơn vị)
                            const packageQuantity = detail.packageQuantity || 0;

                            return {
                                id: index + 1,
                                goodsName: detail.goodsName || "",
                                quantity: packageQuantity.toString(), // packageQuantity đã là số thùng
                                goodsPackingId: detail.goodsPackingId || 0,
                                goodsId: detail.goodsId || 0,
                                purchaseOrderDetailId: detail.purchaseOrderDetailId,
                                // Giữ nguyên dữ liệu gốc để hiển thị
                                unitPerPacking: detail.unitPerPacking || 0,
                                unitMeasureName: detail.unitMeasureName || "đơn vị"
                            };
                        });
                        console.log("Formatted items:", formattedItems);
                        setItems(formattedItems);

                        // Load goods packing data cho các sản phẩm hiện có
                        console.log("Loading goods packing for existing items...");
                        for (const detail of orderData.purchaseOrderDetails) {
                            if (detail.goodsId) {
                                try {
                                    console.log(`Loading packing for goodsId: ${detail.goodsId}`);
                                    const packingResponse = await getGoodsPackingByGoodsId(detail.goodsId);
                                    const packingData = packingResponse?.data || packingResponse?.items || packingResponse || [];
                                    console.log(`Packing data for goodsId ${detail.goodsId}:`, packingData);

                                    setGoodsPacking(prev => ({
                                        ...prev,
                                        [detail.goodsId]: packingData
                                    }));
                                } catch (error) {
                                    console.error(`Error loading goods packing for goodsId ${detail.goodsId}:`, error);
                                }
                            }
                        }
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

        // Kiểm tra xem còn hàng hóa nào để thêm không (so sánh bằng goodsId)
        const selectedGoodsIds = items
            .filter(item => item.goodsId && item.goodsId !== 0)
            .map(item => item.goodsId);

        const availableGoods = goods.filter(good => !selectedGoodsIds.includes(good.goodsId));

        if (availableGoods.length === 0 && goods.length > 0) {
            window.showToast("Đã thêm hết tất cả mặt hàng từ nhà cung cấp này!", "error");
            return;
        }

        const newItem = {
            id: Date.now(),
            goodsName: "",
            quantity: "",
            goodsPackingId: 0,
            goodsId: 0,
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
    }

    const removeItem = (id) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const updateItem = async (id, field, value) => {
        if (field === "goodsName") {
            // Tìm goodsId từ goodsName được chọn
            const selectedGood = goods.find(good => good.goodsName === value);
            if (selectedGood) {
                // Load goods packing cho hàng hóa mới
                try {
                    const packingResponse = await getGoodsPackingByGoodsId(selectedGood.goodsId);
                    const packingData = packingResponse?.data || packingResponse?.items || packingResponse || [];

                    setGoodsPacking(prev => ({
                        ...prev,
                        [selectedGood.goodsId]: packingData
                    }));

                    // Cập nhật item KHÔNG tự động chọn đóng gói
                    setItems(items.map((item) =>
                        item.id === id
                            ? {
                                ...item,
                                [field]: value,
                                goodsPackingId: 0, // Không tự động chọn, để người dùng chọn thủ công
                                goodsId: selectedGood.goodsId
                            }
                            : item
                    ));
                } catch (error) {
                    console.error("Error loading goods packing:", error);
                    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
                }
            } else {
                setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
            }
        } else {
            setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
        }

        // Xóa lỗi validation khi người dùng sửa
        if (fieldErrors[`${id}-${field}`]) {
            const newErrors = { ...fieldErrors };
            delete newErrors[`${id}-${field}`];
            setFieldErrors(newErrors);
        }

        // Validate real-time cho số thùng
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

    // Kiểm tra validation cho số thùng
    const validateQuantity = (item) => {
        if (!item.quantity || !item.goodsPackingId) return null;

        const quantity = parseInt(item.quantity);

        if (quantity <= 0) {
            return "Số thùng phải lớn hơn 0";
        }

        return null;
    };

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


    // Tính tổng số đơn vị (số thùng × đơn vị đóng gói)
    const calculateTotalUnits = (item) => {
        if (!item.quantity || !item.goodsPackingId || item.goodsPackingId === 0) return 0;

        // Ưu tiên tìm theo goodsId nếu có
        let selectedGood = null;
        if (item.goodsId) {
            selectedGood = goods.find(good => good.goodsId === item.goodsId);
        }

        // Nếu không tìm thấy, thử tìm theo goodsName
        if (!selectedGood && item.goodsName) {
            selectedGood = goods.find(good => good.goodsName === item.goodsName);
        }

        if (!selectedGood) {
            console.log("Selected good not found for:", item.goodsName, "goodsId:", item.goodsId);
            return 0;
        }

        const goodsPackings = goodsPacking[selectedGood.goodsId] || [];

        // So sánh cả số và chuỗi để đảm bảo tìm được
        const targetPackingId = parseInt(item.goodsPackingId);
        const selectedPacking = goodsPackings.find(packing =>
            packing.goodsPackingId === targetPackingId ||
            parseInt(packing.goodsPackingId) === targetPackingId
        );

        if (!selectedPacking) {
            console.log("Selected packing not found for goodsPackingId:", item.goodsPackingId, "Available packings:", goodsPackings.map(p => p.goodsPackingId));
            // Nếu không tìm thấy trong goodsPacking, thử dùng unitPerPacking từ item (khi load từ API)
            if (item.unitPerPacking && item.quantity) {
                return parseInt(item.quantity) * item.unitPerPacking;
            }
            return 0;
        }

        const result = parseInt(item.quantity) * selectedPacking.unitPerPackage;
        console.log("Calculating total units:", item.quantity, "*", selectedPacking.unitPerPackage, "=", result);
        return result;
    };

    // Create options for dropdowns
    const supplierOptions = suppliers.map(supplier => ({
        value: supplier.companyName,
        label: supplier.companyName
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

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        const validItems = items.filter(item => item.goodsName && item.quantity && item.goodsPackingId);
        if (validItems.length === 0) {
            window.showToast("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin", "error");
            return;
        }

        try {
            const itemsWithIds = validItems.map(item => {
                // Ưu tiên dùng goodsId từ item (đã có từ dữ liệu load)
                let finalGoodsId = null;

                if (item.goodsId && item.goodsId !== 0) {
                    // Dùng goodsId từ item trước
                    finalGoodsId = parseInt(item.goodsId);
                } else {
                    // Tìm theo goodsName nếu không có goodsId
                    const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                    if (selectedGood) {
                        finalGoodsId = parseInt(selectedGood.goodsId);
                    }
                }

                if (!finalGoodsId) {
                    console.error("Cannot find goodsId for item:", item.goodsName, "item.goodsId:", item.goodsId);
                    return null;
                }

                // packageQuantity là số thùng nhập vào (không nhân với unitPerPackage)
                const packageQuantity = parseInt(item.quantity);

                return {
                    goodsId: finalGoodsId,
                    packageQuantity: packageQuantity,
                    goodsPackingId: parseInt(item.goodsPackingId),
                    purchaseOrderDetailId: item.purchaseOrderDetailId || 0
                };
            }).filter(item => item !== null && item.goodsId);

            if (itemsWithIds.length === 0) {
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            // Cấu trúc đúng theo API documentation
            const submitData = {
                purchaseOderId: id,
                purchaseOrderDetailUpdates: itemsWithIds,
                note: formData.note || ""
            };

            await updatePurchaseOrder(submitData);
            window.showToast("Cập nhật đơn mua hàng thành công!", "success");
            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi cập nhật đơn mua", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi cập nhật đơn mua hàng!";
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

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        const validItems = items.filter(item => item.goodsName && item.quantity && item.goodsPackingId);
        if (validItems.length === 0) {
            window.showToast("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin", "error");
            return;
        }

        setSubmitLoading(true);
        try {
            // Cập nhật đơn hàng trước
            const itemsWithIds = validItems.map(item => {
                let finalGoodsId = null;

                if (item.goodsId && item.goodsId !== 0) {
                    finalGoodsId = parseInt(item.goodsId);
                } else {
                    const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                    if (selectedGood) {
                        finalGoodsId = parseInt(selectedGood.goodsId);
                    }
                }

                if (!finalGoodsId) {
                    console.error("Cannot find goodsId for item:", item.goodsName, "item.goodsId:", item.goodsId);
                    return null;
                }

                const packageQuantity = parseInt(item.quantity);

                return {
                    goodsId: finalGoodsId,
                    packageQuantity: packageQuantity,
                    goodsPackingId: parseInt(item.goodsPackingId),
                    purchaseOrderDetailId: item.purchaseOrderDetailId || 0
                };
            }).filter(item => item !== null && item.goodsId);

            if (itemsWithIds.length === 0) {
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            const submitData = {
                purchaseOderId: id,
                purchaseOrderDetailUpdates: itemsWithIds,
                note: formData.note || ""
            };

            // Cập nhật đơn hàng
            await updatePurchaseOrder(submitData);
            
            // Sau đó gửi phê duyệt
            await submitPurchaseOrder(id);
            
            window.showToast("Cập nhật và gửi phê duyệt đơn mua hàng thành công!", "success");
            navigate("/purchase-orders");
        } catch (error) {
            console.error("Lỗi khi cập nhật và gửi phê duyệt đơn mua", error);
            const errorMessage = extractErrorMessage(error) || "Có lỗi xảy ra khi cập nhật và gửi phê duyệt đơn mua hàng!";
            window.showToast(errorMessage, "error");
        } finally {
            setSubmitLoading(false);
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
                            Cập Nhật Đơn Mua Hàng
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
                            <h3 className="text-lg font-semibold text-slate-600 mb-4">Thông Tin Đơn Mua Hàng</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier" className="text-slate-600 font-medium">
                                            Nhà Cung Cấp *
                                        </Label>
                                        <FloatingDropdown
                                            value={formData.supplierName || undefined}
                                            onChange={(value) => setFormData(prev => ({ ...prev, supplierName: value }))}
                                            options={supplierOptions}
                                            placeholder="Chọn nhà cung cấp"
                                            loading={suppliersLoading}
                                            disabled={true}
                                        />
                                    </div>
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
                                            <TableHead className="text-slate-600 font-semibold">Đóng Gói</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Số Thùng</TableHead>
                                            <TableHead className="text-slate-600 font-semibold">Tổng Số Đơn Vị</TableHead>
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
                                                            value={(() => {
                                                                // Tìm goodsName từ goodsId để hiển thị đúng
                                                                if (item.goodsId && goods.length > 0) {
                                                                    const selectedGood = goods.find(good => good.goodsId === item.goodsId);
                                                                    return selectedGood ? selectedGood.goodsName : item.goodsName;
                                                                }
                                                                return item.goodsName;
                                                            })()}
                                                            onChange={(value) => updateItem(item.id, "goodsName", value)}
                                                            options={(() => {
                                                                // Kiểm tra goods đã load chưa
                                                                if (!goods || goods.length === 0) {
                                                                    return [];
                                                                }

                                                                // Lọc ra những hàng hóa đã được chọn ở các hàng khác (so sánh bằng goodsId)
                                                                const selectedGoodsIds = items
                                                                    .filter(otherItem => otherItem.id !== item.id && otherItem.goodsId && otherItem.goodsId !== 0)
                                                                    .map(otherItem => otherItem.goodsId);

                                                                console.log(`=== DROPDOWN FOR ITEM ${index + 1} ===`);
                                                                console.log("Current item:", item);
                                                                console.log("All items:", items);
                                                                console.log("Selected goods IDs:", selectedGoodsIds);
                                                                console.log("All goods:", goods.map(g => ({ id: g.goodsId, name: g.goodsName })));

                                                                const availableGoods = goods.filter(good => !selectedGoodsIds.includes(good.goodsId));
                                                                console.log("Available goods:", availableGoods.map(g => ({ id: g.goodsId, name: g.goodsName })));

                                                                // Nếu không còn hàng hóa nào để chọn, hiển thị thông báo
                                                                if (availableGoods.length === 0 && goods.length > 0) {
                                                                    return [{
                                                                        value: { undefined },
                                                                        label: "Đã chọn hết hàng hóa"
                                                                    }];
                                                                }

                                                                return availableGoods.map(good => ({
                                                                    value: good.goodsName,
                                                                    label: good.goodsName
                                                                }));
                                                            })()}
                                                            placeholder={formData.supplierName ? "Chọn hàng hóa" : "Chọn nhà cung cấp trước"}
                                                            disabled={(() => {
                                                                // Kiểm tra goods đã load chưa
                                                                if (!goods || goods.length === 0) {
                                                                    return true;
                                                                }

                                                                const selectedGoodsIds = items
                                                                    .filter(otherItem => otherItem.id !== item.id && otherItem.goodsId && otherItem.goodsId !== 0)
                                                                    .map(otherItem => otherItem.goodsId);

                                                                const availableGoods = goods.filter(good => !selectedGoodsIds.includes(good.goodsId));
                                                                return availableGoods.length === 0 && goods.length > 0;
                                                            })()}
                                                        />
                                                        {fieldErrors[`${item.id}-goodsName`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`${item.id}-goodsName`]}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <div>
                                                        <FloatingDropdown
                                                            value={item.goodsPackingId ? item.goodsPackingId.toString() : undefined}
                                                            onChange={(value) => updateItem(item.id, "goodsPackingId", parseInt(value))}
                                                            options={(() => {
                                                                // Hiển thị đóng gói từ goodsPacking data để có thể edit
                                                                if (!item.goodsName) {
                                                                    return [];
                                                                }

                                                                if (!item.goodsId) {
                                                                    return [];
                                                                }

                                                                if (!goodsPacking[item.goodsId]) {
                                                                    return [];
                                                                }

                                                                // Tìm selectedGood để lấy unitMeasureName
                                                                const selectedGood = goods.find(good => good.goodsId === item.goodsId);
                                                                const unitMeasureName = selectedGood?.name || "đơn vị";

                                                                const options = goodsPacking[item.goodsId].map(packing => ({
                                                                    value: packing.goodsPackingId.toString(),
                                                                    label: `${packing.unitPerPackage} ${unitMeasureName}/thùng`
                                                                }));

                                                                return options;
                                                            })()}
                                                            placeholder="Chọn đóng gói"
                                                            disabled={false}
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
                                                            if (item.goodsId) {
                                                                const selectedGood = goods.find(good => good.goodsId === item.goodsId);
                                                                return selectedGood?.name || "Chưa chọn";
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

                            {/* Ghi chú */}
                            <div className="space-y-2">
                                <Label htmlFor="note" className="text-slate-600 font-medium">
                                    Ghi chú
                                </Label>
                                <Textarea
                                    id="note"
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="Nhập ghi chú cho đơn hàng (tùy chọn)"
                                    className="min-h-[100px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                Cập Nhật Đơn Mua Hàng
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
                </Card>
            </div>
        </div>
    )
}
