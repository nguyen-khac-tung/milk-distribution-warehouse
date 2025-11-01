import React, { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { validateLocationCode } from "../../services/LocationServices";
import { getAreaDropdown } from "../../services/AreaServices";
import { updatePallet } from "../../services/PalletService";
import { extractErrorMessage } from "../../utils/Validation";
import CustomDropdown from "../../components/Common/CustomDropdown";

export default function AddLocationToPalletModal({ isOpen, onClose, onSuccess, pallet }) {
  const [formData, setFormData] = useState({
    locationCode: "",
    areaId: "",
    rack: "",
    row: "",
    column: "",
  });

  const [loading, setLoading] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationValidated, setLocationValidated] = useState(false);
  const [validatedLocationData, setValidatedLocationData] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const checkTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form khi mở modal
      setFormData({
        locationCode: "",
        areaId: "",
        rack: "",
        row: "",
        column: "",
      });
      setLocationValidated(false);
      setValidatedLocationData(null);
      setError("");
      loadDropdownData();
    }

    // Cleanup timeout khi unmount hoặc đóng modal
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const areasRes = await getAreaDropdown({ pageNumber: 1, pageSize: 100 });
      const areasData = areasRes?.items || areasRes?.data?.items || areasRes?.data || [];
      setAreas(Array.isArray(areasData) ? areasData : []);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải danh sách khu vực");
      window.showToast?.(errorMessage, "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleCheckLocationCode = async (locationCodeToCheck = null) => {
    // Sử dụng locationCodeToCheck nếu có (từ quét), nếu không thì dùng formData.locationCode
    const codeToCheck = locationCodeToCheck || formData.locationCode;
    
    // Đảm bảo codeToCheck là string và không rỗng
    if (!codeToCheck || typeof codeToCheck !== 'string') {
      window.showToast?.("Vui lòng nhập mã vị trí", "error");
      return;
    }

    const trimmedCode = codeToCheck.trim();
    if (!trimmedCode) {
      window.showToast?.("Vui lòng nhập mã vị trí", "error");
      return;
    }

    try {
      setCheckingLocation(true);
      setError("");
      const result = await validateLocationCode(trimmedCode);
      
      if (result.success && result.data) {
        setLocationValidated(true);
        setValidatedLocationData(result.data);
        
        // Tự động điền thông tin từ location đã validate
        if (result.data && result.data.areaId) {
          setFormData(prev => ({
            ...prev,
            areaId: result.data.areaId != null ? String(result.data.areaId) : "",
            rack: result.data.rack != null ? String(result.data.rack) : "",
            row: result.data.row != null ? String(result.data.row) : "",
            column: result.data.column != null ? String(result.data.column) : "",
          }));
        }
        
        window.showToast?.("Mã vị trí hợp lệ", "success");
      } else {
        setLocationValidated(false);
        setValidatedLocationData(null);
        window.showToast?.(result.message || "Mã vị trí không tồn tại", "error");
      }
    } catch (error) {
      console.error("Error checking location code:", error);
      setLocationValidated(false);
      setValidatedLocationData(null);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi kiểm tra mã vị trí");
      setError(errorMessage);
      window.showToast?.(errorMessage, "error");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!locationValidated || !validatedLocationData) {
      window.showToast?.("Vui lòng kiểm tra mã vị trí trước", "error");
      return;
    }

    // Kiểm tra palletId - đảm bảo có palletId để gọi API
    const palletIdRaw = pallet?.palletId || pallet?.id;
    if (!palletIdRaw) {
      window.showToast?.("Thiếu thông tin pallet (palletId)", "error");
      console.error("Pallet data:", pallet);
      return;
    }
    
    // Convert palletId thành string (theo yêu cầu của API)
    const palletId = String(palletIdRaw);

    // Kiểm tra locationId từ validatedLocationData
    const locationId = validatedLocationData?.locationId;
    if (!locationId) {
      window.showToast?.("Thiếu thông tin vị trí (locationId)", "error");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Đảm bảo các giá trị được parse đúng cách
      const parsedLocationId = parseInt(locationId, 10);
      if (isNaN(parsedLocationId)) {
        window.showToast?.("Mã vị trí không hợp lệ", "error");
        return;
      }

      const parsedPackageQuantity = parseInt(pallet.packageQuantity || pallet.numPackages || 0, 10);
      const parsedGoodsPackingId = pallet.goodsPackingId || pallet.goodsPacking?.goodsPackingId;
      const parsedGoodsPackingIdInt = parsedGoodsPackingId != null ? parseInt(parsedGoodsPackingId, 10) : null;

      const payload = {
        batchId: pallet.batchId || pallet.batch?.batchId || "",
        locationId: parsedLocationId,
        packageQuantity: isNaN(parsedPackageQuantity) ? 0 : parsedPackageQuantity,
        goodsPackingId: (parsedGoodsPackingIdInt != null && !isNaN(parsedGoodsPackingIdInt)) ? parsedGoodsPackingIdInt : null,
        goodsReceiptNoteId: pallet.goodsReceiptNoteId || pallet.goodsReceiptNote?.goodsReceiptNoteId || "",
      };

      console.log("Updating pallet with:", { palletId, payload });
      const response = await updatePallet(palletId, payload);
      
      if (response?.success !== false) {
        window.showToast?.("Thêm vị trí cho pallet thành công!", "success");
        onSuccess && onSuccess();
        onClose && onClose();
      } else {
        const errorMsg = response?.message || "Có lỗi xảy ra khi thêm vị trí";
        window.showToast?.(errorMsg, "error");
        setError(errorMsg);
      }
    } catch (error) {
      console.error("Error adding location to pallet:", error);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi thêm vị trí cho pallet");
      window.showToast?.(errorMessage, "error");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      locationCode: "",
      areaId: "",
      rack: "",
      row: "",
      column: "",
    });
    setLocationValidated(false);
    setValidatedLocationData(null);
    setError("");
    onClose && onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-xl font-semibold text-slate-800">Thêm vị trí cho pallet</h1>
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Mã vị trí với nút Kiểm Tra */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="locationCode" className="text-sm font-medium text-slate-700">
                Mã vị trí <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                <Input
                  id="locationCode"
                  placeholder="Mã vị trí (quét mã hoặc nhập)"
                  value={formData.locationCode}
                  onChange={(e) => handleLocationCodeChange(e.target.value)}
                  onBlur={handleLocationCodeBlur}
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg flex-1"
                  disabled={loading || checkingLocation}
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={() => handleCheckLocationCode()}
                  disabled={loading || checkingLocation || !(formData.locationCode && typeof formData.locationCode === 'string' && formData.locationCode.trim())}
                  className="h-10 px-6 border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {checkingLocation ? "Đang kiểm tra..." : "Kiểm Tra"}
                </Button>
              </div>
              {locationValidated && validatedLocationData && (
                <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mã vị trí hợp lệ</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Khu vực */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="areaId" className="text-sm font-medium text-slate-700">
                Khu vực
              </Label>
              <CustomDropdown
                value={formData.areaId}
                onChange={(value) => setFormData({ ...formData, areaId: value })}
                options={[
                  { value: "", label: "Chọn khu vực..." },
                  ...areas.map((a) => ({
                    value: (a.areaId || a.id || "").toString(),
                    label: a.areaName || a.name || "",
                  })),
                ]}
                placeholder="Chọn khu vực..."
                loading={loadingData}
                disabled={loading || locationValidated}
              />
            </div>

            {/* Kệ, Hàng, Cột */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kệ */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="rack" className="text-sm font-medium text-slate-700">
                  Kệ
                </Label>
                <Input
                  id="rack"
                  placeholder="Kệ"
                  value={formData.rack}
                  onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  disabled={loading || locationValidated}
                />
              </div>

              {/* Hàng */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="row" className="text-sm font-medium text-slate-700">
                  Hàng
                </Label>
                <Input
                  id="row"
                  type="number"
                  min="1"
                  placeholder="Hàng"
                  value={formData.row}
                  onChange={(e) => setFormData({ ...formData, row: e.target.value })}
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  disabled={loading || locationValidated}
                />
              </div>

              {/* Cột */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="column" className="text-sm font-medium text-slate-700">
                  Cột
                </Label>
                <Input
                  id="column"
                  type="number"
                  min="1"
                  placeholder="Cột"
                  value={formData.column}
                  onChange={(e) => setFormData({ ...formData, column: e.target.value })}
                  className="h-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  disabled={loading || locationValidated}
                />
              </div>
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
              <Button
                type="submit"
                disabled={loading || !locationValidated || checkingLocation || loadingData}
                className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Đang thêm..." : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

