import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { X, Loader2, ChevronDown, Search } from 'lucide-react';
import { updatePallet } from '../../services/PalletService';
import { getBatchDropdown } from '../../services/BatchService';
import { validateLocationCode } from '../../services/LocationServices';
import { extractErrorMessage } from '../../utils/Validation';

const UpdatePalletModal = ({
  isOpen,
  onClose,
  pallet,
  goodsId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    batchCode: '',
    batchId: '',
    locationCode: '',
    locationId: '',
    packageQuantity: '',
    unitPerPackage: '',
    goodsPackingId: '',
    goodsReceiptNoteId: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [batchOptions, setBatchOptions] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [locationValidating, setLocationValidating] = useState(false);
  const [locationValidationResult, setLocationValidationResult] = useState(null);

  // Filter batch options based on search query
  const filteredBatchOptions = useMemo(() => {
    if (!batchSearchQuery) return batchOptions;
    const query = batchSearchQuery.toLowerCase().trim();
    return batchOptions.filter(batch => {
      const batchCode = (batch.batchCode || '').toLowerCase();
      return batchCode.includes(query);
    });
  }, [batchOptions, batchSearchQuery]);

  // Initialize form data when pallet changes
  useEffect(() => {
    if (pallet && isOpen) {
      setFormData({
        batchCode: pallet.batchCode || '',
        batchId: pallet.batchId || '',
        locationCode: pallet.locationCode || '',
        locationId: pallet.locationId || '',
        packageQuantity: pallet.packageQuantity || '',
        unitPerPackage: pallet.unitPerPackage || '',
        goodsPackingId: pallet.goodsPackingId || '',
        goodsReceiptNoteId: pallet.goodsReceiptNoteId || ''
      });
      setErrors({});
      setBatchSearchQuery('');

      // Load batch dropdown if goodsId exists
      if (goodsId) {
        loadBatchDropdown(goodsId);
      } else {
      }
    }
  }, [pallet, goodsId, isOpen]);

  // Load batch dropdown data
  const loadBatchDropdown = async (goodsId) => {
    try {
      setBatchLoading(true);
      const response = await getBatchDropdown(goodsId);
      // API trả về object có data property chứa array
      const batchData = response?.data || [];
      setBatchOptions(batchData);
    } catch (error) {
      console.error("Error loading batch dropdown:", error);
      setBatchOptions([]);
    } finally {
      setBatchLoading(false);
    }
  };

  // Validate location code
  const validateLocation = async (locationCode) => {
    if (!locationCode || locationCode.trim() === '') {
      setLocationValidationResult(null);
      return;
    }

    try {
      setLocationValidating(true);
      // Lấy palletId từ pallet prop
      const palletIdRaw = pallet?.palletId || pallet?.id;
      const palletId = palletIdRaw != null ? String(palletIdRaw) : "";
      const result = await validateLocationCode(locationCode, palletId);

      // Xử lý message qua extractErrorMessage
      const message = result.message || "";
      const processedMessage = message
        ? extractErrorMessage({ response: { data: { message } } }, message)
        : (result.success ? "Mã vị trí hợp lệ" : "Mã vị trí không tồn tại");

      // Lưu kết quả với message đã được xử lý
      setLocationValidationResult({
        ...result,
        message: processedMessage
      });

      if (result.success) {
        // Lưu locationId từ response
        setFormData(prev => ({
          ...prev,
          locationId: result.data?.locationId || ''
        }));
        // Không hiển thị toast, chỉ hiển thị message dưới input
      } else {
        // Không hiển thị toast, chỉ hiển thị message dưới input
      }
    } catch (error) {
      console.error("Error validating location:", error);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi kiểm tra mã vị trí");
      setLocationValidationResult({
        success: false,
        message: errorMessage
      });
      // Không hiển thị toast, chỉ hiển thị message dưới input
    } finally {
      setLocationValidating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Clear location validation result when user types
    if (field === 'locationCode') {
      setLocationValidationResult(null);
    }
  };

  // Handle batch selection
  const handleBatchSelect = (batch) => {
    setFormData(prev => ({
      ...prev,
      batchId: batch.batchId,
      batchCode: batch.batchCode
    }));
    setShowBatchDropdown(false);
    setBatchSearchQuery(''); // Clear search when selecting

    // Clear error when user selects
    if (errors.batchCode) {
      setErrors(prev => ({
        ...prev,
        batchCode: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batchCode || formData.batchCode === '') {
      newErrors.batchCode = 'Mã lô hàng là bắt buộc';
    }

    if (!formData.locationCode || formData.locationCode === '') {
      newErrors.locationCode = 'Mã vị trí là bắt buộc';
    }

    if (!formData.packageQuantity || formData.packageQuantity === '') {
      newErrors.packageQuantity = 'Số lượng thùng là bắt buộc';
    } else if (isNaN(formData.packageQuantity) || parseInt(formData.packageQuantity) <= 0) {
      newErrors.packageQuantity = 'Số lượng thùng phải là số dương';
    }

    if (!formData.unitPerPackage || formData.unitPerPackage === '') {
      newErrors.unitPerPackage = 'Đơn vị/thùng là bắt buộc';
    } else if (isNaN(formData.unitPerPackage) || parseInt(formData.unitPerPackage) <= 0) {
      newErrors.unitPerPackage = 'Đơn vị/thùng phải là số dương';
    }

    // goodsReceiptNoteId is read-only, no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate location code before submitting
    if (formData.locationCode && formData.locationCode.trim() !== '') {
      try {
        setLocationValidating(true);
        // Lấy palletId từ pallet prop
        const palletIdRaw = pallet?.palletId || pallet?.id;
        const palletId = palletIdRaw != null ? String(palletIdRaw) : "";
        const result = await validateLocationCode(formData.locationCode, palletId);
        setLocationValidationResult(result);

        // Lấy message từ result và xử lý qua extractErrorMessage
        const message = result.message || "";
        const processedMessage = message ? extractErrorMessage({ response: { data: { message } } }, message) : "Mã vị trí không tồn tại";

        if (!result.success) {
          setErrors(prev => ({
            ...prev,
            locationCode: processedMessage
          }));
          // Không hiển thị toast, chỉ hiển thị message dưới input
          setLocationValidating(false);
          return;
        }

        // Update locationId from validation result
        setFormData(prev => ({
          ...prev,
          locationId: result.data?.locationId || ''
        }));
      } catch (error) {
        console.error("Error validating location:", error);
        const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi kiểm tra mã vị trí");
        setErrors(prev => ({
          ...prev,
          locationCode: errorMessage
        }));
        // Không hiển thị toast, chỉ hiển thị message dưới input
        setLocationValidating(false);
        return;
      } finally {
        setLocationValidating(false);
      }
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      // Prepare data for API - send IDs, not codes
      const apiData = {
        batchId: formData.batchId,
        locationId: formData.locationId,
        packageQuantity: formData.packageQuantity,
        goodsPackingId: formData.goodsPackingId,
        goodsReceiptNoteId: formData.goodsReceiptNoteId
      };
      await updatePallet(pallet.palletId, apiData);

      if (window.showToast) {
        window.showToast("Cập nhật pallet thành công!", "success");
      }

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (error) {
      console.error("Error updating pallet:", error);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật pallet");

      if (window.showToast) {
        window.showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      batchCode: '',
      batchId: '',
      locationCode: '',
      locationId: '',
      packageQuantity: '',
      unitPerPackage: '',
      goodsPackingId: '',
      goodsReceiptNoteId: ''
    });
    setErrors({});
    setBatchOptions([]);
    setShowBatchDropdown(false);
    setBatchSearchQuery('');
    onClose && onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBatchDropdown && !event.target.closest('.batch-dropdown-container')) {
        setShowBatchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBatchDropdown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật pallet</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form id="update-pallet-form" className="space-y-6" onSubmit={handleSubmit}>
            {/* Form Fields - 2 column layout */}
            <div className="space-y-4">
              {/* Row 1: Batch ID & Location ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchCode" className="text-sm font-medium text-slate-700">
                    Mã lô hàng <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative batch-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                      className={`w-full h-[38px] px-3 py-2 text-left border rounded-lg bg-white flex items-center justify-between ${errors.batchCode ? 'border-red-500' : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500'}`}
                    >
                      <span className={formData.batchCode ? 'text-slate-900' : 'text-slate-500'}>
                        {formData.batchCode || 'Chọn lô hàng...'}
                      </span>
                      {batchLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {showBatchDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200 sticky top-0 bg-white z-10 flex-shrink-0">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Tìm kiếm mã lô hàng..."
                              value={batchSearchQuery}
                              onChange={(e) => {
                                e.stopPropagation();
                                setBatchSearchQuery(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="pl-8 pr-8 h-8 text-sm border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                            {batchSearchQuery && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBatchSearchQuery('');
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Dropdown List */}
                        <div className="overflow-y-auto flex-1">
                          {batchLoading ? (
                            <div className="px-3 py-2 text-slate-500 text-sm flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang tải...
                            </div>
                          ) : filteredBatchOptions.length > 0 ? (
                            filteredBatchOptions.map((batch) => (
                              <button
                                key={batch.batchId}
                                type="button"
                                onClick={() => handleBatchSelect(batch)}
                                className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between ${formData.batchId === batch.batchId ? 'bg-orange-50 text-orange-600' : 'text-slate-900'
                                  }`}
                              >
                                <span>{batch.batchCode}</span>
                                {formData.batchId === batch.batchId && (
                                  <span className="text-orange-600">✓</span>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-slate-500 text-sm">
                              {batchSearchQuery ? 'Không tìm thấy kết quả' : 'Không có dữ liệu batch'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.batchCode && (
                    <p className="text-sm text-red-500">{errors.batchCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationCode" className="text-sm font-medium text-slate-700">
                    Quét mã vị trí <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="locationCode"
                      placeholder="Nhập mã vị trí..."
                      value={formData.locationCode}
                      onChange={(e) => handleInputChange('locationCode', e.target.value)}
                      onBlur={(e) => {
                        // Khi blur (rời khỏi input), chỉ validate, không update
                        if (e.target.value && e.target.value.trim() !== '') {
                          validateLocation(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Khi nhấn Enter trong input locationCode, chỉ validate, không submit form
                        if (e.key === 'Enter') {
                          e.preventDefault(); // Ngăn form submit
                          if (formData.locationCode && formData.locationCode.trim() !== '') {
                            validateLocation(formData.locationCode);
                          }
                        }
                      }}
                      className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg pr-10 ${errors.locationCode ? 'border-red-500' :
                        locationValidationResult && !locationValidationResult.success ? 'border-red-500' :
                          locationValidationResult && locationValidationResult.success ? 'border-green-500' : ''
                        }`}
                      required
                    />
                    {locationValidating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </div>
                    )}
                    {!locationValidating && locationValidationResult && locationValidationResult.success && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-green-500 text-sm">✓</span>
                      </div>
                    )}
                    {!locationValidating && locationValidationResult && !locationValidationResult.success && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-red-500 text-sm">✗</span>
                      </div>
                    )}
                  </div>

                  {/* Validation messages */}
                  {errors.locationCode && (
                    <p className="text-sm text-red-500">{errors.locationCode}</p>
                  )}
                  {!errors.locationCode && locationValidationResult && !locationValidationResult.success && (
                    <p className="text-sm text-red-500">{locationValidationResult.message}</p>
                  )}
                  {!errors.locationCode && locationValidationResult && locationValidationResult.success && (
                    <p className="text-sm text-green-600">{locationValidationResult.message}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Package Quantity & Units Per Package */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packageQuantity" className="text-sm font-medium text-slate-700">
                    Số lượng thùng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="packageQuantity"
                    type="number"
                    placeholder="Nhập số lượng thùng..."
                    value={formData.packageQuantity}
                    onChange={(e) => handleInputChange('packageQuantity', e.target.value)}
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${errors.packageQuantity ? 'border-red-500' : ''
                      }`}
                    required
                  />
                  {errors.packageQuantity && (
                    <p className="text-sm text-red-500">{errors.packageQuantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPerPackage" className="text-sm font-medium text-slate-700">
                    Đơn vị/thùng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unitPerPackage"
                    type="number"
                    placeholder="Nhập đơn vị/thùng..."
                    value={formData.unitPerPackage}
                    onChange={(e) => handleInputChange('unitPerPackage', e.target.value)}
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${errors.unitPerPackage ? 'border-red-500' : ''
                      }`}
                    required
                  />
                  {errors.unitPerPackage && (
                    <p className="text-sm text-red-500">{errors.unitPerPackage}</p>
                  )}
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={handleReset}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            form="update-pallet-form"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "Cập nhật"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpdatePalletModal;