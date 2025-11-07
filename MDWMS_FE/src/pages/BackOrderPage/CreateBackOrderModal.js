import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent } from "../../components/ui/card"
import { X, CheckCircle } from "lucide-react"
import { createBackOrder, createBulkBackOrder } from "../../services/BackOrderService"
import { getRetailers } from "../../services/RetailerService"
import { getGoods } from "../../services/GoodService"
import { extractErrorMessage } from "../../utils/Validation"

export default function CreateBackOrderModal({ isOpen, onClose, onSuccess, selectedItems = null, retailerId = null }) {
  const [formData, setFormData] = useState({
    retailerId: "",
    goodsId: "",
    quantity: "",
  })
  const [loading, setLoading] = useState(false)
  const [retailers, setRetailers] = useState([])
  const [goods, setGoods] = useState([])
  const [loadingRetailers, setLoadingRetailers] = useState(false)
  const [loadingGoods, setLoadingGoods] = useState(false)

  // Load retailers and goods when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRetailers()
      loadGoods()
    }
  }, [isOpen])

  // Set retailerId từ props khi modal mở hoặc retailerId thay đổi
  useEffect(() => {
    if (isOpen && retailerId) {
      console.log("Setting retailerId in modal:", retailerId);
      setFormData(prev => ({
        ...prev,
        retailerId: retailerId.toString()
      }))
    } else if (isOpen && !retailerId) {
      console.log("No retailerId provided, clearing form");
      setFormData(prev => ({
        ...prev,
        retailerId: ""
      }))
    }
  }, [isOpen, retailerId])

  const loadRetailers = async () => {
    try {
      setLoadingRetailers(true)
      const response = await getRetailers({
        pageNumber: 1,
        pageSize: 1000,
        search: "",
        sortField: "",
        sortAscending: true,
        status: "1" // Only active retailers
      })

      if (response && response.data && response.data.items) {
        setRetailers(response.data.items)
      }
    } catch (error) {
      console.error("Error loading retailers:", error)
      window.showToast("Lỗi khi tải danh sách nhà bán lẻ", "error")
    } finally {
      setLoadingRetailers(false)
    }
  }

  const loadGoods = async () => {
    try {
      setLoadingGoods(true)
      const response = await getGoods({
        pageNumber: 1,
        pageSize: 1000,
        search: "",
        sortField: "",
        sortAscending: true,
        status: "1" // Only active goods
      })

      if (response && response.data && response.data.items) {
        setGoods(response.data.items)
      }
    } catch (error) {
      console.error("Error loading goods:", error)
      window.showToast("Lỗi khi tải danh sách sản phẩm", "error")
    } finally {
      setLoadingGoods(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Nếu có selectedItems từ cart, tạo bulk back order
    if (selectedItems && selectedItems.length > 0) {
      // Validation cho bulk
      if (!formData.retailerId) {
        window.showToast("Vui lòng chọn nhà bán lẻ", "error")
        return
      }

      try {
        setLoading(true)
        // Map selectedItems thành format cho bulk API
        const backOrders = selectedItems.map(item => ({
          retailerId: parseInt(formData.retailerId),
          goodsId: parseInt(item.goodsId),
          goodsPackingId: parseInt(item.goodsPackingId),
          packageQuantity: parseInt(item.requestedQuantity) || parseInt(item.packageQuantity)
        }))

        const response = await createBulkBackOrder(backOrders)
        console.log("Bulk BackOrder created:", response)
        window.showToast(`Thêm ${selectedItems.length} đơn đặt hàng thành công!`, "success")
        onSuccess && onSuccess()
        onClose && onClose()
      } catch (error) {
        console.error("Error creating bulk backOrder:", error)
        const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm đơn đặt hàng")
        window.showToast(cleanMsg, "error")
      } finally {
        setLoading(false)
      }
      return
    }

    // Tạo đơn đơn lẻ (flow cũ)
    // Basic validation
    if (!formData.retailerId || !formData.goodsId || !formData.quantity) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    // Quantity validation
    const quantity = parseInt(formData.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      window.showToast("Số lượng phải là số nguyên dương", "error")
      return
    }

    try {
      setLoading(true)
      const response = await createBackOrder({
        retailerId: parseInt(formData.retailerId),
        goodsId: parseInt(formData.goodsId),
        quantity: quantity
      })
      console.log("BackOrder created:", response)
      window.showToast("Thêm đơn đặt hàng thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error creating backOrder:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm đơn đặt hàng")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      retailerId: "",
      goodsId: "",
      quantity: "",
    })
    onClose && onClose()
  }

  // Reset form khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        retailerId: "",
        goodsId: "",
        quantity: "",
      })
    }
  }, [isOpen])

  if (!isOpen) return null;

  const isBulkMode = selectedItems && selectedItems.length > 0

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">
            {isBulkMode ? "Tạo đơn bổ sung" : "Thêm đơn đặt hàng mới"}
          </h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form id="backorder-form" className="space-y-6" onSubmit={handleSubmit}>
            {/* Retailer Selection - Chỉ hiển thị nếu không có retailerId từ props */}
            {!retailerId && (
              <div className="space-y-2">
                <Label htmlFor="retailerId" className="text-sm font-medium text-slate-700">
                  Nhà bán lẻ <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.retailerId}
                  onValueChange={(value) => setFormData({ ...formData, retailerId: value })}
                  disabled={loadingRetailers}
                >
                  <SelectTrigger className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                    <SelectValue placeholder={loadingRetailers ? "Đang tải..." : "Chọn nhà bán lẻ..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {retailers.map((retailer) => (
                      <SelectItem key={retailer.retailerId} value={retailer.retailerId.toString()}>
                        {retailer.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hiển thị thông tin nhà bán lẻ nếu đã được truyền từ props */}
            {retailerId && (() => {
              const selectedRetailer = retailers.find(r =>
                r.retailerId?.toString() === retailerId.toString() ||
                r.RetailerId?.toString() === retailerId.toString()
              );
              if (selectedRetailer) {
                const retailerName = selectedRetailer.companyName || selectedRetailer.retailerName || selectedRetailer.RetailerName;
                return (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Nhà bán lẻ <span className="text-red-500">*</span>
                    </Label>
                    <div className="h-[38px] flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-700 font-medium">
                      {retailerName}
                    </div>
                  </div>
                );
              }
              // Nếu chưa load được retailers, vẫn hiển thị để biết đã được truyền
              if (loadingRetailers) {
                return (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Nhà bán lẻ <span className="text-red-500">*</span>
                    </Label>
                    <div className="h-[38px] flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-slate-700 font-medium">
                      Đang tải...
                    </div>
                  </div>
                );
              }
              // Fallback: hiển thị retailerId nếu không tìm thấy
              console.log("Retailer not found in modal. retailerId:", retailerId, "retailers:", retailers);
              return null;
            })()}

            {/* Hiển thị danh sách mặt hàng nếu là bulk mode */}
            {isBulkMode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-red-600 mb-1" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    Danh sách mặt hàng thiếu tồn kho ({selectedItems.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                  {selectedItems.map((item, index) => {
                    const isInsufficient = item.requestedQuantity > item.availableQuantity
                    return (
                      <Card key={index} className={`border ${isInsufficient ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className={`h-5 w-5 mt-1.5 ${isInsufficient ? 'text-red-600' : 'text-green-600'}`} />
                            <div className="flex-1 pt-1">
                              <h4 className="font-semibold text-slate-800 mb-2">{item.goodsName}</h4>
                              <div className="text-sm text-slate-600 mb-3">
                                Mã sản phẩm: <span className="font-medium text-slate-700">{item.goodsCode || "-"}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-slate-600">
                                    {item.availableQuantity === 0 ? "Số lượng bổ sung: " : "Yêu cầu: "}
                                  </span>
                                  <span className="font-semibold text-slate-800">{item.requestedQuantity || item.packageQuantity} thùng</span>
                                </div>
                                {item.availableQuantity > 0 && (
                                  <div className="text-sm">
                                    <span className="text-slate-600">Có sẵn: </span>
                                    <span className={`font-semibold ${isInsufficient ? 'text-red-600' : 'text-green-600'}`}>
                                      {item.availableQuantity} thùng
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Form tạo đơn đơn lẻ */
              <div className="space-y-4">
                {/* Goods Selection */}
                <div className="space-y-2">
                  <Label htmlFor="goodsId" className="text-sm font-medium text-slate-700">
                    Sản phẩm <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.goodsId}
                    onValueChange={(value) => setFormData({ ...formData, goodsId: value })}
                    disabled={loadingGoods}
                  >
                    <SelectTrigger className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder={loadingGoods ? "Đang tải..." : "Chọn sản phẩm..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {goods.map((good) => (
                        <SelectItem key={good.goodsId} value={good.goodsId.toString()}>
                          {good.goodsName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                    Số lượng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Nhập số lượng..."
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}

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
            disabled={loading || loadingRetailers || (isBulkMode ? false : loadingGoods)}
            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            form="backorder-form"
          >
            {loading ? (isBulkMode ? "Đang tạo..." : "Đang thêm...") : (isBulkMode ? `Thêm` : "Thêm")}
          </Button>
        </div>
      </div>
    </div>
  )
}
