import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Printer
} from "lucide-react";
import Loading from "../../components/Common/Loading";
import { getGoodsReceiptNoteByPurchaseOrderId, completeReceiving, completeArranging } from "../../services/GoodsReceiptService";
import { PERMISSIONS } from "../../utils/permissions";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionWrapper from "../../components/Common/PermissionWrapper";

// Status labels for Goods Receipt Note
const GOODS_RECEIPT_STATUS_LABELS = {
    1: { label: "Đang kiểm nhập", color: "bg-blue-100 text-blue-800" },
    2: { label: "Đã kiểm nhập", color: "bg-green-100 text-green-800" },
    3: { label: "Đã sắp xếp", color: "bg-purple-100 text-purple-800" },
    4: { label: "Hoàn thành", color: "bg-gray-100 text-gray-800" }
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


  useEffect(() => {
    fetchGoodsReceiptNoteDetail();
  }, [id]);

  const fetchGoodsReceiptNoteDetail = async () => {
    setLoading(true);
    try {
      // id trong URL là purchaseOrderId
      const response = await getGoodsReceiptNoteByPurchaseOrderId(id);
      if (response && response.data) {
        setGoodsReceiptNote(response.data);
      } else {
        setGoodsReceiptNote(null);
      }
    } catch (error) {
      console.error("Error fetching goods receipt note detail:", error);
      setGoodsReceiptNote(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCompleteReceiving = async () => {
    if (!goodsReceiptNote?.goodsReceiptNoteId) return;
    try {
      await completeReceiving(goodsReceiptNote.goodsReceiptNoteId, "Hoàn thành kiểm nhập");
      // Refresh data
      fetchGoodsReceiptNoteDetail();
    } catch (error) {
      console.error("Error completing receiving:", error);
    }
  };

  const handleCompleteArranging = async () => {
    if (!goodsReceiptNote?.goodsReceiptNoteId) return;
    try {
      await completeArranging(goodsReceiptNote.goodsReceiptNoteId, "Hoàn thành sắp xếp");
      // Refresh data
      fetchGoodsReceiptNoteDetail();
    } catch (error) {
      console.error("Error completing arranging:", error);
    }
  };

  const handlePrintReceipt = () => {
    // Implement print functionality
    window.print();
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết phiếu nhập kho</h1>
          <p className="text-gray-600">Mã phiếu: {goodsReceiptNote.goodsReceiptNoteId}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/goods-receipt-notes')}
          >
            Quay lại
          </Button>
        </div>
      </div>

      {/* Chi tiết đơn hàng */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('orderDetails')}
          >
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng</h2>
            {expandedSections.orderDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.orderDetails && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Trạng thái:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${GOODS_RECEIPT_STATUS_LABELS[goodsReceiptNote.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {GOODS_RECEIPT_STATUS_LABELS[goodsReceiptNote.status]?.label || 'Không xác định'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Mã đơn nhập:</span>
                  <span className="ml-2 text-gray-900">{goodsReceiptNote.purchaseOderId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Người xác nhận:</span>
                  <span className="ml-2 text-gray-900">{goodsReceiptNote.approvalByName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Người tạo:</span>
                  <span className="ml-2 text-gray-900">{goodsReceiptNote.createdByName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Ngày tạo:</span>
                  <span className="ml-2 text-gray-900">
                    {goodsReceiptNote.createdAt ? new Date(goodsReceiptNote.createdAt).toLocaleString('vi-VN') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Ngày cập nhật:</span>
                  <span className="ml-2 text-gray-900">
                    {goodsReceiptNote.updatedAt ? new Date(goodsReceiptNote.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Đã Đến
                </Button>
                <Button onClick={handlePrintReceipt}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Mặt hàng:</span>
                <div className="mt-2 space-y-1">
                  {goodsReceiptNote.goodsReceiptNoteDetails?.map((detail, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      <span className="text-gray-900">
                        Goods ID {detail.goodsId}: {detail.actualPackageQuantity} (Dự kiến: {detail.expectedPackageQuantity}, Nhận: {detail.deliveredPackageQuantity}, Loại bỏ: {detail.rejectPackageQuantity})
                      </span>
                    </div>
                  )) || <span className="text-gray-500">Không có dữ liệu</span>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kiểm nhập */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('receiving')}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Kiểm nhập</h2>
            </div>
            {expandedSections.receiving ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.receiving && (
            <div className="p-4 space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã hàng</TableHead>
                      <TableHead>Dự kiến</TableHead>
                      <TableHead>Đã nhận</TableHead>
                      <TableHead>Thực nhập</TableHead>
                      <TableHead>Số loại bỏ</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goodsReceiptNote.goodsReceiptNoteDetails && goodsReceiptNote.goodsReceiptNoteDetails.length > 0 ? (
                      goodsReceiptNote.goodsReceiptNoteDetails.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.goodsId}</TableCell>
                          <TableCell>{detail.expectedPackageQuantity || 0}</TableCell>
                          <TableCell>{detail.deliveredPackageQuantity || 0}</TableCell>
                          <TableCell>{detail.actualPackageQuantity || 0}</TableCell>
                          <TableCell>{detail.rejectPackageQuantity || 0}</TableCell>
                          <TableCell>{detail.note || '-'}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" disabled>
                  Hoàn Thành Kiểm Nhập
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pallet */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('pallet')}
          >
            <h2 className="text-lg font-semibold text-gray-900">Pallet</h2>
            {expandedSections.pallet ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.pallet && (
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Lô Mới
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Pallet
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Bạn phải thêm ít nhất một dòng pallet.</span>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" disabled>
                  Tiếp Tục Đến Sắp Xếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sắp xếp */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('arranging')}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Sắp xếp</h2>
            </div>
            {expandedSections.arranging ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.arranging && (
            <div className="p-4 space-y-4">
              <div className="text-center text-gray-500 py-8">
                Chưa có pallet nào.
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" disabled>
                  Hoàn Thành
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
