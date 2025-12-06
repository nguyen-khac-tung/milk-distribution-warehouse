import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X, CheckCircle, BarChart3, ArrowRightLeft, Calendar } from "lucide-react"
import { updateSaleOrder, getSalesOrderDetail, updateSaleOrderStatusPendingApproval } from "../../services/SalesOrderService"
import { getRetailersDropdown } from "../../services/RetailerService"
import { getSuppliersDropdown } from "../../services/SupplierService"
import Loading from "../../components/Common/Loading"
import { extractErrorMessage } from "../../utils/Validation"
import { getGoodsInventoryBySupplierId } from "../../services/GoodService"
// 1. IMPORT MODAL TẠO ĐƠN BỔ SUNG
import CreateBackOrderModal from "../BackOrderPage/CreateBackOrderModal"
import { ComponentIcon } from "../../components/IconComponent/Icon"

function UpdateSaleOrder() {
    const navigate = useNavigate();
    const minDate = (() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();
    const dateInputRef = useRef(null);
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [retailers, setRetailers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [goodsBySupplier, setGoodsBySupplier] = useState({}); // Map supplierId -> goods
    const [goodsPackingsMap, setGoodsPackingsMap] = useState({}); // Map goodsId -> packings
    const [inventoryMap, setInventoryMap] = useState({}); // Map goodsId -> inventoryPackingDtos
    const [retailersLoading, setRetailersLoading] = useState(false);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [goodsLoading, setGoodsLoading] = useState({}); // Map supplierId -> loading state
    const [formData, setFormData] = useState({
        retailerName: "",
        estimatedTimeDeparture: "",
        note: ""
    });

    const [items, setItems] = useState([
        { id: 1, supplierName: "", goodsName: "", quantity: "", goodsPackingId: "" },
    ])
    const [fieldErrors, setFieldErrors] = useState({}) // Lỗi theo từng trường
    const [itemsExceedingStock, setItemsExceedingStock] = useState({}) // Map itemId -> { availableQuantity, requestedQuantity }
    const [submitLoading, setSubmitLoading] = useState(false)

    // 2. THÊM STATE CHO MODAL BACKORDER
    const [showBackOrderModal, setShowBackOrderModal] = useState(false)
    const [insufficientItems, setInsufficientItems] = useState([])

    // ... (Phần loadAllData useEffect và các hàm addItem, removeItem, updateItem, handleInputChange giữ nguyên)

    // Load all data in parallel for faster loading
    useEffect(() => {
        const loadAllData = async () => {
            if (!id) {
                window.showToast("Không tìm thấy ID đơn hàng", "error");
                navigate("/sales-orders");
                return;
            }

            try {
                setLoading(true);

                // Load all data in parallel
                const [orderResponse, retailersResponse, suppliersResponse] = await Promise.all([
                    getSalesOrderDetail(id),
                    getRetailersDropdown(),
                    getSuppliersDropdown()
                ]);

                // Set retailers and suppliers
                const retailersData = retailersResponse?.data || retailersResponse?.items || retailersResponse || [];
                const suppliersData = suppliersResponse?.data || suppliersResponse?.items || suppliersResponse || [];
                setRetailers(retailersData);
                setSuppliers(suppliersData);

                // Process order data
                const orderData = orderResponse?.data || orderResponse;
                if (orderData) {
                    // Set form data
                    setFormData({
                        retailerName: orderData.retailerName || "",
                        estimatedTimeDeparture: orderData.estimatedTimeDeparture || "",
                        note: orderData.note || ""
                    });

                    // Set items data
                    if (orderData.salesOrderItemDetails && orderData.salesOrderItemDetails.length > 0) {
                        const mappedItems = orderData.salesOrderItemDetails.map((detail, index) => {
                            return {
                                id: Date.now() + index, // Sử dụng Date.now() + index để đảm bảo ID duy nhất
                                supplierName: detail.goods?.companyName || detail.supplier?.companyName || "",
                                goodsName: detail.goods?.goodsName || "",
                                quantity: detail.packageQuantity ? detail.packageQuantity.toString() : "",
                                goodsPackingId: detail.goodsPacking?.goodsPackingId ? detail.goodsPacking.goodsPackingId.toString() : "",
                                salesOrderDetailId: detail.salesOrderDetailId || 0,
                                originalGoodsId: detail.goods?.goodsId,
                                originalSupplierId: detail.goods?.supplierId
                            };
                        });
                        setItems(mappedItems);

                        // Load goods for all suppliers in parallel
                        const supplierIds = [...new Set(mappedItems
                            .filter(item => item.originalSupplierId)
                            .map(item => item.originalSupplierId)
                            .filter(Boolean)
                        )];

                        if (supplierIds.length > 0) {
                            // Load all goods in parallel directly
                            await Promise.all(
                                supplierIds.map(async (supplierId) => {
                                    // Chắc chắn rằng chỉ load nếu chưa có trong state
                                    if (goodsBySupplier[supplierId]) return;

                                    // Lấy thông tin goods và tồn kho cho các supplier đã có trong đơn hàng
                                    setGoodsLoading(prev => ({ ...prev, [supplierId]: true }));
                                    try {
                                        const response = await getGoodsInventoryBySupplierId(supplierId);
                                        const goodsData = response?.data || response?.items || response || [];

                                        // Lưu goods, packings và inventory
                                        setGoodsBySupplier(prev => ({ ...prev, [supplierId]: goodsData }));

                                        setGoodsPackingsMap(prev => {
                                            const newPackingsMap = { ...prev };
                                            goodsData.forEach(good => {
                                                if (good.goodsId && good.goodsPackings && good.goodsPackings.length > 0) {
                                                    newPackingsMap[good.goodsId] = good.goodsPackings;
                                                }
                                            });
                                            return newPackingsMap;
                                        });

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
                                        setGoodsBySupplier(prev => ({ ...prev, [supplierId]: [] }));
                                    } finally {
                                        setGoodsLoading(prev => ({ ...prev, [supplierId]: false }));
                                    }
                                })
                            );
                        }
                    }
                }

                setDataLoaded(true);
            } catch (error) {
                window.showToast("Không thể tải dữ liệu đơn hàng", "error");
                navigate("/sales-orders");
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [id, navigate]);

    // Hàm loadGoodsBySupplier và các hàm xử lý input/item (addItem, removeItem, updateItem, handleInputChange) được giữ nguyên

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
            // Apply reset immediately
            setItems(updatedItems);

            // Xóa lỗi validation khi người dùng chọn nhà cung cấp
            const newErrors = { ...fieldErrors };
            // Xóa lỗi của supplierName
            if (newErrors[`${id}-${field}`]) {
                delete newErrors[`${id}-${field}`];
            }
            // Xóa lỗi của các field liên quan
            ['goodsName', 'goodsPackingId', 'quantity'].forEach(relatedField => {
                if (newErrors[`${id}-${relatedField}`]) {
                    delete newErrors[`${id}-${relatedField}`];
                }
            });
            setFieldErrors(newErrors);

            return;
        } else if (field === "goodsName") {
            // Cho phép chọn cùng hàng hóa (validation sẽ kiểm tra khi chọn quy cách đóng gói)
            // Reset quantity and packing when goods changes
            updatedItems = updatedItems.map((item) =>
                item.id === id
                    ? { ...item, [field]: value, quantity: "", goodsPackingId: "" }
                    : item
            );
        } else if (field === "goodsPackingId") {
            // Không cần kiểm tra duplicate vì đã ẩn các option trùng lặp
            // Update normally
            updatedItems = updatedItems.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
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


    // Create options for dropdowns
    const retailerOptions = retailers.map(retailer => ({
        value: retailer.retailerName,
        label: retailer.retailerName
    }));

    // Helper: Lấy danh sách các cặp (goodsName + goodsPackingId) đã được chọn (trừ currentItem)
    const getSelectedGoodsPackingPairs = (currentItemId) => {
        return items
            .filter(item => item.id !== currentItemId && item.goodsName && item.goodsPackingId)
            .map(item => `${item.goodsName}_${item.goodsPackingId}`);
    };

    // Lọc nhà cung cấp - chỉ hiện những nhà cung cấp còn hàng hóa có quy cách đóng gói chưa được chọn
    const getAvailableSupplierOptions = (currentItemId) => {
        const selectedPairs = getSelectedGoodsPackingPairs(currentItemId);
        
        return suppliers
            .filter(supplier => {
                const goods = goodsBySupplier[supplier.supplierId];
                
                // Nếu chưa load goods cho nhà cung cấp này, vẫn hiển thị (có thể đang load hoặc chưa load)
                if (!goods || goods.length === 0) {
                    return true; // Hiển thị để người dùng có thể chọn và trigger load
                }

                // Nếu đã có goods, kiểm tra xem nhà cung cấp này còn hàng hóa có quy cách đóng gói chưa được chọn không
                return goods.some(good => {
                    const goodsPackings = goodsPackingsMap[good.goodsId];
                    
                    // Nếu chưa load packings cho hàng hóa này, vẫn cho phép chọn (có thể đang load)
                    if (!goodsPackings || goodsPackings.length === 0) {
                        return true;
                    }
                    
                    // Nếu đã có packings, kiểm tra xem còn quy cách đóng gói chưa được chọn không
                    return goodsPackings.some(packing => {
                        const pair = `${good.goodsName}_${packing.goodsPackingId}`;
                        return !selectedPairs.includes(pair);
                    });
                });
            })
            .map(supplier => ({
                value: supplier.companyName,
                label: supplier.companyName
            }));
    };

    // Lọc danh sách hàng hóa - chỉ hiện những hàng hóa còn quy cách đóng gói chưa được chọn
    const getAvailableGoodsOptions = (currentItemId) => {
        const currentItem = items.find(item => item.id === currentItemId);
        if (!currentItem || !currentItem.supplierName) {
            return [{ value: "", label: "Chọn nhà cung cấp trước" }];
        }

        const selectedSupplier = suppliers.find(supplier => supplier.companyName === currentItem.supplierName);
        if (!selectedSupplier) {
            return [{ value: "", label: "Không tìm thấy nhà cung cấp" }];
        }

        const goods = goodsBySupplier[selectedSupplier.supplierId];
        const selectedPairs = getSelectedGoodsPackingPairs(currentItemId);
        
        // Nếu chưa load goods, trả về empty
        if (!goods || goods.length === 0) {
            return [{ value: "", label: "Đang tải..." }];
        }
        
        // Chỉ hiện những hàng hóa còn quy cách đóng gói chưa được chọn
        return goods
            .filter(good => {
                const goodsPackings = goodsPackingsMap[good.goodsId];
                
                // Nếu chưa load packings cho hàng hóa này, vẫn cho phép chọn (có thể đang load)
                if (!goodsPackings || goodsPackings.length === 0) {
                    return true;
                }
                
                // Kiểm tra xem hàng hóa này còn quy cách đóng gói chưa được chọn không
                return goodsPackings.some(packing => {
                    const pair = `${good.goodsName}_${packing.goodsPackingId}`;
                    return !selectedPairs.includes(pair);
                });
            })
            .map(good => ({
                value: good.goodsName,
                label: good.goodsName
            }));
    };

    // Tạo options cho goods packing dropdown - chỉ hiện những quy cách chưa được chọn
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
        const goodsPackings = goodsPackingsMap[goodsId] || [];
        const inventoryData = inventoryMap[goodsId] || [];

        if (goodsPackings.length === 0) {
            return [];
        }

        // Lấy danh sách các cặp (goodsName + goodsPackingId) đã được chọn
        const selectedPairs = getSelectedGoodsPackingPairs(currentItemId);

        // Chỉ hiện những quy cách đóng gói chưa được chọn cho hàng hóa này
        return goodsPackings
            .filter(packing => {
                const pair = `${currentItem.goodsName}_${packing.goodsPackingId}`;
                return !selectedPairs.includes(pair);
            })
            .map(packing => {
                const inventory = inventoryData.find(inv => 
                    inv.goodsPackingId?.toString() === packing.goodsPackingId?.toString() ||
                    inv.goodsPackingId === packing.goodsPackingId
                );
                const availableQuantity = inventory?.availablePackageQuantity || 0;
                return {
                    value: packing.goodsPackingId.toString(),
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

    // Scroll to first error field
    const scrollToFirstError = (errors) => {
        // Scroll to retailer field if it has error
        if (errors.retailerName) {
            setTimeout(() => {
                const retailerInput = document.querySelector('[data-field="retailerName"]');
                if (retailerInput) {
                    retailerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    retailerInput.focus();
                    return;
                }
            }, 100);
        }

        // Scroll to date field if it has error
        if (errors.estimatedTimeDeparture) {
            const dateInput = document.getElementById('estimatedTimeDeparture');
            if (dateInput) {
                dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                dateInput.focus();
                return;
            }
        }

        // Scroll to first item with error
        const firstErrorKey = Object.keys(errors).find(key =>
            key !== 'retailerName' && key !== 'estimatedTimeDeparture'
        );
        if (firstErrorKey) {
            // Try to find the input field for this error
            setTimeout(() => {
                const errorInput = document.querySelector(`[data-key="${firstErrorKey}"]`);
                if (errorInput) {
                    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorInput.focus();
                } else {
                    // Fallback: scroll to table
                    const table = document.querySelector('table');
                    if (table) {
                        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }, 100);
        }
    };

    // Tính toán thông tin tồn kho để hiển thị (đã có sẵn)
    const getStockInformation = () => {
        const validItems = items.filter(item =>
            item.supplierName && item.goodsName && item.quantity && item.goodsPackingId && parseInt(item.quantity) > 0
        );

        if (validItems.length === 0) {
            return {
                totalGoods: 0,
                sufficientCount: 0,
                insufficientCount: 0,
                good: [],
                allSufficient: false
            };
        }

        const good = validItems.map(item => {
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

        const sufficientCount = good.filter(m => m.isSufficient).length;
        const insufficientCount = good.filter(m => !m.isSufficient).length;
        const allSufficient = sufficientCount === good.length && good.length > 0;

        return {
            totalGoods: good.length,
            sufficientCount,
            insufficientCount,
            good,
            allSufficient
        };
    };

    // 3. LOGIC TÍNH TOÁN DANH SÁCH hàng hóa THIẾU CHO BACKORDER (Được sao chép từ CreateSaleOrder)
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

    // 4. HÀM MỞ MODAL BACKORDER
    const handleOpenBackOrderModal = () => {
        const insufficient = getInsufficientItemsForBackOrder();
        if (insufficient.length === 0) {
            window.showToast("Không có hàng hóa nào bị thiếu tồn kho", "info");
            return;
        }
        setInsufficientItems(insufficient);
        setShowBackOrderModal(true);
    };

    // ... (Các hàm handleSubmit và handleSubmitForApproval giữ nguyên, không thay đổi logic chặn submit khi thiếu tồn kho)

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset validation errors
        setFieldErrors({});
        const newFieldErrors = {};

        // Kiểm tra validation
        items.forEach((item, index) => {
            const rowNumber = index + 1;
            if (!item.supplierName) newFieldErrors[`${item.id}-supplierName`] = "Vui lòng chọn nhà cung cấp";
            if (!item.goodsName) newFieldErrors[`${item.id}-goodsName`] = "Vui lòng chọn tên hàng hóa";
            if (!item.goodsPackingId) newFieldErrors[`${item.id}-goodsPackingId`] = "Vui lòng chọn đóng gói";

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

        // Validate form fields
        if (!formData.retailerName) {
            blockingErrors.retailerName = "Vui lòng chọn nhà bán lẻ";
        }

        if (!formData.estimatedTimeDeparture) {
            blockingErrors.estimatedTimeDeparture = "Vui lòng chọn ngày dự kiến giao hàng";
        } else {
            const selectedDate = new Date(formData.estimatedTimeDeparture);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                blockingErrors.estimatedTimeDeparture = "Ngày giao hàng không thể trong quá khứ";
            }
        }

        // Set cả warnings và blocking errors để hiển thị
        setFieldErrors({ ...blockingErrors, ...warnings });

        // Scroll to first error if validation fails
        if (Object.keys(blockingErrors).length > 0) {
            setTimeout(() => scrollToFirstError(blockingErrors), 100);
            return;
        }

        const selectedRetailer = retailers.find(retailer => retailer.retailerName === formData.retailerName);
        if (!selectedRetailer) {
            blockingErrors.retailerName = "Không tìm thấy nhà bán lẻ";
            setFieldErrors({ ...blockingErrors, ...warnings });
            setTimeout(() => scrollToFirstError(blockingErrors), 100);
            return;
        }

        const validItems = items.filter(item => item.supplierName && item.goodsName && item.quantity && item.goodsPackingId);
        if (validItems.length === 0) {
            // Thêm lỗi vào item đầu tiên
            if (items.length > 0) {
                const firstItemId = items[0].id;
                blockingErrors[`${firstItemId}-supplierName`] = "Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin";
                setFieldErrors({ ...blockingErrors, ...warnings });
                setTimeout(() => scrollToFirstError(blockingErrors), 100);
            }
            return;
        }

        // Kiểm tra duplicate: cùng hàng hóa + cùng quy cách đóng gói
        const duplicateMap = new Map();
        validItems.forEach(item => {
            const key = `${item.goodsName}_${item.goodsPackingId}`;
            if (!duplicateMap.has(key)) {
                duplicateMap.set(key, []);
            }
            duplicateMap.get(key).push(item);
        });

        const duplicates = Array.from(duplicateMap.values()).filter(group => group.length > 1);
        if (duplicates.length > 0) {
            // Tìm item đầu tiên bị duplicate
            const firstDuplicate = duplicates[0][0];
            blockingErrors[`${firstDuplicate.id}-goodsPackingId`] = "Hàng hóa với quy cách đóng gói này đã được thêm vào danh sách!";
            setFieldErrors({ ...blockingErrors, ...warnings });
            setTimeout(() => {
                const errorInput = document.querySelector(`[data-key="${firstDuplicate.id}-goodsPackingId"]`);
                if (errorInput) {
                    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorInput.focus();
                }
            }, 100);
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

            // Thêm lỗi vào field quantity của item đầu tiên vượt quá tồn kho
            const firstItem = insufficientItems[0];
            const stockInfo = getItemStockInfo(firstItem);
            const errorMessage = insufficientItems.length === 1
                ? `Vượt quá tồn kho (Có sẵn: ${stockInfo?.availableQuantity || 0} thùng)`
                : `Vượt quá tồn kho (Có sẵn: ${stockInfo?.availableQuantity || 0} thùng). Có ${insufficientItems.length} hàng hóa thiếu tồn kho.`;

            blockingErrors[`${firstItem.id}-quantity`] = errorMessage;
            setFieldErrors({ ...blockingErrors, ...warnings });

            // Focus vào trường quantity của item đầu tiên
            setTimeout(() => {
                const errorInput = document.querySelector(`[data-key="${firstItem.id}-quantity"]`);
                if (errorInput) {
                    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorInput.focus();
                }
            }, 100);

            // CHẶN submit khi vượt quá tồn kho
            return;
        } else {
            setItemsExceedingStock({});
        }

        try {
            setSubmitLoading(true);

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
                    packageQuantity: parseInt(item.quantity),
                    salesOrderDetailId: item.salesOrderDetailId || 0
                };
            }).filter(item => item !== null);

            if (itemsWithIds.length === 0) {
                // Thêm lỗi vào item đầu tiên
                if (items.length > 0) {
                    const firstItemId = items[0].id;
                    blockingErrors[`${firstItemId}-supplierName`] = "Không tìm thấy hàng hóa hợp lệ";
                    setFieldErrors({ ...blockingErrors, ...warnings });
                    setTimeout(() => scrollToFirstError(blockingErrors), 100);
                }
                setSubmitLoading(false);
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
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật đơn bán hàng!")
            if (window.showToast) window.showToast(message, "error");
        } finally {
            setSubmitLoading(false);
        }
    }

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
                    const quantityError = validateQuantity(item);
                    if (quantityError && !quantityError.includes("(Có sẵn:")) {
                        // Chỉ block validation nếu là lỗi format (không phải lỗi tồn kho)
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    } else if (quantityError && quantityError.includes("(Có sẵn:")) {
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    }
                }
            } else if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
            }
        });

        const blockingErrors = {};
        const warnings = {};

        Object.keys(newFieldErrors).forEach(key => {
            const error = newFieldErrors[key];
            if (error && error.includes("(Có sẵn:")) {
                warnings[key] = error;
            } else {
                blockingErrors[key] = error;
            }
        });

        // Validate form fields
        if (!formData.retailerName) {
            blockingErrors.retailerName = "Vui lòng chọn nhà bán lẻ";
        }

        if (!formData.estimatedTimeDeparture) {
            blockingErrors.estimatedTimeDeparture = "Vui lòng chọn ngày dự kiến giao hàng";
        } else {
            const selectedDate = new Date(formData.estimatedTimeDeparture);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                blockingErrors.estimatedTimeDeparture = "Ngày giao hàng không thể trong quá khứ";
            }
        }

        // Set cả warnings và blocking errors để hiển thị
        setFieldErrors({ ...blockingErrors, ...warnings });

        // Scroll to first error if validation fails
        if (Object.keys(blockingErrors).length > 0) {
            setTimeout(() => scrollToFirstError(blockingErrors), 100);
            return;
        }

        const selectedRetailer = retailers.find(retailer => retailer.retailerName === formData.retailerName);
        if (!selectedRetailer) {
            blockingErrors.retailerName = "Không tìm thấy nhà bán lẻ";
            setFieldErrors({ ...blockingErrors, ...warnings });
            setTimeout(() => scrollToFirstError(blockingErrors), 100);
            return;
        }

        const validItems = items.filter(item => item.supplierName && item.goodsName && item.quantity && item.goodsPackingId);
        if (validItems.length === 0) {
            // Thêm lỗi vào item đầu tiên
            if (items.length > 0) {
                const firstItemId = items[0].id;
                blockingErrors[`${firstItemId}-supplierName`] = "Vui lòng thêm ít nhất một hàng hóa với đầy đủ thông tin";
                setFieldErrors({ ...blockingErrors, ...warnings });
                setTimeout(() => scrollToFirstError(blockingErrors), 100);
            }
            return;
        }

        // Kiểm tra duplicate: cùng hàng hóa + cùng quy cách đóng gói
        const duplicateMap = new Map();
        validItems.forEach(item => {
            const key = `${item.goodsName}_${item.goodsPackingId}`;
            if (!duplicateMap.has(key)) {
                duplicateMap.set(key, []);
            }
            duplicateMap.get(key).push(item);
        });

        const duplicates = Array.from(duplicateMap.values()).filter(group => group.length > 1);
        if (duplicates.length > 0) {
            // Tìm item đầu tiên bị duplicate
            const firstDuplicate = duplicates[0][0];
            blockingErrors[`${firstDuplicate.id}-goodsPackingId`] = "Hàng hóa với quy cách đóng gói này đã được thêm vào danh sách!";
            setFieldErrors({ ...blockingErrors, ...warnings });
            setTimeout(() => {
                const errorInput = document.querySelector(`[data-key="${firstDuplicate.id}-goodsPackingId"]`);
                if (errorInput) {
                    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorInput.focus();
                }
            }, 100);
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

            // Thêm lỗi vào field quantity của item đầu tiên vượt quá tồn kho
            const firstItem = insufficientItems[0];
            const stockInfo = getItemStockInfo(firstItem);
            const errorMessage = insufficientItems.length === 1
                ? `Vượt quá tồn kho (Có sẵn: ${stockInfo?.availableQuantity || 0} thùng)`
                : `Vượt quá tồn kho (Có sẵn: ${stockInfo?.availableQuantity || 0} thùng). Có ${insufficientItems.length} hàng hóa thiếu tồn kho.`;

            blockingErrors[`${firstItem.id}-quantity`] = errorMessage;
            setFieldErrors({ ...blockingErrors, ...warnings });

            // Focus vào trường quantity của item đầu tiên
            setTimeout(() => {
                const errorInput = document.querySelector(`[data-key="${firstItem.id}-quantity"]`);
                if (errorInput) {
                    errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    errorInput.focus();
                }
            }, 100);

            return;
        }

        // Nếu không có items vượt quá tồn kho, reset state
        setItemsExceedingStock({});

        try {
            setSubmitLoading(true);

            const itemsWithIds = validItems.map(item => {
                const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
                if (!selectedSupplier) return null;

                const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                const selectedGood = goods.find(g => g.goodsName === item.goodsName);
                if (!selectedGood) return null;

                return {
                    supplierId: parseInt(selectedSupplier.supplierId),
                    goodsId: parseInt(selectedGood.goodsId),
                    goodsPackingId: parseInt(item.goodsPackingId),
                    packageQuantity: parseInt(item.quantity),
                    salesOrderDetailId: item.salesOrderDetailId || 0
                };
            }).filter(item => item !== null);

            if (itemsWithIds.length === 0) {
                // Thêm lỗi vào item đầu tiên
                if (items.length > 0) {
                    const firstItemId = items[0].id;
                    blockingErrors[`${firstItemId}-supplierName`] = "Không tìm thấy hàng hóa hợp lệ";
                    setFieldErrors({ ...blockingErrors, ...warnings });
                    setTimeout(() => scrollToFirstError(blockingErrors), 100);
                }
                setSubmitLoading(false);
                return;
            }

            const submitData = {
                salesOrderId: id,
                retailerId: parseInt(selectedRetailer.retailerId),
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                note: formData.note || "",
                salesOrderItemDetailUpdateDtos: itemsWithIds
            };

            // Cập nhật đơn hàng trước
            await updateSaleOrder(submitData);
            // Sau đó gửi phê duyệt
            await updateSaleOrderStatusPendingApproval({ salesOrderId: id });

            window.showToast("Cập nhật và gửi phê duyệt đơn bán hàng thành công!", "success");
            navigate("/sales-orders");
        } catch (error) {
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật và gửi phê duyệt!");
            if (window.showToast) window.showToast(message, "error");
        } finally {
            setSubmitLoading(false);
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
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </Button>

                        <h1 className="text-2xl font-bold text-slate-700 leading-none flex items-center m-0">
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
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="retailer" className="text-slate-600 font-medium">
                                            Nhà Bán Lẻ <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <FloatingDropdown
                                                value={formData.retailerName || undefined}
                                                onChange={(value) => handleInputChange("retailerName", value)}
                                                options={retailerOptions}
                                                placeholder="Chọn nhà bán lẻ"
                                                loading={retailersLoading}
                                                data-field="retailerName"
                                            />
                                            {fieldErrors.retailerName && (
                                                <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                    {fieldErrors.retailerName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedTimeDeparture" className="text-sm font-medium text-slate-600">
                                            Ngày Dự Kiến Giao <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative w-[220px]">
                                            <div className="relative">
                                                <Input
                                                    id="estimatedTimeDeparture"
                                                    type="date"
                                                    min={minDate}
                                                    value={formData.estimatedTimeDeparture}
                                                    onChange={(e) => handleInputChange("estimatedTimeDeparture", e.target.value)}
                                                    className={`date-picker-input h-[37px] pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg w-full ${fieldErrors.estimatedTimeDeparture ? 'border-red-500' : ''}`}
                                                    ref={dateInputRef}
                                                />
                                                {fieldErrors.estimatedTimeDeparture && (
                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                        {fieldErrors.estimatedTimeDeparture}
                                                    </p>
                                                )}
                                            </div>
                                            <Calendar
                                                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 cursor-pointer"
                                                onClick={() => {
                                                    const el = dateInputRef.current;
                                                    if (!el) return;
                                                    if (typeof el.showPicker === 'function') el.showPicker();
                                                    else { el.focus(); el.click(); }
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
                                                <TableHead className="text-slate-600 font-semibold w-[15%]">Đóng Gói</TableHead>
                                                <TableHead className="text-slate-600 font-semibold text-center w-[150px]">Số Thùng</TableHead>
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
                                                                    options={(() => {
                                                                        const availableOptions = getAvailableSupplierOptions(item.id);
                                                                        
                                                                        // Fallback: Nếu không có option nào và suppliers có dữ liệu, hiển thị tất cả suppliers
                                                                        if (availableOptions.length === 0 && suppliers.length > 0) {
                                                                            return suppliers.map(supplier => ({
                                                                                value: supplier.companyName,
                                                                                label: supplier.companyName
                                                                            }));
                                                                        }
                                                                        
                                                                        // Nếu nhà cung cấp đã được chọn nhưng không có trong danh sách available, vẫn thêm vào để hiển thị
                                                                        if (item.supplierName) {
                                                                            const exists = availableOptions.some(opt => opt.value === item.supplierName);
                                                                            if (!exists) {
                                                                                const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
                                                                                if (selectedSupplier) {
                                                                                    return [{ value: selectedSupplier.companyName, label: selectedSupplier.companyName }, ...availableOptions];
                                                                                }
                                                                            }
                                                                        }
                                                                        return availableOptions;
                                                                    })()}
                                                                    placeholder="Chọn nhà cung cấp"
                                                                    loading={suppliersLoading}
                                                                    className={`truncate w-full ${fieldErrors[`${item.id}-supplierName`] ? 'border-red-500' : ''}`}
                                                                    title={item.supplierName || ""}
                                                                    data-key={`${item.id}-supplierName`}
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
                                                                    options={(() => {
                                                                        const availableOptions = getAvailableGoodsOptions(item.id);
                                                                        // Nếu hàng hóa đã được chọn nhưng không có trong danh sách available, vẫn thêm vào để hiển thị
                                                                        if (item.goodsName && item.supplierName) {
                                                                            const exists = availableOptions.some(opt => opt.value === item.goodsName);
                                                                            if (!exists) {
                                                                                return [{ value: item.goodsName, label: item.goodsName }, ...availableOptions];
                                                                            }
                                                                        }
                                                                        return availableOptions;
                                                                    })()}
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
                                                                    className={`truncate w-full ${fieldErrors[`${item.id}-goodsName`] ? 'border-red-500' : ''}`}
                                                                    title={item.goodsName || ""}
                                                                    data-key={`${item.id}-goodsName`}
                                                                />
                                                                {fieldErrors[`${item.id}-goodsName`] && (
                                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                                        {fieldErrors[`${item.id}-goodsName`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Đóng gói */}
                                                        <TableCell className="relative align-top pb-6">
                                                            <div className="relative min-w-[130px] max-w-[140px] w-full">
                                                                <FloatingDropdown
                                                                    value={item.goodsPackingId ? item.goodsPackingId.toString() : undefined}
                                                                    onChange={(value) =>
                                                                        updateItem(item.id, "goodsPackingId", value)
                                                                    }
                                                                    options={(() => {
                                                                        const availableOptions = getGoodsPackingOptions(item.id);
                                                                        // Nếu quy cách đóng gói đã được chọn nhưng không có trong danh sách available, vẫn thêm vào để hiển thị
                                                                        if (item.goodsPackingId && item.goodsName && item.supplierName) {
                                                                            const packingIdStr = item.goodsPackingId.toString();
                                                                            const exists = availableOptions.some(opt => opt.value === packingIdStr);
                                                                            if (!exists) {
                                                                                // Tìm thông tin quy cách đóng gói để hiển thị label
                                                                                const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
                                                                                if (selectedSupplier) {
                                                                                    const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
                                                                                    const selectedGood = goods.find(g => g.goodsName === item.goodsName);
                                                                                    if (selectedGood) {
                                                                                        const goodsPackings = goodsPackingsMap[selectedGood.goodsId] || [];
                                                                                        const selectedPacking = goodsPackings.find(p => 
                                                                                            p.goodsPackingId?.toString() === packingIdStr || 
                                                                                            p.goodsPackingId === parseInt(packingIdStr)
                                                                                        );
                                                                                        if (selectedPacking) {
                                                                                            const unitMeasureName = selectedGood?.unitMeasureName || "đơn vị";
                                                                                            return [{ 
                                                                                                value: packingIdStr, 
                                                                                                label: `${selectedPacking.unitPerPackage} ${unitMeasureName}/thùng` 
                                                                                            }, ...availableOptions];
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        return availableOptions;
                                                                    })()}
                                                                    placeholder={
                                                                        item.goodsName ? "Chọn đóng gói" : "Chọn hàng hóa trước"
                                                                    }
                                                                    loading={false}
                                                                    disabled={!item.goodsName}
                                                                    className={`truncate w-full ${fieldErrors[`${item.id}-goodsPackingId`] ? 'border-red-500' : ''}`}
                                                                    title={item.goodsPackingId ? item.goodsPackingId.toString() : ""}
                                                                    data-key={`${item.id}-goodsPackingId`}
                                                                />
                                                                {fieldErrors[`${item.id}-goodsPackingId`] && (
                                                                    <p className="absolute left-0 top-full mt-1 text-red-500 text-xs">
                                                                        {fieldErrors[`${item.id}-goodsPackingId`]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Số thùng */}
                                                        <TableCell className="w-[150px] relative align-top pb-6">
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    min={0}
                                                                    value={item.quantity === "" ? "" : item.quantity}
                                                                    onChange={(e) =>
                                                                        updateItem(item.id, "quantity", e.target.value)
                                                                    }
                                                                    data-key={`${item.id}-quantity`}
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
                                                        <TableCell className="w-[130px]">
                                                            <div className="h-[38px] flex items-center justify-center px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 font-medium">
                                                                {calculateTotalUnits(item) || "0"}
                                                            </div>
                                                        </TableCell>

                                                        {/* Đơn vị */}
                                                        <TableCell className="w-[100px]">
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
                                                );
                                            })}

                                            {/* Hàng trống cuối */}
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
                                    Thêm hàng hóa
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
                                    onClick={handleSubmit}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={submitLoading || items.filter(item => item.supplierName && item.goodsName && item.quantity && item.goodsPackingId).length === 0}
                                >
                                    Cập Nhật Đơn Bán Hàng
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmitForApproval}
                                    disabled={submitLoading || items.filter(item => item.supplierName && item.goodsName && item.quantity && item.goodsPackingId).length === 0}
                                    className="h-[38px] px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitLoading ? "Đang xử lý..." : "Gửi Phê Duyệt"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stock Information Card - Cập nhật để thêm nút Tạo đơn bổ sung */}
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
                                                    ? 'Đủ tồn kho - Có thể gửi phê duyệt'
                                                    : 'Thiếu tồn kho - Vui lòng kiểm tra lại'
                                                }
                                            </span>
                                        </div>
                                        {/* 5. NÚT TẠO ĐƠN BỔ SUNG */}
                                        {!stockInfo.allSufficient && stockInfo.insufficientCount > 0 && (
                                            <Button
                                                type="button"
                                                onClick={handleOpenBackOrderModal}
                                                className="h-[38px] px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Tạo đơn bổ sung cho {stockInfo.insufficientCount} hàng hóa thiếu
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Goods Cards */}
                                {/* ... (Phần hiển thị chi tiết tồn kho giữ nguyên) */}
                                {stockInfo.good.length > 0 && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {stockInfo.good.map((goods, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle className={`h-5 w-5 ${goods.isSufficient ? 'text-green-600' : 'text-red-600'}`} />
                                                    <h4 className="font-semibold text-slate-700">{goods.goodsName}</h4>
                                                </div>

                                                <div className="text-sm text-slate-600 mb-2">
                                                    Mã hàng hóa: <span className="font-medium">{goods.goodsCode}</span>
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
                                                Tổng: {stockInfo.totalGoods} hàng hóa
                                            </span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-green-100 rounded-full">
                                            <span className="text-sm font-medium text-green-600">
                                                Đủ: {stockInfo.sufficientCount} hàng hóa
                                            </span>
                                        </div>
                                        <div className="px-3 py-1.5 bg-red-100 rounded-full">
                                            <span className="text-sm font-medium text-red-600">
                                                Thiếu: {stockInfo.insufficientCount} hàng hóa
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })()}
            </div>

            {/* 6. BACKORDER MODAL */}
            <CreateBackOrderModal
                isOpen={showBackOrderModal}
                onClose={() => setShowBackOrderModal(false)}
                onSuccess={() => {
                    setShowBackOrderModal(false);
                    window.showToast("Tạo đơn đặt hàng thành công!", "success");
                    // Sau khi tạo BackOrder thành công, bạn có thể cân nhắc reload data để cập nhật thông tin tồn kho mới (nếu BackOrder được xử lý ngay lập tức) hoặc giữ nguyên.
                }}
                selectedItems={insufficientItems.map(item => ({
                    goodsId: item.goodsId,
                    goodsPackingId: item.goodsPackingId,
                    goodsName: item.goodsName,
                    goodsCode: item.goodsCode,
                    requestedQuantity: item.packageQuantity, // Số lượng thiếu
                    availableQuantity: 0,
                    packageQuantity: item.packageQuantity // Số lượng thiếu
                }))}
                retailerId={(() => {
                    if (!formData.retailerName || retailers.length === 0) return null;
                    const selectedRetailer = retailers.find(r => r.retailerName === formData.retailerName);
                    return selectedRetailer ? (selectedRetailer.retailerId || selectedRetailer.RetailerId)?.toString() : null;
                })()}
            />
        </div>
    )
}

export default UpdateSaleOrder