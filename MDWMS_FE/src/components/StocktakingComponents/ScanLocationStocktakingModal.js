import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, AlertCircle } from "lucide-react";
import { getStocktakingPalletDetailByLocationCode } from "../../services/StocktakingService";
import { extractErrorMessage } from "../../utils/Validation";

export default function ScanLocationStocktakingModal({ isOpen, onClose, onSuccess, location, stocktakingLocationId, onLocationValidated }) {
  const [formData, setFormData] = useState({
    locationCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationValidated, setLocationValidated] = useState(false);
  const [validatedLocationData, setValidatedLocationData] = useState(null);
  const [error, setError] = useState("");
  const checkTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form khi mở modal - không tự động điền location code
      setFormData({
        locationCode: "",
      });
      setLocationValidated(false);
      setValidatedLocationData(null);
      setError("");
    }

    // Cleanup timeout khi unmount hoặc đóng modal
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleCheckLocationCode = async (locationCodeToCheck = null) => {
    // Sử dụng locationCodeToCheck nếu có (từ quét), nếu không thì dùng formData.locationCode
    const codeToCheck = locationCodeToCheck || formData.locationCode;

    // Đảm bảo codeToCheck là string và không rỗng
    if (!codeToCheck || typeof codeToCheck !== 'string') {
      setError("Vui lòng nhập mã vị trí");
      return;
    }

    const trimmedCode = codeToCheck.trim();
    if (!trimmedCode) {
      setError("Vui lòng nhập mã vị trí");
      return;
    }

    // Kiểm tra stocktakingLocationId
    const currentStocktakingLocationId = stocktakingLocationId || location?.stocktakingLocationId;
    if (!currentStocktakingLocationId) {
      const errorMsg = "Thiếu thông tin stocktakingLocationId";
      setError(errorMsg);
      return;
    }

    try {
      setCheckingLocation(true);
      setError("");

      // Gọi API mới với stocktakingLocationId và locationCode
      const response = await getStocktakingPalletDetailByLocationCode(currentStocktakingLocationId, trimmedCode);

      // Xử lý response
      const responseData = response?.data || response;

      if (responseData) {
        // Kiểm tra xem location code có khớp với location được chọn không
        const validatedCode = responseData.locationCode || trimmedCode;
        const expectedCode = location?.locationCode || "";

        if (expectedCode && validatedCode.toLowerCase() !== expectedCode.toLowerCase()) {
          setLocationValidated(false);
          setValidatedLocationData(null);
          const errorMsg = "Mã vị trí không khớp với vị trí được chọn";
          setError(errorMsg);
        } else {
          // Lưu thông tin location từ response
          const locationData = {
            locationCode: validatedCode,
            locationId: responseData.locationId,
            areaName: responseData.areaName,
            rack: responseData.rack,
            row: responseData.row,
            column: responseData.column,
            ...responseData
          };

          // Chuyển thẳng sang modal pallet ngay khi validate thành công
          if (onLocationValidated) {
            onLocationValidated({
              ...locationData,
              stocktakingLocationId: currentStocktakingLocationId
            });
          }
          onClose && onClose();
        }
      } else {
        setLocationValidated(false);
        setValidatedLocationData(null);
        const errorMsg = "Không tìm thấy thông tin vị trí";
        setError(errorMsg);
      }
    } catch (error) {
      console.error("Error checking location code:", error);
      setLocationValidated(false);
      setValidatedLocationData(null);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi kiểm tra mã vị trí");
      setError(errorMessage);
    } finally {
      setCheckingLocation(false);
    }
  };

  // Tự động kiểm tra mã vị trí khi quét (debounce 500ms sau khi người dùng ngừng nhập)
  const handleLocationCodeChange = (value) => {
    // Đảm bảo value là string (tránh lỗi khi nhận giá trị không hợp lệ)
    const stringValue = value != null ? String(value) : "";

    setFormData({ ...formData, locationCode: stringValue });
    setLocationValidated(false);
    setValidatedLocationData(null);
    setError("");

    // Clear timeout cũ nếu có
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }

    // Nếu có giá trị, tự động kiểm tra sau 500ms (để xử lý quét mã)
    if (stringValue && typeof stringValue === 'string' && stringValue.trim()) {
      checkTimeoutRef.current = setTimeout(() => {
        handleCheckLocationCode(stringValue); // Truyền giá trị trực tiếp
      }, 500);
    }
  };

  // Kiểm tra khi blur (khi người dùng rời khỏi input)
  const handleLocationCodeBlur = () => {
    const locationCode = formData.locationCode;
    if (locationCode && typeof locationCode === 'string' && locationCode.trim() && !locationValidated) {
      handleCheckLocationCode();
    }
  };


  const handleReset = () => {
    setFormData({
      locationCode: "",
    });
    setLocationValidated(false);
    setValidatedLocationData(null);
    setError("");
    onClose && onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 99999, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        // Đóng modal khi click vào backdrop
        if (e.target === e.currentTarget) {
          handleReset();
        }
      }}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-xl font-semibold text-slate-800">Quét mã vị trí kiểm kê</h1>
          <button
            onClick={handleReset}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Mã vị trí với nút Kiểm Tra */}
            <div className="flex flex-col gap-3">
              <Label htmlFor="locationCode" className="text-sm font-medium text-slate-700">
                Mã vị trí <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                <Input
                  id="locationCode"
                  placeholder="Quét mã vị trí hoặc nhập mã"
                  value={formData.locationCode}
                  onChange={(e) => handleLocationCodeChange(e.target.value)}
                  onBlur={handleLocationCodeBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formData.locationCode && formData.locationCode.trim()) {
                      handleCheckLocationCode();
                    }
                  }}
                  className="h-12 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg flex-1 text-base"
                  disabled={loading || checkingLocation}
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={() => handleCheckLocationCode()}
                  disabled={loading || checkingLocation || !(formData.locationCode && typeof formData.locationCode === 'string' && formData.locationCode.trim())}
                  className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {checkingLocation ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Đang kiểm tra...
                    </span>
                  ) : (
                    "Kiểm Tra"
                  )}
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1 px-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md transition-all"
                onClick={handleReset}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

