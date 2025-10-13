import React from "react";
import { Modal, Form, Divider, Row, Col, Select, Input as AntInput, InputNumber } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

const { Option } = Select;

const CreateLocationModal = ({
    isVisible,
    onCancel,
    onSubmit,
    form,
    areas = [],
    loading = false
}) => {
    return (
        <Modal
            title={
                <span style={{ fontWeight: 600, fontSize: 18 }}>
                    Thêm vị trí mới
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
            <Divider orientation="left">Thông tin cơ bản</Divider>
            <Form
                form={form}
                layout="vertical"
                size="middle"
                requiredMark={false}
                style={{ marginTop: 10 }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="areaId"
                            label="Khu vực"
                            rules={[{ required: true, message: "Vui lòng chọn khu vực" }]}
                        >
                            <Select
                                placeholder="Chọn khu vực"
                                allowClear
                                showSearch
                                loading={!areas || areas.length === 0}
                            >
                                {Array.isArray(areas) ? (
                                    areas.map((area) => (
                                        <Option key={area.areaId} value={area.areaId}>
                                            {area.areaName || `Khu vực ${area.areaId}`}
                                        </Option>
                                    ))
                                ) : (
                                    <Option disabled>Không thể tải danh sách khu vực</Option>
                                )}
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="locationCode"
                            label="Mã vị trí"
                            rules={[{ required: true, message: "Vui lòng nhập mã vị trí" }]}
                        >
                            <AntInput
                                placeholder="VD: A1-01"
                                maxLength={20}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="rack"
                            label="Kệ"
                            rules={[{ required: true, message: "Vui lòng nhập tên kệ" }]}
                        >
                            <AntInput
                                placeholder="VD: Kệ A1"
                                maxLength={50}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item
                            name="row"
                            label="Hàng (Row)"
                            rules={[{ required: true, message: "Vui lòng nhập hàng" }]}
                        >
                            <InputNumber
                                min={1}
                                style={{ width: "100%" }}
                                placeholder="VD: 1"
                            />
                        </Form.Item>
                    </Col>

                    <Col span={6}>
                        <Form.Item
                            name="column"
                            label="Cột (Column)"
                            rules={[{ required: true, message: "Vui lòng nhập cột" }]}
                        >
                            <InputNumber
                                min={1}
                                style={{ width: "100%" }}
                                placeholder="VD: 3"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Trạng thái vị trí</Divider>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="isAvailable"
                            label="Tình trạng sử dụng"
                            rules={[{ required: true, message: "Vui lòng chọn tình trạng" }]}
                        >
                            <Select
                                placeholder="Chọn tình trạng"
                                suffixIcon={<CheckCircleOutlined />}
                            >
                                <Option value={true}>Trống</Option>
                                <Option value={false}>Đang sử dụng</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default CreateLocationModal;
