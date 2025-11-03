import React from "react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { X, MapPin, Loader2 } from "lucide-react";

export default function LocationSuggestionModal({ 
  isOpen, 
  onClose, 
  onSelectLocation,
  suggestions = [], 
  loading = false,
  palletInfo = null
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gợi ý vị trí</h3>
            {palletInfo && (
              <p className="text-sm text-gray-500 mt-1">
                Pallet: {palletInfo?.palletCode || palletInfo?.code || palletInfo?.palletId || 'N/A'}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Không có vị trí gợi ý</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">STT</TableHead>
                    <TableHead>Mã vị trí</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Kệ</TableHead>
                    <TableHead>Hàng</TableHead>
                    <TableHead>Cột</TableHead>
                    <TableHead className="w-[15%] text-center">Hoạt động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((location, index) => (
                    <TableRow key={location?.locationId || location?.id || index}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {location?.locationCode || location?.code || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {location?.areaName || location?.area?.areaName || 'N/A'}
                      </TableCell>
                      <TableCell>{location?.rack || 'N/A'}</TableCell>
                      <TableCell>{location?.row || 'N/A'}</TableCell>
                      <TableCell>{location?.column || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => onSelectLocation && onSelectLocation(location)}
                          className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          Chọn
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button
            onClick={onClose}
            className="h-[38px] px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

