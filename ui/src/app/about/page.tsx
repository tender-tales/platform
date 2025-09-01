'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AboutPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <motion.div
        className="bg-gray-900/90 backdrop-blur-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>

            <div className="flex items-center gap-3">
              <Image
                src="/tender-tales-logo.png"
                alt="Tender Tales Logo"
                width={24}
                height={24}
              />
              <h1 className="text-xl font-bold text-white">
                Tender Tales
              </h1>
            </div>

            <div className="w-32" />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-4xl mx-auto text-white"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About <span className="text-blue-400">Us</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Coming soon. We're working on sharing our story and mission with you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-blue-400">Our Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                We're dedicated to documenting the stories of our changing planet through
                advanced satellite imagery and environmental data analysis.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our platform combines cutting-edge technology with accessible visualization
                to help everyone understand the environmental changes happening around us.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center opacity-20">
                <Image
                  src="/tender-tales-logo.png"
                  alt="Tender Tales Logo"
                  width={128}
                  height={128}
                  className="opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-gray-400 text-lg">
              More details about our team, vision, and impact coming soon.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
