import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import { loginUser, registerHospital } from '../lib/auth'

const HospitalRegister = ({ onSuccess, onLogin }) => {
  const [form, setForm] = useState({
    hospitalName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })

    setError('')
  }

  const getPasswordStrength = () => {
    const password = form.password

    if (!password) return 0

    let score = 0

    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    return score
  }

  const passwordStrength = getPasswordStrength()

  const handleRegister = (e) => {
    e.preventDefault()

    setError('')

    if (
      !form.hospitalName ||
      !form.registrationNumber ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('Please fill in all fields.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Phone number must contain 10 digits.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (!/[A-Z]/.test(form.password)) {
      setError('Password must contain at least one uppercase letter.')
      return
    }

    if (!/[a-z]/.test(form.password)) {
      setError('Password must contain at least one lowercase letter.')
      return
    }

    if (!/[0-9]/.test(form.password)) {
      setError('Password must contain at least one number.')
      return
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must contain at least one special character.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      registerHospital(form)
      loginUser({ email: form.email, password: form.password })

      setLoading(false)
      toast.success('Registration successful!')
      if (onSuccess) {
        onSuccess()
      }
    }, 700)
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* ================= LEFT SECTION ================= */}
      <div className="hidden lg:flex lg:w-[48%] relative bg-gradient-to-br from-[#fff7f8] via-white to-[#fff1f3] overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-red-100/40" />

        <div className="absolute top-72 -left-32 w-80 h-80 rounded-full bg-red-50/70" />

        <div className="absolute bottom-[-170px] right-[-80px] w-[480px] h-[480px] rounded-full bg-red-50" />

        <div className="relative z-10 w-full px-14 xl:px-20 pt-10">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-[58px] h-[64px] bg-gradient-to-b from-red-500 to-red-700 rounded-[50%] flex items-center justify-center shadow-lg shadow-red-200">
              <HeartPulse size={34} className="text-white" />
            </div>

            <div>
              <h1 className="text-[31px] font-bold text-[#102a43] leading-none">
                Life Saver
              </h1>

              <p className="text-[17px] font-bold text-red-600 mt-1">
                Blood Bank Management
              </p>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-8">
            <h2 className="text-[21px] font-bold text-[#12345b]">
              Be a Hero. Donate Blood. Save Lives.
            </h2>

            <p className="mt-2 text-[14px] leading-5 text-[#526b87] max-w-[390px]">
              Your donation can give someone a second chance at life. Join our
              community of blood donors and make a difference today.
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-3.5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">💧</span>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#12345b]">
                  Save Lives
                </h3>

                <p className="text-[12px] text-[#58708b]">
                  One donation can save up to 3 lives.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">👥</span>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#12345b]">
                  Build a Healthier Community
                </h3>

                <p className="text-[12px] text-[#58708b]">
                  Help patients, families and communities in need.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">🛡</span>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#12345b]">
                  Safe &amp; Reliable
                </h3>

                <p className="text-[12px] text-[#58708b]">
                  Your safety is our priority.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">❤️</span>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#12345b]">
                  Be a Regular Donor
                </h3>

                <p className="text-[12px] text-[#58708b]">
                  Donate, make a habit, create a bigger impact.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Illustration */}
          <div className="absolute left-14 xl:left-20 bottom-0 flex items-end">
            <div className="relative w-[230px] h-[140px]">
              <div className="absolute left-4 bottom-0 w-20 h-28 bg-[#f3bd95] rounded-t-[45px] rotate-[-13deg]" />

              <div className="absolute right-4 bottom-0 w-20 h-28 bg-[#f3bd95] rounded-t-[45px] rotate-[13deg]" />

              <div className="absolute left-1/2 -translate-x-1/2 bottom-5 w-[90px] h-[110px] bg-gradient-to-b from-red-500 to-red-700 rounded-[55%_55%_65%_65%] rotate-45 shadow-xl flex items-center justify-center">
                <HeartPulse size={42} className="text-white -rotate-45" />
              </div>
            </div>

            <div className="mb-14 ml-4">
              <p className="text-red-600 text-[25px] italic font-semibold leading-6">
                Give Blood
              </p>

              <p className="text-red-600 text-[25px] italic font-semibold leading-6">
                Give Hope
              </p>

              <div className="w-24 h-1 bg-red-500 mt-2 rounded-full rotate-[-7deg]" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-5 bg-red-600 rounded-tr-[100%]" />
        </div>
      </div>

      {/* ================= RIGHT SECTION ================= */}
      <div className="w-full lg:w-[52%] min-h-screen flex items-center justify-center px-5 sm:px-8 py-8 overflow-y-auto">
        <div className="w-full max-w-[600px]">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_35px_rgba(15,23,42,0.08)] px-6 sm:px-8 py-7">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center">
                  <HeartPulse size={25} className="text-white" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mt-2">
              <h2 className="text-[24px] font-bold text-[#102a43]">
                Hospital Registration
              </h2>

              <p className="text-[12px] text-[#627b95] mt-1">
                Create your hospital account to request blood units
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="mt-6 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hospital Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                    Hospital Name
                  </label>

                  <div className="relative">
                    <Building2
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526b87]"
                    />

                    <input
                      name="hospitalName"
                      value={form.hospitalName}
                      onChange={handleChange}
                      placeholder="Enter hospital name"
                      className="w-full h-9 rounded-md border border-[#cbd7e5] pl-9 pr-2 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                    Hospital Registration No.
                  </label>

                  <input
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    placeholder="Enter registration number"
                    className="w-full h-9 rounded-md border border-[#cbd7e5] px-3 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526b87]"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className="w-full h-9 rounded-md border border-[#cbd7e5] pl-9 pr-2 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526b87]"
                    />

                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full h-9 rounded-md border border-[#cbd7e5] pl-9 pr-2 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                  Address
                </label>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526b87]"
                  />

                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter hospital address"
                    className="w-full h-9 rounded-md border border-[#cbd7e5] pl-9 pr-2 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526b87]"
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create password"
                      className="w-full h-9 rounded-md border border-[#cbd7e5] pl-9 pr-9 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength */}
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full ${
                          passwordStrength >= level
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength <= 4
                                ? 'bg-yellow-400'
                                : 'bg-green-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#17324d] mb-1">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526b87]"
                    />

                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className="w-full h-9 rounded-md border border-[#cbd7e5] pl-9 pr-9 text-[11px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-[11px] text-red-600">
                  {error}
                </div>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition shadow-md shadow-red-100"
              >
                {loading ? (
                  'Registering...'
                ) : (
                  <>
                    Register
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-slate-200" />

              <span className="text-[10px] text-slate-500">OR</span>

              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Login */}
            <p className="text-center text-[11px] text-[#526b87]">
              Already have an account?{' '}

              <button
                onClick={onLogin}
                className="font-semibold text-red-600 hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalRegister
