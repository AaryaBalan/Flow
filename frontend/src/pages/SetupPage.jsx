import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Briefcase,
    Building2,
    MapPin,
    Phone,
    FileText,
    Code,
    Github,
    Linkedin,
    CheckCircle
} from 'lucide-react'
import axios from 'axios'
import { useEffect } from 'react'

const SetupPage = () => {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [user, setUser] = useState(null)
    const [formData, setFormData] = useState({
        designation: '',
        company: '',
        location: '',
        phone: '',
        about: '',
        skills: '',
        experience: '',
        github: '',
        linkedin: ''
    })

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        if (!user) {
            navigate('/auth')
            return
        }
        setUser(user)
    }, [navigate])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSetup = async (e) => {
        e.preventDefault()
        const user = JSON.parse(localStorage.getItem('user'))
        await axios.post('http://localhost:3000/api/users/updateSetup', {...formData, userId: user.id})
        localStorage.setItem('user', JSON.stringify({...user, ...formData, setupCompleted: 1}))
        setTimeout(() => {
            location.reload()
        }, 1000)
    }

    const isStep1Valid = formData.designation && formData.company && formData.location && formData.phone
    const isStep2Valid = formData.about && formData.skills
    const isStep3Valid = formData.experience

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-xl font-bold text-white">DC</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Dev Collab</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {user?.name}! 👋</h2>
                    <p className="text-slate-600">Let's set up your developer profile to get started</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                        {[1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div className={`flex items-center gap-2 ${currentStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep > step
                                        ? 'bg-green-500 text-white'
                                        : currentStep === step
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                                        {step === 1 ? 'Basic Info' : step === 2 ? 'About You' : 'Experience'}
                                    </span>
                                </div>
                                {step < 3 && <div className={`w-12 h-1 rounded ${currentStep > step ? 'bg-green-500' : 'bg-slate-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSetup}>
                        {/* Step 1: Basic Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-4">Basic Information</h3>
                                    <p className="text-slate-600 mb-6">Tell us about your professional details</p>
                                </div>

                                {/* Designation */}
                                <div>
                                    <label htmlFor="designation" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Briefcase className="w-4 h-4" />
                                        Designation / Role *
                                    </label>
                                    <input
                                        type="text"
                                        id="designation"
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., Full Stack Developer, Frontend Engineer"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Company */}
                                <div>
                                    <label htmlFor="company" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Building2 className="w-4 h-4" />
                                        Company / Organization *
                                    </label>
                                    <input
                                        type="text"
                                        id="company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., Tech Corp, Freelance"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., San Francisco, CA or Remote"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Phone className="w-4 h-4" />
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., +1 (555) 123-4567"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: About & Skills */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-4">About You</h3>
                                    <p className="text-slate-600 mb-6">Share your professional background and skills</p>
                                </div>

                                {/* About */}
                                <div>
                                    <label htmlFor="about" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <FileText className="w-4 h-4" />
                                        About / Bio *
                                    </label>
                                    <textarea
                                        id="about"
                                        name="about"
                                        value={formData.about}
                                        onChange={handleInputChange}
                                        required
                                        rows="5"
                                        placeholder="Tell us about yourself, your passion for coding, and what you're working on..."
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>

                                {/* Skills */}
                                <div>
                                    <label htmlFor="skills" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Code className="w-4 h-4" />
                                        Skills & Technologies *
                                    </label>
                                    <input
                                        type="text"
                                        id="skills"
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g., React, Node.js, Python, MongoDB, AWS"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">Separate multiple skills with commas</p>
                                </div>

                                {/* GitHub */}
                                <div>
                                    <label htmlFor="github" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Github className="w-4 h-4" />
                                        GitHub Profile (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        id="github"
                                        name="github"
                                        value={formData.github}
                                        onChange={handleInputChange}
                                        placeholder="https://github.com/yourusername"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {/* LinkedIn */}
                                <div>
                                    <label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Linkedin className="w-4 h-4" />
                                        LinkedIn Profile (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        id="linkedin"
                                        name="linkedin"
                                        value={formData.linkedin}
                                        onChange={handleInputChange}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Experience */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-4">Experience</h3>
                                    <p className="text-slate-600 mb-6">How many years of experience do you have?</p>
                                </div>

                                {/* Experience */}
                                <div>
                                    <label htmlFor="experience" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                        <Briefcase className="w-4 h-4" />
                                        Years of Experience *
                                    </label>
                                    <select
                                        id="experience"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select your experience level</option>
                                        <option value="0-1">Less than 1 year (Entry Level)</option>
                                        <option value="1-2">1-2 years</option>
                                        <option value="2-3">2-3 years</option>
                                        <option value="3-5">3-5 years (Mid-Level)</option>
                                        <option value="5-8">5-8 years (Senior)</option>
                                        <option value="8+">8+ years (Expert/Lead)</option>
                                    </select>
                                </div>

                                {/* Summary Card */}
                                <div className="mt-8 p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <h4 className="font-semibold text-slate-800 mb-3">Profile Summary</h4>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <p><span className="font-medium">Role:</span> {formData.designation}</p>
                                        <p><span className="font-medium">Company:</span> {formData.company}</p>
                                        <p><span className="font-medium">Location:</span> {formData.location}</p>
                                        <p><span className="font-medium">Skills:</span> {formData.skills}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className={`px-6 py-3 font-semibold rounded-lg transition-all ${currentStep === 1
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                            >
                                Back
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Step {currentStep} of 3</span>
                            </div>

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={
                                        (currentStep === 1 && !isStep1Valid) ||
                                        (currentStep === 2 && !isStep2Valid)
                                    }
                                    className={`px-6 py-3 font-semibold rounded-lg transition-all ${((currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid))
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                                        }`}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    // onClick={setupCompleted}
                                    disabled={!isStep3Valid}
                                    className={`px-8 py-3 font-semibold rounded-lg transition-all ${!isStep3Valid
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-linear-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                                        }`}
                                >
                                    Complete Setup
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-slate-500">
                        Your information is secure and will only be used within Dev Collab
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SetupPage
