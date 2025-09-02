'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Waves, Loader } from 'lucide-react'
import Image from 'next/image'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname))
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/tender-tales-logo.png"
            alt="Tender Tales Logo"
            width={64}
            height={64}
            className="mx-auto mb-6"
          />
          <div className="flex items-center justify-center gap-2 mb-4">
            <Waves className="w-6 h-6 text-ocean-400" />
            <h2 className="text-2xl font-bold text-white">Kadal</h2>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/tender-tales-logo.png"
            alt="Tender Tales Logo"
            width={64}
            height={64}
            className="mx-auto mb-6"
          />
          <div className="flex items-center justify-center gap-2 mb-4">
            <Waves className="w-6 h-6 text-ocean-400" />
            <h2 className="text-2xl font-bold text-white">Kadal</h2>
          </div>
          <p className="text-gray-300">Redirecting to sign in...</p>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
