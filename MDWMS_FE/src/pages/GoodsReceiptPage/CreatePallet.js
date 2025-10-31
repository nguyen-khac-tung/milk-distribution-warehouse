import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Trash2, AlertCircle } from "lucide-react";

export default function PalletManager() {
  const [showPalletTable, setShowPalletTable] = useState(false);
  const [palletRows, setPalletRows] = useState([]);

  const ensureTableVisibleWithDefaultRow = () => {
    setShowPalletTable(true);
    setPalletRows(prev => (prev.length > 0 ? prev : [{
      productName: "",
      batchCode: "",
      unitName: "",
      unitsPerPackage: "",
      numPackages: ""
    }]));
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
              className="h-[32px] text-sm"
              onClick={() => setPalletRows(prev => ([...prev, { productName: "", batchCode: "", unitName: "", unitsPerPackage: "", numPackages: "" }]))}
            >
              <Plus className="w-4 h-4 mr-1" /> Thêm dòng
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Tên phẩm</TableHead>
                <TableHead className="w-[14%]">Số Lô</TableHead>
                <TableHead className="w-[14%]">Đơn vị tính</TableHead>
                <TableHead className="w-[16%]">Số lượng một thùng</TableHead>
                <TableHead className="w-[12%]">Số thùng</TableHead>
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
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <input
                          type="text"
                          className="w-full h-8 px-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-orange-500"
                          value={row.productName}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, productName: e.target.value } : r))}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="w-full h-8 px-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-orange-500"
                          value={row.batchCode}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, batchCode: e.target.value } : r))}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          className="w-full h-8 px-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-orange-500"
                          value={row.unitName}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, unitName: e.target.value } : r))}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min={0}
                          className="w-full h-8 px-2 rounded border border-gray-300 text-sm text-right focus:outline-none focus:border-orange-500"
                          value={row.unitsPerPackage}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, unitsPerPackage: e.target.value } : r))}
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="number"
                          min={0}
                          className="w-full h-8 px-2 rounded border border-gray-300 text-sm text-right focus:outline-none focus:border-orange-500"
                          value={row.numPackages}
                          onChange={e => setPalletRows(prev => prev.map((r, i) => i === idx ? { ...r, numPackages: e.target.value } : r))}
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


