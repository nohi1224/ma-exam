'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'

const NAV_GROUPS = [
  {
    label: '試験対策',
    items: [
      { href: '/exam/start', label: '模擬試験', icon: '📝', desc: '60問・120分の本番形式' },
      { href: '/practice/start', label: '科目別練習', icon: '💪', desc: '科目を選んで練習' },
      { href: '/review', label: '復習', icon: '🔄', desc: '間違えた問題を再出題' },
      { href: '/history', label: '学習履歴', icon: '📊', desc: '成績と進捗を確認' },
    ],
  },
  {
    label: 'M&A知識',
    items: [
      { href: '/learn', label: '知識ライブラリ', icon: '📚', desc: '実務数値をカテゴリ別に学習' },
      { href: '/learn/quiz', label: '知識テスト', icon: '🧠', desc: '数値・指標の4択テスト' },
      { href: '/tips', label: '攻略のコツ', icon: '💡', desc: '配点戦略・頻出テーマ' },
    ],
  },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  if (!user) return null

  return (
    <header className="border-b border-border-color bg-card-bg sticky top-0 z-50" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/dashboard" className="font-bold text-lg text-primary mr-2 sm:mr-4 shrink-0">
            M&A模擬テスト
          </Link>

          {/* PC Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive('/dashboard') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-bg-secondary'}`}
            >
              ホーム
            </Link>

            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === group.label ? null : group.label) }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    group.items.some(i => isActive(i.href)) ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-bg-secondary'
                  }`}
                >
                  {group.label}
                  <svg className={`w-3 h-3 transition-transform ${openDropdown === group.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === group.label && (
                  <div className="absolute left-0 top-full mt-1 w-64 bg-card-bg border border-border-color rounded-xl shadow-lg py-2 z-50">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${isActive(item.href) ? 'bg-primary/5 text-primary' : 'hover:bg-bg-secondary'}`}
                      >
                        <span className="text-lg shrink-0">{item.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className="text-xs text-text-secondary">{item.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/admin/questions"
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive('/admin') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-bg-secondary'}`}
            >
              管理
            </Link>
          </nav>
        </div>

        {/* Right: Theme + User */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-sm"
            aria-label="テーマ切替"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Desktop user menu */}
          <div className="relative hidden lg:block">
            <button
              onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen) }}
              className="text-sm px-3 py-1.5 rounded-lg hover:bg-bg-secondary transition-colors max-w-[180px] truncate"
            >
              {user.email}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card-bg border border-border-color rounded-xl shadow-lg py-1 z-50">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg-secondary text-danger">
                  ログアウト
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="メニュー"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-border-color bg-card-bg overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-5 py-3 border-b border-border-color ${isActive('/dashboard') ? 'bg-primary/5 text-primary' : ''}`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-sm font-medium">ダッシュボード</span>
          </Link>

          {/* Grouped nav */}
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-5 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${isActive(item.href) ? 'bg-primary/5 text-primary' : 'hover:bg-bg-secondary'}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-text-secondary">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          ))}

          {/* Admin */}
          <div>
            <div className="px-5 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              管理
            </div>
            <Link
              href="/admin/questions"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${isActive('/admin') ? 'bg-primary/5 text-primary' : 'hover:bg-bg-secondary'}`}
            >
              <span className="text-lg">⚙️</span>
              <div>
                <div className="text-sm font-medium">問題・知識管理</div>
                <div className="text-xs text-text-secondary">問題CRUD・インポート・フィードバック</div>
              </div>
            </Link>
          </div>

          {/* User info + logout */}
          <div className="border-t border-border-color mt-2 px-5 py-4">
            <div className="text-xs text-text-secondary mb-3 truncate">{user.email}</div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
