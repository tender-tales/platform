'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Chrome, Waves, Lock, Eye, Zap } from 'lucide-react'
import Image from 'next/image'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/kadal' })
    } catch (error) {
      console.error('Sign in failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 shadow-2xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo and Title */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Image
                  src="/tender-tales-logo.png"
                  alt="Tender Tales Logo"
                  width={32}
                  height={32}
                />
                <Waves className="w-6 h-6 text-ocean-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sign in or create an account</h2>
              <p className="text-gray-300 text-sm">
                Unlock Pro Search and History
              </p>
            </div>

            {/* Sign In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:bg-gray-200 text-gray-800 rounded-xl px-6 py-4 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed mb-6"
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

            {/* Features Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-ocean-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-300">Access AI-powered satellite analysis</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-ocean-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Eye className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-300">View real-time Earth Engine data</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-ocean-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-300">Save and track your queries</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
              <p>Single sign-on (SSO)</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
