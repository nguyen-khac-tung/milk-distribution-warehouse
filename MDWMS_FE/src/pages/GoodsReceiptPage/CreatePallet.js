import React, { useState, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { getGoodRNDPallet } from "../../services/GoodsReceiptService";
import FloatingDropdown from "../../components/Common/FloatingDropdown";

export default function PalletManager({ goodsReceiptNoteId, goodsReceiptNoteDetails = [] }) {
  const [showPalletTable, setShowPalletTable] = useState(false);
  const [palletRows, setPalletRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tạo danh sách sản phẩm từ goodsReceiptNoteDetails
  const productOptions = useMemo(() => {
    if (!goodsReceiptNoteDetails || goodsReceiptNoteDetails.length === 0) return [];

    return goodsReceiptNoteDetails.map(detail => ({
      value: detail.goodsReceiptNoteDetailId || detail.goodsId || "",
      label: detail.goodsName || detail.productName || "",
      unitName: detail.unitMeasureName || detail.unitName || "",
      unitsPerPackage: detail.unitPerPackage || detail.unitsPerPackage || 0
    }));
  }, [goodsReceiptNoteDetails]);

  const handleProductSelect = (idx, goodsReceiptNoteDetailId) => {
    const selectedProduct = productOptions.find(p => p.value === goodsReceiptNoteDetailId);

    setPalletRows(prev => prev.map((r, i) =>
      i === idx ? {
        ...r,
        productId: goodsReceiptNoteDetailId,
        productName: selectedProduct?.label || "",
        unitName: selectedProduct?.unitName || "",
        unitsPerPackage: selectedProduct?.unitsPerPackage || ""
      } : r
    ));
  };

  const ensureTableVisibleWithDefaultRow = async () => {
    setShowPalletTable(true);
    if (palletRows.length === 0) {
      setLoading(true);
      try {
        const response = await getGoodRNDPallet(goodsReceiptNoteId);
        if (response && response.data && response.data.length > 0) {
          // Nếu có dữ liệu từ API, sử dụng dữ liệu đó
          const fetchedPallets = response.data.map(pallet => ({
            productId: pallet.goodsReceiptNoteDetailId || pallet.productId || "",
            productName: pallet.goodsName || pallet.productName || "",
            batchCode: pallet.batchCode || "",
            unitName: pallet.unitMeasureName || pallet.unitName || "",
            unitsPerPackage: pallet.unitPerPackage || pallet.unitsPerPackage || "",
            numPackages: pallet.numPackages || ""
          }));
          setPalletRows(fetchedPallets);
        } else {
          // Nếu không có dữ liệu, tạo dòng mới
          setPalletRows([{
            productId: "",
            productName: "",
            batchCode: "",
            unitName: "",
            unitsPerPackage: "",
            numPackages: ""
          }]);
        }
      } catch (error) {
        console.error("Error fetching pallet data:", error);
        // Nếu có lỗi, vẫn tạo dòng mới
        setPalletRows([{
          productId: "",
          productName: "",
          batchCode: "",
          unitName: "",
          unitsPerPackage: "",
          numPackages: ""
        }]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="mt-3">
        <Button
          variant="outline"
          className="border-orange-300 text-orange-600 hover:bg-orange-50 h-[38px]"
          onClick={ensureTableVisibleWithDefaultRow}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Pallet
        </Button>
      </div>

      {!showPalletTable && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Lưu ý quan trọng</span>
          </div>
          <p className="text-red-600 text-sm mt-1">Bạn phải thêm ít nhất một pallet để tiếp tục.</p>
        </div>
      )}

      {showPalletTable && (
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Pallet</h3>
            <Button
              variant="outline"
              className="h-[38px] text-sm"
              onClick={() => setPalletRows(prev => ([...prev, { productId: "", productName: "", batchCode: "", unitName: "", unitsPerPackage: "", numPackages: "" }]))}
            >
              <Plus className="w-4 h-4 mr-1" /> Thêm dòng
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Tên sản phẩm</TableHead>
                <TableHead className="w-[14%]">Số Lô</TableHead>
                <TableHead className="w-[14%] text-center">Đơn vị tính</TableHead>
                <TableHead className="w-[10%] text-center">Số lượng một thùng</TableHead>
                <TableHead className="w-[12%] text-center">Số thùng</TableHead>
                <TableHead className="w-[14%]">Tổng số hộp</TableHead>
                <TableHead className="w-[8%] text-center">Hoạt động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {palletRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">Chưa có pallet nào</TableCell>
                </TableRow>
              ) : (
                palletRows.map((row, idx) => {
                  const unitsPerPackage = Number(row.unitsPerPackage) || 0;
                  const numPackages = Number(row.numPackages) || 0;
                  const totalUnits = unitsPerPackage * numPackages;
                  const hasSelectedProduct = !!row.productId;

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <FloatingDropdown
                          value={row.productId || undefined}
                          onChange={(value) => handleProductSelect(idx, value || "")}
                          options={productOptions}
                          placeholder="Chọn sản phẩm..."
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="w-full h-[38px] px-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-orange-500"
                          value={row.batchCode}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, batchCode: e.target.value } : r))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="text"
                          className={`w-full h-[38px] px-2 rounded border border-gray-300 text-sm text-center focus:outline-none focus:border-orange-500 ${hasSelectedProduct ? 'bg-gray-50' : ''}`}
                          value={row.unitName || ""}
                          readOnly={hasSelectedProduct}
                          placeholder={hasSelectedProduct ? "" : "Chọn sản phẩm..."}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="number"
                          min={0}
                          className={`w-full h-[38px] px-2 rounded border border-gray-300 text-sm text-center focus:outline-none focus:border-orange-500 ${hasSelectedProduct ? 'bg-gray-50' : ''}`}
                          value={row.unitsPerPackage || ""}
                          readOnly
                          placeholder={hasSelectedProduct ? "" : "Chọn sản phẩm..."}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="number"
                          min={0}
                          className="w-full h-[38px] px-2 rounded border border-gray-300 text-sm text-center focus:outline-none focus:border-orange-500"
                          value={row.numPackages}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, numPackages: e.target.value } : r))}
                          placeholder="Nhập số thùng"
                        />
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{totalUnits}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPalletRows(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}


