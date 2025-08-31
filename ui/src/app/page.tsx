'use client'

import { motion } from 'framer-motion'
import { Satellite, MapPin, TrendingUp, Layers, Eye, ArrowRight, Play, BarChart3, Globe2, TreePine, Building, Mountain } from 'lucide-react'
import Image from 'next/image'
import Footer from '@/components/footer'

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Hero Section with Satellite Imagery Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* NASA Earth Satellite Timelapse Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-green-800 to-blue-900">
          <Image
            src="https://miro.medium.com/v2/resize:fit:640/format:webp/1*UBUrmlBRYwSmx5hIzXhcdQ.gif"
            alt="NASA EPIC Earth satellite timelapse showing full Earth from space"
            className="w-full h-full object-cover opacity-90"
            fill
            priority
            unoptimized
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-5xl mx-auto text-white"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div
              className="flex items-center justify-center mb-6"
              variants={fadeInUp}
            >
              <Satellite className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-6xl md:text-8xl font-bold">
                <span className="text-white">Tender</span>
                <span className="text-blue-400">Tales</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-2xl md:text-3xl text-gray-200 mb-6 font-light"
              variants={fadeInUp}
            >
              Documenting the stories of a changing planet
            </motion.p>

            <motion.p
              className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Our planet is transforming before our eyes, and human activity is the leading force behind this change. Our mission is to document how these vulnerable ecosystems are changing and impacting the rich fabric of biodiversity on which all life depends.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <button
                onClick={() => window.location.href = '/map'}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition duration-300 shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                <Play className="w-5 h-5" />
                Explore the Map
              </button>
              <button className="bg-transparent hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-lg border-2 border-white/30 hover:border-white/50 transition duration-300 flex items-center justify-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                View Examples
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </section>


      <Footer />
    </main>
  )
}
