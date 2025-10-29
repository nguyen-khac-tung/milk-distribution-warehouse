import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X } from "lucide-react"
import { updateSaleOrder, getSalesOrderDetail } from "../../services/SalesOrderService"
import { getRetailersDropdown } from "../../services/RetailerService"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getGoodsDropDownBySupplierId, getGoodsPackingByGoodsId } from "../../services/PurchaseOrderService"
import Loading from "../../components/Common/Loading"

function UpdateSaleOrder() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [retailers, setRetailers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [goodsBySupplier, setGoodsBySupplier] = useState({}); // Map supplierId -> goods
    const [goodsPackingsMap, setGoodsPackingsMap] = useState({}); // Map goodsId -> packings
    const [retailersLoading, setRetailersLoading] = useState(false);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [goodsLoading, setGoodsLoading] = useState({}); // Map supplierId -> loading state
    const [packingLoading, setPackingLoading] = useState(false);
    const [formData, setFormData] = useState({
        retailerName: "",
        estimatedTimeDeparture: "",
        note: ""
    });

    const [items, setItems] = useState([
        { id: 1, supplierName: "", goodsName: "", quantity: "", goodsPackingId: "" },
    ])
    const [fieldErrors, setFieldErrors] = useState({}) // Lỗi theo từng trường

    // Load existing sales order data
    useEffect(() => {
        const loadSalesOrderData = async () => {
            if (!id) {
                window.showToast("Không tìm thấy ID đơn hàng", "error");
                navigate("/sales-orders");
                return;
            }

            try {
                setLoading(true);
                const response = await getSalesOrderDetail(id);
                console.log("Sales Order Detail Response:", response);
 
                const orderData = response?.data || response;
                console.log("Order Data:", orderData);

                if (orderData) {
                    // Set form data
                    setFormData({
                        retailerName: orderData.retailerName || "",
                        estimatedTimeDeparture: orderData.estimatedTimeDeparture || "",
                        note: orderData.note || ""
                    });

                    // Set items data - fix the mapping based on actual API structure
                    if (orderData.salesOrderItemDetails && orderData.salesOrderItemDetails.length > 0) {
                        const mappedItems = orderData.salesOrderItemDetails.map((detail, index) => {
                            // Calculate quantity from packageQuantity and unitPerPackage
                            const unitPerPackage = detail.goodsPacking?.unitPerPackage || 1;
                            const packageQuantity = detail.packageQuantity || 0;
                            const calculatedQuantity = unitPerPackage > 0 ? Math.floor(packageQuantity / unitPerPackage) : packageQuantity;

                            return {
                                id: index + 1,
                                supplierName: detail.goods?.companyName || detail.supplier?.companyName || "",
                                goodsName: detail.goods?.goodsName || "",
                                quantity: calculatedQuantity.toString(),
                                goodsPackingId: detail.goodsPacking?.goodsPackingId ? detail.goodsPacking.goodsPackingId.toString() : "",
                                salesOrderDetailId: detail.salesOrderDetailId || 0,
                                // Store original data for reference
                                originalGoodsId: detail.goods?.goodsId,
                                originalSupplierId: detail.goods?.supplierId
                            };
                        });
                        console.log("Mapped Items:", mappedItems);
                        setItems(mappedItems);
                    }
                }
            } catch (error) {
                console.error("Error loading sales order data:", error);
                window.showToast("Không thể tải dữ liệu đơn hàng", "error");
                navigate("/sales-orders");
            } finally {
                setLoading(false);
            }
        };

        loadSalesOrderData();
    }, [id, navigate]);

    // Load goods and packing data immediately after items are set
    useEffect(() => {
        const loadGoodsAndPackingData = async () => {
            if (suppliers.length === 0 || items.length === 0) return;

            console.log("Loading goods and packing data for items:", items);

            // Get unique supplier IDs from items (use original data if available)
            const supplierIds = [...new Set(items
                .filter(item => item.supplierName)
                .map(item => {
                    // Use original supplier ID if available, otherwise find by name
                    if (item.originalSupplierId) {
                        return item.originalSupplierId;
                    }
                    const supplier = suppliers.find(s => s.companyName === item.supplierName);
                    return supplier?.supplierId;
                })
                .filter(Boolean)
            )];

            console.log("Supplier IDs to load:", supplierIds);

            // Load goods for each supplier
            for (const supplierId of supplierIds) {
                if (!goodsBySupplier[supplierId]) {
                    console.log("Loading goods for supplier:", supplierId);
                    await loadGoodsBySupplier(supplierId);
                }
            }

            // Wait a bit for goods to be loaded
            await new Promise(resolve => setTimeout(resolve, 200));

            // Load packing data for each goods (use original data if available)
            const goodsIds = [...new Set(items
                .filter(item => item.goodsName)
                .map(item => {
                    // Use original goods ID if available
                    if (item.originalGoodsId) {
                        console.log("Using original goods ID:", item.originalGoodsId, "for goods:", item.goodsName);
                        return item.originalGoodsId;
                    }
                    
                    // Otherwise try to find by name
                    const supplier = suppliers.find(s => s.companyName === item.supplierName);
                    if (!supplier) return null;
                    const goods = goodsBySupplier[supplier.supplierId] || [];
                    const good = goods.find(g => g.goodsName === item.goodsName);
                    return good?.goodsId;
                })
                .filter(Boolean)
            )];

            console.log("Goods IDs to load packing for:", goodsIds);

            for (const goodsId of goodsIds) {
                if (!goodsPackingsMap[goodsId]) {
                    console.log("Loading packing for goods:", goodsId);
                    await loadGoodsPacking(goodsId);
                }
            }

            // Mark data as loaded
            setDataLoaded(true);
        };

        loadGoodsAndPackingData();
    }, [items]); // Only depend on items, not suppliers.length

    // Load retailers and suppliers on component mount
    useEffect(() => {
        const loadData = async () => {
            setRetailersLoading(true);
            setSuppliersLoading(true);
            try {
                const [retailersResponse, suppliersResponse] = await Promise.all([
                    getRetailersDropdown(),
                    getSuppliersDropdown()
                ]);

                const retailersData = retailersResponse?.data || retailersResponse?.items || retailersResponse || [];
                const suppliersData = suppliersResponse?.data || suppliersResponse?.items || suppliersResponse || [];

                setRetailers(retailersData);
                setSuppliers(suppliersData);
            } catch (error) {
                console.error("Error loading data:", error);
                setRetailers([]);
                setSuppliers([]);
            } finally {
                setRetailersLoading(false);
                setSuppliersLoading(false);
            }
        };

        loadData();
    }, []);


    const addItem = (e) => {
        // Ngăn chặn mọi event propagation
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const newItem = {
            id: Date.now(),
            supplierName: "",
            goodsName: "",
            quantity: "",
            goodsPackingId: "",
            salesOrderDetailId: 0
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
    }

    const removeItem = (id) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const updateItem = (id, field, value) => {
        let updatedItems = [...items];

        if (field === "supplierName") {
            // Load goods when supplier is selected
            if (value) {
                const selectedSupplier = suppliers.find(supplier => supplier.companyName === value);
                if (selectedSupplier) {
                    loadGoodsBySupplier(selectedSupplier.supplierId);
                }
            }

            // Reset related fields when supplier changes
            updatedItems = updatedItems.map((item) =>
                item.id === id
                    ? { ...item, [field]: value, goodsName: "", quantity: "", goodsPackingId: "" }
                    : item
            );
            // Apply reset immediately and stop further processing for this change
            setItems(updatedItems);
            return;
        } else if (field === "goodsName") {
            // Kiểm tra xem sản phẩm đã được chọn ở hàng khác chưa
            const isDuplicate = items.some(item => item.id !== id && item.goodsName === value && value !== "");
            if (isDuplicate) {
                window.showToast("Mặt hàng này đã được thêm vào danh sách!", "error");
                return;
            }

            // Load goods packing khi chọn goods (chỉ load nếu chưa có trong map)
            if (value) {
                const currentItem = items.find(item => item.id === id);
                if (currentItem && currentItem.supplierName) {
                    const selectedSupplier = suppliers.find(supplier => supplier.companyName === currentItem.supplierName);
                    if (selectedSupplier) {
                        const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                        const selectedGood = goods.find(good => good.goodsName === value);
                        if (selectedGood && !goodsPackingsMap[selectedGood.goodsId]) {
                            loadGoodsPacking(selectedGood.goodsId);
                        }
                    }
                }
            }

            // Reset quantity and packing when goods changes
            updatedItems = updatedItems.map((item) =>
                item.id === id
                    ? { ...item, [field]: value, quantity: "", goodsPackingId: "" }
                    : item
            );
        } else {
            // For other fields, just update normally
            updatedItems = updatedItems.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            );
        }

        setItems(updatedItems);

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
    }

    const loadGoodsBySupplier = async (supplierId) => {
        // Check if goods already loaded for this supplier
        if (goodsBySupplier[supplierId]) {
            return;
        }

        setGoodsLoading(prev => ({ ...prev, [supplierId]: true }));
        try {
            const response = await getGoodsDropDownBySupplierId(supplierId);
            const goodsData = response?.data || response?.items || response || [];
            setGoodsBySupplier(prev => ({
                ...prev,
                [supplierId]: goodsData
            }));
        } catch (error) {
            console.error("Error loading goods by supplier:", error);
            setGoodsBySupplier(prev => ({
                ...prev,
                [supplierId]: []
            }));
        } finally {
            setGoodsLoading(prev => ({ ...prev, [supplierId]: false }));
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
    const retailerOptions = retailers.map(retailer => ({
        value: retailer.retailerName,
        label: retailer.retailerName
    }));

    const supplierOptions = suppliers.map(supplier => ({
        value: supplier.companyName,
        label: supplier.companyName
    }));

    // Lọc danh sách hàng hóa để không hiển thị những mặt hàng đã được chọn
    const getAvailableGoodsOptions = (currentItemId) => {
        const currentItem = items.find(item => item.id === currentItemId);
        if (!currentItem || !currentItem.supplierName) {
            return [{ value: "", label: "Chọn nhà cung cấp trước" }];
        }

        const selectedSupplier = suppliers.find(supplier => supplier.companyName === currentItem.supplierName);
        if (!selectedSupplier) {
            return [{ value: "", label: "Không tìm thấy nhà cung cấp" }];
        }

        const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
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

    // Tạo options cho goods packing dropdown
    const getGoodsPackingOptions = (currentItemId) => {
        const currentItem = items.find(item => item.id === currentItemId);
        if (!currentItem || !currentItem.goodsName || !currentItem.supplierName) {
            return [{ value: "", label: "Chọn hàng hóa trước" }];
        }

        // Lấy thông tin hàng hóa để có unitMeasureName và goodsId
        const selectedSupplier = suppliers.find(supplier => supplier.companyName === currentItem.supplierName);
        if (!selectedSupplier) {
            return [{ value: "", label: "Không tìm thấy nhà cung cấp" }];
        }

        const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
        const selectedGood = goods.find(good => good.goodsName === currentItem.goodsName);
        if (!selectedGood) {
            return [{ value: "", label: "Không tìm thấy hàng hóa" }];
        }

        const unitMeasureName = selectedGood?.name || "đơn vị";
        const goodsId = selectedGood.goodsId;

        // Lấy goodsPackings từ map theo goodsId
        const goodsPackings = goodsPackingsMap[goodsId] || [];

        if (goodsPackings.length === 0) {
            return [];
        }

        return goodsPackings.map(packing => ({
            value: packing.goodsPackingId.toString(),
            label: `${packing.unitPerPackage} ${unitMeasureName}/thùng`
        }));
    };

    // Tính tổng số đơn vị (số thùng × đơn vị đóng gói)
    const calculateTotalUnits = (item) => {
        if (!item.quantity || !item.goodsPackingId) return 0;

        // Use original goods ID if available
        const goodsId = item.originalGoodsId;
        if (!goodsId) {
            console.log("No original goods ID found for item:", item);
            return 0;
        }

        const goodsPackings = goodsPackingsMap[goodsId] || [];
        const selectedPacking = goodsPackings.find(packing =>
            packing.goodsPackingId.toString() === item.goodsPackingId
        );

        if (!selectedPacking) {
            console.log("No packing found for goodsPackingId:", item.goodsPackingId, "in goods:", goodsId);
            console.log("Available packings:", goodsPackings);
            return 0;
        }

        const total = parseInt(item.quantity) * selectedPacking.unitPerPackage;
        console.log(`Calculating total: ${item.quantity} × ${selectedPacking.unitPerPackage} = ${total}`);
        return total;
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
            if (!item.supplierName) {
                newFieldErrors[`${item.id}-supplierName`] = "Vui lòng chọn nhà cung cấp";
            }
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

        // Kiểm tra nhà bán lẻ
        if (!formData.retailerName) {
            window.showToast("Vui lòng chọn nhà bán lẻ", "error");
            if (Object.keys(newFieldErrors).length > 0) {
                setFieldErrors(newFieldErrors);
            }
            return;
        }

        // Kiểm tra ngày giao hàng
        if (!formData.estimatedTimeDeparture) {
            window.showToast("Vui lòng chọn ngày dự kiến giao hàng", "error");
            if (Object.keys(newFieldErrors).length > 0) {
                setFieldErrors(newFieldErrors);
            }
            return;
        }

        // Kiểm tra ngày giao hàng phải trong tương lai
        const selectedDate = new Date(formData.estimatedTimeDeparture);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            window.showToast("Ngày giao hàng phải trong tương lai", "error");
            if (Object.keys(newFieldErrors).length > 0) {
                setFieldErrors(newFieldErrors);
            }
            return;
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        const selectedRetailer = retailers.find(retailer => retailer.retailerName === formData.retailerName);
        if (!selectedRetailer) {
            window.showToast("Không tìm thấy nhà bán lẻ", "error");
            return;
        }

        const validItems = items.filter(item => item.supplierName && item.goodsName && item.quantity && item.goodsPackingId);
        if (validItems.length === 0) {
            window.showToast("Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin", "error");
            return;
        }

        try {
            const itemsWithIds = validItems.map(item => {
                const selectedSupplier = suppliers.find(supplier => supplier.companyName === item.supplierName);
                if (!selectedSupplier) return null;

                const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                if (!selectedGood) return null;

                const goodsPackings = goodsPackingsMap[selectedGood.goodsId] || [];
                const selectedPacking = goodsPackings.find(packing =>
                    packing.goodsPackingId.toString() === item.goodsPackingId
                );

                // Tính packageQuantity = số thùng × đơn vị đóng gói
                const packageQuantity = selectedPacking ?
                    parseInt(item.quantity) * selectedPacking.unitPerPackage :
                    parseInt(item.quantity);

                return {
                    supplierId: parseInt(selectedSupplier.supplierId),
                    goodsId: parseInt(selectedGood.goodsId),
                    goodsPackingId: parseInt(item.goodsPackingId),
                    packageQuantity: packageQuantity,
                    salesOrderDetailId: item.salesOrderDetailId || 0
                };
            }).filter(item => item !== null);

            if (itemsWithIds.length === 0) {
                console.log("Không tìm thấy hàng hóa hợp lệ");
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            const submitData = {
                salesOrderId: id,
                retailerId: parseInt(selectedRetailer.retailerId),
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                note: formData.note || "",
                salesOrderItemDetailUpdateDtos: itemsWithIds
            };

            await updateSaleOrder(submitData);
            window.showToast("Cập nhật đơn bán hàng thành công!", "success");
            navigate("/sales-orders");
        } catch (error) {
            console.error("Lỗi khi cập nhật đơn bán hàng:", error);
            const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật đơn bán hàng!";
            window.showToast(errorMessage, "error");
        }
    }

    if (loading || !dataLoaded) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="default"
                            onClick={() => navigate("/sales-orders")}
                            className="text-slate-600 hover:bg-slate-50 flex items-center"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            <span className="mt-[1px]">Quay Lại</span>
                        </Button>

                        <h1 className="text-2xl font-bold text-slate-700 leading-none flex items-center">
                            Cập Nhật Đơn Bán Hàng
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
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="retailer" className="text-slate-600 font-medium">
                                        Nhà Bán Lẻ <span className="text-red-500">*</span>
                                    </Label>
                                    <FloatingDropdown
                                        value={formData.retailerName || undefined}
                                        onChange={(value) => handleInputChange("retailerName", value)}
                                        options={retailerOptions}
                                        placeholder="Chọn nhà bán lẻ"
                                        loading={retailersLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedTimeDeparture" className="text-slate-600 font-medium">
                                        Ngày Dự Kiến Giao <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={formData.estimatedTimeDeparture}
                                        onChange={(e) => handleInputChange("estimatedTimeDeparture", e.target.value)}
                                        className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 mt-2">
                                <Label htmlFor="note" className="text-slate-600 font-medium">
                                    Ghi Chú
                                </Label>
                                <Textarea
                                    value={formData.note}
                                    onChange={(e) => handleInputChange("note", e.target.value)}
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                    className="min-h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                />
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
                                            <TableHead className="text-slate-600 font-semibold">Nhà Cung Cấp</TableHead>
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
                                            <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50 py-4">
                                                <TableCell className="text-slate-700 w-[10px]">{index + 1}</TableCell>
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <div className="w-fit min-w-[180px] max-w-[240px] relative">
                                                        <FloatingDropdown
                                                            value={item.supplierName || undefined}
                                                            onChange={(value) => updateItem(item.id, "supplierName", value)}
                                                            options={supplierOptions}
                                                            placeholder="Chọn nhà cung cấp"
                                                            loading={suppliersLoading}
                                                        />
                                                        {fieldErrors[`${item.id}-supplierName`] && (
                                                            <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">{fieldErrors[`${item.id}-supplierName`]}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <div className="w-fit min-w-[180px] max-w-[200px] relative">
                                                        <FloatingDropdown
                                                            value={item.goodsName || undefined}
                                                            onChange={(value) => updateItem(item.id, "goodsName", value)}
                                                            options={getAvailableGoodsOptions(item.id)}
                                                            placeholder={item.supplierName ? "Chọn hàng hóa" : "Chọn nhà cung cấp trước"}
                                                            loading={(() => {
                                                                if (!item.supplierName) return false;
                                                                const selectedSupplier = suppliers.find(supplier => supplier.companyName === item.supplierName);
                                                                return selectedSupplier ? goodsLoading[selectedSupplier.supplierId] || false : false;
                                                            })()}
                                                            disabled={!item.supplierName}
                                                        />
                                                        {fieldErrors[`${item.id}-goodsName`] && (
                                                            <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">{fieldErrors[`${item.id}-goodsName`]}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="relative" style={{ overflow: 'visible', zIndex: 'auto' }}>
                                                    <div className="w-fit min-w-[130px] max-w-[160px] relative">
                                                        <FloatingDropdown
                                                            value={item.goodsPackingId || undefined}
                                                            onChange={(value) => updateItem(item.id, "goodsPackingId", value)}
                                                            options={getGoodsPackingOptions(item.id)}
                                                            placeholder={item.goodsName ? "Chọn đóng gói" : "Chọn hàng hóa trước"}
                                                            loading={packingLoading}
                                                            disabled={!item.goodsName}
                                                        />
                                                        {fieldErrors[`${item.id}-goodsPackingId`] && (
                                                            <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">{fieldErrors[`${item.id}-goodsPackingId`]}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="w-fit min-w-[50px] max-w-[60px] relative">
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={item.quantity === "" ? "" : item.quantity}
                                                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                                            className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${fieldErrors[`${item.id}-quantity`] ? 'border-red-500' : ''}`}
                                                        />
                                                        {fieldErrors[`${item.id}-quantity`] && (
                                                            <p className="absolute left-0 top-[42px] top-full mt-1 text-red-500 text-xs">{fieldErrors[`${item.id}-quantity`]}</p>
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
                                                            if (item.goodsName && item.supplierName) {
                                                                const selectedSupplier = suppliers.find(supplier => supplier.companyName === item.supplierName);
                                                                if (selectedSupplier) {
                                                                    const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                                                                    const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                                                                    return selectedGood ? selectedGood.name : "Chưa chọn";
                                                                }
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
                                        <TableRow className="border-b border-gray-200">
                                            <TableCell className={items.length === 1 ? "py-16" : "py-8"}></TableCell>
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
                                    Cập Nhật Đơn Bán Hàng
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default UpdateSaleOrder