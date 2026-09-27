import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  Droplet,
  Eye,
  EyeOff,
  Heart,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { demoLogin, loginUser } from '../lib/auth'

const HospitalLogin = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      try {
        loginUser({ email, password })
        toast.success('Logged in successfully!')
        if (onLogin) {
          onLogin()
        }
      } catch (err) {
        setError(err.message || 'Invalid email or password.')
      } finally {
        setLoading(false)
      }
    }, 700)
  }

  const handleDemoLogin = () => {
    setError('')
    setLoading(true)

    setTimeout(() => {
      try {
        demoLogin()
        toast.success('Logged in with demo account!')
        if (onLogin) {
          onLogin()
        }
      } catch (err) {
        setError(err.message || 'Demo login failed.')
      } finally {
        setLoading(false)
      }
    }, 700)
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* ================= LEFT SECTION ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#fff7f8] via-white to-[#fff1f3] overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-red-100/40" />
        <div className="absolute top-72 -left-32 w-80 h-80 rounded-full bg-red-50/70" />
        <div className="absolute bottom-[-180px] right-[-80px] w-[500px] h-[500px] rounded-full bg-red-50" />

        <div className="relative z-10 w-full px-14 xl:px-20 pt-10">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative w-[58px] h-[64px] bg-gradient-to-b from-red-500 to-red-700 rounded-[50%_50%_55%_55%] flex items-center justify-center shadow-lg shadow-red-200">
              <HeartPulse size={34} strokeWidth={2.5} className="text-white" />
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
            {/* Save Lives */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <Droplet size={22} className="text-red-600" fill="currentColor" />
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

            {/* Community */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <Users size={22} className="text-red-600" />
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-[#12345b]">
                  Build a Healthier Community
                </h3>

                <p className="text-[12px] text-[#58708b] max-w-[300px]">
                  Help patients, families and communities in need.
                </p>
              </div>
            </div>

            {/* Safe */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldCheck size={22} className="text-red-600" />
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

            {/* Regular Donor */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                <Heart size={22} className="text-red-600" fill="currentColor" />
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
            {/* Hands */}
            <div className="relative w-[250px] h-[145px]">
              <div className="absolute left-5 bottom-0 w-20 h-28 bg-gradient-to-t from-[#e9ad83] to-[#ffd2ae] rounded-t-[45px] rotate-[-13deg] shadow-md" />

              <div className="absolute right-5 bottom-0 w-20 h-28 bg-gradient-to-t from-[#e9ad83] to-[#ffd2ae] rounded-t-[45px] rotate-[13deg] shadow-md" />

              {/* Blood Drop */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[92px] h-[112px] bg-gradient-to-b from-red-500 to-red-700 rounded-[55%_55%_65%_65%] rotate-45 shadow-xl flex items-center justify-center">
                <HeartPulse size={43} className="text-white -rotate-45" />
              </div>
            </div>

            {/* Message */}
            <div className="mb-14 ml-5">
              <p className="text-red-600 text-[25px] italic font-semibold leading-6">
                Give Blood
              </p>

              <p className="text-red-600 text-[25px] italic font-semibold leading-6">
                Give Hope
              </p>

              <div className="w-24 h-1 bg-red-500 mt-2 rounded-full rotate-[-7deg]" />
            </div>
          </div>

          {/* Bottom red wave */}
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-red-600 rounded-tr-[100%]" />
        </div>
      </div>

      {/* ================= RIGHT SECTION ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-[500px]">
          {/* Login Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_35px_rgba(15,23,42,0.08)] px-7 sm:px-10 py-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <HeartPulse size={28} className="text-white" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mt-3">
              <h2 className="text-[25px] font-bold text-[#102a43]">
                Hospital Login
              </h2>

              <p className="text-[13px] text-[#627b95] mt-1">
                Sign in to access your hospital account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="mt-7 space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[12px] font-semibold text-[#17324d] mb-1.5">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526b87]"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full h-10 rounded-md border border-[#cbd7e5] pl-11 pr-3 text-[12px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-semibold text-[#17324d] mb-1.5">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#526b87]"
                  />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-10 rounded-md border border-[#cbd7e5] pl-11 pr-11 text-[12px] outline-none text-slate-700 placeholder:text-[#9aabc0] focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#526b87] hover:text-red-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition shadow-md shadow-red-100"
              >
                {loading ? (
                  'Logging in...'
                ) : (
                  <>
                    Login
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-slate-200" />

              <span className="text-[11px] text-slate-500">OR</span>

              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full h-10 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 font-semibold text-[14px] flex items-center justify-center gap-2 transition"
            >
              <Sparkles size={17} />
              Try Demo Account
            </button>

            <p className="text-center text-[11px] text-[#9aabc0] mt-2">
              demo@hospital.com / Demo@1234
            </p>

            {/* Register */}
            <p className="text-center text-[12px] text-[#526b87]">
              Don&apos;t have an account?{' '}

              <button
                onClick={onRegister}
                className="font-semibold text-red-600 hover:underline"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalLogin
