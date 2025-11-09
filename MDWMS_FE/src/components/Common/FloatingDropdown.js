import React from "react";
import { Select, Spin } from "antd";
import "antd/dist/reset.css";

const { Option } = Select;

const FloatingDropdown = ({
    value,
    onChange,
    options = [],
    placeholder = "Chọn một mục...",
    loading = false,
    disabled = false,
}) => {
    return (
        <Select
            showSearch
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            loading={loading}
            className="w-full text-sm"
            popupClassName="rounded-md shadow-2xl z-[99999]"
            getPopupContainer={() => document.body}
            optionFilterProp="children"
            filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={loading ? <Spin size="small" /> : "Không có kết quả"}
            styles={{
                control: (base, state) => ({
                    ...base,
                    height: 38,
                    borderRadius: "6px",
                    borderColor: state.isFocused ? "#f97316" : "#cbd5e1", // orange-500
                    boxShadow: state.isFocused ? "0 0 0 2px rgba(249,115,22,0.2)" : "none",
                    "&:hover": { borderColor: "#f97316" },
                }),
            }}
        >
            {options.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                    {opt.label}
                </Option>
            ))}
        </Select>
    );
};

export default FloatingDropdown;
