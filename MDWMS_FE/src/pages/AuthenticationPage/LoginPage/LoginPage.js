import React from "react";
import { Background } from "../../../components/ui/login/backgroundlogin";
import { Footer } from "../../../components/ui/login/footerlogin";
import { Newsletter } from "../../../components/ui/login/newsletterlogin";
import "../../../components/ui/login/login.css";

export default function LoginPage() {
    return (
        <div className="login-container">
            <Background 
                src="/alt.mp4" 
                placeholder="/alt.png" 
            />
            <div className="login-content">
                <Newsletter />
            </div>
            <Footer />
        </div>
    );
}
