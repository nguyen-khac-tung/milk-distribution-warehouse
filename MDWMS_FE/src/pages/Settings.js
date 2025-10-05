import React, { useState } from "react";
import { Card, Form, Input, Button, Switch, Select, Divider, message, Row, Col, Avatar, Upload } from "antd";
import { UserOutlined, SettingOutlined, BellOutlined, LockOutlined, UploadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Dữ liệu cứng cho cài đặt
    const currentSettings = {
        companyName: "Cửa hàng sữa ABC",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        phone: "0123456789",
        email: "contact@abc-milk.com",
        website: "www.abc-milk.com",
        taxCode: "123456789",
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
        language: "vi",
        notifications: {
            email: true,
            sms: false,
            push: true
        },
        business: {
            autoConfirm: false,
            lowStockAlert: true,
            stockThreshold: 10,
            workingHours: "08:00-17:00"
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success('Cài đặt đã được lưu thành công!');
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu cài đặt!');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (values) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success('Mật khẩu đã được thay đổi thành công!');
            form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
        } catch (error) {
            message.error('Có lỗi xảy ra khi thay đổi mật khẩu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Cài đặt hệ thống</h2>

            <Row gutter={24}>
                {/* Thông tin công ty */}
                <Col xs={24} lg={12}>
                    <Card title={<><SettingOutlined /> Thông tin công ty</>} style={{ marginBottom: 24 }}>
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={currentSettings}
                            onFinish={handleSubmit}
                        >
                            <Form.Item
                                label="Tên công ty"
                                name="companyName"
                                rules={[{ required: true, message: 'Vui lòng nhập tên công ty!' }]}
                            >
                                <Input placeholder="Nhập tên công ty" />
                            </Form.Item>

                            <Form.Item
                                label="Địa chỉ"
                                name="address"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                            >
                                <TextArea rows={3} placeholder="Nhập địa chỉ công ty" />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Số điện thoại"
                                        name="phone"
                                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                                    >
                                        <Input placeholder="Nhập số điện thoại" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập email!' },
                                            { type: 'email', message: 'Email không hợp lệ!' }
                                        ]}
                                    >
                                        <Input placeholder="Nhập email" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Website"
                                        name="website"
                                    >
                                        <Input placeholder="Nhập website" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Mã số thuế"
                                        name="taxCode"
                                    >
                                        <Input placeholder="Nhập mã số thuế" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Lưu thông tin
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* Cài đặt hệ thống */}
                <Col xs={24} lg={12}>
                    <Card title={<><BellOutlined /> Cài đặt hệ thống</>} style={{ marginBottom: 24 }}>
                        <Form layout="vertical" initialValues={currentSettings}>
                            <Form.Item label="Tiền tệ" name="currency">
                                <Select>
                                    <Option value="VND">Việt Nam Đồng (₫)</Option>
                                    <Option value="USD">US Dollar ($)</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Múi giờ" name="timezone">
                                <Select>
                                    <Option value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</Option>
                                    <Option value="Asia/Bangkok">GMT+7 (Thái Lan)</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Ngôn ngữ" name="language">
                                <Select>
                                    <Option value="vi">Tiếng Việt</Option>
                                    <Option value="en">English</Option>
                                </Select>
                            </Form.Item>

                            <Divider>Thông báo</Divider>

                            <Form.Item label="Email thông báo" name={['notifications', 'email']} valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Form.Item label="SMS thông báo" name={['notifications', 'sms']} valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Form.Item label="Push notification" name={['notifications', 'push']} valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Divider>Kinh doanh</Divider>

                            <Form.Item label="Tự động xác nhận đơn hàng" name={['business', 'autoConfirm']} valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Form.Item label="Cảnh báo hết hàng" name={['business', 'lowStockAlert']} valuePropName="checked">
                                <Switch />
                            </Form.Item>

                            <Form.Item label="Ngưỡng cảnh báo tồn kho" name={['business', 'stockThreshold']}>
                                <Input type="number" placeholder="Số lượng" />
                            </Form.Item>

                            <Form.Item label="Giờ làm việc" name={['business', 'workingHours']}>
                                <Input placeholder="VD: 08:00-17:00" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" loading={loading}>
                                    Lưu cài đặt
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {/* Đổi mật khẩu */}
            <Card title={<><LockOutlined /> Đổi mật khẩu</>} style={{ marginBottom: 24 }}>
                <Form
                    layout="vertical"
                    onFinish={handlePasswordChange}
                    style={{ maxWidth: 400 }}
                >
                    <Form.Item
                        label="Mật khẩu hiện tại"
                        name="currentPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Thông tin tài khoản */}
            <Card title={<><UserOutlined /> Thông tin tài khoản</>}>
                <Row gutter={24} align="middle">
                    <Col>
                        <Avatar size={80} icon={<UserOutlined />} />
                    </Col>
                    <Col flex="auto">
                        <div>
                            <h4 style={{ margin: 0, marginBottom: 8 }}>Nguyễn Văn A</h4>
                            <p style={{ margin: 0, color: '#666' }}>Quản trị viên</p>
                            <p style={{ margin: 0, color: '#666', fontSize: 12 }}>Tham gia: 15/01/2024</p>
                        </div>
                    </Col>
                    <Col>
                        <Upload>
                            <Button icon={<UploadOutlined />}>Đổi avatar</Button>
                        </Upload>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default Settings;
