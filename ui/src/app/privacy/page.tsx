'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PrivacyPage() {
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
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Privacy <span className="text-blue-400">Policy</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Introduction</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                At Tender Tales, we are committed to protecting your privacy and ensuring the security of your personal information.
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Information We Collect</h2>
              <div className="text-gray-300 text-lg leading-relaxed space-y-4">
                <p>We may collect the following types of information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Usage data and analytics to improve our services</li>
                  <li>Geographic location data when you interact with our mapping features</li>
                  <li>Technical information about your device and browser</li>
                  <li>Any information you voluntarily provide through our platform</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">How We Use Your Information</h2>
              <div className="text-gray-300 text-lg leading-relaxed space-y-4">
                <p>We use collected information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve our environmental data visualization services</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                  <li>Ensure the security and proper functioning of our platform</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Data Security</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access,
                alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Third-Party Services</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our platform may use third-party services such as mapping providers and analytics tools.
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Your Rights</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                You have the right to access, update, or delete your personal information.
                If you have any questions or requests regarding your data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Contact Us</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices,
                please contact us through our platform or reach out to our team directly.
              </p>
            </section>

            <section className="border-t border-gray-800 pt-8">
              <p className="text-gray-400 text-base">
                This Privacy Policy may be updated from time to time. We will notify you of any significant changes
                by posting the new Privacy Policy on this page with an updated revision date.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
