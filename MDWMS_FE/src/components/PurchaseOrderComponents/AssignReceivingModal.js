import React, { useState, useEffect, useRef } from 'react';
import { X, User, Loader2, AlertCircle, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { getUserDropDownByRoleName } from '../../services/AccountService';
import { ComponentIcon } from '../IconComponent/Icon';

const AssignReceivingModal = ({
    isOpen,
    onClose,
    onConfirm,
    purchaseOrder,
    loading = false
}) => {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [note, setNote] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

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
        setLoadingEmployees(true);
        try {
            const response = await getUserDropDownByRoleName('Warehouse Staff');
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
        onConfirm(selectedEmployee, note);
    };

    const handleClose = () => {
        setSelectedEmployee('');
        setNote('');
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
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Giao cho nhân viên
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
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Purchase Order Info */}
                        <div className="space-y-6">
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
                                            Giao nhiệm vụ nhận hàng
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                            Nhân viên được chọn sẽ nhận thông báo về nhiệm vụ nhận hàng này.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Form */}
                        <div className="space-y-6">
                            {/* Employee Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn nhân viên <span className="text-red-500">*</span>
                                </label>
                                {loadingEmployees ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                        <span className="ml-2 text-sm text-gray-600">Đang tải danh sách nhân viên...</span>
                                    </div>
                                ) : (
                                    <div className="relative" ref={dropdownRef}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Chọn nhân viên"
                                                value={isDropdownOpen ? searchTerm : (selectedEmployee ? `${selectedEmployeeName}${selectedEmployeePhone ? ` - ${selectedEmployeePhone}` : ''}` : '')}
                                                onChange={handleInputChange}
                                                onFocus={() => setIsDropdownOpen(true)}
                                                className="h-[38px] w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-md focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white hover:border-orange-500 hover:shadow-sm transition-all duration-200"
                                                disabled={loading}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                                            >
                                                <ComponentIcon
                                                    name={isDropdownOpen ? "up" : "down"}
                                                    size={10}
                                                    color="#6b7280"
                                                />
                                            </div>
                                        </div>

                                        {isDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map((employee, index) => (
                                                        <button
                                                            key={employee.id || employee.userId}
                                                            type="button"
                                                            onClick={() => handleEmployeeSelect(employee.id || employee.userId)}
                                                            className={`w-full px-3 py-2 text-left hover:bg-orange-500 hover:text-white transition-colors duration-200 ${selectedEmployee === (employee.id || employee.userId) ? "bg-orange-500 text-white" : "text-slate-900"
                                                                }`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {employee.name || employee.userName || employee.fullName}
                                                                </span>
                                                                {employee.phone && (
                                                                    <span className="text-xs opacity-75">
                                                                        {employee.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-slate-500 text-center">
                                                        Không tìm thấy nhân viên
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ghi chú (tùy chọn)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Nhập ghi chú về nhiệm vụ..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows="5"
                                    disabled={loading}
                                />
                            </div>
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
                            disabled={loading || !selectedEmployee}
                            className="h-[38px] px-8 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang giao...
                                </div>
                            ) : (
                                "Giao nhiệm vụ"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignReceivingModal;
