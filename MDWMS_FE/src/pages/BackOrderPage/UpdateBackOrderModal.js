import React, { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { X, Package, ShoppingCart, Box, Calculator } from "lucide-react"
import { updateBackOrder, getBackOrderDetail } from "../../services/BackOrderService"
import { getRetailersDropdown } from "../../services/RetailerService"
import { getGoodsDropdown, getGoodDetail } from "../../services/GoodService"
import { getGoodsPackingByGoodsId } from "../../services/PurchaseOrderService"
import { extractErrorMessage } from "../../utils/Validation"
import FloatingDropdown from "../../components/Common/FloatingDropdown"

export default function UpdateBackOrderModal({ isOpen, onClose, onSuccess, backOrderId }) {
  const [formData, setFormData] = useState({
    backOrderId: "",
    retailerId: "",
    goodsId: "",
    goodsPackingId: "",
    packageQuantity: "",
  })
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [retailers, setRetailers] = useState([])
  const [goods, setGoods] = useState([])
  const [goodsPackings, setGoodsPackings] = useState([])
  const [unitMeasureName, setUnitMeasureName] = useState("đơn vị") // Lưu unitMeasureName từ backOrder hoặc goods
  const [loadingRetailers, setLoadingRetailers] = useState(false)
  const [loadingGoods, setLoadingGoods] = useState(false)
  const [loadingPackings, setLoadingPackings] = useState(false)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && backOrderId) {
      // Load dropdown data first, then backOrder data to ensure dropdowns are ready
      const loadDataSequentially = async () => {
        await Promise.all([loadRetailers(), loadGoods()])
        await loadBackOrderData()
      }
      loadDataSequentially()
    }
  }, [isOpen, backOrderId])

  // Load goods packings and unitMeasureName when goods is selected
  useEffect(() => {
    if (formData.goodsId) {
      loadGoodsPackings(formData.goodsId)
      // Fetch goods detail để lấy unitMeasureName
      const loadGoodsUnitMeasure = async () => {
        try {
          const goodsDetailResponse = await getGoodDetail(parseInt(formData.goodsId))
          const goodsDetail = goodsDetailResponse?.data || goodsDetailResponse
          if (goodsDetail?.unitMeasureName) {
            setUnitMeasureName(goodsDetail.unitMeasureName)
          }
        } catch (error) {
          console.error("Error loading goods detail for unitMeasureName:", error)
          // Nếu không fetch được, thử lấy từ goods list (mặc dù không có nhưng vẫn thử)
          const selectedGood = goods.find(g => g.goodsId?.toString() === formData.goodsId)
          if (selectedGood?.unitMeasureName) {
            setUnitMeasureName(selectedGood.unitMeasureName)
          } else if (selectedGood?.name) {
            setUnitMeasureName(selectedGood.name)
          }
        }
      }
      loadGoodsUnitMeasure()
    } else {
      setGoodsPackings([])
      setFormData(prev => ({ ...prev, goodsPackingId: "" }))
      setUnitMeasureName("đơn vị") // Reset về mặc định
    }
  }, [formData.goodsId, goods])

  const loadBackOrderData = async () => {
    try {
      setLoadingData(true)
      const response = await getBackOrderDetail(backOrderId)

      // API trả về { data: {...}, message: "", status: 200, success: true }
      const backOrderInfo = response.data || response;

      if (backOrderInfo) {
        setFormData({
          backOrderId: backOrderInfo.backOrderId || "",
          retailerId: backOrderInfo.retailerId?.toString() || "",
          goodsId: backOrderInfo.goodsId?.toString() || "",
          goodsPackingId: backOrderInfo.goodsPackingId?.toString() || "",
          packageQuantity: backOrderInfo.packageQuantity?.toString() || "",
        })
        // Lưu unitMeasureName từ backOrder nếu có
        if (backOrderInfo.unitMeasureName) {
          setUnitMeasureName(backOrderInfo.unitMeasureName)
        }
      }
    } catch (error) {
      console.error("Error loading backOrder data:", error)
      const errorMessage = extractErrorMessage(error, "Lỗi khi tải thông tin đơn đặt hàng")
      window.showToast(errorMessage, "error")
    } finally {
      setLoadingData(false)
    }
  }

  const loadRetailers = async () => {
    try {
      setLoadingRetailers(true)
      const response = await getRetailersDropdown()

      // Handle different response formats
      const retailersData = response?.data || response?.items || response || []
      if (Array.isArray(retailersData)) {
        setRetailers(retailersData)
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
      const response = await getGoodsDropdown()

      // Handle different response formats
      const goodsData = response?.data || response || []
      if (Array.isArray(goodsData)) {
        setGoods(goodsData)
      }
    } catch (error) {
      console.error("Error loading goods:", error)
      window.showToast("Lỗi khi tải danh sách hàng hóa", "error")
    } finally {
      setLoadingGoods(false)
    }
  }

  const loadGoodsPackings = async (goodsId) => {
    try {
      setLoadingPackings(true)
      const response = await getGoodsPackingByGoodsId(goodsId)

      if (response && response.data) {
        setGoodsPackings(response.data)
      } else if (Array.isArray(response)) {
        setGoodsPackings(response)
      }
    } catch (error) {
      console.error("Error loading goods packings:", error)
      window.showToast("Lỗi khi tải danh sách đóng gói", "error")
      setGoodsPackings([])
    } finally {
      setLoadingPackings(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.retailerId || !formData.goodsId || !formData.goodsPackingId || !formData.packageQuantity) {
      window.showToast("Vui lòng điền đầy đủ thông tin", "error")
      return
    }

    // Package quantity validation
    const packageQuantity = parseInt(formData.packageQuantity)
    if (isNaN(packageQuantity) || packageQuantity <= 0) {
      window.showToast("Số thùng phải là số nguyên dương", "error")
      return
    }

    try {
      setLoading(true)
      const response = await updateBackOrder(formData.backOrderId, {
        retailerId: parseInt(formData.retailerId),
        goodsId: parseInt(formData.goodsId),
        goodsPackingId: parseInt(formData.goodsPackingId),
        packageQuantity: packageQuantity
      })
      window.showToast("Cập nhật đơn bổ sung thành công!", "success")
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (error) {
      console.error("Error updating backOrder:", error)
      const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi cập nhật đơn bổ sung")
      window.showToast(cleanMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      backOrderId: "",
      retailerId: "",
      goodsId: "",
      goodsPackingId: "",
      packageQuantity: "",
    })
    onClose && onClose()
  }

  // Calculate total units
  const selectedPacking = goodsPackings.find(p => p.goodsPackingId?.toString() === formData.goodsPackingId)
  const unitPerPackage = selectedPacking?.unitPerPackage || 0
  const totalUnits = formData.packageQuantity && unitPerPackage
    ? parseInt(formData.packageQuantity) * unitPerPackage
    : 0

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Cập nhật đơn bổ sung</h1>
              <p className="text-sm text-gray-500">Chỉnh sửa thông tin đơn hàng bổ sung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form id="update-backorder-form" className="space-y-6" onSubmit={handleSubmit} noValidate>
            {loadingData ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-slate-600 font-medium">Đang tải thông tin...</div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[6.5fr_5.5fr]">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="bg-blue-50 border-b border-gray-200">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        Thông tin cơ bản
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {/* Retailer Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="retailerId" className="text-sm font-medium text-slate-700">
                            Nhà bán lẻ <span className="text-red-500">*</span>
                          </Label>
                          <FloatingDropdown
                            value={formData.retailerId?.toString() || ""}
                            onChange={(value) => setFormData({ ...formData, retailerId: value })}
                            loading={loadingRetailers || loadingData}
                            disabled={loadingRetailers || loadingData}
                            placeholder={
                              loadingRetailers || loadingData ? "Đang tải..." : "Chọn nhà bán lẻ..."
                            }
                            options={retailers.map((retailer) => ({
                              value: retailer.retailerId.toString(),
                              label: retailer.retailerName,
                            }))}
                          />
                        </div>

                        {/* Goods Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="goodsId" className="text-sm font-medium text-slate-700">
                            Hàng hóa <span className="text-red-500">*</span>
                          </Label>
                          <FloatingDropdown
                            value={formData.goodsId}
                            onChange={(value) => setFormData({ ...formData, goodsId: value })}
                            loading={loadingGoods || loadingData}
                            disabled={loadingGoods || loadingData}
                            placeholder={
                              loadingGoods || loadingData ? "Đang tải..." : "Chọn hàng hóa..."
                            }
                            options={goods.map((good) => ({
                              value: good.goodsId.toString(),
                              label: good.goodsName,
                            }))}
                          />
                        </div>

                        {/* Goods Packing Selection */}
                        {formData.goodsId && (
                          <div className="space-y-2">
                            <Label htmlFor="goodsPackingId" className="text-sm font-medium text-slate-700">
                              Đóng gói <span className="text-red-500">*</span>
                            </Label>
                            <FloatingDropdown
                              value={formData.goodsPackingId}
                              onChange={(value) => setFormData({ ...formData, goodsPackingId: value })}
                              loading={loadingPackings || loadingData}
                              disabled={loadingPackings || loadingData}
                              placeholder={
                                loadingPackings ? "Đang tải..." : "Chọn đóng gói..."
                              }
                              options={
                                goodsPackings.length > 0
                                  ? goodsPackings.map((packing) => ({
                                    value: packing.goodsPackingId.toString(),
                                    label: `${packing.unitPerPackage} ${unitMeasureName}/thùng`,
                                  }))
                                  : [{ value: "", label: "Không có đóng gói", disabled: true }]
                              }
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Quantity Info */}
                <div className="space-y-6">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="bg-green-50 border-b border-gray-200">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Box className="h-5 w-5 text-green-600" />
                        Thông tin số lượng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {/* Package Quantity */}
                        <div className="space-y-2">
                          <Label htmlFor="packageQuantity" className="text-sm font-medium text-slate-700">
                            Số thùng <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="packageQuantity"
                            type="number"
                            min="1"
                            placeholder="Nhập số thùng..."
                            value={formData.packageQuantity}
                            onChange={(e) => setFormData({ ...formData, packageQuantity: e.target.value })}
                            className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
                          />
                        </div>

                        {/* Unit Per Package Display */}
                        {formData.goodsPackingId && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                              Đơn vị / thùng
                            </Label>
                            <div className="h-[38px] px-3 flex items-center border border-slate-200 bg-slate-50 rounded-lg">
                              <span className="text-slate-700">
                                {unitPerPackage ? `${unitPerPackage} ${unitMeasureName}` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Total Units Display */}
                        {totalUnits > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-700">
                              <Calculator className="inline h-4 w-4 mr-1" />
                              Tổng số đơn vị
                            </Label>
                            <div className="h-[38px] px-3 flex items-center border border-green-200 bg-green-50 rounded-lg">
                              <span className="text-green-700 font-semibold text-base">
                                {totalUnits.toLocaleString('vi-VN')} {unitMeasureName}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4 shadow-lg">
          <Button
            type="button"
            variant="outline"
            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            onClick={handleReset}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading || loadingData || loadingRetailers || loadingGoods || loadingPackings}
            className="h-[38px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            form="update-backorder-form"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang cập nhật...
              </div>
            ) : loadingData ? "Đang tải..." : "Cập nhật"}
          </Button>
        </div>
      </div>
    </div>
  )
}
