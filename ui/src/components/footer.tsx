'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      className="bg-gray-900 text-white py-12"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center space-x-4">
            <Image
              src="/tender-tales-logo.png"
              alt="Tender Tales Logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <span className="text-2xl font-bold">
              <span className="text-white">Tender</span>
              <span className="text-blue-400">Tales</span>
            </span>
          </div>
          <p className="text-gray-400 text-center">
            © {currentYear} Tender Tales Inc. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
