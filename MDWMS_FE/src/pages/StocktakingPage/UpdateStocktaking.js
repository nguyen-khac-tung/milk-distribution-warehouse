import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { updateStocktaking, getStocktakingDetail } from '../../services/StocktakingService';
import { extractErrorMessage } from '../../utils/Validation';
import { getAreaWithLocationsDropDown, getStocktakingArea } from '../../services/AreaServices';
import AssignAreaModal from '../../components/StocktakingComponents/AssignAreaModal';
import AssignSingleAreaModalForCreate from '../../components/StocktakingComponents/AssignSingleAreaModalForCreate';
import AssignSingleAreaModalForReassign from '../../components/StocktakingComponents/AssignSingleAreaModalForReassign';
import PermissionWrapper from '../../components/Common/PermissionWrapper';
import { PERMISSIONS } from '../../utils/permissions';

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
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showSingleAreaModal, setShowSingleAreaModal] = useState(false);
    const [showSingleAreaReassignModal, setShowSingleAreaReassignModal] = useState(false);
    const [unassignedAreaIds, setUnassignedAreaIds] = useState([]); // Danh sách areaIds chưa được phân công
    const [stocktakingData, setStocktakingData] = useState(null); // Lưu stocktaking data để truyền vào modal reassign
    const [areaAssignments, setAreaAssignments] = useState({}); // Map areaId to { assignTo, assignName }
    const [isAllAreasAssigned, setIsAllAreasAssigned] = useState(false); // Tất cả khu vực đã chọn đã được phân công chưa
    const [isFromUpdateAndAssign, setIsFromUpdateAndAssign] = useState(false); // Modal được gọi từ handleUpdateAndAssign

    // Area dropdown states
    const [areas, setAreas] = useState([]);
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [initialSelectedAreas, setInitialSelectedAreas] = useState([]); // Lưu danh sách khu vực ban đầu từ API
    const [areasLoading, setAreasLoading] = useState(false);
    const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
    const areaDropdownRef = useRef(null);

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

                    // Load selected areas from API response
                    // API trả về StocktakingAreas là mảng các StocktakingAreaUpdateDto, mỗi item có AreaId

                    let areaIds = [];

                    if (data.stocktakingAreas && Array.isArray(data.stocktakingAreas)) {
                        areaIds = data.stocktakingAreas
                            .map(area => area.areaId)
                            .filter(areaId => areaId != null);
                    } else if (data.StocktakingAreas && Array.isArray(data.StocktakingAreas)) {
                        // Handle PascalCase
                        areaIds = data.StocktakingAreas
                            .map(area => area.AreaId || area.areaId)
                            .filter(areaId => areaId != null);
                    } else if (data.areaIds && Array.isArray(data.areaIds)) {
                        areaIds = data.areaIds.map(item =>
                            typeof item === 'object' ? (item.areaId || item.AreaId) : item
                        ).filter(areaId => areaId != null);
                    } else if (data.areas && Array.isArray(data.areas)) {
                        areaIds = data.areas
                            .map(area => area.areaId || area.AreaId)
                            .filter(areaId => areaId != null);
                    }

                    if (areaIds.length > 0) {
                        setSelectedAreas(areaIds);
                        setInitialSelectedAreas(areaIds); // Lưu danh sách khu vực ban đầu
                    }
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

    // Kiểm tra assignment status để cập nhật text nút "Phân công"
    useEffect(() => {
        const checkAssignmentStatus = async () => {
            if (selectedAreas.length === 0) {
                setIsAllAreasAssigned(false);
                return;
            }

            const stocktakingSheetId = formData.stocktakingSheetId || id;
            if (!stocktakingSheetId) {
                setIsAllAreasAssigned(false);
                return;
            }

            try {
                // Gọi API để kiểm tra assignment
                const response = await getStocktakingArea(stocktakingSheetId);
                const areasData = response?.data || response || [];
                const areasArray = Array.isArray(areasData) ? areasData : [];

                // Kiểm tra xem tất cả khu vực đã chọn đã được phân công chưa
                let allAssigned = true;
                selectedAreas.forEach(areaId => {
                    const areaInfo = areasArray.find(a => (a.areaId || a.AreaId) === areaId);
                    if (areaInfo) {
                        const assignTo = areaInfo.assignTo || areaInfo.AssignTo;
                        const assignName = areaInfo.assignName || areaInfo.AssignName;

                        if (!assignTo || assignTo === 0 || !assignName) {
                            allAssigned = false;
                        }
                    } else {
                        // Không tìm thấy trong API, coi như chưa phân công
                        allAssigned = false;
                    }
                });

                setIsAllAreasAssigned(allAssigned);
            } catch (error) {
                console.error('Error checking assignment status:', error);
                setIsAllAreasAssigned(false);
            }
        };

        // Debounce để tránh gọi API quá nhiều
        const timeoutId = setTimeout(() => {
            checkAssignmentStatus();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [selectedAreas, formData.stocktakingSheetId, id]);

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

    // Kiểm tra xem có khu vực mới được thêm vào không
    const hasNewAreas = useMemo(() => {
        if (initialSelectedAreas.length === 0) return false;
        // Kiểm tra xem có khu vực nào trong selectedAreas không có trong initialSelectedAreas
        return selectedAreas.some(areaId => !initialSelectedAreas.includes(areaId));
    }, [selectedAreas, initialSelectedAreas]);

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

            // Format areaIds theo API: array of { areaId: number }
            const areaIds = selectedAreas.map(areaId => ({
                areaId: areaId
            }));

            const submitData = {
                stocktakingSheetId: formData.stocktakingSheetId,
                startTime: startTimeISO,
                note: formData.reason.trim(),
                areaIds: areaIds
            };

            await updateStocktaking(submitData);

            // if (window.showToast) {
            //     window.showToast('Cập nhật phiếu kiểm kê thành công!', 'success');
            // }

            // Navigate về danh sách sau khi cập nhật thành công
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

    // Hàm xử lý cập nhật và phân công (gọi API update trước, sau đó mở modal phân công)
    const handleUpdateAndAssign = async (e) => {
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

            // Format areaIds theo API: array of { areaId: number }
            const areaIds = selectedAreas.map(areaId => ({
                areaId: areaId
            }));

            const submitData = {
                stocktakingSheetId: formData.stocktakingSheetId,
                startTime: startTimeISO,
                note: formData.reason.trim(),
                areaIds: areaIds
            };

            // Gọi API update trước
            await updateStocktaking(submitData);

            // if (window.showToast) {
            //     window.showToast('Cập nhật phiếu kiểm kê thành công!', 'success');
            // }

            // Sau khi update thành công, mở modal phân công
            await openAssignModalAfterUpdate();
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

    // Hàm mở modal phân công sau khi update thành công
    const openAssignModalAfterUpdate = async () => {
        try {
            const stocktakingSheetId = formData.stocktakingSheetId || id;
            
            // Gọi API để kiểm tra assignment của các khu vực đã chọn
            const response = await getStocktakingArea(stocktakingSheetId);
            const areasData = response?.data || response || [];
            const areasArray = Array.isArray(areasData) ? areasData : [];

            // Kiểm tra từng khu vực đã chọn xem đã được phân công chưa
            const assignedAreas = [];
            const unassignedAreas = [];

            selectedAreas.forEach(areaId => {
                const areaInfo = areasArray.find(a => (a.areaId || a.AreaId) === areaId);
                if (areaInfo) {
                    const assignTo = areaInfo.assignTo || areaInfo.AssignTo;
                    const assignName = areaInfo.assignName || areaInfo.AssignName;

                    if (assignTo != null && assignTo !== 0 && assignName) {
                        // Đã được phân công
                        assignedAreas.push({
                            areaId: areaId,
                            assignTo: assignTo,
                            assignName: assignName,
                            ...areaInfo
                        });
                    } else {
                        // Chưa được phân công
                        unassignedAreas.push(areaId);
                    }
                } else {
                    // Không tìm thấy trong API, coi như chưa phân công
                    unassignedAreas.push(areaId);
                }
            });

            // Chuẩn hóa stocktaking data để truyền vào modal reassign
            const normalizedStocktakingAreas = areasArray.map(area => ({
                areaId: area.areaId || area.AreaId,
                assignTo: area.assignTo || area.AssignTo || null,
                assignName: area.assignName || area.AssignName || null,
                ...area
            }));

            const normalizedStocktakingData = {
                stocktakingSheetId: stocktakingSheetId,
                stocktakingAreas: normalizedStocktakingAreas
            };
            setStocktakingData(normalizedStocktakingData);

            // Lưu danh sách khu vực chưa phân công và đã phân công
            setUnassignedAreaIds(unassignedAreas);

            // Quyết định mở modal nào dựa trên số lượng khu vực đã chọn
            if (selectedAreas.length === 1) {
                // Nếu chỉ có 1 khu vực → dùng modal hiển thị 1 khu
                if (assignedAreas.length > 0) {
                    // Đã được phân công → mở modal phân công lại 1 khu vực
                    setShowSingleAreaReassignModal(true);
                } else {
                    // Chưa được phân công → mở modal phân công bình thường 1 khu vực
                    setShowSingleAreaModal(true);
                }
            } else {
                // Nếu có 2+ khu vực → dùng modal hiển thị nhiều khu
                setShowAssignModal(true);
            }
            
            // Đánh dấu modal được gọi từ handleUpdateAndAssign
            setIsFromUpdateAndAssign(true);
        } catch (error) {
            console.error('Error opening assign modal after update:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Không thể mở modal phân công', 'error');
            }
        }
    };

    const handleOpenAssignModal = async (e) => {
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

        if (!formData.stocktakingSheetId && !id) {
            window.showToast('Không tìm thấy mã phiếu kiểm kê', 'error');
            return;
        }

        try {
            // Gọi API để kiểm tra assignment của các khu vực đã chọn
            const stocktakingSheetId = formData.stocktakingSheetId || id;
            const response = await getStocktakingArea(stocktakingSheetId);
            const areasData = response?.data || response || [];
            const areasArray = Array.isArray(areasData) ? areasData : [];

            // Kiểm tra từng khu vực đã chọn xem đã được phân công chưa
            const assignedAreas = [];
            const unassignedAreas = [];

            selectedAreas.forEach(areaId => {
                const areaInfo = areasArray.find(a => (a.areaId || a.AreaId) === areaId);
                if (areaInfo) {
                    const assignTo = areaInfo.assignTo || areaInfo.AssignTo;
                    const assignName = areaInfo.assignName || areaInfo.AssignName;

                    if (assignTo != null && assignTo !== 0 && assignName) {
                        // Đã được phân công
                        assignedAreas.push({
                            areaId: areaId,
                            assignTo: assignTo,
                            assignName: assignName,
                            ...areaInfo
                        });
                    } else {
                        // Chưa được phân công
                        unassignedAreas.push(areaId);
                    }
                } else {
                    // Không tìm thấy trong API, coi như chưa phân công
                    unassignedAreas.push(areaId);
                }
            });

            // Chuẩn hóa stocktaking data để truyền vào modal reassign
            const normalizedStocktakingAreas = areasArray.map(area => ({
                areaId: area.areaId || area.AreaId,
                assignTo: area.assignTo || area.AssignTo || null,
                assignName: area.assignName || area.AssignName || null,
                ...area
            }));

            const normalizedStocktakingData = {
                stocktakingSheetId: stocktakingSheetId,
                stocktakingAreas: normalizedStocktakingAreas
            };
            setStocktakingData(normalizedStocktakingData);

            // Lưu danh sách khu vực chưa phân công và đã phân công
            setUnassignedAreaIds(unassignedAreas);

            // Quyết định mở modal nào dựa trên số lượng khu vực đã chọn
            if (selectedAreas.length === 1) {
                // Nếu chỉ có 1 khu vực → dùng modal hiển thị 1 khu
                if (assignedAreas.length > 0) {
                    // Đã được phân công → mở modal phân công lại 1 khu vực
                    setShowSingleAreaReassignModal(true);
                } else {
                    // Chưa được phân công → mở modal phân công bình thường 1 khu vực
                    setShowSingleAreaModal(true);
                }
            } else {
                // Nếu có 2+ khu vực → dùng modal hiển thị nhiều khu
                // Luôn mở modal nhiều khu vực (AssignAreaModal)
                // Modal sẽ tự xử lý reassign hoặc assign bình thường dựa trên isReassign prop
                setShowAssignModal(true);
            }
            
            // Reset flag
            setIsFromUpdateAndAssign(false);
        } catch (error) {
            console.error('Error checking assignment:', error);
            const errorMessage = extractErrorMessage(error);
            if (window.showToast) {
                window.showToast(errorMessage || 'Không thể kiểm tra thông tin phân công', 'error');
            }
        }
    };

    const handleAssignmentSuccess = async () => {
        // Sau khi phân công thành công, tải lại thông tin phân công
        // Toast đã được hiển thị trong modal
        setShowAssignModal(false);
        setShowSingleAreaModal(false);
        setShowSingleAreaReassignModal(false);
        setUnassignedAreaIds([]);
        setIsFromUpdateAndAssign(false);
        
        // Nếu được gọi từ handleUpdateAndAssign, cập nhật initialSelectedAreas
        if (isFromUpdateAndAssign) {
            setInitialSelectedAreas([...selectedAreas]);
        }

        // Tải lại thông tin chi tiết để cập nhật assignment information
        if (id) {
            try {
                const response = await getStocktakingDetail(id);
                const data = response?.data || response;

                if (data) {
                    const assignmentsMap = {};
                    let normalizedStocktakingAreas = [];

                    // Cập nhật thông tin phân công và chuẩn hóa dữ liệu
                    if (data.stocktakingAreas && Array.isArray(data.stocktakingAreas)) {
                        normalizedStocktakingAreas = data.stocktakingAreas.map(area => {
                            const areaId = area.areaId;
                            const assignTo = area.assignTo || area.AssignTo;
                            const assignName = area.assignName || area.AssignName || area.assignToName || area.AssignToName;

                            if (areaId != null) {
                                if (assignTo != null && assignTo !== 0 && assignName) {
                                    assignmentsMap[areaId] = {
                                        assignTo: assignTo,
                                        assignName: assignName
                                    };
                                }

                                return {
                                    areaId: areaId,
                                    assignTo: assignTo || null,
                                    assignName: assignName || null,
                                    ...area
                                };
                            }
                            return null;
                        }).filter(area => area != null);
                    } else if (data.StocktakingAreas && Array.isArray(data.StocktakingAreas)) {
                        normalizedStocktakingAreas = data.StocktakingAreas.map(area => {
                            const areaId = area.AreaId || area.areaId;
                            const assignTo = area.AssignTo || area.assignTo;
                            const assignName = area.AssignName || area.assignName || area.AssignToName || area.assignToName;

                            if (areaId != null) {
                                if (assignTo != null && assignTo !== 0 && assignName) {
                                    assignmentsMap[areaId] = {
                                        assignTo: assignTo,
                                        assignName: assignName
                                    };
                                }

                                return {
                                    areaId: areaId,
                                    assignTo: assignTo || null,
                                    assignName: assignName || null,
                                    ...area
                                };
                            }
                            return null;
                        }).filter(area => area != null);
                    }

                    setAreaAssignments(assignmentsMap);

                    // Chuẩn hóa và cập nhật stocktaking data
                    const normalizedStocktakingData = {
                        ...data,
                        stocktakingAreas: normalizedStocktakingAreas.length > 0
                            ? normalizedStocktakingAreas
                            : (data.stocktakingAreas || data.StocktakingAreas || [])
                    };
                    setStocktakingData(normalizedStocktakingData);
                }
            } catch (error) {
                console.error('Error refreshing assignment data:', error);
            }
        }

        // Không navigate về danh sách, giữ nguyên form để user có thể tiếp tục cập nhật
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
                            {/* Luôn hiển thị nút Cập nhật */}
                            <Button
                                type="button"
                                onClick={handleUpdate}
                                disabled={updateLoading}
                                className="h-[38px] px-6 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                            </Button>
                            {hasNewAreas ? (
                                // Nếu có khu vực mới được thêm vào → hiển thị nút "Cập nhật và Phân công"
                                <Button
                                    type="button"
                                    onClick={handleUpdateAndAssign}
                                    disabled={updateLoading}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateLoading ? 'Đang xử lý...' : 'Cập nhật và Phân công'}
                                </Button>
                            ) : (
                                // Nếu không có khu vực mới → hiển thị nút "Phân công"
                                <Button
                                    type="button"
                                    onClick={handleOpenAssignModal}
                                    disabled={updateLoading}
                                    className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAllAreasAssigned && selectedAreas.length > 0 ? 'Phân công lại' : 'Phân công'}
                                </Button>
                            )}
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
                        setUnassignedAreaIds([]);
                        setIsFromUpdateAndAssign(false);
                    }}
                    onSuccess={handleAssignmentSuccess}
                    stocktakingSheetId={formData.stocktakingSheetId || id}
                    isReassign={unassignedAreaIds.length === 0 && selectedAreas.length > 0} // Nếu không có khu vực chưa phân công thì là reassign
                    stocktaking={stocktakingData} // Luôn truyền stocktaking data để modal có thể hiển thị thông tin phân công cho tất cả khu vực
                    formData={formData} // Truyền formData để modal tự cập nhật khi confirm
                    areasToReassign={selectedAreas} // Luôn truyền tất cả selectedAreas để modal hiển thị tất cả khu vực (cả đã phân công và chưa phân công)
                    selectedAreaIds={selectedAreas} // Truyền selectedAreas để cập nhật vào stocktaking
                    isFromUpdateAndAssign={isFromUpdateAndAssign} // Truyền flag để modal hiển thị nút "Xác nhận"
                />
            </PermissionWrapper>

            {/* Assign Single Area Modal - Hiển thị khi click nút Phân công và có 1 khu vực chưa phân công */}
            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                <AssignSingleAreaModalForCreate
                    isOpen={showSingleAreaModal}
                    onClose={() => {
                        // Chỉ đóng modal, không làm gì cả, form vẫn giữ nguyên
                        setShowSingleAreaModal(false);
                        setUnassignedAreaIds([]);
                        setIsFromUpdateAndAssign(false);
                    }}
                    onSuccess={handleAssignmentSuccess}
                    stocktakingSheetId={formData.stocktakingSheetId || id}
                    formData={formData} // Truyền formData để modal có thể sử dụng nếu cần
                    areaId={selectedAreas.length === 1 ? selectedAreas[0] : null} // areaId của khu vực duy nhất
                    isFromUpdateAndAssign={isFromUpdateAndAssign} // Truyền flag để modal hiển thị nút "Xác nhận"
                />
            </PermissionWrapper>

            {/* Assign Single Area Reassign Modal - Hiển thị khi click nút Phân công và có 1 khu vực đã phân công */}
            <PermissionWrapper requiredPermission={PERMISSIONS.STOCKTAKING_VIEW_WM}>
                <AssignSingleAreaModalForReassign
                    isOpen={showSingleAreaReassignModal}
                    onClose={() => {
                        // Chỉ đóng modal, không làm gì cả, form vẫn giữ nguyên
                        setShowSingleAreaReassignModal(false);
                        setIsFromUpdateAndAssign(false);
                    }}
                    onSuccess={handleAssignmentSuccess}
                    stocktakingSheetId={formData.stocktakingSheetId || id}
                    stocktaking={stocktakingData} // Truyền stocktaking data để pre-select người được phân công trước đó
                    areaId={selectedAreas.length === 1 ? selectedAreas[0] : null} // areaId của khu vực duy nhất
                    isFromUpdateAndAssign={isFromUpdateAndAssign} // Truyền flag để modal hiển thị nút "Xác nhận"
                />
            </PermissionWrapper>
        </div>
    );
};

export default UpdateStocktaking;

