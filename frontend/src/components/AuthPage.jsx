import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import API_BASE_URL from '../config/api'

export default function AuthPage() {
    const [tab, setTab] = useState('signIn') // 'signIn' | 'signUp'
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Sign In State
    const [signInData, setSignInData] = useState({
        email: '',
        password: '',
        rememberMe: false
    })

    // Sign Up State
    const [signUpData, setSignUpData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    })

    // register user
    const registerUser = async (e) => {
        e.preventDefault();
        if (signUpData.name == '' || signUpData.email == '' || signUpData.password == '' || signUpData.confirmPassword == '' || signUpData.agreeToTerms == false) {
            toast.error("Please fill in all fields");
            return;
        }
        if (signUpData.password !== signUpData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        localStorage.setItem('user', JSON.stringify({
            name: signUpData.name,
            email: signUpData.email,
            password: signUpData.password,
        }));

        try {
            const isExist = await axios.get(`${API_BASE_URL}/api/users/email/${signUpData.email}`);
            if (isExist.data.exist) {
                toast.error('Email already exists');
                return;
            }
            const response = await axios.post(`${API_BASE_URL}/api/users/create`, {
                name: signUpData.name,
                email: signUpData.email,
                password: signUpData.password
            });
            console.log('Registration response:', response.data);
            toast.success("Registration successful! Please sign in.");
            setTab('signIn');
            setSignUpData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                agreeToTerms: false
            });
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.response?.data?.message || "Registration failed");
        }
    }

    // login user
    const loginUser = async () => {
        if (signInData.email == '' || signInData.password == '') {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/users/email/${signInData.email}`);
            if (!response.data.exist) {
                toast.error("Email not registered");
                return;
            }
            const user = response.data.user;
            if (user.password !== signInData.password) {
                toast.error("Incorrect password");
                return;
            }
            toast.success("Login successful!");
            localStorage.setItem('user', JSON.stringify(user));
            setTimeout(() => {
                location.href = '/';
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            toast.error("Login failed");
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
            {/* Header Section */}
            <div className="text-center mb-8 max-w-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg">
                    <span className="text-2xl font-bold text-white">DC</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
                    Welcome to <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Dev Collab</span>
                </h1>
                <p className="text-slate-600 text-lg">
                    Collaborate on projects, share ideas, and ship faster together
                </p>
            </div>

            {/* Auth Card */}
            <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                    {/* Tab Switcher */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
                        <button
                            onClick={() => setTab('signIn')}
                            className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${tab === 'signIn'
                                ? 'bg-white text-blue-600 shadow-md'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setTab('signUp')}
                            className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${tab === 'signUp'
                                ? 'bg-white text-blue-600 shadow-md'
                                : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Sign In Form */}
                    {tab === 'signIn' && (
                        <div className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={signInData.email}
                                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={signInData.password}
                                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                                        className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={signInData.rememberMe}
                                        onChange={(e) => setSignInData({ ...signInData, rememberMe: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-slate-600">Remember me</span>
                                </label>
                                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Forgot password?
                                </a>
                            </div>

                            {/* Sign In Button */}
                            <button onClick={loginUser} className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
                                Sign In
                            </button>
                        </div>
                    )}

                    {/* Sign Up Form */}
                    {tab === 'signUp' && (
                        <form className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        required={true}
                                        type="text"
                                        placeholder="John Doe"
                                        value={signUpData.name}
                                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        required={true}
                                        type="email"
                                        placeholder="you@example.com"
                                        value={signUpData.email}
                                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        required={true}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a password"
                                        value={signUpData.password}
                                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                                        className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        required={true}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm your password"
                                        value={signUpData.confirmPassword}
                                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                                        className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms */}
                            <label className="flex items-start gap-2 cursor-pointer text-sm">
                                <input
                                    required={true}
                                    type="checkbox"
                                    checked={signUpData.agreeToTerms}
                                    onChange={(e) => setSignUpData({ ...signUpData, agreeToTerms: e.target.checked })}
                                    className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-slate-600">
                                    I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms & Conditions</a> and <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                                </span>
                            </label>

                            {/* Sign Up Button */}
                            <button
                                className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                                onClick={registerUser}
                            >
                                Create Account
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        <button className="py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </button>
                        <button className="py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                        </button>
                        <button className="py-3 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-600 mt-6">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline">Privacy Policy</a>
                </p>
            </div>
            <Toaster position="bottom-right" />
        </main>
    )
}
