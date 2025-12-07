import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Calendar, User, FileText, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { createStocktaking } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import { getAreaWithLocationsDropDown } from '../../services/AreaServices';
import AssignAreaModal from '../../components/StocktakingComponents/AssignAreaModal';
import AssignSingleAreaModalForCreate from '../../components/StocktakingComponents/AssignSingleAreaModalForCreate';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { PERMISSIONS } from '../../utils/permissions';

const CreateStocktaking = () => {
    const navigate = useNavigate();

    // Get current user info from localStorage
    const currentUserInfo = useMemo(() => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            return {
                userId: userInfo?.userId || userInfo?.id || null,
                fullName: userInfo?.fullName || 'Người dùng',
            };
        } catch {
            return { userId: null, fullName: 'Người dùng', userName: null };
        }
    }, []);

    const [formData, setFormData] = useState({
        createdBy: currentUserInfo.fullName || '',
        startTime: null,
        reason: ''
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [saveDraftLoading, setSaveDraftLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showSingleAreaModal, setShowSingleAreaModal] = useState(false);

    // Area dropdown states
    const [areas, setAreas] = useState([]);
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [areasLoading, setAreasLoading] = useState(false);
    const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
    const areaDropdownRef = useRef(null);

    // Không set default values - người dùng phải tự chọn

    // Fetch areas on component mount
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                setAreasLoading(true);
                const response = await getAreaWithLocationsDropDown();
                let areasList = [];
                if (Array.isArray(response)) {
                    areasList = response;
                } else if (response?.data) {
                    areasList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                } else if (response?.items) {
                    areasList = response.items;
                }
                setAreas(areasList);
            } catch (error) {
                console.error('Error fetching areas:', error);
                setAreas([]);
            } finally {
                setAreasLoading(false);
            }
        };
        fetchAreas();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target)) {
                setIsAreaDropdownOpen(false);
            }
        };

        if (isAreaDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAreaDropdownOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newFormData = { ...prev, [field]: value };

            // Clear error when user starts typing
            setFieldErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                if (newErrors[field]) {
                    delete newErrors[field];
                }

                return newErrors;
            });

            return newFormData;
        });
    };

    // Handle area checkbox change
    const handleAreaCheckboxChange = (areaId, checked) => {
        setSelectedAreas(prev => {
            const newSelectedAreas = checked
                ? [...prev, areaId]
                : prev.filter(id => id !== areaId);

            // Clear error when user selects an area
            if (newSelectedAreas.length > 0 && fieldErrors.selectedAreas) {
                setFieldErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.selectedAreas;
                    return newErrors;
                });
            }

            return newSelectedAreas;
        });
    };

    // Handle select all areas
    const handleSelectAllAreas = (checked) => {
        if (checked) {
            const allAreaIds = areas.map(area => area.areaId);
            setSelectedAreas(allAreaIds);
            // Clear error when user selects areas
            if (fieldErrors.selectedAreas) {
                setFieldErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    delete newErrors.selectedAreas;
                    return newErrors;
                });
            }
        } else {
            setSelectedAreas([]);
        }
    };

    // Get display text for selected areas
    const getSelectedAreasText = () => {
        if (selectedAreas.length === 0) {
            return 'Chọn khu vực kiểm kê';
        }
        if (selectedAreas.length === areas.length) {
            return 'Tất cả khu vực';
        }
        if (selectedAreas.length === 1) {
            const area = areas.find(a => a.areaId === selectedAreas[0]);
            return area ? area.areaName : '1 khu vực';
        }
        return `${selectedAreas.length} khu vực đã chọn`;
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!formData.startTime) {
            errors.startTime = 'Vui lòng chọn thời gian bắt đầu';
            isValid = false;
        }

        if (selectedAreas.length === 0) {
            errors.selectedAreas = 'Vui lòng chọn ít nhất 1 khu vực kiểm kê';
            isValid = false;
        }

        if (!formData.reason || formData.reason.trim() === '') {
            errors.reason = 'Vui lòng nhập lý do kiểm kê';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    // Đóng gói dữ liệu form để gửi lên modal
    const prepareFormDataForModal = () => {
        // Format date giữ nguyên giờ local, không convert sang UTC
        let startTimeISO = null;
        if (formData.startTime) {
            const date = dayjs(formData.startTime);
            // Format: YYYY-MM-DDTHH:mm:ss (giữ nguyên giờ local)
            startTimeISO = date.format('YYYY-MM-DDTHH:mm:ss');
        }

        // Format areaIds theo API: array of { areaId: number }
        const areaIds = selectedAreas.map(areaId => ({
            areaId: areaId
        }));

        return {
            startTime: startTimeISO,
            note: formData.reason.trim(),
            areaIds: areaIds,
            selectedAreas: selectedAreas // Thêm selectedAreas để modal có thể sử dụng
        };
    };

    const handleSaveDraft = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            window.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        setSaveDraftLoading(true);
        try {
            // Format date giữ nguyên giờ local, không convert sang UTC
            let startTimeISO = null;
            if (formData.startTime) {
                const date = dayjs(formData.startTime);
                // Format: YYYY-MM-DDTHH:mm:ss (giữ nguyên giờ local)
                startTimeISO = date.format('YYYY-MM-DDTHH:mm:ss');
            }

            // Format areaIds theo API: array of { areaId: number }
            const areaIds = selectedAreas.map(areaId => ({
                areaId: areaId
            }));

            const submitData = {
                startTime: startTimeISO,
                note: formData.reason.trim(),
                areaIds: areaIds
            };

            await createStocktaking(submitData);

            if (window.showToast) {
                window.showToast('Lưu nháp thành công!', 'success');
            }

            // Chỉ navigate về danh sách, không mở modal
            navigate('/stocktakings');
        } catch (error) {
            console.error('Error saving draft:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi lưu nháp', 'error');
            }
        } finally {
            setSaveDraftLoading(false);
        }
    };

    const handleOpenAssignModal = (e) => {
        e.preventDefault();

        // Validate form trước
        if (!validateForm()) {
            window.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        // Kiểm tra số lượng khu vực đã chọn
        if (selectedAreas.length === 0) {
            window.showToast('Vui lòng chọn ít nhất một khu vực kiểm kê', 'error');
            return;
        }

        // Đóng gói dữ liệu và mở modal (không gọi API tạo ở đây)
        // Modal sẽ tự gọi API khi xác nhận
        if (selectedAreas.length === 1) {
            // Nếu chỉ có 1 khu vực, mở modal phân công 1 khu vực
            setShowSingleAreaModal(true);
        } else {
            // Nếu có 2+ khu vực, mở modal phân công nhiều khu vực
            setShowAssignModal(true);
        }
    };

    const handleAssignmentSuccess = () => {
        // Sau khi phân công thành công, navigate về danh sách
        // Toast đã được hiển thị trong modal
        setShowAssignModal(false);
        navigate('/stocktakings');
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/stocktakings')}
                        className="flex items-center justify-center hover:opacity-80 transition-opacity p-0"
                    >
                        <ComponentIcon name="arrowBackCircleOutline" size={28} />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-600 m-0">
                        Tạo Đơn Kiểm Kê Mới
                    </h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Form Card */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <div className="p-6 space-y-6">
                        {/* Header Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-600 mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-500" />
                                Thông Tin Đơn Kiểm Kê
                            </h3>
                            <div className="space-y-6">
                                {/* Người tạo, Thời gian bắt đầu và Khu vực kiểm kê */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Người tạo */}
                                    <div className="space-y-2">
                                        <Label htmlFor="createdBy" className="text-slate-600 font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-orange-500" />
                                            Người Tạo <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="createdBy"
                                                type="text"
                                                value={formData.createdBy}
                                                readOnly
                                                placeholder="Nhập tên người tạo"
                                                className={`h-[38px] pl-10 border-slate-300 rounded-lg bg-gray-50 cursor-not-allowed ${fieldErrors.createdBy ? 'border-red-500' : ''
                                                    }`}
                                            />
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        {fieldErrors.createdBy && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.createdBy}</p>
                                        )}
                                    </div>

                                    {/* Thời gian bắt đầu */}
                                    <div className="space-y-2">
                                        <Label htmlFor="startTime" className="text-slate-600 font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-500" />
                                            Thời Gian Bắt Đầu <span className="text-red-500">*</span>
                                        </Label>
                                        <ConfigProvider
                                            theme={{
                                                token: {
                                                    colorPrimary: '#f97316', // orange-500
                                                    colorLink: '#f97316',
                                                    colorLinkHover: '#ea580c', // orange-600
                                                    borderRadius: 6,
                                                },
                                            }}
                                        >
                                            <DatePicker
                                                id="startTime"
                                                showTime
                                                format="DD/MM/YYYY HH:mm"
                                                placeholder="Chọn ngày và giờ bắt đầu"
                                                value={formData.startTime}
                                                onChange={(date) => handleInputChange('startTime', date)}
                                                size="large"
                                                allowClear
                                                style={{
                                                    height: '38px',
                                                    width: '100%',
                                                    borderColor: fieldErrors.startTime ? '#ef4444' : undefined
                                                }}
                                                className={fieldErrors.startTime ? 'border-red-500' : ''}
                                                disabledDate={(current) => {
                                                    // Không cho chọn ngày trong quá khứ
                                                    return current && current < dayjs().startOf('day');
                                                }}
                                                disabledTime={(current) => {
                                                    // Nếu chọn ngày hôm nay, disable các giờ đã qua
                                                    if (current && current.isSame(dayjs(), 'day')) {
                                                        const now = dayjs();
                                                        return {
                                                            disabledHours: () => {
                                                                const hours = [];
                                                                for (let i = 0; i < now.hour(); i++) {
                                                                    hours.push(i);
                                                                }
                                                                return hours;
                                                            },
                                                            disabledMinutes: (selectedHour) => {
                                                                if (selectedHour === now.hour()) {
                                                                    const minutes = [];
                                                                    for (let i = 0; i <= now.minute(); i++) {
                                                                        minutes.push(i);
                                                                    }
                                                                    return minutes;
                                                                }
                                                                return [];
                                                            },
                                                            disabledSeconds: () => []
                                                        };
                                                    }
                                                    return {};
                                                }}
                                            />
                                        </ConfigProvider>
                                        {fieldErrors.startTime && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.startTime}</p>
                                        )}
                                    </div>

                                    {/* Khu vực kiểm kê */}
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-medium flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-orange-500" />
                                            Khu Vực Kiểm Kê <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative" ref={areaDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                                                className={`h-[38px] w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between transition-all ${fieldErrors.selectedAreas
                                                    ? 'border-red-500'
                                                    : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500'
                                                    } ${isAreaDropdownOpen ? 'border-orange-500 ring-2 ring-orange-200' : ''}`}
                                            >
                                                <span className={selectedAreas.length > 0 ? 'text-slate-900' : 'text-slate-500'}>
                                                    {getSelectedAreasText()}
                                                </span>
                                                {isAreaDropdownOpen ? (
                                                    <ChevronUp className="h-5 w-5 text-slate-400 transition-all duration-200" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-slate-400 transition-all duration-200" />
                                                )}
                                            </button>

                                            {isAreaDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                                    {areasLoading ? (
                                                        <div className="px-3 py-2 text-slate-500 text-sm">Đang tải...</div>
                                                    ) : areas.length === 0 ? (
                                                        <div className="px-3 py-2 text-slate-500 text-sm">Không có khu vực nào</div>
                                                    ) : (
                                                        <>
                                                            {/* Select All Option */}
                                                            <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-50">
                                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={selectedAreas.length === areas.length && areas.length > 0}
                                                                        onChange={(e) => handleSelectAllAreas(e.target.checked)}
                                                                        className={`border-slate-300 focus:ring-orange-500 focus:ring-offset-0 ${selectedAreas.length === areas.length && areas.length > 0
                                                                            ? 'bg-orange-500 border-orange-500'
                                                                            : ''
                                                                            }`}
                                                                        style={{
                                                                            accentColor: '#f97316',
                                                                            ...(selectedAreas.length === areas.length && areas.length > 0 && {
                                                                                backgroundColor: '#f97316',
                                                                                borderColor: '#f97316'
                                                                            })
                                                                        }}
                                                                    />
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        Chọn tất cả
                                                                    </span>
                                                                </label>
                                                            </div>

                                                            {/* Area Options */}
                                                            {areas.map((area) => (
                                                                <div
                                                                    key={area.areaId}
                                                                    className="px-3 py-2 hover:bg-orange-50 transition-colors"
                                                                >
                                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                                        <Checkbox
                                                                            checked={selectedAreas.includes(area.areaId)}
                                                                            onChange={(e) => handleAreaCheckboxChange(area.areaId, e.target.checked)}
                                                                            className={`border-slate-300 focus:ring-orange-500 focus:ring-offset-0 ${selectedAreas.includes(area.areaId)
                                                                                ? 'bg-orange-500 border-orange-500'
                                                                                : ''
                                                                                }`}
                                                                            style={{
                                                                                accentColor: '#f97316',
                                                                                ...(selectedAreas.includes(area.areaId) && {
                                                                                    backgroundColor: '#f97316',
                                                                                    borderColor: '#f97316'
                                                                                })
                                                                            }}
                                                                        />
                                                                        <span className="text-sm text-slate-700 flex-1">
                                                                            {area.areaName}
                                                                            {area.areaCode && (
                                                                                <span className="text-slate-500 ml-2">({area.areaCode})</span>
                                                                            )}
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {fieldErrors.selectedAreas && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.selectedAreas}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Lý do kiểm kê */}
                                <div className="space-y-2">
                                    <Label htmlFor="reason" className="text-slate-600 font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-orange-500" />
                                        Lý Do Kiểm Kê <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="reason"
                                        value={formData.reason}
                                        onChange={(e) => handleInputChange('reason', e.target.value)}
                                        placeholder="Nhập lý do kiểm kê (ví dụ: Kiểm kê định kỳ, Kiểm kê sau sự cố, Kiểm kê theo yêu cầu quản lý...)"
                                        className={`min-h-[120px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg resize-none ${fieldErrors.reason ? 'border-red-500' : ''
                                            }`}
                                        rows={5}
                                    />
                                    {fieldErrors.reason && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.reason}</p>
                                    )}
                                    <p className="text-slate-500 text-xs">
                                        Vui lòng mô tả rõ lý do và mục đích của đợt kiểm kê này
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                            <Button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={saveDraftLoading}
                                className="h-[38px] px-6 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saveDraftLoading ? 'Đang lưu...' : 'Lưu nháp'}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleOpenAssignModal}
                                disabled={saveDraftLoading}
                                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Phân công
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Assign Area Modal - Hiển thị khi click nút Phân công và có 2+ khu vực */}
            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                <AssignAreaModal
                    isOpen={showAssignModal}
                    onClose={() => {
                        // Chỉ đóng modal, không làm gì cả, form vẫn giữ nguyên
                        setShowAssignModal(false);
                    }}
                    onSuccess={handleAssignmentSuccess}
                    stocktakingSheetId={null} // Không có ID vì chưa tạo, modal sẽ tự tạo khi xác nhận
                    isReassign={false}
                    stocktaking={null}
                    formData={prepareFormDataForModal()} // Truyền formData đã đóng gói để modal tạo và phân công
                    selectedAreaIds={selectedAreas} // Truyền danh sách areaIds đã chọn
                />
            </PermissionWrapper>

            {/* Assign Single Area Modal - Hiển thị khi click nút Phân công và có 1 khu vực */}
            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                <AssignSingleAreaModalForCreate
                    isOpen={showSingleAreaModal}
                    onClose={() => {
                        // Chỉ đóng modal, không làm gì cả, form vẫn giữ nguyên
                        setShowSingleAreaModal(false);
                    }}
                    onSuccess={handleAssignmentSuccess}
                    stocktakingSheetId={null} // Không có ID vì chưa tạo, modal sẽ tự tạo khi xác nhận
                    formData={prepareFormDataForModal()} // Truyền formData đã đóng gói để modal tạo và phân công
                    areaId={selectedAreas.length === 1 ? selectedAreas[0] : null} // areaId của khu vực duy nhất
                />
            </PermissionWrapper>
        </div>
    );
};

export default CreateStocktaking;
