import React from "react";
import { LoginFormWithLogic } from "./LoginFormWithLogic";

export const Newsletter = () => {

    return (
        <div className="flex overflow-hidden relative flex-col gap-1 justify-center items-center pt-4 w-full h-full pb-8 px-4 sm:px-6 md:px-8">
            <div>
                <h3 className="login-title">
                     HỆ THỐNG PHÂN PHỐI KHO SỮA
                </h3>
            </div>

            <div className="flex flex-col items-center min-h-0 shrink -mt-4">
                <div className="login-form-container">
                    <h2 className="login-main-title">Đăng nhập tài khoản</h2>
                    <p className="login-description">Nhập thông tin đăng nhập để truy cập vào không gian làm việc</p>
                    <LoginFormWithLogic
                        input={(props) => (
                            <input
                                autoCapitalize="off"
                                autoComplete="email"
                                className="login-input"
                                {...props}
                            />
                        )}
                        submit={(props) => (
                            <button
                                className="login-manifesto-btn w-full"
                                {...props}
                            >
                                {props.children || (
                                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

