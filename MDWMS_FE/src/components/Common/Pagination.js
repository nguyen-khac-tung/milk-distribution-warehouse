import React from "react";
import { Button } from "antd";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import FilterDropdown from "./FilterDropdown";

const Pagination = ({
    current = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onPageSizeChange,
    showPageSize = true,
    pageSizeOptions = [10, 20, 30, 40],
    className = "",
    style = {}
}) => {
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    const handlePrevious = () => {
        if (current > 1) {
            onPageChange(current - 1);
        }
    };

    const handleNext = () => {
        if (current < totalPages) {
            onPageChange(current + 1);
        }
    };

    const handlePageSizeChange = (newPageSize) => {
        onPageSizeChange(newPageSize);
    };

    if (total === 0) {
        return null;
    }

    return (
        <Card className={className} style={style}>
            <CardContent style={{ paddingTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                        Hiển thị {startItem} - {endItem} trong tổng số {total} mục
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {/* Navigation Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Button
                                style={{ border: "none", background: "white" }}
                                size="small"
                                onClick={handlePrevious}
                                disabled={current <= 1}
                            >
                                Trước
                            </Button>
                            <span style={{ fontSize: "14px", color: "#64748b" }}>
                                Trang {current} / {totalPages}
                            </span>
                            <Button
                                style={{ border: "none", background: "white" }}
                                size="small"
                                onClick={handleNext}
                                disabled={current >= totalPages}
                            >
                                Sau
                            </Button>
                        </div>

                        {/* Page Size Selector */}
                        {showPageSize && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "14px", color: "#64748b" }}>Hiển thị:</span>
                                <FilterDropdown
                                    type="pageSize"
                                    value={pageSize}
                                    onFilterChange={handlePageSizeChange}
                                    onClearFilter={() => handlePageSizeChange(10)}
                                    options={pageSizeOptions.map(size => ({ value: size, label: size.toString() }))}
                                    placeholder="10"
                                    className="page-size-filter-dropdown"
                                />
                                <span style={{ fontSize: "14px", color: "#64748b" }}>/ Trang</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default Pagination;
