import React from "react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

export default function RejectReasonModal({ isOpen, reason, setReason, onCancel, onConfirm, selectedDetails, rejectReasons, setRejectReasons }) {
  if (!isOpen) return null;

  const isMultipleReject = selectedDetails && selectedDetails.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className={`bg-white p-6 rounded-lg shadow-xl ${isMultipleReject ? 'max-w-4xl w-full mx-4' : 'max-w-md w-full'}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {isMultipleReject ? `Nhập lý do từ chối (${selectedDetails.length} mặt hàng)` : "Nhập lý do từ chối"}
        </h3>

        {isMultipleReject ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-semibold text-gray-700 text-center w-16">STT</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mã hàng</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tên hàng</TableHead>
                  <TableHead className="font-semibold text-gray-700">Lý do từ chối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDetails.map((detail, index) => (
                  <TableRow key={detail.goodsReceiptNoteDetailId}>
                    <TableCell className="text-center text-gray-600 text-sm">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 text-sm">
                      {detail.goodsCode}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {detail.goodsName}
                    </TableCell>
                    <TableCell>
                      <textarea
                        className="w-full h-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 text-sm resize-none"
                        placeholder="Nhập lý do từ chối (tối đa 255 ký tự)"
                        maxLength={255}
                        value={rejectReasons[detail.goodsReceiptNoteDetailId] || ""}
                        onChange={(e) => {
                          setRejectReasons(prev => ({
                            ...prev,
                            [detail.goodsReceiptNoteDetailId]: e.target.value
                          }));
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <textarea
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Nhập lý do từ chối (tối đa 255 ký tự)"
            maxLength={255}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-4 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-[38px] px-8 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-[38px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}


