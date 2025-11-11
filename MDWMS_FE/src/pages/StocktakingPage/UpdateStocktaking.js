import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Calendar, User, FileText } from 'lucide-react';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { updateStocktaking, getStocktakingDetail } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';

const UpdateStocktaking = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // stocktakingSheetId từ URL

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
        stocktakingSheetId: id || '',
        createdBy: currentUserInfo.fullName || '',
        startTime: null,
        reason: ''
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load dữ liệu hiện tại
    useEffect(() => {
        const fetchStocktakingDetail = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const response = await getStocktakingDetail(id);
                // Handle different response structures
                const data = response?.data || response;

                if (data) {
                    setFormData({
                        stocktakingSheetId: data.stocktakingSheetId || id,
                        createdBy: data.createByName || data.createdBy || currentUserInfo.fullName,
                        startTime: data.startTime ? dayjs(data.startTime) : null,
                        reason: data.note || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching stocktaking detail:', error);
                const errorMessage = extractErrorMessage(error);
                if (window.showToast) {
                    window.showToast(errorMessage || 'Không thể tải thông tin phiếu kiểm kê', 'error');
                }
                navigate('/stocktakings');
            } finally {
                setLoading(false);
            }
        };

        fetchStocktakingDetail();
    }, [id, navigate, currentUserInfo.fullName]);

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

    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!formData.startTime) {
            errors.startTime = 'Vui lòng chọn thời gian bắt đầu';
            isValid = false;
        }

        if (!formData.reason || formData.reason.trim() === '') {
            errors.reason = 'Vui lòng nhập lý do kiểm kê';
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            window.showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
            return;
        }

        if (!formData.stocktakingSheetId) {
            window.showToast('Không tìm thấy mã phiếu kiểm kê', 'error');
            return;
        }

        setUpdateLoading(true);
        try {
            // Format date giữ nguyên giờ local, không convert sang UTC
            let startTimeISO = null;
            if (formData.startTime) {
                const date = dayjs(formData.startTime);
                // Format: YYYY-MM-DDTHH:mm:ss (giữ nguyên giờ local)
                startTimeISO = date.format('YYYY-MM-DDTHH:mm:ss');
            }

            const submitData = {
                stocktakingSheetId: formData.stocktakingSheetId,
                startTime: startTimeISO,
                note: formData.reason.trim()
            };

            await updateStocktaking(submitData);

            if (window.showToast) {
                window.showToast('Cập nhật phiếu kiểm kê thành công!', 'success');
            }
            navigate('/stocktakings');
        } catch (error) {
            console.error('Error updating stocktaking:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Có lỗi xảy ra khi cập nhật', 'error');
            }
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

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
                        Cập Nhật Đơn Kiểm Kê
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
                                {/* Người tạo và Thời gian bắt đầu */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    // Có thể thêm logic disable dates nếu cần
                                                    return false;
                                                }}
                                            />
                                        </ConfigProvider>
                                        {fieldErrors.startTime && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.startTime}</p>
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
                                variant="outline"
                                onClick={() => navigate('/stocktakings')}
                                disabled={updateLoading}
                                className="h-[38px] px-6 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="button"
                                onClick={handleUpdate}
                                disabled={updateLoading}
                                className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default UpdateStocktaking;

