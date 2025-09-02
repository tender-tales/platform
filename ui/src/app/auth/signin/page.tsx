'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Chrome, ArrowLeft, Waves } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const callbackUrl = searchParams.get('callbackUrl') || '/kadal'

  useEffect(() => {
    // Check if user is already authenticated
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })
  }, [router, callbackUrl])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      console.error('Sign in failed:', error)
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-ocean-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/ocean-pattern.svg')] opacity-5"></div>
      </div>

      {/* Back Button */}
      <motion.button
        onClick={handleGoBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </motion.button>

      {/* Main Content */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Image
              src="/tender-tales-logo.png"
              alt="Tender Tales Logo"
              width={64}
              height={64}
              className="mx-auto mb-6"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Waves className="w-6 h-6 text-ocean-400" />
              <h1 className="text-3xl font-bold text-white">Kadal</h1>
            </div>
            <p className="text-gray-300 text-sm">
              Sign in to access your satellite analytics dashboard
            </p>
          </motion.div>
        </div>

        {/* Sign In Card */}
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300 text-sm">
              Continue with your Google account to access Kadal
            </p>
          </div>

          <motion.button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:bg-gray-200 text-gray-800 rounded-xl px-6 py-4 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed"
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </motion.button>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-ocean-400 hover:text-ocean-300 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-ocean-400 hover:text-ocean-300 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-gray-400 text-sm mb-4">What you'll get access to:</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="text-ocean-400 mb-1">🛰️</div>
              <div className="text-white font-medium">Satellite Data</div>
              <div className="text-gray-400">Real-time Earth imagery</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <div className="text-ocean-400 mb-1">🤖</div>
              <div className="text-white font-medium">AI Assistant</div>
              <div className="text-gray-400">Natural language queries</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
