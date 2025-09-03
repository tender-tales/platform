'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Briefcase, Target, Users, Clock, CheckCircle, Lightbulb, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ProBonoConsultingPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const consultingServices = [
    {
      icon: Target,
      title: "Strategic Planning",
      description: "Develop comprehensive project strategies and roadmaps to maximize environmental impact and sustainability outcomes."
    },
    {
      icon: Lightbulb,
      title: "Technical Advisory",
      description: "Expert guidance on technology implementation, data analysis methodologies, and best practices for conservation projects."
    },
    {
      icon: Users,
      title: "Project Management",
      description: "End-to-end project management support including timeline development, resource allocation, and stakeholder coordination."
    },
    {
      icon: CheckCircle,
      title: "Impact Assessment",
      description: "Rigorous evaluation frameworks to measure project effectiveness and demonstrate measurable environmental outcomes."
    }
  ]

  const projectTypes = [
    "Ecosystem restoration initiatives",
    "Biodiversity monitoring projects",
    "Climate change adaptation studies",
    "Marine conservation efforts",
    "Wildlife protection programs",
    "Environmental policy research",
    "Community-based conservation projects"
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
              <Briefcase className="w-12 h-12 text-ocean-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Pro Bono <span className="text-ocean-400">Consulting</span>
          </h1>
        </motion.div>

        {/* Purpose Statement */}
        <motion.div
          className="max-w-4xl mx-auto mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-r from-ocean-900/30 to-ocean-800/30 rounded-xl p-6 border border-ocean-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Our Approach</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Provide expert consulting services to environmental projects that demonstrate significant conservation impact
              and measurable outcomes for ecosystem protection and biodiversity preservation.
            </p>
          </div>
        </motion.div>

        {/* Consulting Services */}
        <motion.div
          className="max-w-6xl mx-auto mb-16"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Consulting <span className="text-ocean-400">Expertise</span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Comprehensive consulting services tailored to your project needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consultingServices.map((service, index) => {
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

        {/* Project Types */}
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
                Project <span className="text-ocean-400">Focus Areas</span>
              </h2>
              <p className="text-gray-300">
                We consult on projects with clear conservation objectives and measurable impact.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectTypes.map((project, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="w-1.5 h-1.5 bg-ocean-400 rounded-full flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{project}</span>
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
              Need Consulting Support?
            </h2>
            <p className="text-gray-300 mb-4">
              Let&apos;s explore how our expertise can advance your project.
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
