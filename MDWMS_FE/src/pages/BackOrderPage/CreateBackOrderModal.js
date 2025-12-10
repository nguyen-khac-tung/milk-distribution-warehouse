import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent } from "../../components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/table"
import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { createBackOrder, createBulkBackOrder } from "../../services/BackOrderService"
import { getRetailers } from "../../services/RetailerService"
import { getGoods } from "../../services/GoodService"
import { extractErrorMessage, cleanErrorMessage } from "../../utils/Validation"

// Component hiển thị kết quả bulk create
function ResultModal({ result, onClose }) {
  const [activeTab, setActiveTab] = useState("all") // "all", "success", "failed"
  
  const { totalInserted, totalUpdated, totalFailed, insertedItems, updatedItems, failedItems, selectedItems } = result
  
  const totalSuccess = totalInserted + totalUpdated
  
  const getItemInfo = (index) => {
    return selectedItems?.[index] || {}
  }

  const allItems = [
    ...insertedItems.map(item => ({ ...item, type: "inserted" })),
    ...updatedItems.map(item => ({ ...item, type: "updated" })),
    ...failedItems.map(item => ({ ...item, type: "failed" }))
  ].sort((a, b) => a.index - b.index)

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[99999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Kết quả tạo đơn đặt hàng</h1>
            <p className="text-sm text-gray-600 mt-1">
              Tổng cộng: {allItems.length} đơn | Thành công: {totalSuccess} | Thất bại: {totalFailed}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Thành công</p>
                    <p className="text-2xl font-bold text-green-600">{totalSuccess}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Mới tạo</p>
                    <p className="text-2xl font-bold text-blue-600">{totalInserted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Thất bại</p>
                    <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất cả ({allItems.length})
            </button>
            {totalSuccess > 0 && (
              <button
                onClick={() => setActiveTab("success")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "success"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Thành công ({totalSuccess})
              </button>
            )}
            {totalFailed > 0 && (
              <button
                onClick={() => setActiveTab("failed")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "failed"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Thất bại ({totalFailed})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-16 text-center">STT</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tên hàng hóa</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead>Thông tin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems
                .filter(item => {
                  if (activeTab === "all") return true
                  if (activeTab === "success") return item.type !== "failed"
                  if (activeTab === "failed") return item.type === "failed"
                  return true
                })
                .map((item, idx) => {
                  const itemInfo = getItemInfo(item.index)
                  const isSuccess = item.type !== "failed"
                  
                  return (
                    <TableRow key={`${item.type}-${item.index}-${idx}`} className="hover:bg-gray-50">
                      <TableCell className="text-center font-medium">
                        {item.index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.type === "inserted" && (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Tạo mới</span>
                            </>
                          )}
                          {item.type === "updated" && (
                            <>
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">Cập nhật</span>
                            </>
                          )}
                          {item.type === "failed" && (
                            <>
                              <XCircle className="h-5 w-5 text-red-600" />
                              <span className="text-sm font-medium text-red-600">Thất bại</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {itemInfo.goodsName || `Mã ${item.code || item.index}`}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity && (
                          <span className="font-semibold">{item.quantity} thùng</span>
                        )}
                        {item.newPackageQuantity && (
                          <div className="text-sm">
                            <span className="text-gray-500">{item.previousPackageQuantity} → </span>
                            <span className="font-semibold">{item.newPackageQuantity} thùng</span>
                          </div>
                        )}
                        {!item.quantity && !item.newPackageQuantity && (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.error ? (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-red-600">
                              {cleanErrorMessage(item.error)}
                            </span>
                          </div>
                        ) : item.type === "updated" ? (
                          <span className="text-sm text-gray-600">
                            Đã cập nhật số lượng từ {item.previousPackageQuantity} lên {item.newPackageQuantity} thùng
                          </span>
                        ) : (
                          <span className="text-sm text-green-600">Tạo thành công</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              {allItems.filter(item => {
                if (activeTab === "all") return true
                if (activeTab === "success") return item.type !== "failed"
                if (activeTab === "failed") return item.type === "failed"
                return true
              }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <Button
            onClick={onClose}
            className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

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
  
  // State để lưu kết quả bulk create
  const [bulkResult, setBulkResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)

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
      setFormData(prev => ({
        ...prev,
        retailerId: retailerId.toString()
      }))
    } else if (isOpen && !retailerId) {
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
      window.showToast("Lỗi khi tải danh sách hàng hóa", "error")
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
        
        // Xử lý response từ API
        const responseData = response?.data || response
        
        if (responseData) {
          const { totalInserted, totalUpdated, totalFailed, insertedItems, updatedItems, failedItems } = responseData
          
          // Nếu tất cả thành công → chỉ hiển thị toast và đóng modal
          if (totalFailed === 0) {
            const messageParts = []
            if (totalInserted > 0) messageParts.push(`${totalInserted} đơn mới`)
            if (totalUpdated > 0) messageParts.push(`${totalUpdated} đơn cập nhật`)
            window.showToast(`Thành công: ${messageParts.join(", ")}!`, "success")
            onSuccess && onSuccess()
            onClose && onClose()
          } else {
            // Có lỗi → hiển thị modal kết quả
            setBulkResult({
              totalInserted,
              totalUpdated,
              totalFailed,
              insertedItems: insertedItems || [],
              updatedItems: updatedItems || [],
              failedItems: failedItems || [],
              selectedItems: selectedItems // Lưu lại để map với index
            })
            setShowResultModal(true)
            
            // Refresh nếu có ít nhất 1 item thành công
            if (totalInserted > 0 || totalUpdated > 0) {
              onSuccess && onSuccess()
            }
          }
        } else {
          // Response không có data, coi như thành công
        window.showToast(`Thêm ${selectedItems.length} đơn đặt hàng thành công!`, "success")
        onSuccess && onSuccess()
        onClose && onClose()
        }
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
      
      // Xử lý response từ API
      const responseData = response?.data || response
      
      if (responseData) {
        const { isNew, isUpdated, previousPackageQuantity, packageQuantity, goodsName } = responseData
        
        if (isNew) {
          window.showToast(`Tạo đơn đặt hàng mới thành công cho ${goodsName || 'hàng hóa'} (${packageQuantity} thùng)!`, "success")
        } else if (isUpdated) {
          const previousQty = previousPackageQuantity || 0
          const newQty = packageQuantity || 0
          window.showToast(
            `Cập nhật đơn đặt hàng thành công cho ${goodsName || 'hàng hóa'}: ${previousQty} → ${newQty} thùng!`,
            "success"
          )
        } else {
          window.showToast("Thêm đơn đặt hàng thành công!", "success")
        }
      } else {
      window.showToast("Thêm đơn đặt hàng thành công!", "success")
      }
      
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
    setBulkResult(null)
    setShowResultModal(false)
    onClose && onClose()
  }

  const handleCloseResultModal = () => {
    setShowResultModal(false)
    setBulkResult(null)
    onClose && onClose()
  }

  // Reset form khi modal đóng và lock/unlock body scroll
  useEffect(() => {
    if (isOpen || showResultModal) {
      // Lock body scroll khi modal mở
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      // Unlock body scroll khi modal đóng
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      setFormData({
        retailerId: "",
        goodsId: "",
        quantity: "",
      })
      setBulkResult(null)
      setShowResultModal(false)
    }

    // Cleanup khi component unmount
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isOpen, showResultModal])

  const isBulkMode = selectedItems && selectedItems.length > 0

  // Render modal kết quả nếu có (hiển thị trên cùng modal chính)
  if (showResultModal && bulkResult) {
    return createPortal(
      <ResultModal
        result={bulkResult}
        onClose={handleCloseResultModal}
      />,
      document.body
    )
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        zIndex: 99999,
        overflow: 'hidden'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose && onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
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
              return null;
            })()}

            {/* Hiển thị danh sách hàng hóa nếu là bulk mode */}
            {isBulkMode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-red-600 mb-1" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    Danh sách hàng hóa thiếu tồn kho ({selectedItems.length})
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
                                Mã hàng hóa: <span className="font-medium text-slate-700">{item.goodsCode || "-"}</span>
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
                    Hàng hóa <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.goodsId}
                    onValueChange={(value) => setFormData({ ...formData, goodsId: value })}
                    disabled={loadingGoods}
                  >
                    <SelectTrigger className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder={loadingGoods ? "Đang tải..." : "Chọn hàng hóa..."} />
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
    </div>,
    document.body
  )
}
