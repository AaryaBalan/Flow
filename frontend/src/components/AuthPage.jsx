import { useState } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'

export default function AuthPage() {
    const [tab, setTab] = useState('signIn') // 'signIn' | 'signUp'

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
                            className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${
                                tab === 'signIn' 
                                    ? 'bg-white text-blue-600 shadow-md' 
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setTab('signUp')}
                            className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${
                                tab === 'signUp' 
                                    ? 'bg-white text-blue-600 shadow-md' 
                                    : 'text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Clerk Components */}
                    <div className="clerk-auth-container">
                        {tab === 'signIn' ? (
                            <SignIn 
                                afterSignInUrl="/" 
                                appearance={{
                                    elements: {
                                        rootBox: 'w-full',
                                        card: 'shadow-none bg-transparent'
                                    }
                                }}
                            />
                        ) : (
                            <SignUp 
                                afterSignUpUrl="/" 
                                appearance={{
                                    elements: {
                                        rootBox: 'w-full',
                                        card: 'shadow-none bg-transparent'
                                    }
                                }}
                            />
                        )}
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
        </main>
    )
}
