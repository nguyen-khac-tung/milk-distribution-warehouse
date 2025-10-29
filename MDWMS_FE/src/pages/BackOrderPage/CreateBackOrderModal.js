import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { X } from "lucide-react"
import { createBackOrder } from "../../services/BackOrderService"
import { getRetailers } from "../../services/RetailerService"
import { getGoods } from "../../services/GoodService"
import { extractErrorMessage } from "../../utils/Validation"

export default function CreateBackOrderModal({ isOpen, onClose, onSuccess }) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-800">Thêm đơn đặt hàng mới</h1>
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
            {/* Form Fields */}
            <div className="space-y-4">
              {/* Retailer Selection */}
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
            disabled={loading || loadingRetailers || loadingGoods}
            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            form="backorder-form"
          >
            {loading ? "Đang thêm..." : "Thêm"}
          </Button>
        </div>
      </div>
    </div>
  )
}
