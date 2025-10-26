import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { X, Loader2 } from 'lucide-react';
import { updatePallet } from '../../services/PalletService';
import { extractErrorMessage } from '../../utils/Validation';

const UpdatePalletModal = ({ 
  isOpen, 
  onClose, 
  pallet, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    batchCode: '',
    batchId: '',
    locationCode: '',
    locationId: '',
    packageQuantity: '',
    unitsPerPackage: '',
    goodsReceiptNoteId: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when pallet changes
  useEffect(() => {
    if (pallet && isOpen) {
      setFormData({
        batchCode: pallet.batchCode || '',
        batchId: pallet.batchId || '',
        locationCode: pallet.locationCode || '',
        locationId: pallet.locationId || '',
        packageQuantity: pallet.packageQuantity || '',
        unitsPerPackage: pallet.unitsPerPackage || '',
        goodsReceiptNoteId: pallet.goodsReceiptNoteId || ''
      });
      setErrors({});
    }
  }, [pallet, isOpen]);

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
    
    if (!formData.unitsPerPackage || formData.unitsPerPackage === '') {
      newErrors.unitsPerPackage = 'Đơn vị/thùng là bắt buộc';
    } else if (isNaN(formData.unitsPerPackage) || parseInt(formData.unitsPerPackage) <= 0) {
      newErrors.unitsPerPackage = 'Đơn vị/thùng phải là số dương';
    }
    
    if (!formData.goodsReceiptNoteId?.trim()) {
      newErrors.goodsReceiptNoteId = 'Phiếu nhập kho là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        unitsPerPackage: formData.unitsPerPackage,
        goodsReceiptNoteId: formData.goodsReceiptNoteId
      };
      await updatePallet(pallet.palletId, apiData);
      
      if (window.showToast) {
        window.showToast("Cập nhật kệ kê hàng thành công!", "success");
      }
      
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (error) {
      console.error("Error updating pallet:", error);
      const errorMessage = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật kệ kê hàng");
      
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
      unitsPerPackage: '',
      goodsReceiptNoteId: ''
    });
    setErrors({});
    onClose && onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Cập nhật kệ kê hàng</h1>
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
                  <Input
                    id="batchCode"
                    placeholder="Nhập mã lô hàng..."
                    value={formData.batchCode}
                    onChange={(e) => handleInputChange('batchCode', e.target.value)}
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${
                      errors.batchCode ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.batchCode && (
                    <p className="text-sm text-red-500">{errors.batchCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationCode" className="text-sm font-medium text-slate-700">
                    Mã vị trí <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="locationCode"
                    placeholder="Nhập mã vị trí..."
                    value={formData.locationCode}
                    onChange={(e) => handleInputChange('locationCode', e.target.value)}
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${
                      errors.locationCode ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.locationCode && (
                    <p className="text-sm text-red-500">{errors.locationCode}</p>
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
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${
                      errors.packageQuantity ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.packageQuantity && (
                    <p className="text-sm text-red-500">{errors.packageQuantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitsPerPackage" className="text-sm font-medium text-slate-700">
                    Đơn vị/thùng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unitsPerPackage"
                    type="number"
                    placeholder="Nhập đơn vị/thùng..."
                    value={formData.unitsPerPackage}
                    onChange={(e) => handleInputChange('unitsPerPackage', e.target.value)}
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${
                      errors.unitsPerPackage ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.unitsPerPackage && (
                    <p className="text-sm text-red-500">{errors.unitsPerPackage}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Goods Receipt Note ID */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goodsReceiptNoteId" className="text-sm font-medium text-slate-700">
                    Phiếu nhập kho <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="goodsReceiptNoteId"
                    placeholder="Nhập phiếu nhập kho..."
                    value={formData.goodsReceiptNoteId}
                    onChange={(e) => handleInputChange('goodsReceiptNoteId', e.target.value)}
                    className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${
                      errors.goodsReceiptNoteId ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.goodsReceiptNoteId && (
                    <p className="text-sm text-red-500">{errors.goodsReceiptNoteId}</p>
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