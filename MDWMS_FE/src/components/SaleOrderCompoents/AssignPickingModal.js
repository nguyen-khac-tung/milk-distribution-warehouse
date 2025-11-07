import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { getAvailablePickersDropdown } from "../../services/AccountService";

const AssignPickingModal = ({
  isOpen,
  onClose,
  onConfirm,
  saleOrder,
  loading = false,
}) => {
  const [assignTo, setAssignTo] = useState("");
  const [warehouseStaff, setWarehouseStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (isOpen) fetchWarehouseStaff();
  }, [isOpen]);

  const fetchWarehouseStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await getAvailablePickersDropdown(
        saleOrder?.salesOrderId
      );
      if (response?.data) setWarehouseStaff(response.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleConfirm = () => {
    if (!assignTo) return alert("Vui lòng chọn nhân viên kho");
    onConfirm(assignTo);
  };

  const handleClose = () => {
    setAssignTo("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Phân công lấy hàng
              </h3>
              <p className="text-sm text-gray-500">
                Chọn nhân viên để phân công lấy hàng
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
            {/* Left Column - Sale Order Info (narrow) */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-gray-900">Thông tin đơn hàng</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-medium">{saleOrder?.salesOrderId || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nhà bán lẻ:</span>
                    <span className="font-medium">{saleOrder?.retailerName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dự kiến xuất:</span>
                    <span className="font-medium">
                      {saleOrder?.estimatedTimeDeparture
                        ? new Date(saleOrder.estimatedTimeDeparture).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Previous Assignment Info */}
              {saleOrder?.assignTo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-800 mb-1">
                        Phiếu này đã được phân công cho:
                      </h4>

                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Nhân viên chịu trách nhiệm:</span>
                          <span className="font-semibold text-gray-900">
                            {saleOrder.assignTo.fullName}
                          </span>
                        </div>

                        {saleOrder.acknowledgeAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Thời gian phân công:</span>
                            <span className="font-semibold text-gray-900">
                              {saleOrder?.acknowledgeAt
                                ? new Date(saleOrder.acknowledgeAt).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Warning Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">
                      Phân công lấy hàng
                    </h4>
                    <p className="text-sm text-blue-700">
                      Nhân viên được chọn sẽ nhận thông báo về phân công lấy hàng này.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Employee List (wider) */}
            <div className="space-y-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn nhân viên kho <span className="text-red-500">*</span>
              </label>

              {loadingStaff ? (
                <div className="text-center py-4 text-gray-500">Đang tải danh sách nhân viên...</div>
              ) : warehouseStaff.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Không có nhân viên khả dụng.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[386px] overflow-y-auto pr-1">
                  {warehouseStaff.map((staff) => {
                    const isSelected = assignTo === staff.userId;
                    const pendingPO = staff.pendingPurchaseOrders ?? 0;
                    const processingPO = staff.processingPurchaseOrders ?? 0;
                    const pendingSO = staff.pendingSalesOrders ?? 0;
                    const processingSO = staff.processingSalesOrders ?? 0;

                    return (
                      <div
                        key={staff.userId}
                        onClick={() => setAssignTo(staff.userId)}
                        className={`cursor-pointer border rounded-xl p-3 transition-all ${isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                          }`}
                      >
                        <div className="mb-1">
                          <h4 className="font-semibold text-gray-800">{staff.fullName}</h4>
                          <p className="text-sm text-gray-500">{staff.phone}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                          <div>
                            <span className="text-gray-500">Đơn mua đang chờ:</span>
                            <span className="font-medium ml-1">{pendingPO}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Đơn mua đang xử lý:</span>
                            <span className="font-medium ml-1">{processingPO}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Đơn bán đang chờ:</span>
                            <span className="font-medium ml-1">{pendingSO}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Đơn bán đang xử lý:</span>
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
              disabled={loading || !assignTo}
              className="h-[38px] px-8 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang phân công...
                </div>
              ) : (
                "Phân công lấy hàng"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPickingModal;
