import React from "react";
import { Modal, Form, Divider, Row, Col, Input, Select } from "antd";

const { Option } = Select;

const CreateAreaModal = ({
    isVisible,
    onCancel,
    onSubmit,
    form,
    storageConditions = [],
    loading = false
}) => {
    return (
        <Modal
            title={
                <span style={{ fontWeight: 600, fontSize: 18 }}>
                    Thêm khu vực mới
                </span>
            }
            open={isVisible}
            onCancel={onCancel}
            onOk={onSubmit}
            okText="Tạo mới"
            cancelText="Hủy"
            centered
            width={720}
            okButtonProps={{
                style: {
                    backgroundColor: "#237486",
                    borderColor: "#237486",
                },
            }}
        >
            <Divider orientation="left">Thông tin khu vực</Divider>
            <Form form={form} layout="vertical" requiredMark={false} initialValues={{ status: 1 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="areaName"
                            label={
                                <span>
                                    Tên khu vực <span style={{ color: "red" }}>*</span>
                                </span>
                            }
                            rules={[{ required: true, message: "Vui lòng nhập tên khu vực" }]}
                        >
                            <Input placeholder="VD: Khu A" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="areaCode"
                            label={
                                <span>
                                    Mã khu vực <span style={{ color: "red" }}>*</span>
                                </span>
                            }
                            rules={[{ required: true, message: "Vui lòng nhập mã khu vực" }]}
                        >
                            <Input placeholder="VD: A1" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="storageConditionId"
                            label={
                                <span>
                                    Điều kiện bảo quản <span style={{ color: "red" }}>*</span>
                                </span>
                            }
                            rules={[{ required: true, message: "Vui lòng chọn điều kiện bảo quản" }]}
                        >
                            <Select
                                placeholder="Chọn điều kiện bảo quản"
                                allowClear
                                showSearch
                                loading={!storageConditions || storageConditions.length === 0}
                                optionFilterProp="children"
                            >
                                {Array.isArray(storageConditions) && storageConditions.length > 0 ? (
                                    storageConditions.map((storage) => (
                                        <Option key={storage.storageConditionId} value={storage.storageConditionId}>
                                            {` - Nhiệt độ: ${storage.temperatureMin}°C đến ${storage.temperatureMax}°C - Độ ẩm: ${storage.humidityMin}% đến ${storage.humidityMax}%`}
                                        </Option>
                                    ))
                                ) : (
                                    <Option disabled>Không thể tải danh sách điều kiện bảo quản</Option>
                                )}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row>
                    <Col span={24}>
                        <Form.Item name="description"
                            label={
                                <span>
                                    Mô tả <span style={{ color: "red" }}>*</span>
                                </span>
                            }>
                            <Input.TextArea
                                rows={3}
                                placeholder="Nhập mô tả khu vực "
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default CreateAreaModal;
