import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import FloatingDropdown from "../../components/Common/FloatingDropdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, X, CheckCircle, BarChart3, ArrowRightLeft } from "lucide-react"
import { updateSaleOrder, getSalesOrderDetail } from "../../services/SalesOrderService"
import { getRetailersDropdown } from "../../services/RetailerService"
import { getSuppliersDropdown } from "../../services/SupplierService"
import Loading from "../../components/Common/Loading"
import { extractErrorMessage } from "../../utils/Validation"
import { getGoodsInventoryBySupplierId } from "../../services/GoodService"

function UpdateSaleOrder() {
    const navigate = useNavigate();
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
                                id: index + 1,
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
                                    if (goodsBySupplier[supplierId]) return; // Already loaded

                                    setGoodsLoading(prev => ({ ...prev, [supplierId]: true }));
                                    try {
                                        const response = await getGoodsInventoryBySupplierId(supplierId);
                                        const goodsData = response?.data || response?.items || response || [];

                                        setGoodsBySupplier(prev => ({
                                            ...prev,
                                            [supplierId]: goodsData
                                        }));

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
                                        setGoodsBySupplier(prev => ({
                                            ...prev,
                                            [supplierId]: []
                                        }));
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
        const goodsPackings = goodsPackingsMap[goodsId] || [];
        const inventoryData = inventoryMap[goodsId] || [];

        if (goodsPackings.length === 0) {
            return [];
        }

        return goodsPackings.map(packing => {
            const inventory = inventoryData.find(inv => inv.goodsPackingId === packing.goodsPackingId);
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
        const selectedPacking = goodsPackings.find(packing => packing.goodsPackingId.toString() === item.goodsPackingId);

        if (!selectedPacking) return 0;

        return parseInt(item.quantity) * selectedPacking.unitPerPackage;
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
        const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
        if (!selectedSupplier) return null;

        const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
        const selectedGood = goods.find(g => g.goodsName === item.goodsName);
        if (!selectedGood) return null;

        const inventoryData = inventoryMap[selectedGood.goodsId] || [];
        const inventory = inventoryData.find(inv =>
            inv.goodsPackingId?.toString() === item.goodsPackingId?.toString() ||
            inv.goodsPackingId === parseInt(item.goodsPackingId)
        );
        const availableQuantity = inventory?.availablePackageQuantity || 0;

        // Nếu vượt quá tồn kho, hiển thị thông báo tồn kho
        if (quantity > availableQuantity) {
            return `(Tồn: ${availableQuantity} thùng)`;
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
                good: [],
                allSufficient: false
            };
        }

        const good = validItems.map(item => {
            const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
            if (!selectedSupplier) return null;

            const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
            const selectedGood = goods.find(g => g.goodsName === item.goodsName);
            if (!selectedGood) return null;

            const inventoryData = inventoryMap[selectedGood.goodsId] || [];
            const inventory = inventoryData.find(inv => inv.goodsPackingId.toString() === item.goodsPackingId);
            const availableQuantity = inventory?.availablePackageQuantity || 0;
            const requestedQuantity = parseInt(item.quantity) || 0;
            const isSufficient = requestedQuantity <= availableQuantity;

            return {
                goodsName: item.goodsName,
                goodsCode: selectedGood.goodsCode || "-",
                requestedQuantity,
                availableQuantity,
                isSufficient
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
            if (!item.goodsPackingId) {
                newFieldErrors[`${item.id}-goodsPackingId`] = "Vui lòng chọn đóng gói";
            }

            // Kiểm tra validation số thùng
            // Chỉ validate nếu đã có đủ thông tin (supplierName, goodsName, goodsPackingId)
            if (item.supplierName && item.goodsName && item.goodsPackingId) {
                if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                    newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
                } else {
                    // Kiểm tra tồn kho nếu đã nhập số lượng hợp lệ
                    const quantityError = validateQuantity(item);
                    if (quantityError) {
                        newFieldErrors[`${item.id}-quantity`] = quantityError;
                    }
                }
            } else if (!item.quantity || item.quantity === "" || parseInt(item.quantity) <= 0) {
                // Nếu chưa có đủ thông tin nhưng đã nhập số lượng, vẫn validate cơ bản
                newFieldErrors[`${item.id}-quantity`] = "Vui lòng nhập số thùng lớn hơn 0";
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

        // Kiểm tra inventory - chặn submit nếu có item vượt quá tồn kho
        // Kiểm tra tồn kho và lưu thông tin các items vượt quá tồn kho
        const itemsExceedingStockMap = {};
        const insufficientItems = validItems.filter(item => {
            const selectedSupplier = suppliers.find(s => s.companyName === item.supplierName);
            if (!selectedSupplier) return false;

            const goods = goodsBySupplier[selectedSupplier.supplierId] || [];
            const selectedGood = goods.find(g => g.goodsName === item.goodsName);
            if (!selectedGood) return false;

            const inventoryData = inventoryMap[selectedGood.goodsId] || [];
            const inventory = inventoryData.find(inv =>
                inv.goodsPackingId?.toString() === item.goodsPackingId?.toString() ||
                inv.goodsPackingId === parseInt(item.goodsPackingId)
            );
            const availableQuantity = inventory?.availablePackageQuantity || 0;
            const requestedQuantity = parseInt(item.quantity) || 0;

            if (requestedQuantity > availableQuantity) {
                itemsExceedingStockMap[item.id] = {
                    availableQuantity: availableQuantity,
                    requestedQuantity: requestedQuantity
                };
                return true;
            }
            return false;
        });

        if (insufficientItems.length > 0) {
            // Lưu thông tin các items vượt quá tồn kho để hiển thị viền đỏ
            setItemsExceedingStock(itemsExceedingStockMap);
            
            const firstItem = insufficientItems[0];
            const message =
                insufficientItems.length === 1
                    ? `Sản phẩm "${firstItem.goodsName}" vượt quá tồn kho.`
                    : `Có ${insufficientItems.length} sản phẩm vượt quá tồn kho.`;

            window.showToast(message, "error");
            return;
        }

        // Nếu không có items vượt quá tồn kho, reset state
        setItemsExceedingStock({});

        try {
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
            const message = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật đơn bán hàng!")

            if (window.showToast) {
                window.showToast(message, "error");
            }
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
                            <div className="space-y-6">
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
                                                    className={`border-b min-h-[70px] ${
                                                        isExceedingStock 
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

                                                    {/* Đóng gói */}
                                                    <TableCell className="relative align-top pb-6">
                                                        <div className="relative min-w-[130px] max-w-[140px] w-full">
                                                            <FloatingDropdown
                                                                value={item.goodsPackingId ? item.goodsPackingId.toString() : undefined}
                                                                onChange={(value) =>
                                                                    updateItem(item.id, "goodsPackingId", value)
                                                                }
                                                                options={getGoodsPackingOptions(item.id)}
                                                                placeholder={
                                                                    item.goodsName ? "Chọn đóng gói" : "Chọn hàng hóa trước"
                                                                }
                                                                loading={false}
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
                                    onClick={handleSubmit}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Cập Nhật Đơn Bán Hàng
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
                                </div>

                                {/* Goods Cards */}
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
        </div>
    )
}

export default UpdateSaleOrder