import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Save, FileText, AlertCircle, Calendar, Search, Building2, ChevronDown, X } from 'lucide-react';
import { getExpiredGoodsForDisposal, createDisposalRequest, updateDisposalRequestStatusPendingApproval, getDisposalRequestListWarehouseManager } from '../../services/DisposalService';
import { getSuppliersDropdown } from '../../services/SupplierService';
import { extractErrorMessage } from '../../utils/Validation';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import Pagination from '../../components/Common/Pagination';

const CreateDisposal = () => {
    const navigate = useNavigate();
    const dateInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [expiredGoods, setExpiredGoods] = useState([]);
    const [selectedItems, setSelectedItems] = useState(new Map()); // Map với key là `${goodsId}-${goodsPackingId}`
    const [formData, setFormData] = useState({
        estimatedTimeDeparture: '',
        note: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [saveDraftLoading, setSaveDraftLoading] = useState(false);
    const [submitApprovalLoading, setSubmitApprovalLoading] = useState(false);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [showSupplierFilter, setShowSupplierFilter] = useState(false);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Minimum selectable date: tomorrow (force future date)
    const minDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    // Load suppliers on mount
    useEffect(() => {
        const loadSuppliers = async () => {
            setSuppliersLoading(true);
            try {
                const response = await getSuppliersDropdown();
                const suppliersData = response?.data || response?.items || response || [];
                setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
            } catch (error) {
                console.error("Error loading suppliers:", error);
                setSuppliers([]);
            } finally {
                setSuppliersLoading(false);
            }
        };

        loadSuppliers();
    }, []);

    // Load expired goods on mount
    useEffect(() => {
        const fetchExpiredGoods = async () => {
            try {
                setLoading(true);
                const response = await getExpiredGoodsForDisposal();
                console.log("expire: ", response)
                // Handle response format: { success, data, message } or direct array
                let goodsData = [];
                if (response) {
                    if (response.success !== false && (response.data || Array.isArray(response))) {
                        goodsData = Array.isArray(response) ? response : (response.data || []);
                    } else if (response.message) {
                        // Error message from backend
                        if (window.showToast) {
                            window.showToast(response.message, "info");
                        }
                    }
                }
                setExpiredGoods(Array.isArray(goodsData) ? goodsData : []);
            } catch (error) {
                console.error("Error fetching expired goods:", error);
                const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải danh sách hàng hóa hết hạn");
                if (window.showToast) {
                    window.showToast(errorMessage, "error");
                }
                setExpiredGoods([]);
            } finally {
                setLoading(false);
            }
        };

        fetchExpiredGoods();
    }, []);

    // Filter suppliers by search term
    const filteredSuppliers = useMemo(() => {
        if (!supplierSearchTerm.trim()) {
            return suppliers;
        }
        const query = supplierSearchTerm.toLowerCase().trim();
        return suppliers.filter(supplier =>
            supplier.companyName?.toLowerCase().includes(query)
        );
    }, [suppliers, supplierSearchTerm]);

    // Filter and search expired goods
    const filteredExpiredGoods = useMemo(() => {
        let filtered = expiredGoods;

        // Filter by supplier
        if (supplierFilter) {
            filtered = filtered.filter(item => {
                const itemSupplierId = item.goods?.supplierId;
                return itemSupplierId && itemSupplierId.toString() === supplierFilter;
            });
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(item => {
                const goodsName = (item.goods?.goodsName || '').toLowerCase();
                const goodsCode = (item.goods?.goodsCode || '').toLowerCase();
                const companyName = (item.goods?.companyName || '').toLowerCase();
                return goodsName.includes(query) || goodsCode.includes(query) || companyName.includes(query);
            });
        }

        return filtered;
    }, [expiredGoods, searchQuery, supplierFilter]);

    // Paginate filtered goods
    const paginatedGoods = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredExpiredGoods.slice(startIndex, endIndex);
    }, [filteredExpiredGoods, currentPage, pageSize]);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, supplierFilter]);

    // Close supplier filter dropdown when clicking outside
    useEffect(() => {
        const handleDocumentClick = (e) => {
            const target = e.target;
            const isInsideDropdown = target.closest?.('.supplier-filter-dropdown');
            if (!isInsideDropdown && showSupplierFilter) {
                setShowSupplierFilter(false);
            }
        };

        document.addEventListener('mousedown', handleDocumentClick);
        return () => document.removeEventListener('mousedown', handleDocumentClick);
    }, [showSupplierFilter]);

    // Handle supplier filter change
    const handleSupplierFilter = (supplierId) => {
        setSupplierFilter(supplierId);
        setShowSupplierFilter(false);
        setSupplierSearchTerm('');
    };

    // Clear supplier filter
    const clearSupplierFilter = () => {
        setSupplierFilter('');
        setShowSupplierFilter(false);
        setSupplierSearchTerm('');
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setSupplierFilter('');
        setShowSupplierFilter(false);
        setSupplierSearchTerm('');
    };

    // Handle checkbox change
    const handleCheckboxChange = (item, checked) => {
        const key = `${item.goods.goodsId}-${item.goodsPacking.goodsPackingId}`;
        setSelectedItems(prev => {
            const newMap = new Map(prev);
            if (checked) {
                // Khi check, thêm item với packageQuantity mặc định là totalExpiredPackageQuantity
                newMap.set(key, {
                    goodsId: item.goods.goodsId,
                    goodsPackingId: item.goodsPacking.goodsPackingId,
                    packageQuantity: item.totalExpiredPackageQuantity || 0, // Mặc định là số thùng hết hạn
                    maxQuantity: item.totalExpiredPackageQuantity,
                    goods: item.goods,
                    goodsPacking: item.goodsPacking
                });
            } else {
                // Khi uncheck, xóa item
                newMap.delete(key);
                // Xóa lỗi validation nếu có
                if (fieldErrors[key]) {
                    setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[key];
                        return newErrors;
                    });
                }
            }
            return newMap;
        });
    };

    // Handle select all (only for current page)
    const handleSelectAll = (checked) => {
        setSelectedItems(prev => {
            const newMap = new Map(prev);
            if (checked) {
                // Chỉ chọn các items trên trang hiện tại
                paginatedGoods.forEach(item => {
                    const key = `${item.goods.goodsId}-${item.goodsPacking.goodsPackingId}`;
                    newMap.set(key, {
                        goodsId: item.goods.goodsId,
                        goodsPackingId: item.goodsPacking.goodsPackingId,
                        packageQuantity: item.totalExpiredPackageQuantity || 0, // Mặc định là số thùng hết hạn
                        maxQuantity: item.totalExpiredPackageQuantity,
                        goods: item.goods,
                        goodsPacking: item.goodsPacking
                    });
                });
            } else {
                // Bỏ chọn các items trên trang hiện tại
                paginatedGoods.forEach(item => {
                    const key = `${item.goods.goodsId}-${item.goodsPacking.goodsPackingId}`;
                    newMap.delete(key);
                });
            }
            return newMap;
        });
        // Clear all errors when select all/unselect all
        setFieldErrors({});
    };

    // Check if all items on current page are selected
    const allItemsSelectedOnPage = paginatedGoods.length > 0 && paginatedGoods.every(item => {
        const key = `${item.goods.goodsId}-${item.goodsPacking.goodsPackingId}`;
        return selectedItems.has(key);
    });

    // Handle package quantity change
    const handlePackageQuantityChange = (key, value) => {
        setSelectedItems(prev => {
            const newMap = new Map(prev);
            const item = newMap.get(key);
            if (item) {
                const quantity = parseInt(value) || 0;
                newMap.set(key, {
                    ...item,
                    packageQuantity: value === '' ? '' : quantity
                });

                // Validate quantity
                if (value !== '' && quantity > 0) {
                    if (quantity > item.maxQuantity) {
                        setFieldErrors(prev => ({
                            ...prev,
                            [key]: `Số thùng tối đa: ${item.maxQuantity}`
                        }));
                    } else {
                        setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[key];
                            return newErrors;
                        });
                    }
                } else if (value === '') {
                    // Clear error when field is empty
                    setFieldErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[key];
                        return newErrors;
                    });
                } else {
                    setFieldErrors(prev => ({
                        ...prev,
                        [key]: "Vui lòng nhập số thùng lớn hơn 0"
                    }));
                }
            }
            return newMap;
        });
    };

    // Calculate total units for a selected item
    const calculateTotalUnits = (item) => {
        if (!item || !item.packageQuantity || !item.goodsPacking) return 0;
        const quantity = parseInt(item.packageQuantity);
        if (isNaN(quantity) || quantity <= 0) return 0;
        return quantity * (item.goodsPacking.unitPerPackage || 0);
    };

    // Calculate total units for an item (works for both selected and unselected)
    const calculateTotalUnitsForItem = (item, isSelected, selectedItem) => {
        if (isSelected && selectedItem) {
            return calculateTotalUnits(selectedItem);
        } else {
            // Khi chưa check, tính từ totalExpiredPackageQuantity
            const quantity = item.totalExpiredPackageQuantity || 0;
            const unitPerPackage = item.goodsPacking?.unitPerPackage || 0;
            return quantity * unitPerPackage;
        }
    };

    // Validate form before submit
    const validateForm = () => {
        const errors = {};

        // Validate estimatedTimeDeparture
        if (!formData.estimatedTimeDeparture) {
            errors.estimatedTimeDeparture = "Vui lòng chọn ngày dự kiến xuất hủy";
        } else {
            const selectedDate = new Date(formData.estimatedTimeDeparture);
            selectedDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate <= today) {
                errors.estimatedTimeDeparture = "Ngày xuất hủy phải là ngày trong tương lai";
            }
        }

        // Validate selected items
        if (selectedItems.size === 0) {
            errors.selectedItems = "Vui lòng chọn ít nhất một hàng hóa";
        }

        // Validate each selected item has valid quantity
        selectedItems.forEach((item, key) => {
            const quantity = parseInt(item.packageQuantity);
            if (!item.packageQuantity || item.packageQuantity === '' || isNaN(quantity) || quantity <= 0) {
                errors[key] = "Vui lòng nhập số thùng lớn hơn 0";
            } else if (quantity > item.maxQuantity) {
                errors[key] = `Số thùng tối đa: ${item.maxQuantity}`;
            }
        });

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Lưu lại thành bản nháp
    const handleSaveAsDraft = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            if (window.showToast) {
                window.showToast("Vui lòng kiểm tra lại thông tin đã nhập", "error");
            }
            return;
        }

        setSaveDraftLoading(true);
        try {
            // Prepare disposal request items
            const disposalRequestItems = Array.from(selectedItems.values()).map(item => ({
                goodsId: item.goodsId,
                goodsPackingId: item.goodsPackingId,
                packageQuantity: parseInt(item.packageQuantity)
            }));

            // Prepare submit data
            const submitData = {
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                disposalRequestItems: disposalRequestItems,
                note: formData.note || ""
            };

            const response = await createDisposalRequest(submitData);
            // Handle response format: { success, data, message } or direct data
            if (response && (response.success !== false)) {
                if (window.showToast) {
                    window.showToast("Lưu bản nháp thành công!", "success");
                }
                navigate('/disposal');
            } else {
                const errorMessage = response?.message || "Có lỗi xảy ra khi lưu bản nháp";
                if (window.showToast) {
                    window.showToast(errorMessage, "error");
                }
            }
        } catch (error) {
            console.error("Error saving disposal request as draft:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi lưu bản nháp");
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

        if (!validateForm()) {
            if (window.showToast) {
                window.showToast("Vui lòng kiểm tra lại thông tin đã nhập", "error");
            }
            return;
        }

        setSubmitApprovalLoading(true);
        try {
            // Prepare disposal request items
            const disposalRequestItems = Array.from(selectedItems.values()).map(item => ({
                goodsId: item.goodsId,
                goodsPackingId: item.goodsPackingId,
                packageQuantity: parseInt(item.packageQuantity)
            }));

            // Prepare submit data
            const submitData = {
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                disposalRequestItems: disposalRequestItems,
                note: formData.note || ""
            };

            // Tạo Disposal Request
            await createDisposalRequest(submitData);

            // Fetch lại list để lấy disposalRequestId mới tạo
            try {
                const listResponse = await getDisposalRequestListWarehouseManager({
                    pageNumber: 1,
                    pageSize: 1,
                    sortField: "createdAt",
                    sortAscending: false
                });

                if (listResponse && listResponse.success && listResponse.data && listResponse.data.items && listResponse.data.items.length > 0) {
                    const latestRequest = listResponse.data.items[0];
                    const disposalRequestId = latestRequest.disposalRequestId;

                    // Gửi phê duyệt
                    await updateDisposalRequestStatusPendingApproval({
                        disposalRequestId: disposalRequestId
                    });

                    window.showToast("Tạo và gửi phê duyệt yêu cầu xuất hủy thành công!", "success");
                    navigate("/disposal");
                } else {
                    // Nếu không lấy được ID, vẫn báo thành công (đã tạo)
                    window.showToast("Tạo yêu cầu xuất hủy thành công! Vui lòng gửi phê duyệt từ trang chi tiết.", "success");
                    navigate("/disposal");
                }
            } catch (fetchError) {
                // Nếu không fetch được, vẫn báo thành công (đã tạo)
                window.showToast("Tạo yêu cầu xuất hủy thành công! Vui lòng gửi phê duyệt từ trang chi tiết.", "success");
                navigate("/disposal");
            }
        } catch (error) {
            console.error("Error creating and submitting disposal request for approval:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tạo và gửi phê duyệt yêu cầu xuất hủy");
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setSubmitApprovalLoading(false);
        }
    };

    if (loading) {
        return <Loading size="large" text="Đang tải danh sách hàng hóa hết hạn..." />;
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
                            onClick={() => navigate("/disposal")}
                            className="text-slate-600 hover:bg-slate-50 flex items-center"
                        >
                            <ComponentIcon name="arrowBackCircleOutline" size={28} />
                        </Button>

                        <h1 className="text-2xl font-bold text-slate-700 leading-none flex items-center m-0">
                            Tạo Yêu Cầu Xuất Hủy
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
                            <h3 className="text-lg font-semibold text-slate-600 mb-4">Thông Tin Yêu Cầu</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="estimatedTimeDeparture" className="text-sm font-medium text-slate-600">
                                            Ngày Dự Kiến Xuất Hủy <span className="text-red-500">*</span>
                                        </Label>
                                        {/* Giới hạn chiều rộng container */}
                                        <div className="relative w-[180px]">
                                            <Input
                                                id="estimatedTimeDeparture"
                                                type="date"
                                                // min={minDate}
                                                value={formData.estimatedTimeDeparture}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, estimatedTimeDeparture: e.target.value }));
                                                    if (fieldErrors.estimatedTimeDeparture) {
                                                        setFieldErrors(prev => {
                                                            const newErrors = { ...prev };
                                                            delete newErrors.estimatedTimeDeparture;
                                                            return newErrors;
                                                        });
                                                    }
                                                }}
                                                ref={dateInputRef}
                                                className={`date-picker-input h-[37px] pr-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg w-full ${fieldErrors.estimatedTimeDeparture ? 'border-red-500' : ''}`}
                                                disabled={saveDraftLoading || submitApprovalLoading}
                                                required
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
                                        {fieldErrors.estimatedTimeDeparture && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.estimatedTimeDeparture}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-600">Chi Tiết Hàng Hóa</h3>
                                {filteredExpiredGoods.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSelectAll(!allItemsSelectedOnPage)}
                                        className="h-[32px] text-sm bg-orange-200 rounded-lg px-3"
                                    >
                                        {allItemsSelectedOnPage ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                    </Button>
                                )}
                            </div>

                            <div className="relative">
                                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-4">

                                    {/* Search chiếm 2 cột */}
                                    <div className="relative md:col-span-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="text"
                                            placeholder="Tìm kiếm theo tên nhà cung cấp, hàng hóa, mã hàng..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                        />
                                    </div>
                                    {suppliers.length > 0 && (
                                        <div className="relative supplier-filter-dropdown">
                                            <button
                                                type="button"
                                                onClick={() => setShowSupplierFilter(!showSupplierFilter)}
                                                className={`flex items-center space-x-2 px-4 py-2 h-[38px] border border-slate-300 rounded-lg transition-colors w-full
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                                                    ${supplierFilter ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">
                                                    {supplierFilter
                                                        ? suppliers.find(s => s.supplierId?.toString() === supplierFilter)?.companyName || "Chọn nhà cung cấp"
                                                        : "Tất cả nhà cung cấp"}
                                                </span>
                                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                            </button>

                                            {showSupplierFilter && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-md shadow-lg border z-50 max-h-64 overflow-hidden flex flex-col">
                                                    {/* Search Input */}
                                                    <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Tìm kiếm theo tên nhà cung cấp"
                                                                value={supplierSearchTerm}
                                                                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                                                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Dropdown List */}
                                                    <div className="py-1 overflow-y-auto max-h-48" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => clearSupplierFilter()}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                                        >
                                                            Tất cả nhà cung cấp
                                                        </button>
                                                        {filteredSuppliers.length > 0 ? filteredSuppliers.map((supplier) => (
                                                            <button
                                                                key={supplier.supplierId}
                                                                type="button"
                                                                onClick={() => handleSupplierFilter(supplier.supplierId?.toString() || '')}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${supplierFilter === supplier.supplierId?.toString()
                                                                    ? 'bg-orange-500 text-white'
                                                                    : 'text-slate-700'
                                                                    }`}
                                                            >
                                                                {supplier.companyName}
                                                            </button>
                                                        )) : (
                                                            <div className="px-3 py-2 text-sm text-slate-500">
                                                                {suppliers.length > 0 ? "Không tìm thấy kết quả" : "Không có dữ liệu"}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>

                                {/* Bỏ lọc button - cố định bên góc phải */}
                                {(searchQuery || supplierFilter) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearAllFilters}
                                        className="absolute right-0 top-0 h-[35px] px-4 bg-orange-100 border border-orange-300 text-orange-700 
                                        hover:bg-orange-200 hover:border-orange-400 flex items-center gap-2 whitespace-nowrap rounded-md"
                                    >
                                        <X className="h-4 w-4" />
                                        Bỏ lọc
                                    </Button>
                                )}
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white" style={{ overflow: 'visible' }}>
                                <div className="overflow-x-auto w-full">
                                    {filteredExpiredGoods.length === 0 ? (
                                        <div className="text-center py-12">
                                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">
                                                {searchQuery ? 'Không tìm thấy hàng hóa nào' : 'Không có hàng hóa hết hạn nào khả dụng để xuất hủy'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <Table className="min-w-full">
                                                <TableHeader>
                                                    <TableRow className="border-b border-gray-200 hover:bg-transparent">
                                                        {/* 1. CHECKBOX: Giảm độ rộng tối thiểu, căn giữa */}
                                                        <TableHead className="text-slate-600 font-semibold w-8 text-center">
                                                            <Checkbox
                                                                checked={allItemsSelectedOnPage}
                                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                                disabled={paginatedGoods.length === 0}
                                                            />
                                                        </TableHead>
                                                        {/* 2. STT*/}
                                                        <TableHead className="text-slate-600 font-semibold w-12 text-center">STT</TableHead>

                                                        {/* 3. Tên nhà cung cấp*/}
                                                        <TableHead className="text-slate-600 font-semibold w-[13%]">Tên nhà cung cấp</TableHead>

                                                        {/* 4. Tên hàng hóa */}
                                                        <TableHead className="text-slate-600 font-semibold w-[17%]">Tên hàng hóa</TableHead>

                                                        {/* 5. Mã Hàng*/}
                                                        <TableHead className="text-slate-600 font-semibold w-[14%]">Mã hàng hóa</TableHead>

                                                        {/* 6. Quy Cách Đóng Gói*/}
                                                        <TableHead className="text-slate-600 font-semibold w-[10%]">Quy cách đóng gói</TableHead>

                                                        {/* 7. SỐ THÙNG CẦN XUẤT HỦY (INPUT) */}
                                                        <TableHead className="text-slate-600 font-semibold text-center w-[120px] lg:w-[12%] min-w-[140px]">Số thùng xuất hủy</TableHead>

                                                        {/* 8. Tổng Số Đơn Vị/} */}
                                                        <TableHead className="text-slate-600 font-semibold text-center w-[100px] min-w-[100px]">Tổng số đơn vị</TableHead>

                                                        {/* {/* 9. Đơn Vị */}
                                                        <TableHead className="text-slate-600 font-semibold text-center w-[80px] min-w-[80px]">Đơn vị</TableHead>
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {paginatedGoods.map((item, index) => {
                                                        const key = `${item.goods.goodsId}-${item.goodsPacking.goodsPackingId}`;
                                                        const selectedItem = selectedItems.get(key);
                                                        const isSelected = !!selectedItem;
                                                        const globalIndex = (currentPage - 1) * pageSize + index + 1;

                                                        return (
                                                            <TableRow
                                                                key={key}
                                                                className={`border-b min-h-[70px] ${isSelected
                                                                    ? 'bg-blue-50 hover:bg-blue-100'
                                                                    : 'border-gray-200 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {/* 1. CHECKBOX*/}
                                                                <TableCell className="text-center text-slate-700 align-top pb-6 w-8">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onChange={(e) => handleCheckboxChange(item, e.target.checked)}
                                                                    />
                                                                </TableCell>
                                                                {/* 2. STT*/}
                                                                <TableCell className="text-center text-slate-700 align-top pb-6 w-12">
                                                                    {globalIndex}
                                                                </TableCell>
                                                                {/* 3. Tên nhà cung cấp*/}
                                                                <TableCell className="text-slate-700 font-medium align-top pb-6 w-[13%]">
                                                                    {item.goods?.companyName || '-'}
                                                                </TableCell>
                                                                {/* 4. Tên hàng hóa*/}
                                                                <TableCell className="text-slate-700 font-medium align-top pb-6 w-[17%]">
                                                                    {item.goods?.goodsName || '-'}
                                                                </TableCell>
                                                                {/* 5. Mã Hàng*/}
                                                                <TableCell className="text-slate-700 align-top pb-6 w-[14%]">
                                                                    {item.goods?.goodsCode || '-'}
                                                                </TableCell>
                                                                {/* 6. Quy Cách Đóng Gói*/}
                                                                <TableCell className="text-slate-700 align-top pb-6 w-[10%]">
                                                                    {item.goodsPacking?.unitPerPackage || 0}{item.goods?.unitMeasureName ? ' ' + item.goods.unitMeasureName : ''}/thùng
                                                                </TableCell>

                                                                {/* 7. SỐ THÙNG CẦN XUẤT HỦY (INPUT)*/}
                                                                <TableCell className="w-[120px] lg:w-[12%] min-w-[140px] relative text-center align-top pb-6">
                                                                    <div className="relative">
                                                                        {isSelected ? (
                                                                            <Input
                                                                                type="number"
                                                                                min="1"
                                                                                max={item.totalExpiredPackageQuantity}
                                                                                value={selectedItem.packageQuantity || ''}
                                                                                onChange={(e) => handlePackageQuantityChange(key, e.target.value)}
                                                                                className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${fieldErrors[key] ? 'border-red-500' : ''}`}
                                                                                disabled={saveDraftLoading || submitApprovalLoading}
                                                                            />
                                                                        ) : (
                                                                            <Input
                                                                                type="number"
                                                                                value={item.totalExpiredPackageQuantity || 0}
                                                                                className="h-[38px] border-slate-300 bg-gray-50 text-slate-600 rounded-lg cursor-not-allowed"
                                                                                disabled
                                                                                readOnly
                                                                            />
                                                                        )}
                                                                        {fieldErrors[key] && (
                                                                            <p className="absolute left-0 top-full mt-1 text-red-500 text-xs whitespace-nowrap">
                                                                                {fieldErrors[key]}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </TableCell>

                                                                {/* 8. Tổng Số Đơn Vị */}
                                                                <TableCell className="w-[100px] min-w-[100px] text-center align-top pb-6">
                                                                    <div className="h-[38px] flex items-center justify-center px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 font-medium">
                                                                        {calculateTotalUnitsForItem(item, isSelected, selectedItem) || "0"}
                                                                    </div>
                                                                </TableCell>
                                                                {/* 9. Đơn Vị */}
                                                                <TableCell className="w-[80px] min-w-[80px] text-center align-top pb-6">
                                                                    <div className="h-[38px] flex items-center justify-center px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-600 text-sm">
                                                                        {item.goods?.unitMeasureName || '-'}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>

                                            {/* Pagination */}
                                            {filteredExpiredGoods.length > pageSize && (
                                                <div className="mt-4 pb-4">
                                                    <Pagination
                                                        current={currentPage}
                                                        pageSize={pageSize}
                                                        total={filteredExpiredGoods.length}
                                                        onPageChange={(page) => setCurrentPage(page)}
                                                        onPageSizeChange={(size) => {
                                                            setPageSize(size);
                                                            setCurrentPage(1);
                                                        }}
                                                        showPageSize={true}
                                                        pageSizeOptions={[10, 20, 30, 40]}
                                                        className="bg-gray-50"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 mt-2">
                                <Label htmlFor="note" className="text-slate-600 font-medium">
                                    Ghi Chú
                                </Label>
                                <Textarea
                                    id="note"
                                    value={formData.note}
                                    rows={4}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="Nhập ghi chú (tùy chọn)"
                                    className="min-h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                                    disabled={saveDraftLoading || submitApprovalLoading}
                                />
                            </div>

                            {fieldErrors.selectedItems && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700">{fieldErrors.selectedItems}</p>
                                </div>
                            )}

                            {/* Summary */}
                            {/* {selectedItems.size > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Tóm Tắt</h3>
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <p>Số hàng hóa đã chọn: <span className="font-semibold">{selectedItems.size}</span></p>
                                        <p>Tổng số thùng: <span className="font-semibold">
                                            {Array.from(selectedItems.values()).reduce((sum, item) => {
                                                const qty = parseInt(item.packageQuantity) || 0;
                                                return sum + qty;
                                            }, 0)}
                                        </span></p>
                                    </div>
                                </div>
                            )} */}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                <Button
                                    type="button"
                                    onClick={() => navigate('/disposal')}
                                    disabled={saveDraftLoading || submitApprovalLoading}
                                    className="h-[38px] px-6 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSaveAsDraft}
                                    disabled={saveDraftLoading || submitApprovalLoading || selectedItems.size === 0}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saveDraftLoading ? "Đang lưu..." : "Lưu nháp"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmitForApproval}
                                    disabled={saveDraftLoading || submitApprovalLoading || selectedItems.size === 0}
                                    className="h-[38px] px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitApprovalLoading ? "Đang xử lý..." : "Gửi phê duyệt"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CreateDisposal;
