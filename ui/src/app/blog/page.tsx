'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { calculateReadingTime, getLastUpdatedDate, formatDate } from '@/lib/reading-time'

export default function BlogPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const blogPosts = [
    {
      id: 'whale-ship-strikes',
      title: 'Mapping Whale Migration Patterns to Prevent Ship Strikes',
      excerpt: 'Using advanced data analysis to track whale movements and shipping routes, helping reduce deadly collisions in critical marine habitats.',
      content: 'Ship strikes represent one of the leading causes of whale mortality worldwide. By analyzing migration patterns alongside shipping traffic data, we can identify collision hotspots and develop targeted prevention strategies. The Problem. Whale migration routes often intersect with major shipping lanes, creating predictable collision zones.',
      category: 'Marine Conservation',
      image: '/whale_blog.jpg'
    }
  ]

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
          className="max-w-6xl mx-auto"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Research <span className="text-ocean-400">Blog</span>
            </h1>
            <p className="text-xl text-gray-300 font-light max-w-3xl mx-auto">
              Insights, discoveries, and innovations in conservation technology and environmental science
            </p>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 hover:border-ocean-500/50 transition-all duration-300 group"
                whileHover={{ y: -5 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-ocean-600/90 text-white text-sm rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(getLastUpdatedDate(post.id, post.content))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{calculateReadingTime(post.content)}</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-gray-300 text-sm leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <Link
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 text-ocean-400 hover:text-ocean-300 transition-colors font-medium"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

        </motion.div>
      </div>
    </main>
  )
}
