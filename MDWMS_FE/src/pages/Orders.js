import React from "react";
import { Table, Button, Space, Tag, Select, DatePicker, Input } from "antd";
import { EyeOutlined, EditOutlined, PrinterOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Orders = () => {
    // Dữ liệu cứng cho đơn hàng
    const orders = [
        {
            id: "DH001",
            customerName: "Nguyễn Văn A",
            customerPhone: "0123456789",
            orderDate: "2024-01-15",
            totalAmount: 85000,
            status: "pending",
            paymentMethod: "COD",
            items: [
                { name: "Sữa tươi Vinamilk 100%", quantity: 2, price: 25000 },
                { name: "Sữa chua Probi", quantity: 2, price: 18000 }
            ]
        },
        {
            id: "DH002",
            customerName: "Trần Thị B",
            customerPhone: "0987654321",
            orderDate: "2024-01-15",
            totalAmount: 150000,
            status: "confirmed",
            paymentMethod: "Bank Transfer",
            items: [
                { name: "Sữa bột Dielac", quantity: 1, price: 180000 }
            ]
        },
        {
            id: "DH003",
            customerName: "Lê Văn C",
            customerPhone: "0369852147",
            orderDate: "2024-01-14",
            totalAmount: 64000,
            status: "shipped",
            paymentMethod: "COD",
            items: [
                { name: "Sữa đặc Ông Thọ", quantity: 2, price: 32000 }
            ]
        },
        {
            id: "DH004",
            customerName: "Phạm Thị D",
            customerPhone: "0741258963",
            orderDate: "2024-01-14",
            totalAmount: 24000,
            status: "delivered",
            paymentMethod: "COD",
            items: [
                { name: "Sữa đậu nành Fami", quantity: 2, price: 12000 }
            ]
        },
        {
            id: "DH005",
            customerName: "Hoàng Văn E",
            customerPhone: "0852147963",
            orderDate: "2024-01-13",
            totalAmount: 125000,
            status: "cancelled",
            paymentMethod: "Bank Transfer",
            items: [
                { name: "Sữa tươi Vinamilk 100%", quantity: 5, price: 25000 }
            ]
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "orange";
            case "confirmed": return "blue";
            case "shipped": return "cyan";
            case "delivered": return "green";
            case "cancelled": return "red";
            default: return "default";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "pending": return "Chờ xác nhận";
            case "confirmed": return "Đã xác nhận";
            case "shipped": return "Đang giao";
            case "delivered": return "Đã giao";
            case "cancelled": return "Đã hủy";
            default: return status;
        }
    };

    const columns = [
        {
            title: "Mã đơn hàng",
            dataIndex: "id",
            key: "id",
            render: (id) => <strong>{id}</strong>
        },
        {
            title: "Khách hàng",
            key: "customer",
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.customerName}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{record.customerPhone}</div>
                </div>
            )
        },
        {
            title: "Ngày đặt",
            dataIndex: "orderDate",
            key: "orderDate",
            sorter: (a, b) => new Date(a.orderDate) - new Date(b.orderDate),
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalAmount",
            key: "totalAmount",
            sorter: (a, b) => a.totalAmount - b.totalAmount,
            render: (amount) => `${amount.toLocaleString('vi-VN')} ₫`
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: "Chờ xác nhận", value: "pending" },
                { text: "Đã xác nhận", value: "confirmed" },
                { text: "Đang giao", value: "shipped" },
                { text: "Đã giao", value: "delivered" },
                { text: "Đã hủy", value: "cancelled" },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            )
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            filters: [
                { text: "COD", value: "COD" },
                { text: "Chuyển khoản", value: "Bank Transfer" },
            ],
            onFilter: (value, record) => record.paymentMethod === value,
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" icon={<EyeOutlined />} size="small">
                        Xem
                    </Button>
                    <Button type="link" icon={<EditOutlined />} size="small">
                        Sửa
                    </Button>
                    <Button type="link" icon={<PrinterOutlined />} size="small">
                        In
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>Quản lý đơn hàng</h2>
            </div>

            <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Search
                    placeholder="Tìm kiếm đơn hàng..."
                    style={{ width: 300 }}
                    allowClear
                />
                <Select placeholder="Lọc theo trạng thái" style={{ width: 200 }} allowClear>
                    <Option value="pending">Chờ xác nhận</Option>
                    <Option value="confirmed">Đã xác nhận</Option>
                    <Option value="shipped">Đang giao</Option>
                    <Option value="delivered">Đã giao</Option>
                    <Option value="cancelled">Đã hủy</Option>
                </Select>
                <RangePicker placeholder={["Từ ngày", "Đến ngày"]} style={{ width: 250 }} />
                <Select placeholder="Phương thức thanh toán" style={{ width: 200 }} allowClear>
                    <Option value="COD">COD</Option>
                    <Option value="Bank Transfer">Chuyển khoản</Option>
                </Select>
            </div>

            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                pagination={{
                    total: orders.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
                }}
            />
        </div>
    );
};

export default Orders;
