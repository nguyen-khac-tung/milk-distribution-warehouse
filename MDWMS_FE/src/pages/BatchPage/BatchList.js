
import React, { useEffect, useState } from "react";
import { Table, Input, Button, Space, Tag, Tooltip } from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const BatchList = () => {
    const [batches, setBatches] = useState([]);
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        // Dữ liệu mẫu - thay bằng API thực tế
        const data = [
            { BatchId: 1, BatchCode: "BT0001", GoodsId: 4, ManufacturingDate: "2023-03-10", ExpiryDate: "2023-11-30", CreateAt: "2023-03-10", CreateBy: 3 },
            { BatchId: 2, BatchCode: "BT0002", GoodsId: 5, ManufacturingDate: "2023-04-05", ExpiryDate: "2023-12-20", CreateAt: "2023-04-05", CreateBy: 3 },
            { BatchId: 3, BatchCode: "BT0003", GoodsId: 4, ManufacturingDate: "2023-06-26", ExpiryDate: "2024-03-31", CreateAt: "2023-06-26", CreateBy: 3 },
            { BatchId: 4, BatchCode: "BT0004", GoodsId: 1, ManufacturingDate: "2023-02-08", ExpiryDate: "2023-11-11", CreateAt: "2023-02-08", CreateBy: 3 },
            { BatchId: 5, BatchCode: "BT0005", GoodsId: 3, ManufacturingDate: "2023-06-15", ExpiryDate: "2024-02-27", CreateAt: "2023-06-15", CreateBy: 3 },
            { BatchId: 6, BatchCode: "BT0006", GoodsId: 2, ManufacturingDate: "2023-05-20", ExpiryDate: "2024-01-25", CreateAt: "2023-05-20", CreateBy: 3 },
            { BatchId: 7, BatchCode: "BT0007", GoodsId: 5, ManufacturingDate: "2023-07-12", ExpiryDate: "2024-06-30", CreateAt: "2023-07-12", CreateBy: 3 },
            { BatchId: 8, BatchCode: "BT0008", GoodsId: 1, ManufacturingDate: "2023-01-30", ExpiryDate: "2023-10-10", CreateAt: "2023-01-30", CreateBy: 3 },
            { BatchId: 9, BatchCode: "BT0009", GoodsId: 2, ManufacturingDate: "2023-08-05", ExpiryDate: "2024-05-15", CreateAt: "2023-08-05", CreateBy: 3 },
            { BatchId: 10, BatchCode: "BT0010", GoodsId: 3, ManufacturingDate: "2023-09-01", ExpiryDate: "2024-08-20", CreateAt: "2023-09-01", CreateBy: 3 },
        ];
        setBatches(data);
    }, []);

    const handleSearch = (value) => {
        setSearchText(value.toLowerCase());
    };

    const handleReset = () => {
        setSearchText("");
    };

    const filteredData = batches.filter(
        (b) =>
            b.BatchCode.toLowerCase().includes(searchText) ||
            String(b.GoodsId).includes(searchText)
    );

    const columns = [
        {
            title: "Mã lô hàng",
            dataIndex: "BatchCode",
            key: "BatchCode",
            sorter: (a, b) => a.BatchCode.localeCompare(b.BatchCode),
            render: (text) => <b>{text}</b>,
        },
        {
            title: "Mã sản phẩm",
            dataIndex: "GoodsId",
            key: "GoodsId",
            sorter: (a, b) => a.GoodsId - b.GoodsId,
            render: (id) => <Tag color="blue">#{id}</Tag>,
        },
        {
            title: "Ngày sản xuất",
            dataIndex: "ManufacturingDate",
            key: "ManufacturingDate",
            sorter: (a, b) =>
                new Date(a.ManufacturingDate) - new Date(b.ManufacturingDate),
            render: (date) => dayjs(date).format("DD/MM/YYYY"),
        },
        {
            title: "Ngày hết hạn",
            dataIndex: "ExpiryDate",
            key: "ExpiryDate",
            sorter: (a, b) => new Date(a.ExpiryDate) - new Date(b.ExpiryDate),
            render: (date) => {
                const expired = dayjs(date).isBefore(dayjs());
                return (
                    <Tag color={expired ? "red" : "green"}>
                        {dayjs(date).format("DD/MM/YYYY")}
                    </Tag>
                );
            },
        },
        {
            title: "Người tạo",
            dataIndex: "CreateBy",
            key: "CreateBy",
            render: (id) => <Tag color="purple">Người dùng {id}</Tag>,
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        icon={<EyeOutlined style={{ color: "#1890ff" }} />} // xanh
                        size="small"
                        onClick={() => console.log("Xem:", record)}
                    />

                    <Button
                        type="link"
                        icon={<EditOutlined style={{ color: "#52c41a" }} />} // xanh lá
                        size="small"
                        onClick={() => console.log("Sửa:", record)}
                    />

                    <Button
                        type="link"
                        icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />} // đỏ
                        size="small"
                        onClick={() => console.log("Xóa:", record)}
                    />

                </Space>
            ),
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>
                    Quản lý lô hàng
                </h2>
                <Button type="primary" icon={<PlusOutlined />}>
                    Thêm lô hàng
                </Button>
            </div>

            <Space style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Tìm kiếm theo mã lô hoặc mã sản phẩm"
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                    style={{ width: 300 }}
                />
                <Tooltip title="Làm mới">
                    <Button icon={<ReloadOutlined />} onClick={handleReset} />
                </Tooltip>
            </Space>

            <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="BatchId"
                pagination={{
                    pageSize: 5,
                    showTotal: (total, range) =>
                        `${range[0]} -${range[1]} trong tổng ${total} lô hàng`,
                }}
                bordered
                size="middle"
            />
        </div>
    );
};

export default BatchList;

