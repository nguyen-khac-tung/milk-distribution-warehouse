import React, { useState, useEffect, useRef } from 'react';
import { X, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { getAvailableReceiversDropDown } from '../../services/AccountService';
import { ComponentIcon } from '../IconComponent/Icon';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS, PURCHASE_ORDER_STATUS } from '../../utils/permissions';

const AssignReceivingModal = ({
    isOpen,
    onClose,
    onConfirm,
    purchaseOrder,
    loading = false
}) => {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const { hasPermission } = usePermissions();

    // Xác định đây là giao mới hay giao lại dựa trên trạng thái
    const purchaseOrderId = purchaseOrder?.purchaseOrderId || purchaseOrder?.purchaseOderId || purchaseOrder?.id;
    const isReassign = purchaseOrder?.status === PURCHASE_ORDER_STATUS.AssignedForReceiving || purchaseOrder?.status === 6 || purchaseOrder?.status === '6';
    const canReassign = hasPermission(PERMISSIONS.PURCHASE_ORDER_REASSIGN_FOR_RECEIVING);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen, purchaseOrder?.purchaseOrderId, purchaseOrder?.purchaseOderId, purchaseOrder?.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchEmployees = async () => {
        if (!purchaseOrder?.purchaseOrderId && !purchaseOrder?.purchaseOderId && !purchaseOrder?.id) {
            console.error('Purchase Order ID is missing');
            setEmployees([]);
            return;
        }

        setLoadingEmployees(true);
        try {
            const purchaseOrderId = purchaseOrder?.purchaseOrderId || purchaseOrder?.purchaseOderId || purchaseOrder?.id;
            const response = await getAvailableReceiversDropDown(purchaseOrderId);
            if (response && response.success) {
                setEmployees(response.data || []);
            } else {
                setEmployees([]);
                if (window.showToast) {
                    window.showToast("Không thể tải danh sách nhân viên kho", "error");
                }
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            if (window.showToast) {
                window.showToast("Có lỗi xảy ra khi tải danh sách nhân viên", "error");
            }
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedEmployee) {
            if (window.showToast) {
                window.showToast("Vui lòng chọn nhân viên", "error");
            }
            return;
        }
        onConfirm(selectedEmployee);
    };

    const handleClose = () => {
        setSelectedEmployee('');
        setSearchTerm('');
        setIsDropdownOpen(false);
        onClose();
    };

    const filteredEmployees = employees.filter(employee => {
        const name = employee.name || employee.userName || employee.fullName || '';
        const phone = employee.phone || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            phone.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const selectedEmployeeData = employees.find(emp =>
        (emp.id || emp.userId) === selectedEmployee
    );

    const selectedEmployeeName = selectedEmployeeData?.name ||
        selectedEmployeeData?.userName ||
        selectedEmployeeData?.fullName || '';

    const selectedEmployeePhone = selectedEmployeeData?.phone || '';

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployee(employeeId);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!isDropdownOpen) {
            setIsDropdownOpen(true);
        }
        // Nếu xóa hết text thì reset selection
        if (value === '') {
            setSelectedEmployee('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isReassign ? 'Giao lại cho nhân viên' : 'Giao cho nhân viên'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Chọn nhân viên để giao nhiệm vụ nhận hàng
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[5.5fr_6.5fr] gap-6">
                        {/* Left Column - Purchase Order Info (narrow) */}
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center space-x-2 mb-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <span className="font-medium text-gray-900">Thông tin đơn hàng</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mã đơn hàng:</span>
                                        <span className="font-medium">{purchaseOrder?.purchaseOderId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nhà cung cấp:</span>
                                        <span className="font-medium">{purchaseOrder?.supplierName || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Người tạo:</span>
                                        <span className="font-medium">{purchaseOrder?.createdByName || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning Message */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-blue-800 mb-1">
                                            {isReassign ? 'Giao lại nhiệm vụ nhận hàng' : 'Giao nhiệm vụ nhận hàng'}
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                            Nhân viên được chọn sẽ nhận thông báo về nhiệm vụ nhận hàng này.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Form (wider) */}
                        <div className="space-y-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn nhân viên kho <span className="text-red-500">*</span>
                            </label>
                            {loadingEmployees ? (
                                <div className="text-center py-4 text-gray-500">Đang tải danh sách nhân viên...</div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">Không có nhân viên khả dụng.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                                    {employees.map((emp) => {
                                        const id = emp.id || emp.userId;
                                        const isSelected = selectedEmployee === id;
                                        const name = emp.fullName || emp.name || emp.userName;
                                        const phone = emp.phone || '';
                                        const pendingPO = emp.pendingPurchaseOrders ?? 0;
                                        const processingPO = emp.processingPurchaseOrders ?? 0;
                                        const pendingSO = emp.pendingSalesOrders ?? 0;
                                        const processingSO = emp.processingSalesOrders ?? 0;
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => setSelectedEmployee(id)}
                                                className={`cursor-pointer border rounded-xl p-3 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                            >
                                                <div className="mb-1">
                                                    <h4 className="font-semibold text-gray-800">{name}</h4>
                                                    {phone && <p className="text-sm text-gray-500">{phone}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                                    <div>
                                                        <span className="text-gray-500">Đơn mua chờ:</span>
                                                        <span className="font-medium ml-1">{pendingPO}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Đơn mua xử lý:</span>
                                                        <span className="font-medium ml-1">{processingPO}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Đơn bán chờ:</span>
                                                        <span className="font-medium ml-1">{pendingSO}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Đơn bán xử lý:</span>
                                                        <span className="font-medium ml-1">{processingSO}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading || !selectedEmployee || (isReassign && !canReassign)}
                            className="h-[38px] px-8 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {isReassign ? 'Đang giao lại...' : 'Đang giao...'}
                                </div>
                            ) : (
                                (isReassign ? 'Giao lại' : 'Giao nhiệm vụ')
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignReceivingModal;
