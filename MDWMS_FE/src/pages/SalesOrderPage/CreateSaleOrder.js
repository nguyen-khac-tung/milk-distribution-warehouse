import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, CheckCircle, BarChart3, ArrowRightLeft, Calendar } from "lucide-react"
import { createSaleOrder, updateSaleOrderStatusPendingApproval, getSalesOrderListSalesRepresentatives } from "../../services/SalesOrderService"
import { getRetailersDropdown } from "../../services/RetailerService"
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getGoodsPackingByGoodsId } from "../../services/PurchaseOrderService"
import { getGoodsInventoryBySupplierId } from "../../services/GoodService"
import { extractErrorMessage } from "../../utils/Validation"
import CreateBackOrderModal from "../BackOrderPage/CreateBackOrderModal"
import { ComponentIcon } from "../../components/IconComponent/Icon"

function CreateSaleOrder({
    isEditMode = false,
    initialData = null
}) {
    const navigate = useNavigate();
    const dateInputRef = useRef(null);
    // Minimum selectable date: tomorrow (force future date)
    const minDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();
    const [retailers, setRetailers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [goodsBySupplier, setGoodsBySupplier] = useState({});
    const [goodsPackingsMap, setGoodsPackingsMap] = useState({});
    const [inventoryMap, setInventoryMap] = useState({});
    const [retailersLoading, setRetailersLoading] = useState(false);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [goodsLoading, setGoodsLoading] = useState({});
    const [packingLoading, setPackingLoading] = useState(false);

    // Lấy dữ liệu từ localStorage nếu có (từ BackOrderList)
    const getInitialData = () => {
        if (initialData) return initialData;

        try {
            const storedData = localStorage.getItem('saleOrderFromBackOrder');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                // Xóa dữ liệu sau khi lấy để tránh tái sử dụng
                localStorage.removeItem('saleOrderFromBackOrder');
                return parsed;
            }
        } catch (error) {
            console.error("Error parsing stored sale order data:", error);
        }
        return null;
    };

    const dataFromBackOrder = getInitialData();

    const [formData, setFormData] = useState({
        retailerName: dataFromBackOrder?.retailerName || initialData?.retailerName || "",
        estimatedTimeDeparture: initialData?.estimatedTimeDeparture || "",
        note: initialData?.note || ""
    });

    const [items, setItems] = useState(
        dataFromBackOrder?.items || initialData?.items || [
            { id: 1, supplierName: "", goodsName: "", quantity: "", goodsPackingId: "" },
        ],
    )
    const [fieldErrors, setFieldErrors] = useState({})
    const [showBackOrderModal, setShowBackOrderModal] = useState(false)
    const [insufficientItems, setInsufficientItems] = useState([])
    const [itemsExceedingStock, setItemsExceedingStock] = useState({})
    const [saveDraftLoading, setSaveDraftLoading] = useState(false)
    const [submitApprovalLoading, setSubmitApprovalLoading] = useState(false)

    const loadGoodsBySupplier = async (supplierId) => {
        // Check if goods already loaded for this supplier
        if (goodsBySupplier[supplierId]) {
            return;
        }

        setGoodsLoading(prev => ({ ...prev, [supplierId]: true }));
        try {
            const response = await getGoodsInventoryBySupplierId(supplierId);
            const goodsData = response?.data || response?.items || response || [];

            // Lưu goods vào state và goodsPackings vào map từ response (vì API đã trả về sẵn)
            setGoodsBySupplier(prev => ({
                ...prev,
                [supplierId]: goodsData
            }));

            // Lưu goodsPackings vào map từ response (vì API đã trả về sẵn)
            setGoodsPackingsMap(prev => {
                const newPackingsMap = { ...prev };
                goodsData.forEach(good => {
                    if (good.goodsId && good.goodsPackings && good.goodsPackings.length > 0) {
                        newPackingsMap[good.goodsId] = good.goodsPackings;
                    }
                });
                return newPackingsMap;
            });

            // Lưu inventory data vào map
            setInventoryMap(prev => {
                const newInventoryMap = { ...prev };
                goodsData.forEach(good => {
                    if (good.goodsId && good.inventoryPackingDtos && good.inventoryPackingDtos.length > 0) {
                        newInventoryMap[good.goodsId] = good.inventoryPackingDtos;
                    }
                });
                return newInventoryMap;
            });
        } catch (error) {
            setGoodsBySupplier(prev => ({
                ...prev,
                [supplierId]: []
            }));
        } finally {
            setGoodsLoading(prev => ({ ...prev, [supplierId]: false }));
        }
    };

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

                // Nếu có dữ liệu từ BackOrder, load goods cho các supplier đã có trong items
                if (dataFromBackOrder && dataFromBackOrder.items && suppliersData.length > 0) {
                    const supplierNames = [...new Set(dataFromBackOrder.items.map(item => item.supplierName).filter(Boolean))];
                    for (const supplierName of supplierNames) {
                        const supplier = suppliersData.find(s => s.companyName === supplierName);
                        if (supplier) {
                            await loadGoodsBySupplier(supplier.supplierId);
                        }
                    }
                }
            } catch (error) {
                setRetailers([]);
                setSuppliers([]);
            } finally {
                setRetailersLoading(false);
                setSuppliersLoading(false);
            }
        };

        loadData();
    }, []);

    // Đảm bảo goodsPackings được load khi có items từ BackOrder với goodsPackingId
    useEffect(() => {
        if (dataFromBackOrder && dataFromBackOrder.items && suppliers.length > 0 && Object.keys(goodsBySupplier).length > 0) {
            // Đảm bảo goodsPackings được load cho tất cả items có goodsPackingId
            const itemsWithPackingId = dataFromBackOrder.items.filter(item =>
                item.goodsPackingId && item.supplierName && item.goodsName
            );

            itemsWithPackingId.forEach(item => {
                const supplier = suppliers.find(s => s.companyName === item.supplierName);
                if (supplier) {
                    const goods = goodsBySupplier[supplier.supplierId] || [];
                    const selectedGood = goods.find(g => g.goodsName === item.goodsName);
                    if (selectedGood && (!goodsPackingsMap[selectedGood.goodsId] || goodsPackingsMap[selectedGood.goodsId].length === 0)) {
                        // Nếu chưa có packings, thử load lại
                        loadGoodsBySupplier(supplier.supplierId);
                    }
                }
            });
        }
    }, [suppliers, goodsBySupplier, dataFromBackOrder]);

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

            // GoodsPackings đã được load sẵn khi load goods, không cần load riêng nữa

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

        // Xóa viền đỏ khi người dùng sửa item (nếu item đó đã từng vượt quá tồn kho)
        if (itemsExceedingStock[id]) {
            setItemsExceedingStock(prev => {
                const newMap = { ...prev };
                delete newMap[id];
                return newMap;
            });
        }

        // Validate real-time cho số lượng (use updatedItems to avoid stale state)
        if (field === "quantity" || field === "goodsPackingId") {
            const updatedItem = updatedItems.find(item => item.id === id);
            if (updatedItem) {
                const tempItem = { ...updatedItem, [field]: value };

                // Nếu đã có đủ thông tin, validate
                if (tempItem.supplierName && tempItem.goodsName && tempItem.goodsPackingId) {
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
                } else if (tempItem.quantity) {
                    // Nếu chưa có đủ thông tin nhưng đã nhập số lượng, validate cơ bản
                    const quantity = parseInt(tempItem.quantity);
                    if (isNaN(quantity) || quantity <= 0) {
                        setFieldErrors(prev => ({
                            ...prev,
                            [`${id}-quantity`]: "Vui lòng nhập số thùng lớn hơn 0"
                        }));
                    } else {
                        // Xóa lỗi nếu số lượng hợp lệ nhưng chưa có đủ thông tin để validate tồn kho
                        setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`${id}-quantity`];
                            return newErrors;
                        });
                    }
                } else {
                    // Nếu không có số lượng, xóa lỗi
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

        const unitMeasureName = selectedGood?.unitMeasureName || "đơn vị";
        const goodsId = selectedGood.goodsId;

        // Lấy goodsPackings từ map theo goodsId
        let goodsPackings = goodsPackingsMap[goodsId] || [];
        const inventoryData = inventoryMap[goodsId] || [];

        // Nếu chưa có packings và có goodsPackingId từ BackOrder, thử load lại
        if (goodsPackings.length === 0 && currentItem.goodsPackingId && !goodsLoading[selectedSupplier.supplierId]) {
            // Trigger load nếu chưa có packings
            if (goodsBySupplier[selectedSupplier.supplierId] && goodsBySupplier[selectedSupplier.supplierId].length > 0) {
                // Goods đã được load nhưng chưa có packings
            } else {
                // Goods chưa được load, trigger load
                loadGoodsBySupplier(selectedSupplier.supplierId);
            }
        }

        if (goodsPackings.length === 0) {
            return currentItem.goodsPackingId
                ? [{ value: currentItem.goodsPackingId.toString(), label: "Đang tải..." }]
                : [];
        }

        return goodsPackings.map(packing => {
            const inventory = inventoryData.find(inv =>
                inv.goodsPackingId?.toString() === packing.goodsPackingId?.toString() ||
                inv.goodsPackingId === packing.goodsPackingId
            );
            const availableQuantity = inventory?.availablePackageQuantity || 0;
            const packingIdStr = packing.goodsPackingId?.toString() || "";
            return {
                value: packingIdStr,
                label: `${packing.unitPerPackage} ${unitMeasureName}/thùng`
            };
        });
    };

    // Tính tổng số đơn vị (số thùng × đơn vị đóng gói)
    const calculateTotalUnits = (item) => {
        if (!item.quantity || !item.goodsPackingId || !item.supplierName) return 0;

        const selectedSupplier = suppliers.find(supplier => supplier.companyName === item.supplierName);
        if (!selectedSupplier) return 0;

        const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
        const selectedGood = goods.find(good => good.goodsName === item.goodsName);
        if (!selectedGood) return 0;

        const goodsPackings = goodsPackingsMap[selectedGood.goodsId] || [];
        const selectedPacking = goodsPackings.find(packing =>
            packing.goodsPackingId?.toString() === item.goodsPackingId?.toString() ||
            packing.goodsPackingId === parseInt(item.goodsPackingId)
        );

        if (!selectedPacking) return 0;

        return parseInt(item.quantity) * selectedPacking.unitPerPackage;
    };

    // Hàm lấy thông tin tồn kho cho một item
    const getItemStockInfo = (item) => {
        try {
            // Kiểm tra điều kiện cơ bản
            if (!item || !item.supplierName || !item.goodsName || !item.goodsPackingId || !item.quantity) {
                return null;
            }

            const requestedQuantity = parseInt(item.quantity);
            if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
                return null;
            }

            // Tìm supplier
            const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
            if (!selectedSupplier) {
                return null;
            }

            // Tìm goods
            const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
            const selectedGood = goods.find(g => g.goodsName === item.goodsName);
            if (!selectedGood || !selectedGood.goodsId) {
                return null;
            }

            // Lấy inventory data
            const inventoryData = inventoryMap[selectedGood.goodsId] || [];

            // Normalize goodsPackingId về số
            const itemPackingId = parseInt(item.goodsPackingId);
            if (isNaN(itemPackingId)) {
                return null;
            }

            // Tìm inventory matching goodsPackingId
            let inventory = null;
            for (const inv of inventoryData) {
                if (!inv || !inv.goodsPackingId) continue;

                const invPackingId = parseInt(inv.goodsPackingId);
                if (!isNaN(invPackingId) && invPackingId === itemPackingId) {
                    inventory = inv;
                    break;
                }
            }

            // Lấy available quantity (mặc định là 0 nếu không tìm thấy)
            const availableQuantity = inventory?.availablePackageQuantity ?? 0;
            const isExceeding = requestedQuantity > availableQuantity;

            return {
                availableQuantity,
                requestedQuantity,
                isExceeding,
                hasInventory: inventory !== null
            };
        } catch (error) {
            return null;
        }
    };

    // Kiểm tra validation cho số thùng
    const validateQuantity = (item) => {
        // Kiểm tra điều kiện cần thiết
        if (!item.quantity || item.quantity === "" || !item.goodsPackingId || !item.supplierName || !item.goodsName) {
            return null;
        }

        const quantity = parseInt(item.quantity);

        // Kiểm tra số lượng hợp lệ
        if (isNaN(quantity) || quantity <= 0) {
            return "Vui lòng nhập số thùng lớn hơn 0";
        }

        // Kiểm tra tồn kho
        const stockInfo = getItemStockInfo(item);
        const availableQuantity = stockInfo?.availableQuantity ?? 0;

        // Nếu vượt quá tồn kho, hiển thị thông báo tồn kho
        if (quantity > availableQuantity) {
            return `(Có sẵn: ${availableQuantity} thùng)`;
        }

        return null;
    };

    // Tính toán thông tin tồn kho để hiển thị
    const getStockInformation = () => {
        const validItems = items.filter(item =>
            item.supplierName && item.goodsName && item.quantity && item.goodsPackingId && parseInt(item.quantity) > 0
        );

        if (validItems.length === 0) {
            return {
                totalGoods: 0,
                sufficientCount: 0,
                insufficientCount: 0,
                goods: [],
                allSufficient: false
            };
        }

        const goods = validItems.map(item => {
            const stockInfo = getItemStockInfo(item);
            if (!stockInfo) return null;

            const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
            const goodsList = selectedSupplier ? goodsBySupplier[selectedSupplier.supplierId] || [] : [];
            const selectedGood = goodsList.find(g => g.goodsName === item.goodsName);

            return {
                goodsName: item.goodsName,
                goodsCode: selectedGood?.goodsCode || "-",
                requestedQuantity: stockInfo.requestedQuantity,
                availableQuantity: stockInfo.availableQuantity,
                isSufficient: !stockInfo.isExceeding
            };
        }).filter(item => item !== null);

        const sufficientCount = goods.filter(m => m.isSufficient).length;
        const insufficientCount = goods.filter(m => !m.isSufficient).length;
        const allSufficient = sufficientCount === goods.length && goods.length > 0;

        return {
            totalGoods: goods.length,
            sufficientCount,
            insufficientCount,
            goods,
            allSufficient
        };
    };

    // Tính toán danh sách mặt hàng thiếu để tạo BackOrder
    const getInsufficientItemsForBackOrder = () => {
        const validItems = items.filter(item =>
            item.supplierName && item.goodsName && item.quantity && item.goodsPackingId && parseInt(item.quantity) > 0
        );

        if (validItems.length === 0) {
            return [];
        }

        const insufficientItems = validItems.map(item => {
            const stockInfo = getItemStockInfo(item);
            if (!stockInfo || !stockInfo.isExceeding) {
                return null;
            }

            const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
            if (!selectedSupplier) return null;

            const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
            const selectedGood = goods.find(g => g.goodsName === item.goodsName);
            if (!selectedGood) return null;

            // Tính số lượng thiếu (requested - available)
            const shortageQuantity = stockInfo.requestedQuantity - stockInfo.availableQuantity;

            return {
                goodsId: selectedGood.goodsId,
                goodsPackingId: parseInt(item.goodsPackingId),
                goodsName: selectedGood.goodsName,
                goodsCode: selectedGood.goodsCode || "-",
                requestedQuantity: stockInfo.requestedQuantity,
                availableQuantity: stockInfo.availableQuantity,
                packageQuantity: shortageQuantity, // Số lượng thiếu
            };
        }).filter(item => item !== null);

        return insufficientItems;
    };

    // Mở modal BackOrder với danh sách mặt hàng thiếu
    const handleOpenBackOrderModal = () => {
        const insufficient = getInsufficientItemsForBackOrder();
        if (insufficient.length === 0) {
            window.showToast("Không có mặt hàng nào bị thiếu tồn kho", "info");
            return;
        }
        setInsufficientItems(insufficient);
        setShowBackOrderModal(true);
    };

    // Lưu lại thành bản nháp
    const handleSaveAsDraft = async (e) => {
        e.preventDefault();

        // Reset validation errors
        setFieldErrors({});
        const newFieldErrors = {};

        // Kiểm tra validation
        items.forEach((item, index) => {
            if (!item.supplierName) newFieldErrors[`${item.id}-supplierName`] = "Vui lòng chọn nhà cung cấp";
            if (!item.goodsName) newFieldErrors[`${item.id}-goodsName`] = "Vui lòng chọn tên hàng hóa";
            if (!item.goodsPackingId) newFieldErrors[`${item.id}-goodsPackingId`] = "Vui lòng chọn đóng gói";

            if (item.supplierName && item.goodsName && item.goodsPackingId) {
                if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                    newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
                } else {
                    // Kiểm tra tồn kho nếu đã nhập số lượng hợp lệ
                    const quantityError = validateQuantity(item);
                    if (quantityError && !quantityError.includes("(Có sẵn:")) {
                        // Chỉ block validation nếu là lỗi format (không phải lỗi tồn kho)
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    } else if (quantityError && quantityError.includes("(Có sẵn:")) {
                        // Nếu vượt quá tồn kho, chỉ set warning (không block validation)
                        // Validation vẫn pass để có thể show toast ở phần submit
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    }
                }
            } else if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
            }
        });

        // Tách riêng blocking errors (lỗi format/required) và warnings (tồn kho)
        // Chỉ block validation nếu có blocking errors, warnings không block
        const blockingErrors = {};
        const warnings = {};

        Object.keys(newFieldErrors).forEach(key => {
            const error = newFieldErrors[key];
            // Nếu là warning về tồn kho (có chứa "(Có sẵn:"), chỉ thêm vào warnings
            if (error && error.includes("(Có sẵn:")) {
                warnings[key] = error;
            } else {
                // Các lỗi khác là blocking errors
                blockingErrors[key] = error;
            }
        });

        // Set cả warnings và blocking errors để hiển thị
        setFieldErrors({ ...blockingErrors, ...warnings });

        if (!formData.retailerName) {
            window.showToast("Vui lòng chọn nhà bán lẻ", "error");
            if (Object.keys(blockingErrors).length > 0) return;
        }

        if (!formData.estimatedTimeDeparture) {
            window.showToast("Vui lòng chọn ngày dự kiến giao hàng", "error");
            if (Object.keys(blockingErrors).length > 0) return;
        }

        const selectedDate = new Date(formData.estimatedTimeDeparture);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            window.showToast("Ngày giao hàng phải trong tương lai", "error");
            if (Object.keys(blockingErrors).length > 0) return;
        }

        // Chỉ block validation nếu có blocking errors
        if (Object.keys(blockingErrors).length > 0) {
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

        // Kiểm tra tồn kho - CHẶN submit nếu vượt quá tồn kho
        const itemsExceedingStockMap = {};
        const insufficientItems = [];

        for (const item of validItems) {
            const stockInfo = getItemStockInfo(item);

            // Nếu có thông tin tồn kho và vượt quá tồn kho
            if (stockInfo && stockInfo.isExceeding) {
                itemsExceedingStockMap[item.id] = {
                    availableQuantity: stockInfo.availableQuantity,
                    requestedQuantity: stockInfo.requestedQuantity
                };
                insufficientItems.push(item);
            }
        }

        if (insufficientItems.length > 0) {
            // Lưu thông tin các items vượt quá tồn kho để hiển thị viền đỏ
            setItemsExceedingStock(itemsExceedingStockMap);

            // Hiển thị thông báo lỗi và CHẶN submit
            const firstItem = insufficientItems[0];
            const message = insufficientItems.length === 1
                ? `Sản phẩm "${firstItem.goodsName}" vượt quá tồn kho. Vui lòng điều chỉnh số lượng.`
                : `Có ${insufficientItems.length} sản phẩm vượt quá tồn kho. Vui lòng điều chỉnh số lượng.`;

            // Đảm bảo toast được hiển thị và CHẶN submit
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast(message, "error");
            } else if (typeof window !== 'undefined' && window.showToast) {
                window.showToast(message);
            }

            // CHẶN submit khi vượt quá tồn kho
            return;
        } else {
            setItemsExceedingStock({});
        }

        try {
            setSaveDraftLoading(true);

            const itemsWithIds = validItems.map(item => {
                const selectedSupplier = suppliers.find(supplier => supplier.companyName === item.supplierName);
                if (!selectedSupplier) return null;

                const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                if (!selectedGood) return null;

                return {
                    supplierId: parseInt(selectedSupplier.supplierId),
                    goodsId: parseInt(selectedGood.goodsId),
                    goodsPackingId: parseInt(item.goodsPackingId),
                    packageQuantity: parseInt(item.quantity)
                };
            }).filter(item => item !== null);

            if (itemsWithIds.length === 0) {
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            const submitData = {
                retailerId: parseInt(selectedRetailer.retailerId),
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                note: formData.note || "",
                salesOrderItemDetailCreateDtos: itemsWithIds
            };

            await createSaleOrder(submitData);
            window.showToast("Lưu bản nháp thành công!", "success");
            navigate("/sales-orders");
        } catch (error) {
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi lưu bản nháp!");

            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setSaveDraftLoading(false);
        }
    };

    // Gửi phê duyệt (tạo và submit ngay)
    const handleSubmitForApproval = async (e) => {
        e.preventDefault();

        // **LOGIC CHẶN KHI VƯỢT QUÁ TỒN KHO VẪN ĐƯỢC GIỮ NGUYÊN (Không cho gửi phê duyệt)**
        setFieldErrors({});
        const newFieldErrors = {};

        items.forEach((item, index) => {
            if (!item.supplierName) newFieldErrors[`${item.id}-supplierName`] = "Vui lòng chọn nhà cung cấp";
            if (!item.goodsName) newFieldErrors[`${item.id}-goodsName`] = "Vui lòng chọn tên hàng hóa";
            if (!item.goodsPackingId) newFieldErrors[`${item.id}-goodsPackingId`] = "Vui lòng chọn đóng gói";

            // Check quantity for validation
            if (item.supplierName && item.goodsName && item.goodsPackingId) {
                if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                    newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
                } else {
                    // Kiểm tra tồn kho nếu đã nhập số lượng hợp lệ
                    // NHƯNG: Không block validation khi vượt quá tồn kho
                    // Chỉ hiển thị warning, validation sẽ pass để có thể show toast ở phần submit
                    const quantityError = validateQuantity(item);
                    if (quantityError && !quantityError.includes("(Có sẵn:")) {
                        // Chỉ block validation nếu là lỗi format (không phải lỗi tồn kho)
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    } else if (quantityError && quantityError.includes("(Có sẵn:")) {
                        // Nếu vượt quá tồn kho, chỉ set warning (không block validation)
                        // Validation vẫn pass để có thể show toast ở phần submit
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    }
                }
            } else if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
            }
        });

        // Tách riêng blocking errors (lỗi format/required) và warnings (tồn kho)
        // Chỉ block validation nếu có blocking errors, warnings không block
        const blockingErrors = {};
        const warnings = {};

        Object.keys(newFieldErrors).forEach(key => {
            const error = newFieldErrors[key];
            // Nếu là warning về tồn kho (có chứa "(Có sẵn:"), chỉ thêm vào warnings
            if (error && error.includes("(Có sẵn:")) {
                warnings[key] = error;
            } else {
                // Các lỗi khác là blocking errors
                blockingErrors[key] = error;
            }
        });

        // Set cả warnings và blocking errors để hiển thị
        setFieldErrors({ ...blockingErrors, ...warnings });

        if (!formData.retailerName) {
            window.showToast("Vui lòng chọn nhà bán lẻ", "error");
            if (Object.keys(blockingErrors).length > 0) return;
        }

        if (!formData.estimatedTimeDeparture) {
            window.showToast("Vui lòng chọn ngày dự kiến giao hàng", "error");
            if (Object.keys(blockingErrors).length > 0) return;
        }

        const selectedDate = new Date(formData.estimatedTimeDeparture);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate <= today) {
            window.showToast("Ngày giao hàng phải trong tương lai", "error");
            if (Object.keys(blockingErrors).length > 0) return;
        }

        // Chỉ block validation nếu có blocking errors
        if (Object.keys(blockingErrors).length > 0) {
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

        // Kiểm tra tồn kho - CHẶN submit nếu vượt quá tồn kho
        const itemsExceedingStockMap = {};
        const insufficientItems = [];

        for (const item of validItems) {
            const stockInfo = getItemStockInfo(item);

            // Nếu có thông tin tồn kho và vượt quá tồn kho
            if (stockInfo && stockInfo.isExceeding) {
                itemsExceedingStockMap[item.id] = {
                    availableQuantity: stockInfo.availableQuantity,
                    requestedQuantity: stockInfo.requestedQuantity
                };
                insufficientItems.push(item);
            }
        }

        if (insufficientItems.length > 0) {
            // Lưu thông tin các items vượt quá tồn kho để hiển thị viền đỏ
            setItemsExceedingStock(itemsExceedingStockMap);

            const firstItem = insufficientItems[0];
            const message = insufficientItems.length === 1
                ? `Sản phẩm "${firstItem.goodsName}" vượt quá tồn kho. Vui lòng kiểm tra lại số lượng.`
                : `Có ${insufficientItems.length} sản phẩm vượt quá tồn kho. Vui lòng kiểm tra lại số lượng.`;

            // Đảm bảo toast được hiển thị
            if (typeof window !== 'undefined' && window.showToast) {
                window.showToast(message, "error");
            } else if (typeof window !== 'undefined' && window.showToast) {
                window.showToast(message);
            }
            return;
        }

        // Nếu không có items vượt quá tồn kho, reset state
        setItemsExceedingStock({});

        try {
            setSubmitApprovalLoading(true);

            const itemsWithIds = validItems.map(item => {
                const selectedSupplier = suppliers.find(supplier => supplier.companyName === item.supplierName);
                if (!selectedSupplier) return null;

                const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                const selectedGood = goods.find(good => good.goodsName === item.goodsName);
                if (!selectedGood) return null;

                return {
                    supplierId: parseInt(selectedSupplier.supplierId),
                    goodsId: parseInt(selectedGood.goodsId),
                    goodsPackingId: parseInt(item.goodsPackingId),
                    packageQuantity: parseInt(item.quantity)
                };
            }).filter(item => item !== null);

            if (itemsWithIds.length === 0) {
                window.showToast("Không tìm thấy hàng hóa hợp lệ!", "error");
                return;
            }

            const submitData = {
                retailerId: parseInt(selectedRetailer.retailerId),
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                note: formData.note || "",
                salesOrderItemDetailCreateDtos: itemsWithIds
            };

            // Tạo Sales Order
            await createSaleOrder(submitData);

            // Fetch lại list để lấy salesOrderId mới tạo
            try {
                const listResponse = await getSalesOrderListSalesRepresentatives({
                    pageNumber: 1,
                    pageSize: 1,
                    sortField: "createdAt",
                    sortAscending: false
                });

                if (listResponse && listResponse.success && listResponse.data && listResponse.data.items && listResponse.data.items.length > 0) {
                    const latestOrder = listResponse.data.items[0];
                    const salesOrderId = latestOrder.salesOrderId;

                    // Gửi phê duyệt
                    await updateSaleOrderStatusPendingApproval({
                        salesOrderId: salesOrderId
                    });

                    window.showToast("Tạo và gửi phê duyệt đơn bán hàng thành công!", "success");
                    navigate("/sales-orders");
                } else {
                    // Nếu không lấy được ID, vẫn báo thành công (đã tạo)
                    window.showToast("Tạo đơn bán hàng thành công! Vui lòng gửi phê duyệt từ trang chi tiết.", "success");
                    navigate("/sales-orders");
                }
            } catch (fetchError) {
                // Nếu không fetch được, vẫn báo thành công (đã tạo)
                window.showToast("Tạo đơn bán hàng thành công! Vui lòng gửi phê duyệt từ trang chi tiết.", "success");
                navigate("/sales-orders");
            }
        } catch (error) {
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tạo và gửi phê duyệt đơn bán hàng!");

            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setSubmitApprovalLoading(false);
        }
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
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </Button>

                        <h1 className="text-2xl font-bold text-slate-700 leading-none flex items-center m-0">
                            {isEditMode ? "Cập Nhật Đơn Bán Hàng" : "Tạo Đơn Bán Hàng Mới"}
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
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-2">
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
                                        <Label htmlFor="estimatedTimeDeparture" className="text-sm font-medium text-slate-600">
                                            Ngày Dự Kiến Giao <span className="text-red-500">*</span>
                                        </Label>
                                        {/* Giới hạn chiều rộng container */}
                                        <div className="relative w-[180px]">
                                            <Input
                                                id="estimatedTimeDeparture"
                                                type="date"
                                                value={formData.estimatedTimeDeparture}
                                                onChange={(e) => handleInputChange("estimatedTimeDeparture", e.target.value)}
                                                ref={dateInputRef}
                                                // min={minDate}
                                                className="date-picker-input h-[37px] pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg w-full"
                                            />
                                            <Calendar
                                                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 cursor-pointer"
                                                onClick={() => {
                                                    const el = dateInputRef.current
                                                    if (!el) return
                                                    if (typeof el.showPicker === "function") el.showPicker()
                                                    else {
                                                        el.focus()
                                                        el.click()
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Thông tin nhà bán lẻ đã chọn */}
                                {formData.retailerName && (() => {
                                    const selectedRetailer = retailers.find(retailer => retailer.retailerName === formData.retailerName);
                                    return selectedRetailer ? (
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-orange-800 mb-3">Thông Tin Nhà Bán Lẻ</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Email</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedRetailer.email}</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Số Điện Thoại</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedRetailer.phone}</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs text-orange-600 font-medium mb-1">Địa Chỉ</div>
                                                    <div className="text-sm font-semibold text-slate-700">{selectedRetailer.address}</div>
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
                                <div className="overflow-x-auto w-full">
                                    <Table className="min-w-[1000px]">
                                        <TableHeader>
                                            <TableRow className="border-b border-gray-200 hover:bg-transparent">
                                                <TableHead className="text-slate-600 font-semibold w-[4%]">STT</TableHead>
                                                <TableHead className="text-slate-600 font-semibold w-[18%]">Nhà Cung Cấp</TableHead>
                                                <TableHead className="text-slate-600 font-semibold w-[22%]">Tên Hàng Hóa</TableHead>
                                                <TableHead className="text-slate-600 font-semibold w-[15%]">Quy Cách Đóng Gói</TableHead>
                                                <TableHead className="text-slate-600 font-semibold text-center w-[150px]">Số Lượng Thùng</TableHead>
                                                <TableHead className="text-slate-600 font-semibold text-center w-[130px]">Tổng Số Đơn Vị</TableHead>
                                                <TableHead className="text-slate-600 font-semibold text-center w-[130px]">Đơn Vị</TableHead>
                                                {items.length > 1 && (
                                                    <TableHead className="text-right text-slate-600 font-semibold w-[6%]">
                                                        Hành Động
                                                    </TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {items.map((item, index) => {
                                                const isExceedingStock = itemsExceedingStock[item.id] !== undefined;

                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        className={`border-b min-h-[70px] ${isExceedingStock
                                                            ? 'border-red-500 border-2 bg-red-50 hover:bg-red-100'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {/* STT */}
                                                        <TableCell className="text-center text-slate-700 align-top pb-6">
                                                            {index + 1}
                                                        </TableCell>

                                                        {/* Nhà cung cấp */}
                                                        <TableCell className="relative align-top pb-6">
                                                            <div className="relative min-w-[160px] max-w-[220px] w-full">
                                                                <FloatingDropdown
                                                                    value={item.supplierName || undefined}
                                                                    onChange={(value) => updateItem(item.id, "supplierName", value)}
                                                                    options={supplierOptions}
                                                                    placeholder="Chọn nhà cung cấp"
                                                                    loading={suppliersLoading}
                                                                    className="truncate w-full"
                                                                    title={item.supplierName || ""}
                                                                />
                                                                {fieldErrors[`${item.id}-supplierName`] && (
                                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                                        {fieldErrors[`${item.id}-supplierName`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Tên hàng hóa */}
                                                        <TableCell className="relative align-top pb-6">
                                                            <div className="relative min-w-[180px] max-w-[260px] w-full">
                                                                <FloatingDropdown
                                                                    value={item.goodsName || undefined}
                                                                    onChange={(value) => updateItem(item.id, "goodsName", value)}
                                                                    options={getAvailableGoodsOptions(item.id)}
                                                                    placeholder={
                                                                        item.supplierName
                                                                            ? "Chọn hàng hóa"
                                                                            : "Chọn nhà cung cấp trước"
                                                                    }
                                                                    loading={(() => {
                                                                        if (!item.supplierName) return false;
                                                                        const selectedSupplier = suppliers.find(
                                                                            (s) => s.companyName === item.supplierName
                                                                        );
                                                                        return selectedSupplier
                                                                            ? goodsLoading[selectedSupplier.supplierId] || false
                                                                            : false;
                                                                    })()}
                                                                    disabled={!item.supplierName}
                                                                    className="truncate w-full"
                                                                    title={item.goodsName || ""}
                                                                />
                                                                {fieldErrors[`${item.id}-goodsName`] && (
                                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                                        {fieldErrors[`${item.id}-goodsName`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Quy cách đóng gói */}
                                                        <TableCell className="relative align-top pb-6">
                                                            <div className="relative min-w-[130px] max-w-[140px] w-full">
                                                                <FloatingDropdown
                                                                    value={item.goodsPackingId ? item.goodsPackingId.toString() : undefined}
                                                                    onChange={(value) => updateItem(item.id, "goodsPackingId", value)}
                                                                    options={getGoodsPackingOptions(item.id)}
                                                                    placeholder={
                                                                        item.goodsName ? "Chọn đóng gói" : "Chọn hàng hóa trước"
                                                                    }
                                                                    loading={packingLoading}
                                                                    disabled={!item.goodsName}
                                                                    className="truncate w-full"
                                                                    title={item.goodsPackingId ? item.goodsPackingId.toString() : ""}
                                                                />
                                                                {fieldErrors[`${item.id}-goodsPackingId`] && (
                                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                                        {fieldErrors[`${item.id}-goodsPackingId`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Số lượng thùng */}
                                                        <TableCell className="w-[150px] relative align-top pb-6">
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    min="0"
                                                                    value={item.quantity === "" ? "" : item.quantity}
                                                                    onChange={(e) =>
                                                                        updateItem(item.id, "quantity", e.target.value)
                                                                    }
                                                                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${fieldErrors[`${item.id}-quantity`] ? "border-red-500" : ""
                                                                        }`}
                                                                />
                                                                {fieldErrors[`${item.id}-quantity`] && (
                                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs whitespace-nowrap">
                                                                        {fieldErrors[`${item.id}-quantity`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Tổng số đơn vị */}
                                                        <TableCell className="w-[130px] text-center align-top pb-6">
                                                            <div className="h-[38px] flex items-center justify-center px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 font-medium">
                                                                {calculateTotalUnits(item) || "0"}
                                                            </div>
                                                        </TableCell>

                                                        {/* Đơn vị */}
                                                        <TableCell className="w-[100px] text-center align-top pb-6">
                                                            <div className="h-[38px] flex items-center justify-center px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 text-sm">
                                                                {(() => {
                                                                    if (item.goodsName && item.supplierName) {
                                                                        const selectedSupplier = suppliers.find(
                                                                            (s) => s.companyName === item.supplierName
                                                                        );
                                                                        if (selectedSupplier) {
                                                                            const goods =
                                                                                goodsBySupplier[selectedSupplier.supplierId] || [];
                                                                            const selectedGood = goods.find(
                                                                                (good) => good.goodsName === item.goodsName
                                                                            );
                                                                            return selectedGood
                                                                                ? selectedGood.unitMeasureName
                                                                                : "Trống";
                                                                        }
                                                                    }
                                                                    return "Trống";
                                                                })()}
                                                            </div>
                                                        </TableCell>

                                                        {/* Hành động */}
                                                        {items.length > 1 && (
                                                            <TableCell className="text-right align-top pb-6">
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
                                                );
                                            })}

                                            {/* Hàng trống cuối cùng */}
                                            <TableRow className="border-b border-gray-200">
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                                <TableCell
                                                    className={items.length === 1 ? "py-12" : "py-6"}
                                                ></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
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

                            <div className="space-y-2 mt-2">
                                <Label htmlFor="note" className="text-slate-600 font-medium">
                                    Ghi Chú
                                </Label>
                                <Textarea
                                    value={formData.note}
                                    rows={4}
                                    onChange={(e) => handleInputChange("note", e.target.value)}
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                    className="min-h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                <Button
                                    type="button"
                                    onClick={handleSaveAsDraft}
                                    disabled={saveDraftLoading || submitApprovalLoading}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saveDraftLoading ? "Đang lưu..." : "Lưu nháp"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmitForApproval}
                                    disabled={saveDraftLoading || submitApprovalLoading}
                                    className="h-[38px] px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitApprovalLoading ? "Đang xử lý..." : "Gửi phê duyệt"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stock Information Card */}
                {(() => {
                    const stockInfo = getStockInformation();
                    if (stockInfo.totalGoods === 0) return null;

                    return (
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <div className="p-6 space-y-4">
                                {/* Header */}
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-lg font-semibold text-blue-600">Thông Tin Tồn Kho</h3>
                                </div>

                                {/* Status Banner */}
                                <div className={`rounded-lg p-4 ${stockInfo.allSufficient
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                    }`}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className={`h-5 w-5 ${stockInfo.allSufficient ? 'text-green-600' : 'text-red-600'}`} />
                                            <ArrowRightLeft className={`h-5 w-5 ${stockInfo.allSufficient ? 'text-green-600' : 'text-red-600'}`} />
                                            <span className={`font-medium ${stockInfo.allSufficient ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                {stockInfo.allSufficient
                                                    ? 'Đủ tồn kho - Có thể tạo đơn bán hàng'
                                                    : 'Thiếu tồn kho - Vui lòng kiểm tra lại'
                                                }
                                            </span>
                                        </div>
                                        {/* Button để tạo BackOrder cho các mặt hàng thiếu - Góc phải */}
                                        {!stockInfo.allSufficient && stockInfo.insufficientCount > 0 && (
                                            <Button
                                                type="button"
                                                onClick={handleOpenBackOrderModal}
                                                className="h-[38px] px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Tạo đơn bổ sung cho {stockInfo.insufficientCount} mặt hàng thiếu
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Goods Cards */}
                                {stockInfo.goods.length > 0 && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {stockInfo.goods.map((goods, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle className={`h-5 w-5 ${goods.isSufficient ? 'text-green-600' : 'text-red-600'}`} />
                                                    <h4 className="font-semibold text-slate-700">{goods.goodsName}</h4>
                                                </div>

                                                <div className="text-sm text-slate-600 mb-2">
                                                    Mã sản phẩm: <span className="font-medium">{goods.goodsCode}</span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="text-sm">
                                                        <span className="text-slate-600">Yêu cầu: </span>
                                                        <span className="font-semibold text-slate-800">{goods.requestedQuantity}</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-slate-600">Có sẵn: </span>
                                                        <span className={`font-semibold ${goods.isSufficient ? 'text-green-600' : 'text-red-600'}`}>
                                                            {goods.availableQuantity}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Stock Summary */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-600">Tóm Tắt Tồn Kho:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="px-3 py-1.5 bg-gray-100 rounded-full">
                                            <span className="text-sm font-medium text-blue-600">
                                                Tổng: {stockInfo.totalGoods} mặt hàng
                                            </span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-green-100 rounded-full">
                                            <span className="text-sm font-medium text-green-600">
                                                Đủ: {stockInfo.sufficientCount} mặt hàng
                                            </span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-red-100 rounded-full">
                                            <span className="text-sm font-medium text-red-600">
                                                Thiếu: {stockInfo.insufficientCount} mặt hàng
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })()}
            </div>

            {/* BackOrder Modal */}
            <CreateBackOrderModal
                isOpen={showBackOrderModal}
                onClose={() => setShowBackOrderModal(false)}
                onSuccess={() => {
                    setShowBackOrderModal(false);
                    window.showToast("Tạo đơn đặt hàng thành công!", "success");
                }}
                selectedItems={insufficientItems.map(item => ({
                    goodsId: item.goodsId,
                    goodsPackingId: item.goodsPackingId,
                    goodsName: item.goodsName,
                    goodsCode: item.goodsCode,
                    requestedQuantity: item.packageQuantity, // Số lượng thiếu
                    availableQuantity: 0, // Không có sẵn vì đây là số lượng thiếu
                    packageQuantity: item.packageQuantity // Số lượng thiếu
                }))}
                retailerId={(() => {
                    if (!formData.retailerName || retailers.length === 0) {
                        return null;
                    }
                    const selectedRetailer = retailers.find(r =>
                        r.retailerName === formData.retailerName ||
                        r.RetailerName === formData.retailerName ||
                        (r.retailerName || r.RetailerName)?.toLowerCase() === formData.retailerName?.toLowerCase()
                    );
                    if (selectedRetailer) {
                        const retailerIdValue = selectedRetailer.retailerId || selectedRetailer.RetailerId;
                        return retailerIdValue ? retailerIdValue.toString() : null;
                    }
                    return null;
                })()}
            />
        </div>
    )
}

export default CreateSaleOrder