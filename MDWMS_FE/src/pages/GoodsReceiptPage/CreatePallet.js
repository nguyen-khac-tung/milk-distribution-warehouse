import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { getGoodRNDPallet } from "../../services/GoodsReceiptService";
import { getBatchDropdown } from "../../services/BatchService";
import FloatingDropdown from "../../components/Common/FloatingDropdown";
import { createPalletsBulk } from "../../services/PalletService";

export default function PalletManager({ goodsReceiptNoteId, goodsReceiptNoteDetails = [], onRegisterSubmit, onPalletCreated, hasExistingPallets = false, onSubmittingChange, onBatchCreated }) {
  const [showPalletTable, setShowPalletTable] = useState(false);
  const [palletRows, setPalletRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmitRef = useRef(null);
  const [goodsPackingByDetailId, setGoodsPackingByDetailId] = useState({});
  const refreshBatchOptionsRef = useRef(null);
  const [rowErrors, setRowErrors] = useState({}); // Lưu lỗi theo index của row

  // Tạo danh sách sản phẩm từ goodsReceiptNoteDetails
  const productOptions = useMemo(() => {
    if (!goodsReceiptNoteDetails || goodsReceiptNoteDetails.length === 0) return [];

    return goodsReceiptNoteDetails.map(detail => ({
      value: detail.goodsReceiptNoteDetailId || detail.goodsId || "",
      label: detail.goodsName || detail.productName || "",
      unitName: detail.unitMeasureName || detail.unitName || "",
      unitsPerPackage: detail.unitPerPackage || detail.unitsPerPackage || 0,
      goodsId: detail.goodsId || detail.goodsID || detail.id,
      goodsPackingId: detail.goodsPackingId || null
    }));
  }, [goodsReceiptNoteDetails]);

  // map goodsReceiptNoteDetailId -> goodsId để dùng khi load mặc định từ API
  const detailIdToGoodsId = useMemo(() => {
    const map = new Map();
    (goodsReceiptNoteDetails || []).forEach(d => {
      const key = d.goodsReceiptNoteDetailId || d.value || d.id;
      const gid = d.goodsId || d.goodsID || d.id;
      if (key) map.set(key, gid);
    });
    return map;
  }, [goodsReceiptNoteDetails]);

  // Map detailId -> actualPackageQuantity (số lượng thùng thực nhận) để validate
  const actualPackageQuantityByDetailId = useMemo(() => {
    const map = {};
    (goodsReceiptNoteDetails || []).forEach(d => {
      const key = d.goodsReceiptNoteDetailId || d.id;
      if (key) {
        map[key] = Number(d.actualPackageQuantity) || 0;
      }
    });
    return map;
  }, [goodsReceiptNoteDetails]);

  const fetchBatchOptionsByGoodsId = async (goodsId) => {
    if (!goodsId) return [];
    try {
      const res = await getBatchDropdown(goodsId);
      if (res?.success && Array.isArray(res.data)) {
        return res.data.map(b => ({ value: b.batchId || b.id, label: b.batchCode }));
      }
    } catch (e) {
      console.error("Error fetching batch dropdown:", e);
    }
    return [];
  };

  const handleProductSelect = async (idx, goodsReceiptNoteDetailId) => {
    const selectedProduct = productOptions.find(p => p.value === goodsReceiptNoteDetailId);

    // Lấy batch dropdown theo goodsId (ở đây goodsReceiptNoteDetailId đại diện cho dòng hàng)
    let batchOptions = [];
    try {
      const goodsId = selectedProduct?.goodsId;
      const res = await getBatchDropdown(goodsId);
      if (res?.success && Array.isArray(res.data)) {
        batchOptions = res.data.map(b => ({ value: b.batchId || b.id, label: b.batchCode }));
      }
    } catch (e) {
      console.error("Error fetching batch dropdown:", e);
    }

    setPalletRows(prev => prev.map((r, i) =>
      i === idx ? {
        ...r,
        productId: goodsReceiptNoteDetailId,
        productName: selectedProduct?.label || "",
        unitName: selectedProduct?.unitName || "",
        unitsPerPackage: selectedProduct?.unitsPerPackage || "",
        goodsPackingId: goodsPackingByDetailId[goodsReceiptNoteDetailId] || selectedProduct?.goodsPackingId || null,
        batchId: "",
        batchCode: "",
        batchOptions
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
          const fetchedPallets = await Promise.all(
            response.data.map(async (pallet) => {
              return {
                productId: pallet.goodsReceiptNoteDetailId || pallet.productId || "",
                productName: pallet.goodsName || pallet.productName || "",
                batchId: pallet.batchId || pallet.id || "",
                batchCode: pallet.batchCode || "",
                unitName: pallet.unitMeasureName || pallet.unitName || "",
                unitsPerPackage: pallet.unitPerPackage || pallet.unitsPerPackage || "",
                numPackages: pallet.numPackages || "",
                goodsPackingId: pallet.goodsPackingId || null,
                batchOptions: await fetchBatchOptionsByGoodsId(
                  detailIdToGoodsId.get(pallet.goodsReceiptNoteDetailId) || null
                )
              };
            })
          );
          // Lưu map goodsPackingId theo detailId để dùng khi user chọn sản phẩm
          const map = {};
          response.data.forEach(p => { map[p.goodsReceiptNoteDetailId] = p.goodsPackingId; });
          setGoodsPackingByDetailId(map);
          setPalletRows(fetchedPallets);
        } else {
          // Nếu không có dữ liệu, tạo dòng mới
          // Chọn mặc định sản phẩm đầu tiên nếu có, và load batch
          const first = productOptions[0];
          const defaultRow = {
            productId: first?.value || "",
            productName: first?.label || "",
            batchId: "",
            batchCode: "",
            unitName: first?.unitName || "",
            unitsPerPackage: first?.unitsPerPackage || "",
            numPackages: "",
            goodsPackingId: goodsPackingByDetailId[first?.value] || null,
            batchOptions: await fetchBatchOptionsByGoodsId(first?.goodsId)
          };
          setPalletRows([defaultRow]);
        }
      } catch (error) {
        console.error("Error fetching pallet data:", error);
        // Nếu có lỗi, vẫn tạo dòng mới
        const first = productOptions[0];
        const defaultRow = {
          productId: first?.value || "",
          productName: first?.label || "",
          batchId: "",
          batchCode: "",
          unitName: first?.unitName || "",
          unitsPerPackage: first?.unitsPerPackage || "",
          numPackages: "",
          goodsPackingId: goodsPackingByDetailId[first?.value] || null,
          batchOptions: await fetchBatchOptionsByGoodsId(first?.goodsId)
        };
        setPalletRows([defaultRow]);
      } finally {
        setLoading(false);
      }
    }
  };

  // Validate và trả về lỗi theo từng row
  const validateRows = () => {
    const newRowErrors = {};
    let hasErrors = false;

    // Validate từng row
    palletRows.forEach((r, idx) => {
      const rowErrors = [];
      
      if (!r.batchId) {
        rowErrors.push("Chưa chọn số lô");
      }
      if (!(Number(r.numPackages) > 0)) {
        rowErrors.push("Số thùng phải lớn hơn 0");
      }

      if (rowErrors.length > 0) {
        newRowErrors[idx] = rowErrors;
        hasErrors = true;
      }
    });

    // Validate tổng số thùng phải BẰNG số lượng thùng thực nhận cho từng mặt hàng
    const totalPackagesByProduct = {};
    palletRows.forEach((r, idx) => {
      if (r.productId && Number(r.numPackages) > 0) {
        if (!totalPackagesByProduct[r.productId]) {
          totalPackagesByProduct[r.productId] = { total: 0, rowIndices: [] };
        }
        totalPackagesByProduct[r.productId].total += Number(r.numPackages);
        totalPackagesByProduct[r.productId].rowIndices.push(idx);
      }
    });

    // Kiểm tra từng mặt hàng: tổng số thùng phải BẰNG số thùng thực nhận
    Object.keys(totalPackagesByProduct).forEach(productId => {
      const requiredQuantity = actualPackageQuantityByDetailId[productId] || 0;
      const { total, rowIndices } = totalPackagesByProduct[productId];
      const productName = productOptions.find(p => p.value === productId)?.label || productId;

      if (requiredQuantity > 0) {
        if (total > requiredQuantity) {
          const errorMsg = `Tổng số thùng vượt quá số lượng thực nhận (${requiredQuantity} thùng). Hiện tại: ${total} thùng`;
          rowIndices.forEach(idx => {
            if (!newRowErrors[idx]) newRowErrors[idx] = [];
            if (!newRowErrors[idx].includes(errorMsg)) {
              newRowErrors[idx].push(errorMsg);
            }
          });
          hasErrors = true;
        } else if (total < requiredQuantity) {
          const errorMsg = `Tổng số thùng chưa đủ (${requiredQuantity} thùng). Hiện tại: ${total} thùng`;
          rowIndices.forEach(idx => {
            if (!newRowErrors[idx]) newRowErrors[idx] = [];
            if (!newRowErrors[idx].includes(errorMsg)) {
              newRowErrors[idx].push(errorMsg);
            }
          });
          hasErrors = true;
        }
      }
    });

    setRowErrors(newRowErrors);
    return !hasErrors;
  };

  const handleSubmitCreatePallets = async () => {
    if (!goodsReceiptNoteId) {
      window.showToast?.("Thiếu mã phiếu nhập kho", "error");
      return;
    }

    // Kiểm tra nếu đã có pallet thì không cho tạo lại
    if (hasExistingPallets) {
      window.showToast?.("Đã có pallet cho phiếu nhập kho này. Không thể tạo lại!", "warning");
      return;
    }

    // Validate và hiển thị lỗi theo từng dòng
    if (!validateRows()) {
      window.showToast?.("Vui lòng kiểm tra và sửa các lỗi trong bảng", "warning");
      return;
    }

    const pallets = palletRows
      .filter(r => (Number(r.numPackages) || 0) > 0)
      .map(r => ({
        batchId: r.batchId,
        locationId: null,
        packageQuantity: Number(r.numPackages) || 0,
        goodsPackingId: r.goodsPackingId != null ? parseInt(r.goodsPackingId) : null,
        goodsReceiptNoteId: goodsReceiptNoteId
      }));

    if (pallets.length === 0) return;

    setSubmitting(true);
    // Thông báo cho parent component biết đang submitting
    if (typeof onSubmittingChange === 'function') {
      onSubmittingChange(true);
    }
    try {
      const res = await createPalletsBulk(pallets);
      if (res?.success) {
        window.showToast?.("Tạo pallet hàng loạt thành công", "success");
        // Gọi callback để thông báo cho parent component
        if (typeof onPalletCreated === 'function') {
          onPalletCreated();
        }
      } else {
        window.showToast?.(res?.message || "Tạo pallet thất bại", "error");
      }
    } catch (e) {
      console.error(e);
      window.showToast?.("Tạo pallet thất bại, vui lòng thử lại", "error");
    } finally {
      setSubmitting(false);
      // Thông báo cho parent component biết đã xong submitting
      if (typeof onSubmittingChange === 'function') {
        onSubmittingChange(false);
      }
    }
  };

  // Function để refresh batch options cho tất cả các dòng đã chọn sản phẩm
  const refreshBatchOptionsForAllRows = async () => {
    // Lấy tất cả rows hiện tại
    const currentRows = [...palletRows];
    
    // Refresh batch options cho từng row đã có sản phẩm
    const updatedRows = await Promise.all(
      currentRows.map(async (row) => {
        if (row.productId) {
          const selectedProduct = productOptions.find(p => p.value === row.productId);
          if (selectedProduct?.goodsId) {
            const batchOptions = await fetchBatchOptionsByGoodsId(selectedProduct.goodsId);
            return {
              ...row,
              batchOptions
            };
          }
        }
        return row;
      })
    );
    
    // Cập nhật state với batch options mới
    setPalletRows(updatedRows);
  };

  // Lưu function mới nhất vào ref để không trigger re-register
  handleSubmitRef.current = handleSubmitCreatePallets;
  refreshBatchOptionsRef.current = refreshBatchOptionsForAllRows;

  // Đăng ký hàm submit ra parent chỉ một lần khi mount, dùng ref để luôn gọi function mới nhất
  useEffect(() => {
    if (typeof onRegisterSubmit === 'function') {
      onRegisterSubmit(() => handleSubmitRef.current?.());
    }
    if (typeof onBatchCreated === 'function') {
      onBatchCreated(() => refreshBatchOptionsRef.current?.());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSubmit, onBatchCreated]);

  // Validate khi palletRows thay đổi (debounce)
  useEffect(() => {
    if (palletRows.length > 0 && showPalletTable) {
      const timer = setTimeout(() => {
        validateRows();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palletRows, showPalletTable]);

  return (
    <div>
      {hasExistingPallets && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Đã có pallet</span>
          </div>
          <p className="text-blue-600 text-sm mt-1">Phiếu nhập kho này đã có pallet. Vui lòng tiếp tục đến bước sắp xếp.</p>
        </div>
      )}

      {!hasExistingPallets && (
        <>
          <div className="mt-3">
            <Button
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 h-[38px]"
              onClick={ensureTableVisibleWithDefaultRow}
              disabled={hasExistingPallets}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm kệ kê hàng
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
        </>
      )}

      {hasExistingPallets && showPalletTable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Đã có pallet</span>
          </div>
          <p className="text-blue-600 text-sm mt-1">Phiếu nhập kho này đã có pallet. Không thể tạo lại.</p>
        </div>
      )}

      {showPalletTable && !hasExistingPallets && (
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">Pallet</h3>
            <Button
              variant="outline"
              className="h-[38px] text-sm"
              onClick={async () => {
                const first = productOptions[0];
                const options = await fetchBatchOptionsByGoodsId(first?.goodsId);
                setPalletRows(prev => ([...prev, { productId: first?.value || "", productName: first?.label || "", batchId: "", batchCode: "", unitName: first?.unitName || "", unitsPerPackage: first?.unitsPerPackage || "", numPackages: "", goodsPackingId: goodsPackingByDetailId[first?.value] || null, batchOptions: options }]));
              }}
            >
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[4%] text-center"></TableHead>
                <TableHead className="w-[20%]">Tên sản phẩm</TableHead>
                <TableHead className="w-[14%]">Số Lô</TableHead>
                <TableHead className="w-[12%] text-center">Đơn vị</TableHead>
                <TableHead className="w-[10%] text-center">Đơn vị/thùng</TableHead>
                <TableHead className="w-[12%] text-center">Số thùng</TableHead>
                <TableHead className="w-[14%]">Tổng số đơn vị</TableHead>
                <TableHead className="w-[8%] text-center">Hoạt động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {palletRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">Chưa có pallet nào</TableCell>
                </TableRow>
              ) : (
                palletRows.map((row, idx) => {
                  const unitsPerPackage = Number(row.unitsPerPackage) || 0;
                  const numPackages = Number(row.numPackages) || 0;
                  const totalUnits = unitsPerPackage * numPackages;
                  const hasSelectedProduct = !!row.productId;
                  const hasError = rowErrors[idx] && rowErrors[idx].length > 0;

                  return (
                    <React.Fragment key={idx}>
                      <TableRow>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 hover:bg-green-50 ${hasError ? 'border-2 border-red-500' : ''}`}
                            onClick={() => {
                              // Duplicate row với số thùng = 0
                              const duplicatedRow = {
                                ...row,
                                numPackages: 0,
                                batchId: row.batchId || "",
                                batchCode: row.batchCode || ""
                              };
                              setPalletRows(prev => {
                                const newRows = [...prev];
                                newRows.splice(idx + 1, 0, duplicatedRow);
                                return newRows;
                              });
                            }}
                            title="Thêm dòng giống mặt hàng này"
                          >
                            <Plus className="w-4 h-4 text-green-600" />
                          </Button>
                        </TableCell>
                      <TableCell>
                        <FloatingDropdown
                          value={row.productId || undefined}
                          onChange={(value) => {
                            handleProductSelect(idx, value || "");
                          }}
                          options={productOptions}
                          placeholder="Chọn sản phẩm..."
                        />
                      </TableCell>
                      <TableCell>
                        {row.batchOptions && row.batchOptions.length > 0 ? (
                          <FloatingDropdown
                            value={row.batchId || undefined}
                            onChange={(val) => {
                              const selected = row.batchOptions.find(o => o.value === val);
                              setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, batchId: val || '', batchCode: selected?.label || '' } : r));
                            }}
                            options={row.batchOptions}
                            placeholder="Chọn số lô..."
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full h-[38px] px-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-orange-500"
                            value={row.batchCode}
                            onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, batchCode: e.target.value } : r))}
                            placeholder="Chọn sản phẩm để tải số lô"
                            readOnly
                          />
                        )}

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
                          min={1}
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
                          className={hasError ? 'border-2 border-red-500' : ''}
                          onClick={() => {
                            setPalletRows(prev => prev.filter((_, i) => i !== idx));
                            // Xóa lỗi của row này
                            setRowErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[idx];
                              // Cập nhật lại index của các lỗi sau row bị xóa
                              const updatedErrors = {};
                              Object.keys(newErrors).forEach(key => {
                                const keyNum = parseInt(key);
                                if (keyNum < idx) {
                                  updatedErrors[keyNum] = newErrors[keyNum];
                                } else if (keyNum > idx) {
                                  updatedErrors[keyNum - 1] = newErrors[keyNum];
                                }
                              });
                              return updatedErrors;
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {hasError && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-red-50 py-2">
                          <div className="text-red-600 text-xs space-y-1">
                            {rowErrors[idx].map((error, errorIdx) => (
                              <div key={errorIdx} className="flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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


