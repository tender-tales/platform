'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Map, { NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Send, Waves, Loader, User, Menu, X, LogOut, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import SignInModal from '@/components/auth/signin-modal'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const INITIAL_VIEW_STATE: ViewState = {
  longitude: -149.4, // French Polynesia
  latitude: -17.6797,
  zoom: 5
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  data?: any;
}

function MapPageContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE)
  const [chatOpen, setChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isAuthenticated = status === 'authenticated'

  const handleViewStateChange = useCallback((evt: any) => {
    setViewState(evt.viewState)
  }, [])

  const handleGoBack = () => {
    router.push('/')
  }

  // Show sign-in modal for unauthenticated users after a delay
  useEffect(() => {
    if (status === 'unauthenticated') {
      const timer = setTimeout(() => {
        setShowSignInModal(true)
      }, 3000) // Show modal after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [status])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false)
      }
      if (e.key === 'Escape' && showSignInModal) {
        setShowSignInModal(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [chatOpen, showSignInModal])

  // Handle map resize when sidebar state changes
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.resize()
      }, 300) // Match the transition duration
      return () => clearTimeout(timer)
    }
  }, [chatOpen])

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading) return

    // Show sign-in modal for unauthenticated users trying to use the assistant
    if (!isAuthenticated) {
      setShowSignInModal(true)
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoading(true)

    try {
      // Process the query using the MCP server
      const response = await processMCPQuery(chatInput.trim(), viewState)

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        data: response.data
      }

      setChatMessages(prev => [...prev, botMessage])

      // Handle location navigation and satellite imagery from all results
      console.log('Response data length:', response.data?.length) // Debug log
      console.log('All results:', response.data) // Debug log

      if (response.data && response.data.length > 0) {
        // Look for geocoding result in all results (not just first)
        const geocodeResult = response.data.find((result: any) => result.tool === 'geocode_location')
        if (geocodeResult && geocodeResult.result?.found) {
          const coords = geocodeResult.result.coordinates
          console.log('Navigation coords found:', coords) // Debug log
          console.log('About to navigate to:', coords.longitude, coords.latitude, coords.zoom) // Debug log
          // Update the map viewport to the new location
          const newViewState = {
            longitude: coords.longitude,
            latitude: coords.latitude,
            zoom: coords.zoom
          }
          setViewState(newViewState)
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [coords.longitude, coords.latitude],
              zoom: coords.zoom,
              duration: 2000
            })
          }
        }

      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Failed to process query'}`,
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const processMCPQuery = async (query: string, currentView: ViewState) => {
    // Call the backend MCP endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mcp/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        region: {
          type: 'rectangle',
          coordinates: [
            currentView.longitude - 0.1,
            currentView.latitude - 0.1,
            currentView.longitude + 0.1,
            currentView.latitude + 0.1
          ]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to process query: ${response.statusText}`)
    }

    const data = await response.json()

    console.log('Full API response:', data) // Debug log

    return {
      message: data.response,
      data: data.data
    }
  }

  const exampleQueries = [
    "Go to Toronto",
    "Navigate to Paris",
    "Show me New York City",
    "Go to Amazon rainforest",
    "Take me to Tokyo"
  ]

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Image
            src="/tender-tales-logo.png"
            alt="Tender Tales Logo"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Configuration Error</h2>
          <p className="text-gray-300">Mapbox API token is not configured.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Panel - Chat Assistant */}
      <motion.div
        className={`${chatOpen ? 'w-96' : 'w-16'} flex-shrink-0 transition-all duration-300 ease-out bg-gray-900 border-r border-gray-700 flex flex-col z-30`}
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left Panel Header */}
        <div className={`${chatOpen ? 'h-16' : 'h-12'} bg-gray-800/50 border-b border-gray-700 flex items-center px-3 flex-shrink-0 transition-all duration-300`}>
          {chatOpen ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Image
                  src="/tender-tales-logo.png"
                  alt="Tender Tales Logo"
                  width={20}
                  height={20}
                />
                <div>
                  <h1 className="text-sm font-bold text-white">Kadal</h1>
                  <p className="text-xs text-gray-400">AI Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-700 rounded"
                title="Collapse Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col w-full h-full px-2">
              {/* Top - Kadal Icon */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition-colors rounded"
                  title="Open Kadal Assistant"
                >
                  <Waves className="w-5 h-5 text-ocean-400" />
                </button>
              </div>

              {/* Middle spacer */}
              <div className="flex-1"></div>

              {/* Bottom - User Section */}
              <div className="flex flex-col items-center pb-3 gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => router.push('/account')}
                      className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-700 rounded-full transition-colors"
                      title="Account Settings"
                    >
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={28}
                          height={28}
                          className="rounded-full ring-1 ring-ocean-400/20"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-0 -right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors hover:bg-red-900/20 rounded"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                    title="Sign In"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Content - Only show when open */}
        {chatOpen && (
          <>
            {/* Current View Info */}
            <div className="px-3 py-2 bg-gray-800/30 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3 h-3 text-ocean-400" />
                <span className="text-xs font-medium text-gray-300">Current View</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-gray-400">
                <div>Lat: {viewState.latitude.toFixed(4)}°</div>
                <div>Lon: {viewState.longitude.toFixed(4)}°</div>
                <div>Zoom: {viewState.zoom.toFixed(1)}x</div>
              </div>
            </div>


            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  <p className="mb-3 font-medium text-gray-300">Try these examples:</p>
                  <div className="space-y-2">
                    {exampleQueries.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(example)}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-800 rounded-md transition-colors text-ocean-300 border border-gray-700/50 hover:border-ocean-500/40 text-xs"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[90%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.isUser ? 'bg-ocean-600 text-white' : 'bg-gray-700 text-ocean-400'}`}>
                          {message.isUser ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Waves className="w-3 h-3" />
                          )}
                        </div>
                        <div
                          className={`p-2 rounded-lg text-xs ${message.isUser ? 'bg-ocean-600 text-white rounded-br-sm' : 'bg-gray-700 text-gray-100 rounded-bl-sm'}`}
                        >
                          <p className="leading-relaxed">{message.text}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-gray-700 text-ocean-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <Waves className="w-3 h-3" />
                        </div>
                        <div className="bg-gray-700 text-gray-100 p-2 rounded-lg rounded-bl-sm">
                          <div className="flex items-center gap-2">
                            <Loader className="w-3 h-3 animate-spin text-ocean-400" />
                            <span className="text-xs">Analyzing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-700 bg-gray-800/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Kadal..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ocean-500 placeholder-gray-400"
                  disabled={isLoading}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoading}
                  className="bg-ocean-600 hover:bg-ocean-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {chatInput.length}/500
              </div>
            </form>

            {/* User Section - Bottom */}
            <div className="px-3 py-3 border-t border-gray-700 bg-gray-800/50">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={28}
                          height={28}
                          className="rounded-full ring-1 ring-ocean-400/20"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="absolute -bottom-0 -right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                      <p className="text-gray-400 text-xs truncate">{session?.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1.5 hover:bg-red-900/20 rounded"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Not signed in</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSignInModal(true)}
                    className="text-xs bg-ocean-600 hover:bg-ocean-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Right Panel - Map */}
      <div className="flex-1 min-w-0 relative transition-all duration-300 ease-out">

        {/* Map Container */}
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW_STATE}
          onMove={handleViewStateChange}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          reuseMaps
        >
          <NavigationControl position="top-right" />
        </Map>
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </div>
  )
}

export default function MapPage() {
  return <MapPageContent />
}
