import { LoginForm } from "../../../components/AuthenticationComponent/LoginForm"
import image from "../../../asset/backgroudlogin.png";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex">
            {/* Left side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    <LoginForm />
                </div>
            </div>

            {/* Right side - Decorative Panel */}
            <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
                <img
                    src={image}
                    alt="Login illustration"
                    className="w-full max-w-3xl h-[450px] object-cover rounded-2xl shadow-lg"
                />
            </div>
        </div>
    )
}
