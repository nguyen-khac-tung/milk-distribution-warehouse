import React from "react";
import { Table, Button, Space, Tag, Image, Input, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

const Products = () => {
    // Dữ liệu cứng cho sản phẩm
    const products = [
        {
            id: 1,
            name: "Sữa tươi Vinamilk 100%",
            category: "Sữa tươi",
            price: 25000,
            stock: 150,
            image: "https://via.placeholder.com/60x60?text=Milk1",
            status: "active",
            description: "Sữa tươi nguyên chất 100%"
        },
        {
            id: 2,
            name: "Sữa chua Probi",
            category: "Sữa chua",
            price: 18000,
            stock: 89,
            image: "https://via.placeholder.com/60x60?text=Yogurt",
            status: "active",
            description: "Sữa chua có lợi khuẩn"
        },
        {
            id: 3,
            name: "Sữa đặc Ông Thọ",
            category: "Sữa đặc",
            price: 32000,
            stock: 45,
            image: "https://via.placeholder.com/60x60?text=Condensed",
            status: "active",
            description: "Sữa đặc có đường"
        },
        {
            id: 4,
            name: "Sữa bột Dielac",
            category: "Sữa bột",
            price: 180000,
            stock: 23,
            image: "https://via.placeholder.com/60x60?text=Formula",
            status: "active",
            description: "Sữa bột dinh dưỡng cho trẻ em"
        },
        {
            id: 5,
            name: "Sữa đậu nành Fami",
            category: "Sữa đậu nành",
            price: 12000,
            stock: 0,
            image: "https://via.placeholder.com/60x60?text=Soy",
            status: "inactive",
            description: "Sữa đậu nành nguyên chất"
        }
    ];

    const columns = [
        {
            title: "Hình ảnh",
            dataIndex: "image",
            key: "image",
            width: 80,
            render: (image) => (
                <Image
                    width={50}
                    height={50}
                    src={image}
                    style={{ borderRadius: 4 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                />
            )
        },
        {
            title: "Tên sản phẩm",
            dataIndex: "name",
            key: "name",
            filteredValue: null,
            onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
            filters: [
                { text: "Sữa tươi", value: "Sữa tươi" },
                { text: "Sữa chua", value: "Sữa chua" },
                { text: "Sữa đặc", value: "Sữa đặc" },
                { text: "Sữa bột", value: "Sữa bột" },
                { text: "Sữa đậu nành", value: "Sữa đậu nành" },
            ],
            onFilter: (value, record) => record.category === value,
        },
        {
            title: "Giá (₫)",
            dataIndex: "price",
            key: "price",
            sorter: (a, b) => a.price - b.price,
            render: (price) => price.toLocaleString('vi-VN')
        },
        {
            title: "Tồn kho",
            dataIndex: "stock",
            key: "stock",
            sorter: (a, b) => a.stock - b.stock,
            render: (stock) => (
                <Tag color={stock > 50 ? "green" : stock > 0 ? "orange" : "red"}>
                    {stock}
                </Tag>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: "Hoạt động", value: "active" },
                { text: "Ngừng bán", value: "inactive" },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => (
                <Tag color={status === "active" ? "green" : "red"}>
                    {status === "active" ? "Hoạt động" : "Ngừng bán"}
                </Tag>
            )
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<EditOutlined />} size="small">
                        Sửa
                    </Button>
                    <Button type="link" danger icon={<DeleteOutlined />} size="small">
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>Quản lý sản phẩm</h2>
                <Button type="primary" icon={<PlusOutlined />}>
                    Thêm sản phẩm
                </Button>
            </div>

            <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
                <Search
                    placeholder="Tìm kiếm sản phẩm..."
                    style={{ width: 300 }}
                    allowClear
                />
                <Select placeholder="Lọc theo danh mục" style={{ width: 200 }} allowClear>
                    <Option value="Sữa tươi">Sữa tươi</Option>
                    <Option value="Sữa chua">Sữa chua</Option>
                    <Option value="Sữa đặc">Sữa đặc</Option>
                    <Option value="Sữa bột">Sữa bột</Option>
                    <Option value="Sữa đậu nành">Sữa đậu nành</Option>
                </Select>
            </div>

            <Table
                columns={columns}
                dataSource={products}
                rowKey="id"
                pagination={{
                    total: products.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`,
                }}
            />
        </div>
    );
};

export default Products;
