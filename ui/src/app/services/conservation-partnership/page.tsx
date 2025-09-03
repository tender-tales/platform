'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Leaf, Shield, Users, Globe, Target, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ConservationPartnershipPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const services = [
    {
      icon: Globe,
      title: "Environmental Impact Assessment",
      description: "Comprehensive analysis of environmental risks and opportunities using advanced geospatial technologies and data science."
    },
    {
      icon: Target,
      title: "Strategic Conservation Planning",
      description: "Data-driven strategies to optimize conservation efforts, maximize impact, and ensure sustainable outcomes for vulnerable ecosystems."
    },
    {
      icon: Shield,
      title: "Ecosystem Monitoring Solutions",
      description: "Implementation of cutting-edge monitoring systems to track ecosystem health, biodiversity, and environmental changes over time."
    },
    {
      icon: Users,
      title: "Capacity Building & Training",
      description: "Empowering conservation teams with technical knowledge, tools, and methodologies to enhance their environmental protection efforts."
    }
  ]

  const eligibleOrganizations = [
    "Environmental non-profits and NGOs",
    "Wildlife conservation organizations",
    "Marine protection groups",
    "Forest and habitat preservation societies",
    "Indigenous community conservation initiatives",
    "Academic research institutions focused on environmental science",
    "Community-based conservation programs"
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

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-4xl mx-auto text-center text-white mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-ocean-500/20 to-green-500/20 rounded-full">
              <Heart className="w-12 h-12 text-ocean-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Conservation <span className="text-ocean-400">Partnership</span>
          </h1>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-ocean-900/30 to-ocean-800/30 rounded-xl p-6 border border-ocean-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Our Purpose</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Empower non-profit organizations and conservation groups to protect endangered ecosystems
              using cutting-edge technology and expertise.
            </p>
          </div>
        </motion.div>

        {/* Services */}
        <motion.div
          className="max-w-6xl mx-auto mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              How We <span className="text-ocean-400">Help</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Comprehensive partnership services for conservation organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-5 border border-gray-700 hover:border-ocean-500/50 transition-all duration-300"
                  whileHover={{ y: -3 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-ocean-500/20 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 text-ocean-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Eligible Organizations */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-3">
                Who We <span className="text-ocean-400">Work With</span>
              </h2>
              <p className="text-gray-300">
                Organizations making measurable environmental impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eligibleOrganizations.map((org, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="w-1.5 h-1.5 bg-ocean-400 rounded-full flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{org}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-ocean-500/10 to-ocean-400/10 rounded-xl p-6 border border-ocean-500/20">
            <h2 className="text-xl font-bold text-white mb-3">
              Ready to Partner With Us?
            </h2>
            <p className="text-gray-300 mb-4">
              Let&apos;s discuss how we can support your conservation efforts.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              <Mail className="w-5 h-5" />
              Get In Touch
            </Link>
          </div>
        </motion.div>

      </div>
    </main>
  )
}
