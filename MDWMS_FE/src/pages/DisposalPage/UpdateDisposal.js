import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { AlertCircle, Calendar, Search, Building2, ChevronDown, X } from 'lucide-react';
import {
    getExpiredGoodsForDisposal,
    updateDisposalRequest,
    updateDisposalRequestStatusPendingApproval,
    getDisposalRequestDetail
} from '../../services/DisposalService';
import { getSuppliersDropdown } from '../../services/SupplierService';
import { extractErrorMessage } from '../../utils/Validation';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import Pagination from '../../components/Common/Pagination';

const UpdateDisposal = () => {
    const { id } = useParams();
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
    const [updateLoading, setUpdateLoading] = useState(false);
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
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    })();

    const normalize = (str) => {
        if (!str) return "";
        return str.toLowerCase().trim().replace(/\s+/g, " ");
    };
    // Load disposal request detail on mount
    useEffect(() => {
        const fetchDisposalRequestDetail = async () => {
            try {
                setLoading(true);
                const response = await getDisposalRequestDetail(id);
                if (response && response.success && response.data) {
                    const disposalRequest = response.data;

                    // Set form data
                    const estimatedDate = disposalRequest.estimatedTimeDeparture
                        ? new Date(disposalRequest.estimatedTimeDeparture).toISOString().split('T')[0]
                        : '';
                    setFormData({
                        estimatedTimeDeparture: estimatedDate,
                        note: disposalRequest.note || ''
                    });

                    // Map disposal request details to selectedItems
                    const itemsMap = new Map();
                    if (disposalRequest.disposalRequestDetails && Array.isArray(disposalRequest.disposalRequestDetails)) {
                        disposalRequest.disposalRequestDetails.forEach(detail => {
                            if (detail.goods && detail.goodsPacking) {
                                const key = `${detail.goods.goodsId}-${detail.goodsPacking.goodsPackingId}`;
                                itemsMap.set(key, {
                                    goodsId: detail.goods.goodsId,
                                    goodsPackingId: detail.goodsPacking.goodsPackingId,
                                    packageQuantity: detail.packageQuantity || 1,
                                    disposalRequestDetailId: detail.disposalRequestDetailId, // Keep ID for update
                                    maxQuantity: 0, // Will be set when loading expired goods
                                    goods: detail.goods,
                                    goodsPacking: detail.goodsPacking
                                });
                            }
                        });
                    }
                    setSelectedItems(itemsMap);
                } else {
                    if (window.showToast) {
                        window.showToast("Không thể tải thông tin yêu cầu xuất hủy", "error");
                    }
                    navigate('/disposal');
                }
            } catch (error) {
                console.error("Error fetching disposal request detail:", error);
                const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải thông tin yêu cầu xuất hủy");
                if (window.showToast) {
                    window.showToast(errorMessage, "error");
                }
                navigate('/disposal');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDisposalRequestDetail();
        }
    }, [id, navigate]);

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
                const response = await getExpiredGoodsForDisposal();
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

                // Update maxQuantity for selected items
                setSelectedItems(prev => {
                    const newMap = new Map(prev);
                    goodsData.forEach(item => {
                        if (item.goods && item.goodsPacking) {
                            const key = `${item.goods.goodsId}-${item.goodsPacking.goodsPackingId}`;
                            const existingItem = newMap.get(key);
                            if (existingItem) {
                                newMap.set(key, {
                                    ...existingItem,
                                    maxQuantity: item.totalExpiredPackageQuantity || 0
                                });
                            }
                        }
                    });
                    return newMap;
                });
            } catch (error) {
                console.error("Error fetching expired goods:", error);
                const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi tải danh sách hàng hóa hết hạn");
                if (window.showToast) {
                    window.showToast(errorMessage, "error");
                }
                setExpiredGoods([]);
            }
        };

        fetchExpiredGoods();
    }, []);

    // Đồng bộ maxQuantity của các item đã chọn mỗi khi danh sách hàng hết hạn hoặc lựa chọn thay đổi
    useEffect(() => {
        if (expiredGoods.length === 0 || selectedItems.size === 0) return;

        setSelectedItems(prev => {
            let hasChange = false;
            const newMap = new Map(prev);

            prev.forEach((selectedItem, key) => {
                const matchedExpiredItem = expiredGoods.find(item =>
                    item.goods?.goodsId === selectedItem.goodsId &&
                    item.goodsPacking?.goodsPackingId === selectedItem.goodsPackingId
                );

                if (matchedExpiredItem) {
                    const newMax = matchedExpiredItem.totalExpiredPackageQuantity || 0;
                    if (selectedItem.maxQuantity !== newMax) {
                        hasChange = true;
                        newMap.set(key, {
                            ...selectedItem,
                            maxQuantity: newMax,
                            // Nếu packageQuantity hiện tại lớn hơn max mới, giữ nguyên để user điều chỉnh, validation sẽ cảnh báo
                        });
                    }
                }
            });

            return hasChange ? newMap : prev;
        });
    }, [expiredGoods, selectedItems]);

    // Filter suppliers by search term
    const filteredSuppliers = useMemo(() => {
        if (!supplierSearchTerm.trim()) {
            return suppliers;
        }

        const query = normalize(supplierSearchTerm);

        return suppliers.filter(supplier =>
            normalize(supplier.companyName).includes(query)
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
            const query = normalize(searchQuery);

            filtered = filtered.filter(item => {
                const goodsName = normalize(item.goods?.goodsName || "");
                const goodsCode = normalize(item.goods?.goodsCode || "");
                const companyName = normalize(item.goods?.companyName || "");

                return (
                    goodsName.includes(query) ||
                    goodsCode.includes(query) ||
                    companyName.includes(query)
                );
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
                // Khi check, thêm item với packageQuantity mặc định là số thùng hết hạn
                newMap.set(key, {
                    goodsId: item.goods.goodsId,
                    goodsPackingId: item.goodsPacking.goodsPackingId,
                    packageQuantity: item.totalExpiredPackageQuantity || 0,
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
                        packageQuantity: item.totalExpiredPackageQuantity || 0,
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

    // Calculate total units for any item (selected or not)
    const calculateTotalUnitsForItem = (item, isSelected, selectedItem) => {
        if (isSelected && selectedItem) {
            return calculateTotalUnits(selectedItem);
        }
        const quantity = item.totalExpiredPackageQuantity || 0;
        const unitPerPackage = item.goodsPacking?.unitPerPackage || 0;
        return quantity * unitPerPackage;
    };

    // Scroll to first error field
    const scrollToFirstError = (errors) => {
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
            key !== 'estimatedTimeDeparture' && key !== 'selectedItems'
        );
        if (firstErrorKey) {
            // Try to find the input field for this error
            setTimeout(() => {
                const errorInput = document.querySelector(`input[data-key="${firstErrorKey}"]`);
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
        } else if (errors.selectedItems) {
            // Scroll to table if no items selected
            const table = document.querySelector('table');
            if (table) {
                table.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    // Validate form before submit - returns { isValid: boolean, errors: object }
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

            if (selectedDate < today) {
                errors.estimatedTimeDeparture = "Ngày xuất hủy không được là ngày trong quá khứ";
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

        // Scroll to first error if validation fails
        if (Object.keys(errors).length > 0) {
            setTimeout(() => scrollToFirstError(errors), 100);
        }

        return { isValid: Object.keys(errors).length === 0, errors };
    };

    // Cập nhật đơn xuất hủy
    const handleUpdate = async (e) => {
        e.preventDefault();

        const validation = validateForm();
        if (!validation.isValid) {
            // Không hiển thị toast vì các lỗi đã được hiển thị trên form
            return;
        }

        setUpdateLoading(true);
        try {
            // Prepare disposal request items
            const disposalRequestItems = Array.from(selectedItems.values()).map(item => ({
                disposalRequestDetailId: item.disposalRequestDetailId || null, // Keep ID if exists (for update), null for new items
                goodsId: item.goodsId,
                goodsPackingId: item.goodsPackingId,
                packageQuantity: parseInt(item.packageQuantity)
            }));

            // Prepare update data
            const updateData = {
                disposalRequestId: id,
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                disposalRequestItems: disposalRequestItems,
                note: formData.note || ""
            };

            const response = await updateDisposalRequest(updateData);
            // Handle response format: { success, data, message } or direct data
            if (response && (response.success !== false)) {
                if (window.showToast) {
                    window.showToast("Cập nhật đơn xuất hủy thành công!", "success");
                }
                navigate('/disposal');
            } else {
                const errorMessage = response?.message || "Có lỗi xảy ra khi cập nhật đơn xuất hủy";
                if (window.showToast) {
                    window.showToast(errorMessage, "error");
                }
            }
        } catch (error) {
            console.error("Error updating disposal request:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật đơn xuất hủy");
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setUpdateLoading(false);
        }
    };

    // Gửi phê duyệt (cập nhật và submit ngay)
    const handleSubmitForApproval = async (e) => {
        e.preventDefault();

        const validation = validateForm();
        if (!validation.isValid) {
            // Không hiển thị toast vì các lỗi đã được hiển thị trên form
            return;
        }

        setSubmitApprovalLoading(true);
        try {
            // Prepare disposal request items
            const disposalRequestItems = Array.from(selectedItems.values()).map(item => ({
                disposalRequestDetailId: item.disposalRequestDetailId || null,
                goodsId: item.goodsId,
                goodsPackingId: item.goodsPackingId,
                packageQuantity: parseInt(item.packageQuantity)
            }));

            // Prepare update data
            const updateData = {
                disposalRequestId: id,
                estimatedTimeDeparture: formData.estimatedTimeDeparture,
                disposalRequestItems: disposalRequestItems,
                note: formData.note || ""
            };

            // Cập nhật Disposal Request
            await updateDisposalRequest(updateData);

            // Gửi phê duyệt
            await updateDisposalRequestStatusPendingApproval({
                disposalRequestId: id
            });

            window.showToast("Cập nhật và gửi phê duyệt yêu cầu xuất hủy thành công!", "success");
            navigate("/disposal");
        } catch (error) {
            console.error("Error updating and submitting disposal request for approval:", error);
            const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật và gửi phê duyệt yêu cầu xuất hủy");
            if (window.showToast) {
                window.showToast(errorMessage, "error");
            }
        } finally {
            setSubmitApprovalLoading(false);
        }
    };

    if (loading) {
        return <Loading size="large" text="Đang tải thông tin yêu cầu xuất hủy..." />;
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
                            Cập Nhật Yêu Cầu Xuất Hủy
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
                                                min={minDate}
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
                                                disabled={updateLoading || submitApprovalLoading}
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
                                            placeholder="Tìm kiếm theo tên nhà cung cấp, hàng hóa, mã hàng"
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
                                                                placeholder="Tìm kiếm nhà cung cấp..."
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
                                                        <TableHead className="text-slate-600 font-semibold w-[40px] p-0 text-center">STT</TableHead>

                                                        {/* 5. Mã Hàng*/}
                                                        <TableHead className="text-slate-600 font-semibold w-[11%]">Mã hàng hóa</TableHead>

                                                        {/* 3. Tên nhà cung cấp*/}
                                                        <TableHead className="text-slate-600 font-semibold w-[13%]">Tên nhà cung cấp</TableHead>

                                                        {/* 4. Tên hàng hóa */}
                                                        <TableHead className="text-slate-600 font-semibold w-[20%]">Tên hàng hóa</TableHead>

                                                        {/* 6. Quy Cách Đóng Gói*/}
                                                        <TableHead className="text-slate-600 font-semibold w-[10%]">Quy cách đóng gói</TableHead>

                                                        {/* 7. SỐ THÙNG CẦN XUẤT HỦY (INPUT) */}
                                                        <TableHead className="text-slate-600 font-semibold text-center w-[120px] lg:w-[12%] min-w-[140px]">
                                                            <div className="flex flex-col items-center">
                                                                <span className="whitespace-nowrap">Số thùng</span>
                                                                <span className="whitespace-nowrap">xuất hủy</span>
                                                            </div>
                                                        </TableHead>

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
                                                                <TableCell className="text-center text-slate-700 align-top pb-6 w-[40px] p-0">
                                                                    {globalIndex}
                                                                </TableCell>
                                                                {/* 5. Mã Hàng*/}
                                                                <TableCell className="text-slate-700 align-top pb-6 w-[11%]">
                                                                    {item.goods?.goodsCode || '-'}
                                                                </TableCell>
                                                                {/* 3. Tên nhà cung cấp*/}
                                                                <TableCell className="text-slate-700 font-medium align-top pb-6 w-[13%]">
                                                                    {item.goods?.companyName || '-'}
                                                                </TableCell>
                                                                {/* 4. Tên hàng hóa*/}
                                                                <TableCell className="text-slate-700 font-medium align-top pb-6 w-[20%]">
                                                                    {item.goods?.goodsName || '-'}
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
                                                                                data-key={key}
                                                                                className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${fieldErrors[key] ? 'border-red-500' : ''}`}
                                                                                disabled={updateLoading || submitApprovalLoading}
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
                                    disabled={updateLoading || submitApprovalLoading}
                                />
                            </div>

                            {fieldErrors.selectedItems && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700">{fieldErrors.selectedItems}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                <Button
                                    type="button"
                                    onClick={() => navigate('/disposal')}
                                    disabled={updateLoading || submitApprovalLoading}
                                    className="h-[38px] px-6 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleUpdate}
                                    disabled={updateLoading || submitApprovalLoading || selectedItems.size === 0}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateLoading ? "Đang cập nhật..." : "Cập nhật đơn xuất hủy"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSubmitForApproval}
                                    disabled={updateLoading || submitApprovalLoading || selectedItems.size === 0}
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

export default UpdateDisposal;
