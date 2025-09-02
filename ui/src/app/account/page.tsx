'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Calendar, Shield, LogOut, Waves, Loader } from 'lucide-react'
import Image from 'next/image'
import ProtectedRoute from '@/components/auth/protected-route'

function AccountPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleGoBack = () => {
    router.push('/kadal')
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out failed:', error)
      setIsSigningOut(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Waves className="w-6 h-6 text-ocean-400" />
            <h2 className="text-2xl font-bold text-white">Loading Account...</h2>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Loader className="w-5 h-5 animate-spin" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <motion.div
        className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-white hover:text-ocean-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Kadal
            </button>

            <div className="flex items-center gap-3">
              <Image
                src="/tender-tales-logo.png"
                alt="Tender Tales Logo"
                width={24}
                height={24}
              />
              <h1 className="text-xl font-bold text-white">Account Settings</h1>
            </div>

            <div className="w-32" />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Profile Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={80}
                    height={80}
                    className="rounded-full ring-4 ring-ocean-400/20"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-700 rounded-full flex items-center justify-center shadow-md ring-4 ring-ocean-400/20">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-800 shadow-sm"></div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {session?.user?.name || 'User'}
                </h2>
                <p className="text-gray-400 mb-3">
                  {session?.user?.email}
                </p>
                <div className="flex items-center gap-2 text-sm text-ocean-400">
                  <Shield className="w-4 h-4" />
                  <span>Verified Google Account</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-ocean-400" />
                    <h3 className="text-white font-semibold">Display Name</h3>
                  </div>
                  <p className="text-gray-300">{session?.user?.name || 'Not provided'}</p>
                </div>

                <div className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-ocean-400" />
                    <h3 className="text-white font-semibold">Email Address</h3>
                  </div>
                  <p className="text-gray-300">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-ocean-400" />
                    <h3 className="text-white font-semibold">Last Sign In</h3>
                  </div>
                  <p className="text-gray-300">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Waves className="w-5 h-5 text-ocean-400" />
                    <h3 className="text-white font-semibold">Access Level</h3>
                  </div>
                  <p className="text-gray-300">Standard User</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            <h2 className="text-xl font-bold text-white mb-6">Privacy & Security</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                <div>
                  <h3 className="text-white font-semibold">Data Collection</h3>
                  <p className="text-gray-400 text-sm">We collect minimal data required for service functionality</p>
                </div>
                <div className="text-green-400 text-sm font-medium">Active</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                <div>
                  <h3 className="text-white font-semibold">Account Security</h3>
                  <p className="text-gray-400 text-sm">Secured via Google OAuth 2.0</p>
                </div>
                <div className="text-green-400 text-sm font-medium">Verified</div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
            <h2 className="text-xl font-bold text-white mb-6">Account Actions</h2>

            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center gap-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-600/10 border border-red-500/30 hover:border-red-500/50 disabled:border-red-500/20 text-red-400 hover:text-red-300 disabled:text-red-500 disabled:cursor-not-allowed rounded-xl px-6 py-4 transition-all duration-200"
              >
                {isSigningOut ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
                <span className="font-semibold">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </span>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center text-gray-500 text-sm">
            <p>
              Questions about your account?{' '}
              <a href="mailto:support@tendertales.com" className="text-ocean-400 hover:text-ocean-300">
                Contact Support
              </a>
            </p>
            <p className="mt-2">
              By using Kadal, you agree to our{' '}
              <a href="/terms" className="text-ocean-400 hover:text-ocean-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-ocean-400 hover:text-ocean-300">
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountPageContent />
    </ProtectedRoute>
  )
}
