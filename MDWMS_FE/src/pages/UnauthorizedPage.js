import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
    const navigate = useNavigate();
    
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <Result
                status="403"
                title="403"
                subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
                extra={
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button type="primary" onClick={() => navigate('/dashboard')}>
                            Về trang chủ
                        </Button>
                        <Button onClick={() => navigate(-1)}>
                            Quay lại
                        </Button>
                    </div>
                }
            />
        </div>
    );
};

export default UnauthorizedPage;
