import { LoginForm } from "../../../components/AuthenticationComponent/LoginForm"
import image from "../../../asset/backgroudlogin.png";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #FFF3E0, #fcf7f8)" }}>
            {/* Left side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8" >
                <div className="w-full max-w-md">
                    <LoginForm />
                </div>
            </div>

            {/* Right side - Decorative Panel */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" >
                <div className="relative w-full max-w-4xl">
                    <img
                        src={image}
                        alt="Login illustration"
                        className="w-full h-[500px] object-cover rounded-2xl shadow-2xl"
                    />
                    {/* Overlay gradient for better text readability if needed */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
            </div>
        </div>
    )
}