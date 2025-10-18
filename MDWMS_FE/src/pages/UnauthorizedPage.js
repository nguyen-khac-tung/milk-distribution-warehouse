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
            backgroundColor: '#f5f5f5',
            position: 'relative'
        }}>
            {/* Background 403 */}
            <div style={{
                position: 'absolute',
                fontSize: '200px',
                fontWeight: 'bold',
                color: 'rgba(16, 12, 12, 0.15)',
                zIndex: 1,
                userSelect: 'none',
                pointerEvents: 'none',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap'
            }}>
                403
            </div>
            
            <div style={{ position: 'relative', zIndex: 0, transform: 'translateY(-20px)' }}>
                <Result
                    status="403"
                    title=""
                    subTitle=""
                    style={{
                        fontSize: '120px',
                    }}
                    extra={
                        <div style={{ textAlign: 'center' }}>
                            <p style={{
                                color: 'red',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                marginTop: '30px',
                                marginBottom: '30px'
                            }}>
                                Xin lỗi, bạn không có quyền truy cập trang này.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <Button 
                                    type="primary" 
                                    onClick={() => navigate('/dashboard')}
                                    style={{ 
                                        backgroundColor: '#f97316', 
                                        borderColor: '#f97316',
                                        height: '38px'
                                    }}
                                >
                                    Về trang chủ
                                </Button>
                                <Button 
                                    onClick={() => navigate(-1)}
                                    style={{ 
                                        borderColor: '#f97316', 
                                        color: '#f97316',
                                        height: '38px'
                                    }}
                                >
                                    Quay lại
                                </Button>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default UnauthorizedPage;
