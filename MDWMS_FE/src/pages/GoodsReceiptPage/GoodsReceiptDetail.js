import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  CheckCircle,
  Printer,
  Lightbulb
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { PrintablePalletLabel, PrintableMultiplePalletLabels } from "../../components/PalletComponents/PrintPalletLabel";
import Loading from "../../components/Common/Loading";
import { getGoodsReceiptNoteByPurchaseOrderId, verifyRecord, cancelGoodsReceiptNoteDetail, submitGoodsReceiptNote, approveGoodsReceiptNote, rejectGoodsReceiptNoteDetail, getPalletByGRNID, getLocationSuggest } from "../../services/GoodsReceiptService";
import { completePurchaseOrder, getPurchaseOrderDetail } from "../../services/PurchaseOrderService";
import { PERMISSIONS, PURCHASE_ORDER_STATUS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { GOODS_RECEIPT_NOTE_STATUS, RECEIPT_ITEM_STATUS, getGoodsReceiptNoteStatusMeta } from "./goodsReceiptNoteStatus";
import { getReceiptItemStatusMeta } from "./goodsReceiptNoteStatus";
import RejectReasonModal from "./RejectReasonModal";
import { extractErrorMessage } from "../../utils/Validation";
import CreateBatchModal from "./CreateBatchModal";
import PalletManager from "./CreatePallet";
import AddLocationToPalletModal from "./AddLocationToPalletModal";
import LocationSuggestionModal from "./LocationSuggestionModal";

// Status labels for Goods Receipt Note - sẽ được lấy từ API
const getStatusLabel = (status) => {
  if (!status) return { label: "Không xác định", color: "bg-gray-100 text-gray-800" };

  // Nếu status là object có label và color
  if (typeof status === 'object' && status.label && status.color) {
    return status;
  }

  // Nếu status là string
  if (typeof status === 'string') {
    return { label: status, color: "bg-blue-100 text-blue-800" };
  }

  // Fallback cho các trường hợp khác
  return { label: `Trạng thái ${status}`, color: "bg-gray-100 text-gray-800" };
};

export default function GoodsReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [goodsReceiptNote, setGoodsReceiptNote] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    orderDetails: true,
    receiving: true,
    pallet: true,
    arranging: true
  });
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [submitPalletsFn, setSubmitPalletsFn] = useState(null);
  const [palletCreated, setPalletCreated] = useState(false);
  const [pallets, setPallets] = useState([]);
  const [isSubmittingPallet, setIsSubmittingPallet] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [selectedPalletForLocation, setSelectedPalletForLocation] = useState(null);
  const [selectedPalletForSuggestion, setSelectedPalletForSuggestion] = useState(null);
  const [showLocationSuggestionModal, setShowLocationSuggestionModal] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isPurchaseOrderCompleted, setIsPurchaseOrderCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({}); // Lưu lỗi validation cho từng detail
  const arrangingSectionRef = useRef(null);
  const [selectedPalletForPrint, setSelectedPalletForPrint] = useState(null);
  const [selectedPallets, setSelectedPallets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printRef = useRef(null);
  // Thêm state quản lý kiểm tra từng mặt hàng
  // Xóa hẳn 2 state checkedDetails, notCheckedDetails và các setCheckedDetails/setNotCheckedDetails

  // Dùng useCallback để giữ reference ổn định, tránh loop vô hạn
  const handleRegisterSubmit = useCallback((fn) => {
    setSubmitPalletsFn(() => fn);
  }, []);

  // Callback khi tạo pallet thành công
  const handlePalletCreated = useCallback(async () => {
    setPalletCreated(true);
    // Refresh danh sách pallet sau khi tạo thành công
    if (goodsReceiptNote?.goodsReceiptNoteId) {
      await fetchPallets(goodsReceiptNote.goodsReceiptNoteId);
    }
  }, [goodsReceiptNote?.goodsReceiptNoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callback khi trạng thái submitting thay đổi
  const handleSubmittingChange = useCallback((isSubmitting) => {
    setIsSubmittingPallet(isSubmitting);
  }, []);

  // Callback để refresh batch options trong PalletManager khi tạo lô mới
  const handleBatchCreatedRef = useRef(null);
  
  const handleBatchCreated = useCallback((fn) => {
    handleBatchCreatedRef.current = fn;
  }, []);

  // Xử lý in pallet
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Phiếu dán mã kệ kê hàng",
    pageStyle: `
      @page { 
        size: A4; 
        margin: 10mm; 
      } 
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
        margin: 0;
        padding: 0;
      }
      .print-container {
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
    `,
  });

  const handlePrintPallet = (pallet) => {
    setSelectedPalletForPrint(pallet);
    setTimeout(() => handlePrint(), 100);
  };

  // Cập nhật selectAll khi selectedPallets thay đổi
  useEffect(() => {
    if (selectedPallets.length === 0) {
      setSelectAll(false);
    } else if (selectedPallets.length === pallets.length && pallets.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedPallets, pallets]);

  // Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPallets([...pallets]);
    } else {
      setSelectedPallets([]);
    }
  };

  // Xử lý chọn/bỏ chọn một pallet
  const handleSelectPallet = (pallet, checked) => {
    if (checked) {
      setSelectedPallets(prev => [...prev, pallet]);
    } else {
      setSelectedPallets(prev => prev.filter(p => (p.palletId || p.id) === (pallet.palletId || pallet.id)));
    }
  };

  // Kiểm tra xem một pallet có được chọn không
  const isPalletSelected = (pallet) => {
    return selectedPallets.some(p => (p.palletId || p.id) === (pallet.palletId || pallet.id));
  };

  // In nhiều pallet đã chọn
  const handlePrintSelected = () => {
    if (selectedPallets.length === 0) {
      window.showToast?.("Vui lòng chọn ít nhất một kệ kê hàng để in", "warning");
      return;
    }
    // Hiển thị modal preview trước khi in
    setShowPrintPreview(true);
  };

  // Xác nhận in từ modal preview
  const handleConfirmPrint = () => {
    setShowPrintPreview(false);
    setSelectedPalletForPrint(null); // Reset để dùng selectedPallets
    setTimeout(() => handlePrint(), 100);
  };

  useEffect(() => {
    fetchGoodsReceiptNoteDetail();
  }, [id]);

  // Đóng cart pallet và arranging nếu status không phải Completed
  useEffect(() => {
    if (!goodsReceiptNote) return;
    
    if (goodsReceiptNote.status !== GOODS_RECEIPT_NOTE_STATUS.Completed) {
      setExpandedSections(prev => {
        // Chỉ đóng nếu đang mở, tránh re-render không cần thiết
        if (!prev.pallet && !prev.arranging) {
          return prev;
        }
        return {
          ...prev,
          pallet: false,
          arranging: false
        };
      });
    }
  }, [goodsReceiptNote?.status]);

  const fetchGoodsReceiptNoteDetail = async () => {
    setLoading(true);
    try {
      // id trong URL là purchaseOrderId
      const response = await getGoodsReceiptNoteByPurchaseOrderId(id);
      if (response && response.data && Array.isArray(response.data.goodsReceiptNoteDetails)) {
        response.data.goodsReceiptNoteDetails = response.data.goodsReceiptNoteDetails.map(d =>
          d.status === 1 ? {
            ...d,
            deliveredPackageQuantity: d.deliveredPackageQuantity === null || d.deliveredPackageQuantity === undefined || d.deliveredPackageQuantity === '' ? 0 : d.deliveredPackageQuantity,
            actualPackageQuantity: d.actualPackageQuantity === null || d.actualPackageQuantity === undefined || d.actualPackageQuantity === '' ? 0 : d.actualPackageQuantity,
            rejectPackageQuantity: d.rejectPackageQuantity === null || d.rejectPackageQuantity === undefined || d.rejectPackageQuantity === '' ? 0 : d.rejectPackageQuantity,
          } : d
        );
      }
      if (response && response.data) {
        setGoodsReceiptNote(response.data);

        // Reset validation errors khi fetch lại dữ liệu
        setValidationErrors({});

        // Kiểm tra xem Purchase Order đã hoàn thành chưa
        // Nếu có purchaseOrderStatus trong response, dùng nó
        if (response.data.purchaseOrderStatus !== undefined) {
          setIsPurchaseOrderCompleted(response.data.purchaseOrderStatus === PURCHASE_ORDER_STATUS.Completed);
        } else {
          // Nếu không có, fetch Purchase Order detail để lấy status
          if (response.data.purchaseOderId) {
            try {
              const poResponse = await getPurchaseOrderDetail(response.data.purchaseOderId);
              if (poResponse && poResponse.success && poResponse.data) {
                const poStatus = poResponse.data.status;
                setIsPurchaseOrderCompleted(poStatus === PURCHASE_ORDER_STATUS.Completed);
              }
            } catch (error) {
              console.error("Error fetching purchase order status:", error);
              // Nếu không fetch được, mặc định là false
              setIsPurchaseOrderCompleted(false);
            }
          }
        }

        // Sau khi set goodsReceiptNote, check xem đã có pallet chưa (để ẩn nút tạo pallet nếu đã có)
        if (response.data.goodsReceiptNoteId) {
          // Gọi fetchPallets để check, nhưng không hiển thị lỗi nếu chưa có pallet (400/404)
          fetchPallets(response.data.goodsReceiptNoteId).catch(() => {
            // Im lặng xử lý lỗi - đã được xử lý trong fetchPallets
          });
        }
      } else {
        setGoodsReceiptNote(null);
        setValidationErrors({});
      }
    } catch (error) {
      console.error("Error fetching goods receipt note detail:", error);
      const msg = extractErrorMessage(error, "Không thể tải thông tin phiếu nhập kho!");
      window.showToast?.(msg, "error");
      setGoodsReceiptNote(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPallets = async (grnId) => {
    if (!grnId) return;
    try {
      const response = await getPalletByGRNID(grnId);

      // Lưu danh sách pallet vào state
      let palletList = [];
      if (response && response.data && Array.isArray(response.data)) {
        palletList = response.data;
      } else if (response && Array.isArray(response)) {
        palletList = response;
      }

      setPallets(palletList);

      // Nếu đã có pallet thì set palletCreated = true để ẩn nút tạo pallet
      if (palletList.length > 0) {
        setPalletCreated(true);
      } else {
        // Nếu không có pallet thì reset state
        setPalletCreated(false);
      }
    } catch (error) {
      // Xử lý lỗi 400 một cách graceful - coi như chưa có pallet
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        // Chưa có pallet, đây là trường hợp bình thường
        setPallets([]);
        setPalletCreated(false);
      } else {
        // Lỗi khác, chỉ log ở console, không làm gián đoạn flow
        console.error("Error fetching pallets:", error);
        setPallets([]);
        setPalletCreated(false);
      }
    }
  };

  const toggleSection = (section) => {
    // Chỉ cho mở cart pallet và arranging khi status là Completed
    if (section === 'pallet' || section === 'arranging') {
      if (goodsReceiptNote?.status !== GOODS_RECEIPT_NOTE_STATUS.Completed) {
        window.showToast?.("Phiếu phải được Quản lý kho duyệt thì mới được đưa vào kệ kê hàng", "warning");
        return;
      }
    }
    
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCompleteReceiving = async () => {
    if (needCheckDetails.length > 0) {
      window.showToast("Bạn phải kiểm tra hết tất cả mặt hàng trước khi nộp đơn kiểm nhập!", "warning");
      return;
    }
    try {
      const id = goodsReceiptNote?.goodsReceiptNoteId;
      if (!id) return;
      await submitGoodsReceiptNote(id);
      await fetchGoodsReceiptNoteDetail();
    } catch (error) {
      console.error('Submit goods receipt note failed:', error);
      const msg = extractErrorMessage(error, "Nộp đơn kiểm nhập thất bại, vui lòng thử lại!");
      window.showToast?.(msg, "error");
    }
  };

  const handleCompleteArranging = async () => {
    if (!goodsReceiptNote?.goodsReceiptNoteId) {
      window.showToast?.("Không tìm thấy mã phiếu nhập kho", "error");
      return;
    }
    try {
      // Refresh danh sách pallet
      await fetchPallets(goodsReceiptNote.goodsReceiptNoteId);

      // Mở rộng section "Sắp xếp"
      setExpandedSections(prev => ({
        ...prev,
        arranging: true
      }));

      // Scroll đến phần "Sắp xếp" sau một chút delay để UI cập nhật
      setTimeout(() => {
        if (arrangingSectionRef.current) {
          arrangingSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching pallets:", error);
      const msg = extractErrorMessage(error, "Lấy danh sách pallet thất bại, vui lòng thử lại!");
      window.showToast?.(msg, "error");
    }
  };

  // Handler để hoàn thành Purchase Order
  const handleCompletePurchaseOrder = async () => {
    if (!goodsReceiptNote?.purchaseOderId) {
      window.showToast?.("Không tìm thấy mã đơn nhập hàng", "error");
      return;
    }

    // Kiểm tra xem tất cả pallet đã có locationCode chưa
    const allPalletsHaveLocation = pallets.length > 0 && pallets.every(pallet => {
      const locationCode = pallet.locationCode ? String(pallet.locationCode).trim() : '';
      return locationCode && locationCode !== '';
    });

    if (!allPalletsHaveLocation) {
      window.showToast?.("Vui lòng đưa tất cả pallet vào kho trước khi hoàn thành!", "warning");
      return;
    }

    try {
      await completePurchaseOrder(goodsReceiptNote.purchaseOderId);
      window.showToast?.("Hoàn thành đơn nhập hàng thành công!", "success");
      // Đánh dấu đã hoàn thành để disable nút
      setIsPurchaseOrderCompleted(true);
      // Refresh dữ liệu sau khi hoàn thành
      await fetchGoodsReceiptNoteDetail();
    } catch (error) {
      console.error("Error completing purchase order:", error);
      const msg = extractErrorMessage(error, "Hoàn thành đơn nhập hàng thất bại, vui lòng thử lại!");
      window.showToast?.(msg, "error");
    }
  };

  // Handler khi thêm location cho pallet thành công
  const handleLocationAdded = useCallback(async () => {
    if (goodsReceiptNote?.goodsReceiptNoteId) {
      await fetchPallets(goodsReceiptNote.goodsReceiptNoteId);
    }
  }, [goodsReceiptNote?.goodsReceiptNoteId]);

  // Handler mở modal gợi ý vị trí
  const handleOpenLocationSuggestion = async (pallet) => {
    const palletId = pallet?.palletId || pallet?.id;
    if (!palletId) {
      window.showToast?.("Không tìm thấy mã pallet", "error");
      return;
    }
    
    setSelectedPalletForSuggestion(pallet);
    setShowLocationSuggestionModal(true);
    setLoadingSuggestions(true);
    setLocationSuggestions([]);

    try {
      const response = await getLocationSuggest(palletId);
      const suggestions = response?.data || response?.items || response || [];
      setLocationSuggestions(Array.isArray(suggestions) ? suggestions : []);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      const errorMessage = extractErrorMessage(error, "Lấy danh sách gợi ý vị trí thất bại");
      window.showToast?.(errorMessage, "error");
      setLocationSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handler chọn vị trí từ gợi ý
  const handleSelectSuggestedLocation = (location) => {
    const locationCode = location?.locationCode || location?.code || "";
    if (locationCode && selectedPalletForSuggestion) {
      setShowLocationSuggestionModal(false);
      setSelectedPalletForLocation({
        ...selectedPalletForSuggestion,
        suggestedLocationCode: locationCode,
        suggestedLocationId: location?.locationId || location?.id
      });
      setShowAddLocationModal(true);
    }
  };

  const handlePrintReceipt = () => {
    // Implement print functionality
    window.print();
  };

  const openRejectModal = (detailId) => {
    setSelectedDetailId(detailId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason("");
    setSelectedDetailId(null);
  };

  const submitReject = async () => {
    if (!selectedDetailId) return;
    try {
      await rejectGoodsReceiptNoteDetail({ goodsReceiptNoteDetailId: selectedDetailId, rejectionReason: rejectReason || "" });
      closeRejectModal();
      fetchGoodsReceiptNoteDetail();
    } catch (e) {
      console.error(e);
      const msg = extractErrorMessage(e, "Từ chối thất bại, vui lòng thử lại!");
      window.showToast?.(msg, "error");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!goodsReceiptNote) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy phiếu nhập kho</h2>
          <p className="text-gray-600 mt-2">Phiếu nhập kho không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  const needCheckDetails = goodsReceiptNote.goodsReceiptNoteDetails?.filter(d => d.status === RECEIPT_ITEM_STATUS.Receiving) || [];
  const checkedDetails = goodsReceiptNote.goodsReceiptNoteDetails?.filter(d => d.status === RECEIPT_ITEM_STATUS.Inspected || d.status === RECEIPT_ITEM_STATUS.PendingApproval || d.status === RECEIPT_ITEM_STATUS.Completed) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/purchase-orders')}
              className="text-slate-600 hover:bg-slate-50 h-[38px]"
            >
              <ChevronDown className="h-4 w-4 mr-2 rotate-90" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết phiếu nhập kho</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGoodsReceiptNoteStatusMeta(goodsReceiptNote.status).color}`}>
              {getGoodsReceiptNoteStatusMeta(goodsReceiptNote.status).label}
            </span>
            <Button onClick={handlePrintReceipt} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-[38px] text-white">
              <Printer className="w-4 h-4" />
              In Phiếu
            </Button>
          </div>
        </div>
      </div>
      {/* Main Content full width, no px-6 container, just vertical spacing */}
      <div className="space-y-6 mt-4">
        {/* Chi tiết đơn hàng */}
        <Card className="bg-gray-50 border border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div
              className="p-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('orderDetails')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng</h2>
                  <p className="text-sm text-gray-500">Thông tin cơ bản về đơn hàng</p>
                </div>
              </div>
              {expandedSections.orderDetails ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedSections.orderDetails && (
              <div className="p-4 space-y-4">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Mã đơn nhập</div>
                    <div className="text-base font-semibold text-gray-900">{goodsReceiptNote.purchaseOderId || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Người duyệt</div>
                    <div className="text-base font-semibold text-gray-900">{goodsReceiptNote.approvalByName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Người tạo</div>
                    <div className="text-base font-semibold text-gray-900">{goodsReceiptNote.createdByName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Ngày tạo</div>
                    <div className="text-base font-semibold text-gray-900">
                      {goodsReceiptNote.createdAt ? new Date(goodsReceiptNote.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Ngày cập nhật</div>
                    <div className="text-base font-semibold text-gray-900">
                      {goodsReceiptNote.updatedAt ? new Date(goodsReceiptNote.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Danh sách mặt hàng */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Danh sách mặt hàng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {goodsReceiptNote.goodsReceiptNoteDetails?.map((detail, index) => (
                      <div key={index} className="rounded border border-gray-200 bg-white p-2 flex flex-col gap-1">
                        <div className="mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="font-semibold text-gray-900 text-sm">Mã: {detail.goodsCode || ''}</span>
                          </div>
                          <div className="mt-0.5">
                            <span className="font-normal text-gray-800 text-xs">Tên: {detail.goodsName || ''}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <div className="text-gray-800">Dự kiến: <span className="font-semibold">{detail.expectedPackageQuantity || 0}</span></div>
                          <div className="text-green-600">Đã nhận: <span className="font-semibold">{detail.deliveredPackageQuantity || 0}</span></div>
                          <div className="text-blue-600">Thực nhập: <span className="font-semibold">{Math.max(0, detail.actualPackageQuantity || 0)}</span></div>
                          <div className="text-red-600">Loại bỏ: <span className="font-semibold">{detail.rejectPackageQuantity || 0}</span></div>
                        </div>
                      </div>
                    )) || <div className="text-center text-gray-500 py-2">Không có dữ liệu</div>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kiểm nhập */}
        <Card className="bg-gray-50 border border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div
              className="p-6 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-green-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">Kiểm nhập</h2>
                  <p className="text-sm text-gray-500">Kiểm nhập và xác nhận hàng hóa nhập kho</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchGoodsReceiptNoteDetail}
                  className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 h-[38px] text-slate-700 bg-white"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                <button
                  onClick={() => toggleSection('receiving')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  {expandedSections.receiving ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {expandedSections.receiving && (
              <>
                <div className="p-6 space-y-6">
                  {/* TABLE 1: CẦN KIỂM TRA (status==1) - Luôn hiển thị cho nhân viên kho khi có item Receiving */}
                  {!(hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT)) && (
                    <>
                      <h2 className="text-lg font-semibold mb-3">Đang kiểm nhập</h2>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100">
                            <TableHead className="font-semibold text-gray-700">Mã hàng</TableHead>
                            <TableHead className="font-semibold text-gray-700">Tên hàng</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Đơn vị tính</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Quy cách đóng gói</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Số lượng thùng dự kiến</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Số lượng thùng giao đến</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Số lượng thùng trả lại</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Số lượng thùng thực nhận</TableHead>
                            <TableHead className="font-semibold text-gray-700">Ghi chú</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Trạng thái</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {needCheckDetails.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} className="text-center text-gray-500 py-8">Chưa có mặt hàng cần kiểm nhập</TableCell>
                            </TableRow>
                          ) : needCheckDetails.map((detail, index) => {
                            const expectedPackageQuantity = Number(detail.expectedPackageQuantity) || 0;
                            const deliveredPackageQuantity = Number(detail.deliveredPackageQuantity) || 0;
                            const rejectPackageQuantity = Number(detail.rejectPackageQuantity) || 0;
                            // Đảm bảo số lượng thực nhận không bao giờ âm, nếu âm thì là 0
                            const actualPackageQuantity = Math.max(0, deliveredPackageQuantity - rejectPackageQuantity);

                            // Validation logic theo quy tắc
                            // a = expected (số lượng dự kiến), b = delivered (số lượng giao đến), c = reject (số lượng trả lại)
                            const validateRejectQuantity = (delivered, reject, expected) => {
                              if (delivered === 0 && reject === 0) return null; // Cho phép cả 2 = 0

                              // Kiểm tra số lượng thực nhận không được âm (reject không được lớn hơn delivered)
                              if (reject > delivered) {
                                return `Số lượng trả lại không được lớn hơn số lượng giao đến`;
                              }

                              if (expected > delivered) {
                                // TH1: a > b -> 0 <= c <= b
                                if (reject < 0 || reject > delivered) {
                                  return `Số lượng trả lại phải từ 0 đến ${delivered} (vì số lượng dự kiến > số lượng giao đến)`;
                                }
                              } else if (expected < delivered) {
                                // TH2: a < b -> b - a <= c <= b
                                const minReject = delivered - expected;
                                if (reject < minReject) {
                                  return `Số lượng trả lại  tối thiểu phải là ${minReject} (vì số lượng giao đến > số lượng dự kiến)`;
                                }
                                if (reject > delivered) {
                                  return `Số lượng trả lại không được lớn hơn số lượng giao đến`;
                                }
                              } else {
                                // TH3: a = b -> 0 <= c <= b
                                if (reject < 0 || reject > delivered) {
                                  return `Số lượng trả lại phải từ 0 đến ${delivered} (vì số lượng giao đến = số lượng dự kiến)`;
                                }
                              }
                              return null;
                            };

                            const detailId = detail.goodsReceiptNoteDetailId;
                            const errorMessage = validateRejectQuantity(deliveredPackageQuantity, rejectPackageQuantity, expectedPackageQuantity);

                            return (
                              <>
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="font-medium text-gray-900 text-xs max-w-[70px] truncate" title={detail.goodsCode}>{detail.goodsCode}</TableCell>
                                  <TableCell className="text-xs text-gray-700 max-w-[90px] truncate" title={detail.goodsName}>{detail.goodsName}</TableCell>
                                  <TableCell className="text-xs text-gray-700 text-center">{detail.unitMeasureName}</TableCell>
                                  <TableCell className="text-xs text-gray-700 text-center">{detail.unitPerPackage ? `${detail.unitPerPackage}${detail.unitMeasureName ? ' ' + detail.unitMeasureName : ''}/thùng` : '-'}</TableCell>
                                  {/* Số lượng thùng dự kiến */}
                                  <TableCell className="text-center text-xs">{detail.expectedPackageQuantity ?? 0}</TableCell>
                                  {/* Số lượng thùng giao đến */}
                                  <TableCell className="text-center text-xs">
                                    <div className="flex flex-col items-center">
                                      <input
                                        type="number"
                                        className={`w-20 h-8 px-2 rounded border text-center text-xs focus:outline-none focus:border-blue-500 ${validationErrors[detailId] ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                        value={detail.deliveredPackageQuantity === '' || detail.deliveredPackageQuantity === null || detail.deliveredPackageQuantity === undefined ? '' : detail.deliveredPackageQuantity}
                                        min={0}
                                        onChange={e => {
                                          const value = e.target.value;
                                          const numValue = value === '' ? 0 : Math.max(0, Number(value));
                                          const updatedDetail = {
                                            ...detail,
                                            deliveredPackageQuantity: value === '' ? '' : numValue
                                          };

                                          setGoodsReceiptNote(prev => ({
                                            ...prev,
                                            goodsReceiptNoteDetails: prev.goodsReceiptNoteDetails.map((d) =>
                                              d.goodsReceiptNoteDetailId === detail.goodsReceiptNoteDetailId ? updatedDetail : d
                                            )
                                          }));

                                          // Validate sau khi update
                                          const currentReject = Number(detail.rejectPackageQuantity) || 0;
                                          const currentExpected = expectedPackageQuantity;
                                          const error = validateRejectQuantity(numValue, currentReject, currentExpected);
                                          setValidationErrors(prev => ({
                                            ...prev,
                                            [detailId]: error
                                          }));
                                        }}
                                        onBlur={e => {
                                          const value = e.target.value;
                                          const numValue = value === '' ? 0 : Number(value) || 0;

                                          if (value === '') {
                                            setGoodsReceiptNote(prev => ({
                                              ...prev,
                                              goodsReceiptNoteDetails: prev.goodsReceiptNoteDetails.map((d) =>
                                                d.goodsReceiptNoteDetailId === detail.goodsReceiptNoteDetailId ? { ...d, deliveredPackageQuantity: 0 } : d
                                              )
                                            }));
                                          }

                                          // Validate reject quantity sau khi update delivered
                                          const currentReject = Number(detail.rejectPackageQuantity) || 0;
                                          const currentExpected = expectedPackageQuantity;
                                          const error = validateRejectQuantity(numValue, currentReject, currentExpected);
                                          setValidationErrors(prev => ({
                                            ...prev,
                                            [detailId]: error
                                          }));
                                        }}
                                      />
                                    </div>
                                  </TableCell>
                                  {/* Số lượng thùng trả lại */}
                                  <TableCell className="text-center text-xs">
                                    <div className="flex flex-col items-center">
                                      <input
                                        type="number"
                                        className={`w-20 h-8 px-2 rounded border text-center text-xs focus:outline-none focus:border-blue-500 ${validationErrors[detailId] ? 'border-red-500' : 'border-gray-300'
                                          }`}
                                        value={detail.rejectPackageQuantity === '' || detail.rejectPackageQuantity === null || detail.rejectPackageQuantity === undefined ? '' : detail.rejectPackageQuantity}
                                        min={0}
                                        onChange={e => {
                                          const value = e.target.value;
                                          const numValue = value === '' ? 0 : Math.max(0, Number(value));

                                          setGoodsReceiptNote(prev => ({
                                            ...prev,
                                            goodsReceiptNoteDetails: prev.goodsReceiptNoteDetails.map((d) =>
                                              d.goodsReceiptNoteDetailId === detail.goodsReceiptNoteDetailId ? { ...d, rejectPackageQuantity: value === '' ? '' : numValue } : d
                                            )
                                          }));

                                          // Validate
                                          const currentDelivered = Number(detail.deliveredPackageQuantity) || 0;
                                          const currentExpected = expectedPackageQuantity;
                                          const error = validateRejectQuantity(currentDelivered, numValue, currentExpected);
                                          setValidationErrors(prev => ({
                                            ...prev,
                                            [detailId]: error
                                          }));
                                        }}
                                        onBlur={e => {
                                          const value = e.target.value;
                                          const numValue = value === '' ? 0 : Number(value) || 0;

                                          if (value === '') {
                                            setGoodsReceiptNote(prev => ({
                                              ...prev,
                                              goodsReceiptNoteDetails: prev.goodsReceiptNoteDetails.map((d) =>
                                                d.goodsReceiptNoteDetailId === detail.goodsReceiptNoteDetailId ? { ...d, rejectPackageQuantity: 0 } : d
                                              )
                                            }));
                                          }

                                          // Validate
                                          const currentDelivered = Number(detail.deliveredPackageQuantity) || 0;
                                          const currentExpected = expectedPackageQuantity;
                                          const error = validateRejectQuantity(currentDelivered, numValue, currentExpected);
                                          setValidationErrors(prev => ({
                                            ...prev,
                                            [detailId]: error
                                          }));
                                        }}
                                      />
                                    </div>
                                  </TableCell>
                                  {/* Số lượng thùng thực nhận */}
                                  <TableCell className="text-center text-xs">
                                    <input
                                      type="number"
                                      className="w-20 h-8 px-2 rounded border border-gray-300 text-center text-xs focus:outline-none focus:border-blue-500 bg-gray-50 text-blue-700 font-semibold"
                                      value={actualPackageQuantity}
                                      readOnly
                                      disabled
                                    />
                                  </TableCell>
                                  <TableCell className="text-gray-600">
                                    <input type="text" className="w-32 h-8 px-2 rounded border border-gray-300 text-xs focus:outline-none focus:border-blue-500"
                                      value={detail.note || ''}
                                      onChange={e => {
                                        const value = e.target.value;
                                        setGoodsReceiptNote(prev => ({
                                          ...prev,
                                          goodsReceiptNoteDetails: prev.goodsReceiptNoteDetails.map((d) =>
                                            d.goodsReceiptNoteDetailId === detail.goodsReceiptNoteDetailId ? { ...d, note: value } : d
                                          )
                                        }));
                                      }}
                                    />
                                  </TableCell>
                                  {/* Cột trạng thái */}
                                  <TableCell className="text-center min-w-[110px]">
                                    {(() => {
                                      const meta = getReceiptItemStatusMeta(detail.status); return (
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium break-words ${meta.color}`}>{meta.label}</span>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_CHECK) && !hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) && !hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT) && (
                                      <Button
                                        size="sm"
                                        className="bg-green-600 text-white hover:bg-green-700 h-[38px] mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!!validationErrors[detailId]}
                                        onClick={async () => {
                                          // Validate trước khi submit
                                          const error = validateRejectQuantity(
                                            Number(detail.deliveredPackageQuantity) || 0,
                                            Number(detail.rejectPackageQuantity) || 0,
                                            expectedPackageQuantity
                                          );

                                          if (error) {
                                            window.showToast?.(error, "error");
                                            return;
                                          }

                                          try {
                                            await verifyRecord({
                                              goodsReceiptNoteDetailId: detail.goodsReceiptNoteDetailId,
                                              deliveredPackageQuantity: Number(detail.deliveredPackageQuantity) || 0,
                                              rejectPackageQuantity: Number(detail.rejectPackageQuantity) || 0,
                                              note: detail.note || ''
                                            });
                                            setValidationErrors(prev => {
                                              const newErrors = { ...prev };
                                              delete newErrors[detailId];
                                              return newErrors;
                                            });
                                            fetchGoodsReceiptNoteDetail();
                                          } catch (error) {
                                            console.error("Error verifying record:", error);
                                            const msg = extractErrorMessage(error, "Kiểm nhập thất bại, vui lòng thử lại!");
                                            window.showToast?.(msg, "error");
                                          }
                                        }}
                                      >
                                        Kiểm nhập
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                                {validationErrors[detailId] && (
                                  <TableRow key={`${index}-validation-error`}>
                                    <TableCell colSpan={11} className="py-2">
                                      <div className="text-red-600 text-xs italic">
                                        {validationErrors[detailId]}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                                {detail.rejectionReason && (
                                  <TableRow key={`${index}-rej`}>
                                    <TableCell colSpan={11} className="py-2">
                                      <div className="text-red-600 text-xs italic">
                                        Lý do từ chối: {detail.rejectionReason}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </>
                  )}

                  {/* TABLE 2: ĐÃ KIỂM TRA (status==2, 3, 4) */}
                  {/* Nhân viên kho: luôn thấy bảng này để có thể kiểm nhập lại
                      Quản lý kho: thấy khi đơn đã được nộp (PendingApproval/Completed) HOẶC có item đang chờ duyệt/hoàn thành (để từ chối) */}
                  {(() => {
                    const isWarehouseManager = hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT);
                    
                    // Nhân viên kho: luôn hiển thị để có thể xem và kiểm nhập lại
                    if (!isWarehouseManager) {
                      return true;
                    }
                    
                    // Quản lý kho: hiển thị nếu:
                    // 1. Status GRN là PendingApproval hoặc Completed (đã nộp đơn)
                    // 2. HOẶC có item đang ở trạng thái PendingApproval hoặc Completed (để có thể tiếp tục từ chối)
                    const isPendingOrCompleted = goodsReceiptNote.status === GOODS_RECEIPT_NOTE_STATUS.PendingApproval || goodsReceiptNote.status === GOODS_RECEIPT_NOTE_STATUS.Completed;
                    const hasPendingOrCompletedItems = checkedDetails.some(d => d.status === RECEIPT_ITEM_STATUS.PendingApproval || d.status === RECEIPT_ITEM_STATUS.Completed);
                    
                    return isPendingOrCompleted || hasPendingOrCompletedItems;
                  })() ? (
                    <>
                      <h2 className="text-lg font-semibold text-green-700 mt-10 mb-3">Đã kiểm nhập</h2>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-100">
                            <TableHead className="font-semibold text-green-900">Mã hàng</TableHead>
                            <TableHead className="font-semibold text-green-900">Tên hàng</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Đơn vị tính</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Quy cách đóng gói</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Số lượng thùng dự kiến</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Số lượng thùng giao đến</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Số lượng thùng trả lại</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Số lượng thùng thực nhận</TableHead>
                            <TableHead className="font-semibold text-green-900">Ghi chú</TableHead>
                            <TableHead className="font-semibold text-green-900 text-center">Trạng thái</TableHead>
                            {(hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT) || checkedDetails.some(d => d.status === RECEIPT_ITEM_STATUS.Inspected)) && goodsReceiptNote.status !== GOODS_RECEIPT_NOTE_STATUS.Completed && (
                              <TableHead className="font-semibold text-green-900 text-center">Hành động</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {checkedDetails.length === 0 ? (
                            <TableRow>
                              <TableCell 
                                colSpan={
                                  ((hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT)) && goodsReceiptNote.status !== GOODS_RECEIPT_NOTE_STATUS.Completed) 
                                    ? 12 
                                    : 11
                                } 
                                className="text-center text-green-500 py-8"
                              >
                                Chưa có mặt hàng đã kiểm nhập
                              </TableCell>
                            </TableRow>
                          ) : checkedDetails.map((detail, idx) => (
                            <TableRow key={idx} className="hover:bg-green-50">
                              <TableCell className="font-medium text-green-800 text-xs">{detail.goodsCode}</TableCell>
                              <TableCell className="text-xs text-green-700">{detail.goodsName}</TableCell>
                              <TableCell className="text-xs text-green-700 text-center">{detail.unitMeasureName}</TableCell>
                              <TableCell className="text-xs text-green-700 text-center">{detail.unitPerPackage ? `${detail.unitPerPackage}${detail.unitMeasureName ? ' ' + detail.unitMeasureName : ''}/thùng` : '-'}</TableCell>
                              <TableCell className="text-center text-xs">{detail.expectedPackageQuantity}</TableCell>
                              <TableCell className="text-center text-xs">{detail.deliveredPackageQuantity}</TableCell>
                              <TableCell className="text-center text-xs">{detail.rejectPackageQuantity}</TableCell>
                              <TableCell className="text-center text-xs">{Math.max(0, detail.actualPackageQuantity || 0)}</TableCell>
                              <TableCell className="text-green-700">{detail.note || ''}</TableCell>
                              {/* Cột trạng thái */}
                              <TableCell className="text-center min-w-[110px]">
                                {(() => {
                                  const meta = getReceiptItemStatusMeta(detail.status); return (
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium break-words ${meta.color}`}>{meta.label}</span>
                                  );
                                })()}
                              </TableCell>
                              {(hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT) || checkedDetails.some(d => d.status === RECEIPT_ITEM_STATUS.Inspected)) && goodsReceiptNote.status !== GOODS_RECEIPT_NOTE_STATUS.Completed && (
                                <TableCell className="text-center">
                                  <div className="inline-flex items-center gap-2">
                                    {detail.status === RECEIPT_ITEM_STATUS.Inspected && hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_CANCEL) && (
                                      <Button size="sm" className="bg-yellow-500 text-white hover:bg-yellow-600 h-[30px] rounded" onClick={async () => {
                                        try {
                                          await cancelGoodsReceiptNoteDetail(detail.goodsReceiptNoteDetailId);
                                          fetchGoodsReceiptNoteDetail();
                                        } catch (error) {
                                          console.error("Error canceling goods receipt note detail:", error);
                                          const msg = extractErrorMessage(error, "Kiểm nhập lại thất bại, vui lòng thử lại!");
                                          window.showToast?.(msg, "error");
                                        }
                                      }}>Kiểm nhập lại</Button>
                                    )}
                                    {hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT) && (
                                      <Button onClick={() => openRejectModal(detail.goodsReceiptNoteDetailId)} className="h-[38px] px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all">Từ chối</Button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mr-6">
                  {hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_COMPLETE_RECEIVING) && (
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 h-[38px]"
                      disabled={goodsReceiptNote.status === GOODS_RECEIPT_NOTE_STATUS.PendingApproval || goodsReceiptNote.status === GOODS_RECEIPT_NOTE_STATUS.Completed}
                      onClick={handleCompleteReceiving}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Nộp Đơn Kiểm Nhập
                    </Button>
                  )}
                  {hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) && (
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        goodsReceiptNote.status === GOODS_RECEIPT_NOTE_STATUS.Completed || 
                        checkedDetails.length === 0 ||
                        goodsReceiptNote.status !== GOODS_RECEIPT_NOTE_STATUS.PendingApproval
                      }
                      onClick={async () => {
                        try {
                          await approveGoodsReceiptNote(goodsReceiptNote.goodsReceiptNoteId);
                          window.showToast?.("Duyệt đơn kiểm nhập thành công!", "success");
                          fetchGoodsReceiptNoteDetail();
                        } catch (error) {
                          const msg = extractErrorMessage(error, "Duyệt đơn kiểm nhập thất bại, vui lòng thử lại!");
                          window.showToast?.(msg, "error");
                        }
                      }}
                    >
                      Duyệt Đơn Kiểm Nhập
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pallet - Ẩn cho quản lý kho */}
        {!(hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT)) && (
        <Card className="bg-gray-50 border border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div
              className="p-6 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('pallet')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Plus className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Kệ kê hàng</h2>
                  <p className="text-sm text-gray-500">Quản lý kệ kê hàng và lô hàng</p>
                </div>
              </div>
              {expandedSections.pallet ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {/* Luôn render PalletManager để giữ state, chỉ ẩn/hiện bằng CSS */}
            <div className={`p-6 space-y-6 ${expandedSections.pallet ? '' : 'hidden'}`}>
              <div className="flex gap-3">
                {/* Ẩn nút "Thêm Lô Mới" cho nhân viên kho khi đã tạo pallet */}
                {!(hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_CHECK) && !hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) && !hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT) && palletCreated) && (
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 h-[38px] flex items-center gap-2" onClick={() => setShowCreateBatchModal(true)}>
                    <Plus className="w-4 h-4 mr-3" />
                    Thêm Lô Mới
                  </Button>
                )}
              </div>

              <PalletManager
                goodsReceiptNoteId={goodsReceiptNote?.goodsReceiptNoteId}
                goodsReceiptNoteDetails={goodsReceiptNote?.goodsReceiptNoteDetails || []}
                onRegisterSubmit={handleRegisterSubmit}
                onPalletCreated={handlePalletCreated}
                hasExistingPallets={pallets.length > 0}
                onSubmittingChange={handleSubmittingChange}
                onBatchCreated={handleBatchCreated}
              />

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  {!palletCreated && (
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 h-[38px]"
                      onClick={() => submitPalletsFn && submitPalletsFn()}
                      disabled={!submitPalletsFn || isSubmittingPallet}
                    >
                      {isSubmittingPallet ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Đang tạo kệ kê hàng...
                        </>
                      ) : (
                        "Tạo kệ kê hàng"
                      )}
                    </Button>
                  )}
                  {palletCreated && (
                    <Button
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 h-[38px]"
                      onClick={handleCompleteArranging}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tiếp Tục Đến Sắp Xếp
                    </Button>
                  )}
                </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Sắp xếp - Hiển thị cho nhân viên kho hoặc quản lý kho (khi đã có pallet và phiếu đã được duyệt) */}
        {(() => {
          const isWarehouseManager = hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT);
          
          // Nhân viên kho: luôn hiển thị
          if (!isWarehouseManager) {
            return true;
          }
          
          // Quản lý kho: chỉ hiển thị khi đã có pallet VÀ phiếu đã được duyệt (Completed)
          const hasPallets = pallets.length > 0;
          const isApproved = goodsReceiptNote?.status === GOODS_RECEIPT_NOTE_STATUS.Completed;
          
          return hasPallets && isApproved;
        })() && (
        <Card ref={arrangingSectionRef} className="bg-gray-50 border border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div
              className="p-6 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('arranging')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sắp xếp</h2>
                  <p className="text-sm text-gray-500">Sắp xếp hàng hóa trong kho</p>
                </div>
              </div>
              {expandedSections.arranging ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>

            {expandedSections.arranging && (
              <div className="p-6 space-y-6">
                {pallets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <RefreshCw className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có pallet nào</h3>
                        <p className="text-gray-500">Hãy thêm pallet ở bước trước để tiếp tục sắp xếp.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Danh sách pallet</h3>
                      {/* Nút in đã chọn */}
                      {hasPermission(PERMISSIONS.PALLET_PRINT_BARCODE) && selectedPallets.length > 0 && (
                        <div className="flex items-center gap-3">
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 h-[38px] px-6 text-white transition-colors duration-200"
                            onClick={handlePrintSelected}
                          >
                            <Printer className="mr-2 h-4 w-4 text-white" />
                            In đã chọn ({selectedPallets.length})
                          </Button>
                          <Button
                            className="bg-slate-800 hover:bg-slate-900 h-[38px] px-6 text-white transition-colors duration-200"
                            onClick={() => {
                              setSelectedPallets([]);
                              setSelectAll(false);
                            }}
                          >
                            Bỏ chọn tất cả
                          </Button>
                        </div>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-purple-100">
                          {hasPermission(PERMISSIONS.PALLET_PRINT_BARCODE) && (
                            <TableHead className="font-semibold text-purple-900 text-center w-12">
                              <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                            </TableHead>
                          )}
                          <TableHead className="font-semibold text-purple-900">Mã pallet</TableHead>
                          <TableHead className="font-semibold text-purple-900">Tên sản phẩm</TableHead>
                          <TableHead className="font-semibold text-purple-900">Mã hàng</TableHead>
                          <TableHead className="font-semibold text-purple-900 text-center">Số lô</TableHead>
                          <TableHead className="font-semibold text-purple-900 text-center">Số thùng</TableHead>
                          <TableHead className="font-semibold text-purple-900">Vị trí</TableHead>
                          <TableHead className="font-semibold text-purple-900 text-center">Trạng thái</TableHead>
                          <TableHead className="font-semibold text-purple-900 text-center">Hoạt động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pallets.map((pallet, index) => {
                          // Lấy locationCode từ pallet
                          const locationCode = pallet.locationCode ? String(pallet.locationCode).trim() : '';
                          // Chỉ hiển thị nút Add khi chưa có locationCode (chưa được gán vị trí)
                          const isEmptyLocation = !locationCode || locationCode === '';

                          // Hàm hiển thị trạng thái
                          const getStatusDisplay = (status) => {
                            if (status === 1 || status === '1') {
                              return {
                                label: 'Đã được sắp xếp',
                                className: 'bg-green-100 text-green-800'
                              };
                            } else if (status === 2 || status === '2') {
                              return {
                                label: 'Chưa được sắp xếp',
                                className: 'bg-yellow-100 text-yellow-800'
                              };
                            } else {
                              return {
                                label: 'Đang xử lý',
                                className: 'bg-blue-100 text-blue-800'
                              };
                            }
                          };

                          const statusDisplay = getStatusDisplay(pallet.status);

                          return (
                            <TableRow key={pallet.palletId || pallet.id || index} className="hover:bg-purple-50">
                              {hasPermission(PERMISSIONS.PALLET_PRINT_BARCODE) && (
                                <TableCell className="px-6 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isPalletSelected(pallet)}
                                    onChange={(e) => handleSelectPallet(pallet, e.target.checked)}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                </TableCell>
                              )}
                              <TableCell className="font-medium text-gray-900 text-xs">
                                {pallet.palletCode || pallet.code || pallet.palletId || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">
                                {pallet.goodName || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">
                                {pallet.goodCode || pallet.goodsCode || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700 text-center">
                                {pallet.batchCode || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700 text-center">
                                {pallet.packageQuantity || pallet.numPackages || 0}
                              </TableCell>
                              <TableCell className="text-xs text-gray-700">
                                {locationCode || 'Chưa đưa vào vị trí'}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
                                  {statusDisplay.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {isEmptyLocation && !(hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT)) && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-yellow-50"
                                        onClick={() => handleOpenLocationSuggestion(pallet)}
                                        title="Gợi ý vị trí"
                                      >
                                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-red-50"
                                        onClick={() => {
                                          setSelectedPalletForLocation(pallet);
                                          setShowAddLocationModal(true);
                                        }}
                                        title="Thêm vị trí"
                                      >
                                        <Plus className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                  {hasPermission(PERMISSIONS.PALLET_PRINT_BARCODE) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-50"
                                      onClick={() => handlePrintPallet(pallet)}
                                      title="In mã pallet"
                                    >
                                      <Printer className="w-4 h-4 text-blue-600" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  {(() => {
                    // Ẩn nút "Hoàn Thành" cho quản lý kho, chỉ hiển thị cho nhân viên kho
                    const isWarehouseManager = hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_APPROVE) || hasPermission(PERMISSIONS.GOODS_RECEIPT_NOTE_DETAIL_REJECT);
                    if (isWarehouseManager) {
                      return null;
                    }

                    // Kiểm tra xem tất cả pallet đã có locationCode chưa
                    const allPalletsHaveLocation = pallets.length > 0 && pallets.every(pallet => {
                      const locationCode = pallet.locationCode ? String(pallet.locationCode).trim() : '';
                      return locationCode && locationCode !== '';
                    });

                    // Disable nút nếu Purchase Order đã hoàn thành (status = 9 - Đã nhập kho) hoặc chưa đủ điều kiện
                    const isDisabled = isPurchaseOrderCompleted || !allPalletsHaveLocation || pallets.length === 0;

                    return (
                      <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDisabled}
                        onClick={handleCompletePurchaseOrder}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hoàn Thành
                      </Button>
                    );
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
      {/* Modal nhập lý do từ chối */}
      <RejectReasonModal
        isOpen={showRejectModal}
        reason={rejectReason}
        setReason={setRejectReason}
        onCancel={closeRejectModal}
        onConfirm={submitReject}
      />
      {/* Modal tạo lô mới */}
      <CreateBatchModal
        isOpen={showCreateBatchModal}
        onClose={() => setShowCreateBatchModal(false)}
        onSuccess={() => {
          setShowCreateBatchModal(false);
          // Chỉ refresh batch options trong PalletManager, không reload toàn bộ component
          if (handleBatchCreatedRef.current) {
            handleBatchCreatedRef.current();
          }
        }}
      />
      {/* Modal gợi ý vị trí */}
      <LocationSuggestionModal
        isOpen={showLocationSuggestionModal}
        onClose={() => {
          setShowLocationSuggestionModal(false);
          setSelectedPalletForSuggestion(null);
          setLocationSuggestions([]);
        }}
        onSelectLocation={handleSelectSuggestedLocation}
        suggestions={locationSuggestions}
        loading={loadingSuggestions}
        palletInfo={selectedPalletForSuggestion}
      />
      {/* Modal thêm vị trí cho pallet */}
      <AddLocationToPalletModal
        isOpen={showAddLocationModal}
        onClose={() => {
          setShowAddLocationModal(false);
          setSelectedPalletForLocation(null);
        }}
        onSuccess={handleLocationAdded}
        pallet={selectedPalletForLocation}
      />
      {/* Modal Preview In */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Xem trước barcode ({selectedPallets.length} kệ kê hàng)
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PrintableMultiplePalletLabels pallets={selectedPallets} />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                In ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vùng in phiếu - căn giữa khi in */}
      <div className="print-wrapper" style={{ display: 'none' }}>
        <div ref={printRef} className="print-container">
          {selectedPallets.length > 1 ? (
            <PrintableMultiplePalletLabels pallets={selectedPallets} />
          ) : selectedPallets.length === 1 ? (
            <PrintablePalletLabel pallet={selectedPallets[0]} />
          ) : selectedPalletForPrint ? (
            <PrintablePalletLabel pallet={selectedPalletForPrint} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
