'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { calculateReadingTime, getLastUpdatedDate, formatDate } from '@/lib/reading-time'

export default function WhaleShipStrikesPost() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/blog')
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  // Article content for reading time calculation and last updated tracking
  const articleContent = `
    Mapping Whale Migration Patterns to Prevent Ship Strikes
    The Problem
  `

  const postId = 'whale-ship-strikes'

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
              className="flex items-center gap-2 text-white hover:text-ocean-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Blog
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

            <button className="flex items-center gap-2 text-white hover:text-ocean-400 transition-colors">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </motion.div>

      {/* Article */}
      <article className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          {/* Article Header */}
          <header className="mb-12">
            <div className="mb-6">
              <span className="px-4 py-2 bg-ocean-600/20 text-ocean-300 rounded-full text-sm font-medium">
                Marine Conservation
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Mapping Whale Migration Patterns to Prevent Ship Strikes
            </h1>

            <div className="flex items-center gap-6 text-gray-400 text-sm mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(getLastUpdatedDate(postId, articleContent))}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{calculateReadingTime(articleContent)}</span>
              </div>
            </div>

            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
              <Image
                src="/whale_blog.jpg"
                alt="Whale migration routes overlaid with ship traffic patterns"
                fill
                className="object-cover"
              />
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg prose-invert max-w-none text-gray-300">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">The Problem</h2>
            </motion.div>
          </div>
        </motion.div>
      </article>
    </main>
  )
}
