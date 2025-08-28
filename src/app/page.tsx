'use client'

import { motion } from 'framer-motion'
import { Satellite, MapPin, TrendingUp, Layers, Eye, ArrowRight, Play, BarChart3, Globe2, TreePine, Building, Mountain } from 'lucide-react'

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
          <img 
            src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeDV2ZmxtYWM4amluaDg2Nml1ZzZ1a3pqMzRxODkyMjBsaThwOTNzeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l1Kddb81CyiXkEanC/giphy.gif"
            alt="NASA EPIC Earth satellite timelapse showing full Earth from space"
            className="w-full h-full object-cover opacity-90"
            loading="eager"
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
              Visualizing Our Changing Planet
            </motion.p>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Harness the power of Google Earth Engine satellite data to detect and monitor 
              environmental changes. Track deforestation, urban growth, agricultural expansion, 
              and climate impacts with AI-powered analysis.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition duration-300 shadow-lg flex items-center justify-center gap-2 text-lg">
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

      {/* Platform Overview */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by Satellite Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform processes vast amounts of satellite imagery from Google Earth Engine 
              to identify patterns, track changes, and provide insights into our planet&apos;s transformation.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-16"
            initial="initial"
            whileInView="animate"
            variants={stagger}
            viewport={{ once: true }}
          >
            <motion.div 
              className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300"
              variants={fadeInUp}
            >
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe2 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Global Coverage</h3>
              <p className="text-gray-600 leading-relaxed">
                Access satellite imagery covering the entire planet with regular updates 
                to track changes over time across any region.
              </p>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300"
              variants={fadeInUp}
            >
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">AI Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Machine learning models trained on labeled datasets automatically detect 
                and classify environmental changes with high accuracy.
              </p>
            </motion.div>

            <motion.div 
              className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition duration-300"
              variants={fadeInUp}
            >
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Trend Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualize temporal changes and identify trends in land use, 
                vegetation cover, and human development patterns.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Change Detection Examples */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Examples of Change Detection
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              See how satellite imagery reveals the story of our changing planet through 
              before-and-after comparisons and time-series analysis.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            variants={stagger}
            viewport={{ once: true }}
          >
            {[
              { 
                icon: TreePine, 
                title: 'Deforestation Tracking',
                desc: 'Monitor forest loss in the Amazon, detecting illegal logging and tracking reforestation efforts.',
                bgColor: 'bg-green-500/20',
                textColor: 'text-green-400'
              },
              { 
                icon: Building, 
                title: 'Urban Expansion',
                desc: 'Track city growth, new infrastructure development, and suburban sprawl patterns.',
                bgColor: 'bg-blue-500/20',
                textColor: 'text-blue-400'
              },
              { 
                icon: Mountain, 
                title: 'Agricultural Changes',
                desc: 'Identify crop rotation patterns, irrigation expansion, and land conversion to farming.',
                bgColor: 'bg-yellow-500/20',
                textColor: 'text-yellow-400'
              },
              { 
                icon: Layers, 
                title: 'Climate Impact',
                desc: 'Observe glacial retreat, desert expansion, and vegetation changes due to climate.',
                bgColor: 'bg-red-500/20',
                textColor: 'text-red-400'
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="group p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer"
                variants={fadeInUp}
              >
                <div className={`w-14 h-14 ${item.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-7 h-7 ${item.textColor}`} />
                </div>
                <h4 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <div className="flex items-center text-blue-400 text-sm group-hover:text-blue-300">
                  <span>View Example</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built on Industry-Leading Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leveraging Google Earth Engine&apos;s petabyte-scale satellite database 
              and advanced machine learning for accurate change detection.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Technologies</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Satellite className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Google Earth Engine</h4>
                    <p className="text-gray-600 text-sm">Planetary-scale satellite imagery and analysis platform</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Labeled Datasets</h4>
                    <p className="text-gray-600 text-sm">Curated training data for accurate change detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Layers className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Machine Learning</h4>
                    <p className="text-gray-600 text-sm">Advanced algorithms for pattern recognition and classification</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Globe2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Interactive Visualization</p>
                  <p className="text-sm text-gray-500 mt-1">Coming Soon</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-green-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start Exploring Earth&apos;s Changes
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90 leading-relaxed">
              Join researchers, environmentalists, and data scientists in understanding 
              our planet&apos;s transformation through the lens of satellite imagery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-900 font-semibold py-4 px-10 rounded-lg hover:bg-gray-100 transition duration-300 shadow-lg text-lg">
                Launch Platform
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold py-4 px-10 rounded-lg transition duration-300 text-lg">
                Get API Access
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}