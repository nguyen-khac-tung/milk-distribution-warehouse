// import React, { useState, useEffect } from "react"
// import { Button } from "../../components/ui/button"
// import { Input } from "../../components/ui/input"
// import { Label } from "../../components/ui/label"
// import { X, Package } from "lucide-react"
// import { createPallet } from "../../services/PalletService"
// import { extractErrorMessage } from "../../utils/Validation"
// import { getBatches } from "../../services/BatchService"
// import { getLocations } from "../../services/LocationServices"
// import { getPurchaseOrders } from "../../services/PurchaseOrderService"

// export default function CreatePalletModal({ isOpen, onClose, onSuccess }) {
//   const [formData, setFormData] = useState({
//     batchId: "",
//     locationId: "",
//     packageQuantity: "",
//     unitsPerPackage: "",
//     purchaseOrderId: ""
//   })
//   const [loading, setLoading] = useState(false)
//   const [batches, setBatches] = useState([])
//   const [locations, setLocations] = useState([])
//   const [purchaseOrders, setPurchaseOrders] = useState([])
//   const [loadingOptions, setLoadingOptions] = useState(false)

//   // Fetch options for dropdowns
//   useEffect(() => {
//     if (isOpen) {
//       fetchOptions()
//     }
//   }, [isOpen])

//   const fetchOptions = async () => {
//     try {
//       setLoadingOptions(true)
      
//       // Fetch batches
//       const batchResponse = await getBatches({
//         pageNumber: 1,
//         pageSize: 1000,
//         search: "",
//         sortField: "",
//         sortAscending: true,
//         status: "1" // Only active batches
//       })
//       setBatches(batchResponse?.data?.items || [])

//       // Fetch locations
//       const locationResponse = await getLocations({
//         pageNumber: 1,
//         pageSize: 1000,
//         search: "",
//         sortField: "",
//         sortAscending: true,
//         status: "1" // Only active locations
//       })
//       setLocations(locationResponse?.data?.items || [])

//       // Fetch purchase orders
//       const poResponse = await getPurchaseOrders({
//         pageNumber: 1,
//         pageSize: 1000,
//         search: "",
//         sortField: "",
//         sortAscending: true,
//         status: "1" // Only active purchase orders
//       })
//       setPurchaseOrders(poResponse?.data?.items || [])

//     } catch (error) {
//       console.error("Error fetching options:", error)
//       window.showToast("Có lỗi xảy ra khi tải dữ liệu", "error")
//     } finally {
//       setLoadingOptions(false)
//     }
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
    
//     // Basic validation - check if required fields are filled
//     if (!formData.batchId || !formData.locationId || !formData.packageQuantity || 
//         !formData.unitsPerPackage || !formData.purchaseOrderId) {
//       window.showToast("Vui lòng điền đầy đủ thông tin", "error")
//       return
//     }

//     // Number validation
//     if (isNaN(formData.packageQuantity) || parseInt(formData.packageQuantity) <= 0) {
//       window.showToast("Số lượng thùng phải là số dương", "error")
//       return
//     }

//     if (isNaN(formData.unitsPerPackage) || parseInt(formData.unitsPerPackage) <= 0) {
//       window.showToast("Đơn vị/thùng phải là số dương", "error")
//       return
//     }

//     try {
//       setLoading(true)
//       const response = await createPallet(formData)
//       console.log("Pallet created:", response)
//       window.showToast("Thêm kệ kê hàng thành công!", "success")
//       onSuccess && onSuccess()
//       onClose && onClose()
//     } catch (error) {
//       console.error("Error creating pallet:", error)
//       const cleanMsg = extractErrorMessage(error, "Có lỗi xảy ra khi thêm kệ kê hàng")
//       window.showToast(cleanMsg, "error")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleReset = () => {
//     setFormData({
//       batchId: "",
//       locationId: "",
//       packageQuantity: "",
//       unitsPerPackage: "",
//       purchaseOrderId: ""
//     })
//     onClose && onClose()
//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
//       <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-orange-100 rounded-lg">
//               <Package className="h-5 w-5 text-orange-600" />
//             </div>
//             <h1 className="text-2xl font-bold text-slate-800">Thêm kệ kê hàng mới</h1>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-1 hover:bg-gray-100 rounded-full transition-colors"
//           >
//             <X className="h-5 w-5 text-gray-500" />
//           </button>
//         </div>
        
