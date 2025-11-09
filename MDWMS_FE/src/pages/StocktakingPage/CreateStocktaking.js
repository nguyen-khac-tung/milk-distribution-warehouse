import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Calendar, Clock, User, FileText, ArrowLeft } from 'lucide-react';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

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
        endTime: null,
        reason: ''
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [submitLoading, setSubmitLoading] = useState(false);
    const [saveDraftLoading, setSaveDraftLoading] = useState(false);

    // Không set default values - người dùng phải tự chọn

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newFormData = { ...prev, [field]: value };

            // Clear error when user starts typing
            setFieldErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                if (newErrors[field]) {
                    delete newErrors[field];
                }

                // Validate end time is after start time với giá trị mới
                if (field === 'startTime' && newFormData.endTime && value) {
                    const startTime = dayjs(value);
                    const endTime = dayjs(newFormData.endTime);
                    if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
                        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
                    } else {
                        delete newErrors.endTime;
                    }
                }
                if (field === 'endTime' && newFormData.startTime && value) {
                    const endTime = dayjs(value);
                    const startTime = dayjs(newFormData.startTime);
                    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
                        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
                    } else {
                        delete newErrors.endTime;
                    }
                }

                return newErrors;
            });

            return newFormData;
        });
    };

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!formData.createdBy || formData.createdBy.trim() === '') {
            errors.createdBy = 'Vui lòng nhập tên người tạo';
            isValid = false;
        }

        if (!formData.startTime) {
            errors.startTime = 'Vui lòng chọn thời gian bắt đầu';
            isValid = false;
        }

        if (!formData.endTime) {
            errors.endTime = 'Vui lòng chọn thời gian kết thúc';
            isValid = false;
        }

        if (formData.startTime && formData.endTime) {
            const startTime = dayjs(formData.startTime);
            const endTime = dayjs(formData.endTime);
            if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
                errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
                isValid = false;
            }
        }

        if (!formData.reason || formData.reason.trim() === '') {
            errors.reason = 'Vui lòng nhập lý do kiểm kê';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleSaveDraft = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            window.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        setSaveDraftLoading(true);
        try {
            // TODO: Call API to create stocktaking as draft
            const submitData = {
                createdBy: formData.createdBy,
                startTime: formData.startTime ? dayjs(formData.startTime).toISOString() : null,
                endTime: formData.endTime ? dayjs(formData.endTime).toISOString() : null,
                reason: formData.reason.trim(),
                createdById: currentUserInfo.userId,
                status: 'Draft' // Save as draft
            };

            console.log('Saving stocktaking draft:', submitData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            window.showToast('Lưu nháp thành công!', 'success');
            navigate('/stocktakings');
        } catch (error) {
            console.error('Error saving draft:', error);
            window.showToast('Có lỗi xảy ra khi lưu nháp', 'error');
        } finally {
            setSaveDraftLoading(false);
        }
    };

    const handleSubmitForApproval = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            window.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        setSubmitLoading(true);
        try {
            // TODO: Call API to create stocktaking and submit for approval
            const submitData = {
                createdBy: formData.createdBy,
                startTime: formData.startTime ? dayjs(formData.startTime).toISOString() : null,
                endTime: formData.endTime ? dayjs(formData.endTime).toISOString() : null,
                reason: formData.reason.trim(),
                createdById: currentUserInfo.userId
            };

            console.log('Submitting stocktaking for approval:', submitData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            window.showToast('Tạo đơn và gửi phê duyệt thành công!', 'success');
            navigate('/stocktakings');
        } catch (error) {
            console.error('Error submitting for approval:', error);
            window.showToast('Có lỗi xảy ra khi gửi phê duyệt', 'error');
        } finally {
            setSubmitLoading(false);
        }
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
                                            onChange={(e) => handleInputChange('createdBy', e.target.value)}
                                            placeholder="Nhập tên người tạo"
                                            className={`h-[42px] pl-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${fieldErrors.createdBy ? 'border-red-500' : ''
                                                }`}
                                        />
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>
                                    {fieldErrors.createdBy && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.createdBy}</p>
                                    )}
                                </div>

                                {/* Thời gian bắt đầu và kết thúc */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Thời gian bắt đầu */}
                                    <div className="space-y-2">
                                        <Label htmlFor="startTime" className="text-slate-600 font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-500" />
                                            Thời Gian Bắt Đầu <span className="text-red-500">*</span>
                                        </Label>
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
                                                width: '100%',
                                                borderColor: fieldErrors.startTime ? '#ef4444' : undefined
                                            }}
                                            className={fieldErrors.startTime ? 'border-red-500' : ''}
                                            disabledDate={(current) => {
                                                // Có thể thêm logic disable dates nếu cần
                                                return false;
                                            }}
                                        />
                                        {fieldErrors.startTime && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.startTime}</p>
                                        )}
                                    </div>

                                    {/* Thời gian kết thúc */}
                                    <div className="space-y-2">
                                        <Label htmlFor="endTime" className="text-slate-600 font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-orange-500" />
                                            Thời Gian Kết Thúc <span className="text-red-500">*</span>
                                        </Label>
                                        <DatePicker
                                            id="endTime"
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Chọn ngày và giờ kết thúc"
                                            value={formData.endTime}
                                            onChange={(date) => handleInputChange('endTime', date)}
                                            size="large"
                                            allowClear
                                            style={{
                                                width: '100%',
                                                borderColor: fieldErrors.endTime ? '#ef4444' : undefined
                                            }}
                                            className={fieldErrors.endTime ? 'border-red-500' : ''}
                                            disabledDate={(current) => {
                                                // Disable dates before start time
                                                if (formData.startTime) {
                                                    return current && current.isBefore(dayjs(formData.startTime).startOf('day'));
                                                }
                                                return false;
                                            }}
                                            disabledTime={(current) => {
                                                // Disable time if same day and time should be after start time
                                                if (formData.startTime && current) {
                                                    const startTime = dayjs(formData.startTime);
                                                    if (current.isSame(startTime, 'day')) {
                                                        const startHour = startTime.hour();
                                                        const startMinute = startTime.minute();
                                                        return {
                                                            disabledHours: () => {
                                                                const hours = [];
                                                                for (let i = 0; i < startHour; i++) {
                                                                    hours.push(i);
                                                                }
                                                                return hours;
                                                            },
                                                            disabledMinutes: (selectedHour) => {
                                                                if (selectedHour === startHour) {
                                                                    const minutes = [];
                                                                    for (let i = 0; i <= startMinute; i++) {
                                                                        minutes.push(i);
                                                                    }
                                                                    return minutes;
                                                                }
                                                                return [];
                                                            }
                                                        };
                                                    }
                                                }
                                                return {};
                                            }}
                                        />
                                        {fieldErrors.endTime && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.endTime}</p>
                                        )}
                                        {!fieldErrors.endTime && formData.startTime && formData.endTime && (
                                            <p className="text-slate-500 text-xs mt-1">
                                                Thời gian kiểm kê: {dayjs(formData.endTime).diff(dayjs(formData.startTime), 'hour', true).toFixed(1)} giờ
                                            </p>
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
                                className="h-[42px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saveDraftLoading ? 'Đang lưu...' : 'Lưu nháp'}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitForApproval}
                                disabled={submitLoading}
                                className="h-[42px] px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitLoading ? 'Đang xử lý...' : 'Gửi Phê Duyệt'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CreateStocktaking;
