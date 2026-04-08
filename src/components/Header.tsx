'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    setDarkMode(isDark)
  }

  if (!user) return null

  return (
    <header className="border-b border-border-color bg-card-bg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg text-primary">
            M&A模擬テスト
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-primary transition-colors">ダッシュボード</Link>
            <Link href="/exam/start" className="hover:text-primary transition-colors">模擬試験</Link>
            <Link href="/practice/start" className="hover:text-primary transition-colors">練習</Link>
            <Link href="/history" className="hover:text-primary transition-colors">学習履歴</Link>
            <Link href="/review" className="hover:text-primary transition-colors">復習</Link>
            <Link href="/learn" className="hover:text-primary transition-colors">知識</Link>
            <Link href="/tips" className="hover:text-primary transition-colors">攻略のコツ</Link>
            <Link href="/admin/questions" className="hover:text-primary transition-colors">問題管理</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
            aria-label="テーマ切替"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {/* Desktop user menu */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
            >
              {user.email}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card-bg border border-border-color rounded-lg shadow-lg py-1 z-50">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary text-danger">
                  ログアウト
                </button>
              </div>
            )}
          </div>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-bg-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニュー"
          >
            ☰
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border-color px-4 py-2 space-y-1 bg-card-bg">
          <Link href="/dashboard" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>ダッシュボード</Link>
          <Link href="/exam/start" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>模擬試験</Link>
          <Link href="/practice/start" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>練習</Link>
          <Link href="/history" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>学習履歴</Link>
          <Link href="/review" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>復習</Link>
          <Link href="/learn" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>M&A知識</Link>
          <Link href="/tips" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>攻略のコツ</Link>
          <Link href="/admin/questions" className="block py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>問題管理</Link>
          <hr className="border-border-color" />
          <div className="py-2 text-xs text-text-secondary">{user.email}</div>
          <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-danger">
            ログアウト
          </button>
        </nav>
      )}
    </header>
  )
}
