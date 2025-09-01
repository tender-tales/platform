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
          className="max-w-4xl mx-auto text-white"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About <span className="text-ocean-400">Us</span>
            </h1>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-ocean-400">Our Team</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Team Member 1 - Smruthi */}
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-ocean-500/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ocean-400/20 shadow-xl">
                      <Image
                        src="https://media.licdn.com/dms/image/v2/C5603AQGf7esY1Eluhg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1616968325612?e=1759363200&v=beta&t=snaBQm4H5CNAvh8AyMYhEqn034XnBQ1lV9fUKgfD8EU"
                        alt="Smruthi Rangarajan"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">Smruthi Rangarajan</h3>
                  <p className="text-ocean-400 font-medium mb-4">Co-Founder & CEO</p>

                  <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p>
                      MBA graduate from University of British Columbia with Big4 consulting experience
                      and 6+ years leading complex business transformations across strategy and operations.
                    </p>
                    <p>
                      Award-winning leader specializing in supply chain optimization, product management,
                      and sustainable business practices. Lean Six Sigma certified with a passion for
                      social entrepreneurship.
                    </p>
                    <p>
                      Dedicated to leveraging technology and data-driven insights to create positive
                      environmental impact and drive meaningful change.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">Strategy</span>
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">Operations</span>
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">Supply Chain</span>
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">Product Management</span>
                  </div>

                  <a
                    href="https://www.linkedin.com/in/smruthi-rangarajan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-ocean-400 hover:text-ocean-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </motion.div>

              {/* Team Member 2 - Amrit */}
              <motion.div
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-ocean-500/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-ocean-400/20 shadow-xl">
                      <Image
                        src="https://media.licdn.com/dms/image/v2/C4E03AQHF58K1ZMcWBQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1652318623696?e=1759363200&v=beta&t=wcJIUCiIE7D5EJAPW0kRCJm-B_ueqFdqF6KLYffeIMM"
                        alt="Amrit Krishnan"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">Amrit Krishnan</h3>
                  <p className="text-ocean-400 font-medium mb-4">Co-Founder & CTO</p>

                  <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                    <p>
                      Technical leader with deep expertise in Artificial Intelligence and Software Engineering
                      across diverse application domains including automotive and healthcare systems.
                    </p>
                    <p>
                      Proven track record of developing scalable AI solutions and leading cross-functional
                      technical teams to deliver innovative products.
                    </p>
                    <p>
                      Passionate about applying cutting-edge AI and machine learning technologies to solve
                      complex environmental challenges and create meaningful technological impact.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">AI/ML</span>
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">Robotics</span>
                    <span className="px-3 py-1 bg-ocean-900/50 text-ocean-300 rounded-full text-xs">Software Engineering</span>
                  </div>

                  <a
                    href="https://www.linkedin.com/in/amritkrishnan/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-ocean-400 hover:text-ocean-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
