import React from "react";
import Barcode from "react-barcode";

// Component in nhãn pallet đơn
export const PrintablePalletLabel = React.forwardRef(({ pallet }, ref) => (
    <div ref={ref} className="p-6 w-[600px] h-[400px] text-center border border-gray-200 rounded-md bg-white flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-0 leading-tight">
            MÃ PALLET
        </h2>
        <div className="flex flex-col items-center w-full mt-[20px]">
            <Barcode
                value={pallet.palletId}
                height={55}
                width={1}
                margin={10}
                displayValue={false}
                fontSize={12}
                textMargin={6}
                format="CODE128"
            />
            <p className="text-xl font-mono mt-2 text-gray-800 break-all">
                {pallet.palletId}
            </p>
        </div>
    </div>
));

// Component in nhiều pallet (2 barcode trên 1 dòng)
export const PrintableMultiplePalletLabels = React.forwardRef(({ pallets }, ref) => (
    <div ref={ref} className="bg-white" style={{ width: '100%', minHeight: '100vh' }}>
        <div
            className="max-w-[800px] mx-auto"
            style={{
                padding: '20px',
                backgroundColor: '#ffffff'
            }}
        >
            <div className="flex flex-wrap gap-4">
                {pallets.map((pallet, index) => (
                    <div
                        key={pallet.palletId}
                        className="p-4 w-[calc(50%-8px)] text-center border border-gray-200 rounded-md bg-white flex flex-col items-center justify-center"
                        style={{
                            minHeight: '200px',
                            pageBreakInside: 'avoid'
                        }}
                    >
                        <h2 className="text-3xl font-bold text-gray-800 mb-0 leading-tight">
                            MÃ PALLET
                        </h2>
                        <div className="flex flex-col items-center w-full mt-[20px]">
                            <Barcode
                                value={pallet.palletId}
                                height={55}
                                width={1}
                                margin={10}
                                displayValue={false}
                                fontSize={12}
                                textMargin={6}
                                format="CODE128"
                            />
                            <p className="text-xl font-mono mt-2 text-gray-800 break-all">
                                {pallet.palletId}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
));
