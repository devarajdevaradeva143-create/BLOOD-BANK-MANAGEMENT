import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'
import ChatWidget from './chat/ChatWidget'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 sm:px-6 lg:px-8">
        <div className="py-8 lg:py-12">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
