import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import FloatingDropdown from "../Common/FloatingDropdown";
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
      const response = await getAvailablePickersDropdown("Warehouse Staff");
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
      <div className="bg-white rounded-2xl shadow-lg max-w-xl w-full animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Đơn hàng */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-gray-800">Thông tin đơn hàng</span>
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
                    ? new Date(saleOrder.estimatedTimeDeparture).toLocaleDateString("vi-VN")
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Nhân viên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhân viên kho <span className="text-red-500">*</span>
            </label>

            <FloatingDropdown
              value={assignTo || undefined}
              onChange={(v) => setAssignTo(v)}
              placeholder="-- Chọn nhân viên kho --"
              loading={loadingStaff}
              disabled={loading}
              options={warehouseStaff.map((staff) => ({
                label: `${staff.fullName} (${staff.phone})`,
                value: staff.userId,
              }))}
            />
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

          {/* Buttons */}
          <div className="flex justify-center gap-4">
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
    </div>
  );
};

export default AssignPickingModal;
