'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function TermsPage() {
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
              Terms of <span className="text-blue-400">Service</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Agreement to Terms</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                By accessing and using the Tender Tales platform, you accept and agree to be bound by these Terms of Service.
                If you do not agree to abide by these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Use of Services</h2>
              <div className="text-gray-300 text-lg leading-relaxed space-y-4">
                <p>You may use our services for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Exploring environmental and satellite data visualizations</li>
                  <li>Educational and research purposes</li>
                  <li>Personal, non-commercial use</li>
                  <li>Any lawful purpose consistent with our mission</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Prohibited Uses</h2>
              <div className="text-gray-300 text-lg leading-relaxed space-y-4">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the service for any unlawful purpose or activity</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service or servers</li>
                  <li>Reproduce, duplicate, or copy any part of the service without permission</li>
                  <li>Use the service in any way that could damage our reputation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Data and Content</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                The environmental data, satellite imagery, and visualizations provided through our platform are for
                informational purposes only. While we strive for accuracy, we cannot guarantee the completeness or
                reliability of all data presented.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Intellectual Property</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                The service and its original content, features, and functionality are owned by Tender Tales Inc. and are
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Disclaimer of Warranties</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranties, expressed or implied,
                and hereby disclaim all other warranties including implied warranties of merchantability, fitness for a
                particular purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Limitation of Liability</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                In no event shall Tender Tales Inc., its directors, employees, or agents be liable for any indirect,
                incidental, special, consequential, or punitive damages arising out of your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Termination</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                We may terminate or suspend your access to our service immediately, without prior notice, for any reason,
                including breach of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Changes to Terms</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes
                by posting the updated terms on this page with a new effective date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-blue-400">Contact Information</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our platform
                or reach out to our support team.
              </p>
            </section>

            <section className="border-t border-gray-800 pt-8">
              <p className="text-gray-400 text-base">
                These Terms of Service constitute the entire agreement between you and Tender Tales Inc. regarding
                the use of our service and supersede any prior agreements.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
