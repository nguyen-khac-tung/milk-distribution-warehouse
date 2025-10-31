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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Phân công lấy hàng
              </h3>
              <p className="text-sm text-gray-500">
                Giao nhiệm vụ cho nhân viên kho
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Thông tin đơn hàng */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-800">
                Thông tin đơn hàng
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="font-medium">
                  {saleOrder?.salesOrderId || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nhà bán lẻ:</span>
                <span className="font-medium">
                  {saleOrder?.retailerName || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dự kiến xuất:</span>
                <span className="font-medium">
                  {saleOrder?.estimatedTimeDeparture
                    ? new Date(
                      saleOrder.estimatedTimeDeparture
                    ).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Danh sách nhân viên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chọn nhân viên kho <span className="text-red-500">*</span>
            </label>

            {loadingStaff ? (
              <div className="text-center py-4 text-gray-500">
                Đang tải danh sách nhân viên...
              </div>
            ) : warehouseStaff.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Không có nhân viên khả dụng.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
                {warehouseStaff.map((staff) => {
                  const isSelected = assignTo === staff.userId;

                  return (
                    <div
                      key={staff.userId}
                      onClick={() => setAssignTo(staff.userId)}
                      className={`cursor-pointer border rounded-xl p-4 transition-all ${isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                        }`}
                    >
                      <div className="mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {staff.fullName}
                        </h4>
                        <p className="text-sm text-gray-500">{staff.phone}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <span className="text-gray-500">
                            Đơn mua hàng đang chờ:
                          </span>
                          <span className="font-medium ml-1">
                            {staff.pendingPurchaseOrders}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Đơn mua hàng đang xử lý:
                          </span>
                          <span className="font-medium ml-1">
                            {staff.processingPurchaseOrders}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Đơn bán hàng đang chờ:
                          </span>
                          <span className="font-medium ml-1">
                            {staff.pendingSalesOrders}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Đơn bán hàng đang xử lý:
                          </span>
                          <span className="font-medium ml-1">
                            {staff.processingSalesOrders}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cảnh báo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">
                  Xác nhận phân công
                </h4>
                <p className="text-sm text-blue-700">
                  Sau khi xác nhận, nhân viên sẽ được thông báo để bắt đầu lấy hàng.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 p-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="h-[38px] px-8 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !assignTo}
            className="h-[38px] px-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang phân công...
              </div>
            ) : (
              "Xác nhận phân công"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignPickingModal;
