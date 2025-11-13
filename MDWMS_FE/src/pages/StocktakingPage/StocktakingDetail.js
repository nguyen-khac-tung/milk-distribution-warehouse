import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, FileText, Calendar, User, Hash, Clock, Users, Play, Edit } from 'lucide-react';
import Loading from '../../components/Common/Loading';
import { ComponentIcon } from '../../components/IconComponent/Icon';
import { getStocktakingDetail } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import StatusDisplay, { STOCKTAKING_STATUS } from '../../components/StocktakingComponents/StatusDisplay';
import AssignAreaModal from '../../components/StocktakingComponents/AssignAreaModal';
import StartStocktakingModal from '../../components/StocktakingComponents/StartStocktakingModal';
import { PERMISSIONS } from '../../utils/permissions';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { usePermissions } from '../../hooks/usePermissions';
import dayjs from 'dayjs';

const StocktakingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [stocktaking, setStocktaking] = useState(null);
    const [error, setError] = useState(null);

    // Assignment modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isReassign, setIsReassign] = useState(false);

    // Start stocktaking modal state
    const [showStartStocktakingModal, setShowStartStocktakingModal] = useState(false);
    const [startStocktakingLoading, setStartStocktakingLoading] = useState(false);

    useEffect(() => {
        const fetchStocktakingDetail = async () => {
            if (!id) {
                setError('Không tìm thấy mã phiếu kiểm kê');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await getStocktakingDetail(id);
                // Handle different response structures
                const data = response?.data || response;

                if (data) {
                    setStocktaking(data);
                } else {
                    setError('Không tìm thấy thông tin phiếu kiểm kê');
                }
            } catch (error) {
                console.error('Error fetching stocktaking detail:', error);
                const errorMessage = extractErrorMessage(error);
                setError(errorMessage || 'Không thể tải thông tin phiếu kiểm kê');
                if (window.showToast) {
                    window.showToast(errorMessage || 'Không thể tải thông tin phiếu kiểm kê', 'error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStocktakingDetail();
    }, [id]);

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '-';
        try {
            const date = dayjs(dateTimeString);
            return date.format('DD/MM/YYYY HH:mm');
        } catch {
            return dateTimeString;
        }
    };

    const handleStartAssignment = () => {
        // Check if it's reassignment (status is Assigned) or initial assignment (status is Draft)
        setIsReassign(stocktaking?.status === STOCKTAKING_STATUS.Assigned);
        setShowAssignModal(true);
    };

    const handleAssignmentSuccess = () => {
        // Refresh stocktaking detail after successful assignment
        const fetchStocktakingDetail = async () => {
            if (!id) return;
            try {
                const response = await getStocktakingDetail(id);
                const data = response?.data || response;
                if (data) {
                    setStocktaking(data);
                }
            } catch (error) {
                console.error('Error refreshing stocktaking detail:', error);
            }
        };
        fetchStocktakingDetail();
    };

    const handleStartStocktaking = () => {
        setShowStartStocktakingModal(true);
    };

    const handleStartStocktakingConfirm = async () => {
        // Modal sẽ tự xử lý API call và navigation
        // Chỉ cần refresh data nếu cần
        const fetchStocktakingDetail = async () => {
            if (!id) return;
            try {
                const response = await getStocktakingDetail(id);
                const data = response?.data || response;
                if (data) {
                    setStocktaking(data);
                }
            } catch (error) {
                console.error('Error refreshing stocktaking detail:', error);
            }
        };
        // Không cần fetch vì sẽ navigate đi rồi
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Loading size="large" text="Đang tải thông tin phiếu kiểm kê..." />
            </div>
        );
    }

    if (error || !stocktaking) {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center py-12">
                            <div className="text-red-500 text-lg font-semibold mb-2">
                                {error || 'Không tìm thấy thông tin phiếu kiểm kê'}
                            </div>
                            <Button
                                onClick={() => navigate('/stocktakings')}
                                className="mt-4 bg-orange-500 hover:bg-orange-600"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại danh sách
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Header */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-white">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/stocktakings')}
                                    className="flex items-center justify-center hover:opacity-80 transition-opacity p-0"
                                >
                                    <ComponentIcon name="arrowBackCircleOutline" size={28} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-600 m-0">
                                        Chi Tiết Phiếu Kiểm Kê
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Content */}
                <Card className="shadow-sm border border-slate-200 overflow-visible bg-gray-50">
                    <div className="p-6 space-y-6">
                        {/* Information Card */}
                        <Card className="bg-white border border-gray-200 shadow-sm">
                            <CardHeader className="bg-gray-50 border-b border-gray-200">
                                <CardTitle className="text-xl font-semibold text-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-orange-500" />
                                        Thông Tin Phiếu Kiểm Kê
                                    </div>
                                    {stocktaking.status === STOCKTAKING_STATUS.Draft && (
                                        <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                                            <button
                                                onClick={() => navigate(`/stocktakings/update/${stocktaking.stocktakingSheetId}`)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Cập nhật"
                                            >
                                                <Edit className="h-7 w-7 text-blue-500 hover:text-blue-600" />
                                            </button>
                                        </PermissionWrapper>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* General Information */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-orange-500" />
                                            Thông tin chung
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Mã phiếu kiểm kê */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    Mã phiếu kiểm kê
                                                </label>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {stocktaking.stocktakingSheetId || '-'}
                                                </div>
                                            </div>

                                            {/* Trạng thái */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Trạng thái
                                                </label>
                                                <div>
                                                    <StatusDisplay status={stocktaking.status} />
                                                </div>
                                            </div>

                                            {/* Thời gian bắt đầu */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Thời gian bắt đầu
                                                </label>
                                                <div className="text-sm text-slate-700">
                                                    {formatDateTime(stocktaking.startTime)}
                                                </div>
                                            </div>

                                            {/* Ngày tạo */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Ngày tạo
                                                </label>
                                                <div className="text-sm text-slate-700">
                                                    {formatDateTime(stocktaking.createdAt)}
                                                </div>
                                            </div>

                                            {/* Người tạo */}
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    Người tạo
                                                </label>
                                                <div className="text-sm text-slate-700">
                                                    {stocktaking.createByName || stocktaking.createdBy || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lý do kiểm kê */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-orange-500" />
                                            Lý do kiểm kê
                                        </h3>
                                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {stocktaking.note || (
                                                <span className="text-slate-400 italic">Chưa có lý do kiểm kê</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assignment Button - Only visible for Warehouse Manager */}
                        {/* Show "Bắt đầu phân công" button when status is Draft (1) */}
                        {stocktaking.status === STOCKTAKING_STATUS.Draft && (
                            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                                <div className="flex justify-center">
                                    <Button
                                        onClick={handleStartAssignment}
                                        className="h-[42px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Users className="mr-2 h-5 w-5" />
                                        Bắt đầu phân công theo khu vực
                                    </Button>
                                </div>
                            </PermissionWrapper>
                        )}

                        {/* Show "Phân công lại" button when status is Assigned (2) - for Warehouse Manager */}
                        {stocktaking.status === STOCKTAKING_STATUS.Assigned && (
                            <>
                                <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_REASSIGN_AREA}>
                                    <div className="flex justify-center">
                                        <Button
                                            onClick={handleStartAssignment}
                                            className="h-[42px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Users className="mr-2 h-5 w-5" />
                                            Phân công lại theo khu vực
                                        </Button>
                                    </div>
                                </PermissionWrapper>

                                {/* Show "Bắt đầu kiểm kê" button for Warehouse Staff */}
                                {hasPermission(PERMISSIONS.STOCKTAKING_IN_PROGRESS) && (
                                    <div className="flex justify-center mt-4">
                                        <Button
                                            onClick={handleStartStocktaking}
                                            className="h-[42px] px-8 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                                        >
                                            <Play className="mr-2 h-5 w-5" />
                                            Bắt đầu kiểm kê
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* No button shown when status is InProgress (4) or other statuses */}
                    </div>
                </Card>

                {/* Assign Area Modal - Only accessible for Warehouse Manager */}
                {(stocktaking?.status === STOCKTAKING_STATUS.Draft || stocktaking?.status === STOCKTAKING_STATUS.Assigned) && (
                    <>
                        {stocktaking?.status === STOCKTAKING_STATUS.Draft && (
                            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                                <AssignAreaModal
                                    isOpen={showAssignModal}
                                    onClose={() => setShowAssignModal(false)}
                                    onSuccess={handleAssignmentSuccess}
                                    stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                                    isReassign={isReassign}
                                    stocktaking={stocktaking}
                                />
                            </PermissionWrapper>
                        )}
                        {stocktaking?.status === STOCKTAKING_STATUS.Assigned && (
                            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_REASSIGN_AREA}>
                                <AssignAreaModal
                                    isOpen={showAssignModal}
                                    onClose={() => setShowAssignModal(false)}
                                    onSuccess={handleAssignmentSuccess}
                                    stocktakingSheetId={stocktaking?.stocktakingSheetId || id}
                                    isReassign={isReassign}
                                    stocktaking={stocktaking}
                                />
                            </PermissionWrapper>
                        )}
                    </>
                )}

                {/* Start Stocktaking Modal - for Warehouse Staff */}
                {stocktaking?.status === STOCKTAKING_STATUS.Assigned && hasPermission(PERMISSIONS.STOCKTAKING_IN_PROGRESS) && (
                    <StartStocktakingModal
                        isOpen={showStartStocktakingModal}
                        onClose={() => setShowStartStocktakingModal(false)}
                        onConfirm={handleStartStocktakingConfirm}
                        stocktaking={stocktaking}
                        loading={startStocktakingLoading}
                    />
                )}
            </div>
        </div>
    );
};

export default StocktakingDetail;

