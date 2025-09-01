'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      className="bg-gray-900 text-white py-16"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4">
              <Image
                src="/tender-tales-logo.png"
                alt="Tender Tales Logo"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-2xl font-bold">
                <span className="text-white">Tender </span>
                <span className="text-ocean-400">Tales</span>
              </span>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/kadal"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Kadal
                </Link>
              </li>
              <li>
                <a
                  href="https://tender-tales.github.io/platform/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-center md:text-left">
              © {currentYear} Tender Tales Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