//         {/* Content */}
//         <div className="p-6">
//           <form id="pallet-form" className="space-y-6" onSubmit={handleSubmit}>
//             {/* Form Fields - 2 column layout */}
//             <div className="space-y-4">
//               {/* Row 1: Batch & Location */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="batchId" className="text-sm font-medium text-slate-700">
//                     Lô hàng <span className="text-red-500">*</span>
//                   </Label>
//                   <select
//                     id="batchId"
//                     value={formData.batchId}
//                     onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
//                     className="w-full h-[38px] px-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
//                     required
//                     disabled={loadingOptions}
//                   >
//                     <option value="">Chọn lô hàng...</option>
//                     {batches.map((batch) => (
//                       <option key={batch.batchId} value={batch.batchId}>
//                         {batch.batchCode} - {batch.goodsName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="locationId" className="text-sm font-medium text-slate-700">
//                     Vị trí <span className="text-red-500">*</span>
//                   </Label>
//                   <select
//                     id="locationId"
//                     value={formData.locationId}
//                     onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
//                     className="w-full h-[38px] px-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
//                     required
//                     disabled={loadingOptions}
//                   >
//                     <option value="">Chọn vị trí...</option>
//                     {locations.map((location) => (
//                       <option key={location.locationId} value={location.locationId}>
//                         {location.locationCode} - {location.areaName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* Row 2: Package Quantity & Units Per Package */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="packageQuantity" className="text-sm font-medium text-slate-700">
//                     Số lượng thùng <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="packageQuantity"
//                     type="number"
//                     min="1"
//                     placeholder="Nhập số lượng thùng..."
//                     value={formData.packageQuantity}
//                     onChange={(e) => setFormData({ ...formData, packageQuantity: e.target.value })}
//                     className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="unitsPerPackage" className="text-sm font-medium text-slate-700">
//                     Đơn vị/thùng <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="unitsPerPackage"
//                     type="number"
//                     min="1"
//                     placeholder="Nhập đơn vị/thùng..."
//                     value={formData.unitsPerPackage}
//                     onChange={(e) => setFormData({ ...formData, unitsPerPackage: e.target.value })}
//                     className="h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Row 3: Purchase Order */}
//               <div className="grid grid-cols-1 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="purchaseOrderId" className="text-sm font-medium text-slate-700">
//                     Đơn đặt hàng <span className="text-red-500">*</span>
//                   </Label>
//                   <select
//                     id="purchaseOrderId"
//                     value={formData.purchaseOrderId}
//                     onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })}
//                     className="w-full h-[38px] px-3 border border-slate-300 rounded-lg focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
//                     required
//                     disabled={loadingOptions}
//                   >
//                     <option value="">Chọn đơn đặt hàng...</option>
//                     {purchaseOrders.map((po) => (
//                       <option key={po.purchaseOrderId} value={po.purchaseOrderId}>
//                         {po.purchaseOrderCode} - {po.supplierName}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//           </form>
//         </div>

//         {/* Footer with Action Buttons */}
//         <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
//           <Button
//             type="button"
//             variant="outline"
//             className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
//             onClick={handleReset}
//           >
//             Hủy
//           </Button>
//           <Button
//             type="submit"
//             disabled={loading || loadingOptions}
//             className="h-[38px] px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
//             form="pallet-form"
//           >
//             {loading ? "Đang thêm..." : "Thêm"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
