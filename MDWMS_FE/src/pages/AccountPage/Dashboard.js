import React from "react";
import { Card, Statistic, Row, Col } from "antd";
import { ShoppingCartOutlined, UserOutlined, BarChartOutlined } from "@ant-design/icons";

const Dashboard = () => {
    return (
        <div>
            <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Tổng quan hệ thống</h2>
            <Row gutter={24}>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <Statistic
                            title="Đơn hàng mới"
                            value={32}
                            prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <Statistic
                            title="Khách hàng mới"
                            value={12}
                            prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <Statistic
                            title="Doanh thu hôm nay"
                            value={15000000}
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<BarChartOutlined style={{ color: '#cf1322' }} />}
                            suffix="₫"
                        />
                    </Card>
                </Col>
            </Row>
            {/* Thêm các biểu đồ hoặc thống kê khác ở đây */}
        </div>
    );
};

export default Dashboard;
