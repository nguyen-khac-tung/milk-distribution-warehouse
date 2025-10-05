import React from "react";
import { Card, Row, Col, Statistic, Table, DatePicker, Select, Button } from "antd";
import {
    ShoppingCartOutlined,
    DollarOutlined,
    UserOutlined,
    RiseOutlined,
    FileTextOutlined,
    DownloadOutlined
} from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
    // Dữ liệu thống kê cứng
    const statistics = [
        {
            title: "Tổng đơn hàng",
            value: 1250,
            prefix: <ShoppingCartOutlined style={{ color: '#1890ff' }} />,
            suffix: "đơn",
            precision: 0
        },
        {
            title: "Doanh thu tháng",
            value: 45000000,
            prefix: <DollarOutlined style={{ color: '#52c41a' }} />,
            suffix: "₫",
            precision: 0
        },
        {
            title: "Khách hàng mới",
            value: 85,
            prefix: <UserOutlined style={{ color: '#722ed1' }} />,
            suffix: "người",
            precision: 0
        },
        {
            title: "Tăng trưởng",
            value: 12.5,
            prefix: <RiseOutlined style={{ color: '#fa8c16' }} />,
            suffix: "%",
            precision: 1
        }
    ];

    // Dữ liệu báo cáo sản phẩm bán chạy
    const topProducts = [
        {
            key: 1,
            name: "Sữa tươi Vinamilk 100%",
            category: "Sữa tươi",
            sold: 450,
            revenue: 11250000,
            rank: 1
        },
        {
            key: 2,
            name: "Sữa chua Probi",
            category: "Sữa chua",
            sold: 320,
            revenue: 5760000,
            rank: 2
        },
        {
            key: 3,
            name: "Sữa đặc Ông Thọ",
            category: "Sữa đặc",
            sold: 280,
            revenue: 8960000,
            rank: 3
        },
        {
            key: 4,
            name: "Sữa bột Dielac",
            category: "Sữa bột",
            sold: 150,
            revenue: 27000000,
            rank: 4
        },
        {
            key: 5,
            name: "Sữa đậu nành Fami",
            category: "Sữa đậu nành",
            sold: 95,
            revenue: 1140000,
            rank: 5
        }
    ];

    const productColumns = [
        {
            title: "Xếp hạng",
            dataIndex: "rank",
            key: "rank",
            width: 80,
            render: (rank) => (
                <span style={{
                    fontWeight: 'bold',
                    color: rank <= 3 ? '#1890ff' : '#666',
                    fontSize: rank <= 3 ? '16px' : '14px'
                }}>
                    #{rank}
                </span>
            )
        },
        {
            title: "Tên sản phẩm",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
        },
        {
            title: "Đã bán",
            dataIndex: "sold",
            key: "sold",
            sorter: (a, b) => a.sold - b.sold,
            render: (sold) => <span style={{ fontWeight: 500 }}>{sold.toLocaleString()}</span>
        },
        {
            title: "Doanh thu",
            dataIndex: "revenue",
            key: "revenue",
            sorter: (a, b) => a.revenue - b.revenue,
            render: (revenue) => (
                <span style={{ fontWeight: 500, color: '#52c41a' }}>
                    {revenue.toLocaleString('vi-VN')} ₫
                </span>
            )
        }
    ];

    // Dữ liệu báo cáo theo ngày
    const dailyReports = [
        {
            key: 1,
            date: "2024-01-15",
            orders: 25,
            revenue: 1850000,
            customers: 22
        },
        {
            key: 2,
            date: "2024-01-14",
            orders: 18,
            revenue: 1420000,
            customers: 16
        },
        {
            key: 3,
            date: "2024-01-13",
            orders: 32,
            revenue: 2680000,
            customers: 28
        },
        {
            key: 4,
            date: "2024-01-12",
            orders: 28,
            revenue: 1950000,
            customers: 25
        },
        {
            key: 5,
            date: "2024-01-11",
            orders: 22,
            revenue: 1680000,
            customers: 20
        }
    ];

    const dailyColumns = [
        {
            title: "Ngày",
            dataIndex: "date",
            key: "date",
            sorter: (a, b) => new Date(a.date) - new Date(b.date),
        },
        {
            title: "Số đơn hàng",
            dataIndex: "orders",
            key: "orders",
            sorter: (a, b) => a.orders - b.orders,
        },
        {
            title: "Doanh thu",
            dataIndex: "revenue",
            key: "revenue",
            sorter: (a, b) => a.revenue - b.revenue,
            render: (revenue) => `${revenue.toLocaleString('vi-VN')} ₫`
        },
        {
            title: "Khách hàng",
            dataIndex: "customers",
            key: "customers",
            sorter: (a, b) => a.customers - b.customers,
        }
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 24, margin: 0 }}>Báo cáo & Thống kê</h2>
                <Button type="primary" icon={<DownloadOutlined />}>
                    Xuất báo cáo
                </Button>
            </div>

            {/* Bộ lọc */}
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={8}>
                        <RangePicker style={{ width: '100%' }} placeholder={["Từ ngày", "Đến ngày"]} />
                    </Col>
                    <Col span={6}>
                        <Select placeholder="Loại báo cáo" style={{ width: '100%' }} defaultValue="all">
                            <Option value="all">Tất cả</Option>
                            <Option value="products">Sản phẩm</Option>
                            <Option value="orders">Đơn hàng</Option>
                            <Option value="customers">Khách hàng</Option>
                        </Select>
                    </Col>
                    <Col span={6}>
                        <Select placeholder="Khoảng thời gian" style={{ width: '100%' }} defaultValue="month">
                            <Option value="week">Tuần</Option>
                            <Option value="month">Tháng</Option>
                            <Option value="quarter">Quý</Option>
                            <Option value="year">Năm</Option>
                        </Select>
                    </Col>
                    <Col span={4}>
                        <Button type="primary" icon={<FileTextOutlined />} style={{ width: '100%' }}>
                            Tạo báo cáo
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Thống kê tổng quan */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
                {statistics.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card>
                            <Statistic
                                title={stat.title}
                                value={stat.value}
                                prefix={stat.prefix}
                                suffix={stat.suffix}
                                precision={stat.precision}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={24}>
                {/* Top sản phẩm bán chạy */}
                <Col xs={24} lg={12}>
                    <Card title="Top sản phẩm bán chạy" style={{ marginBottom: 24 }}>
                        <Table
                            columns={productColumns}
                            dataSource={topProducts}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>

                {/* Báo cáo theo ngày */}
                <Col xs={24} lg={12}>
                    <Card title="Báo cáo theo ngày" style={{ marginBottom: 24 }}>
                        <Table
                            columns={dailyColumns}
                            dataSource={dailyReports}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Biểu đồ có thể thêm ở đây */}
            <Card title="Biểu đồ doanh thu">
                <div style={{
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5',
                    borderRadius: 8
                }}>
                    <p style={{ color: '#999', fontSize: 16 }}>
                        Biểu đồ doanh thu sẽ được hiển thị ở đây
                        <br />
                        (Có thể tích hợp Chart.js hoặc Ant Design Charts)
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Reports;
