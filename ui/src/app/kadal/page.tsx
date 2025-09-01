'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Send, Waves, Loader, User, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_API_KEY

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 80.2707, // Chennai, India
  latitude: 13.0827,
  zoom: 12
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  data?: any;
}

export default function MapPage() {
  const router = useRouter()
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [visualizationData, setVisualizationData] = useState<any>(null)

  const handleViewStateChange = useCallback((evt: any) => {
    setViewState(evt.viewState)
  }, [])

  const handleGoBack = () => {
    router.push('/')
  }

  // Keyboard shortcuts for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
      if (e.key === 'Escape' && chatOpen) {
        setChatOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen, chatOpen])

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading) return

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
        const geocodeResult = response.data.find(result => result.tool === 'geocode_location')
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

        // Check for satellite imagery data in all results
        const sentinelResult = response.data.find(result => result.tool === 'get_sentinel_image')
        if (sentinelResult && sentinelResult.result) {
          // Only set visualization data if we have a valid thumbnail URL
          if (sentinelResult.result.thumbnail_url && !sentinelResult.result.status?.includes('simulated')) {
            setVisualizationData({
              url: sentinelResult.result.thumbnail_url,
              region: sentinelResult.result.region,
              type: 'sentinel2',
              metadata: {
                dateRange: sentinelResult.result.date_range,
                imageCount: sentinelResult.result.image_count,
                cloudCover: sentinelResult.result.cloud_cover_threshold
              }
            })
          }
          // For now, we just acknowledge the satellite request without showing imagery
          console.log('Satellite imagery requested:', sentinelResult.result)
        }
      }

      // If there's visualization data, update the map
      if (response.visualizationUrl) {
        setVisualizationData({
          url: response.visualizationUrl,
          region: response.region
        })
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
      data: data.data,
      visualizationUrl: data.visualization_url,
      region: currentView
    }
  }

  const exampleQueries = [
    "Go to Toronto",
    "Show satellite data for this area",
    "Show me elevation data for this area",
    "Go to Amazon rainforest",
    "Show Sentinel imagery for this location"
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
    <div className="relative min-h-screen bg-gray-900">
      {/* Header */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 bg-gray-900/90 backdrop-blur-sm"
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
                Kadal
              </h1>
            </div>

            <div className="w-32" />
          </div>
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="relative w-full h-screen">
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW_STATE}
          onMove={handleViewStateChange}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          reuseMaps
        >
          <NavigationControl position="top-right" style={{ top: '80px' }} />

          {/* Satellite imagery overlay */}
          {visualizationData && visualizationData.type === 'sentinel2' && (
            <Source
              id="sentinel-overlay"
              type="raster"
              tiles={[visualizationData.url]}
              tileSize={512}
            >
              <Layer
                id="sentinel-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.8,
                  'raster-fade-duration': 300
                }}
              />
            </Source>
          )}
        </Map>
      </div>

      {/* Sidebar Toggle Button - Only show when sidebar is closed */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-20 left-6 bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700 text-white rounded-lg p-3 shadow-lg transition-colors z-30 border border-gray-600"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="absolute top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-sm shadow-2xl border-r border-gray-700 z-40"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src="/tender-tales-logo.png"
                    alt="Tender Tales Logo"
                    width={32}
                    height={32}
                  />
                  <h2 className="text-xl font-bold text-white">Kadal</h2>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* User Section */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-1 ring-blue-400/20">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                </div>
                <div>
                  <p className="text-white font-medium">Demo User</p>
                  <p className="text-gray-400 text-sm">demo@tendertales.com</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    chatOpen
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Waves className="w-5 h-5" />
                  <span className="font-medium">Kadal Assistant</span>
                </button>
              </nav>
            </div>

            {/* Version Info */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-center text-xs text-gray-500">
                <p>Kadal v1.0.0</p>
                <p className="mt-1">Powered by Earth Engine</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Assistant - Bottom positioned */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 z-50"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Kadal Assistant</h3>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-80 max-h-[60vh] overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  <p className="mb-2 font-medium text-gray-300">Try these example queries:</p>
                  <div className="space-y-1">
                    {exampleQueries.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(example)}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-700/50 rounded-md transition-colors text-blue-300 border border-gray-700/30 hover:border-blue-500/40 text-xs"
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
                      <div className={`flex gap-2 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-blue-400'
                        }`}>
                          {message.isUser ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Waves className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-xl ${
                            message.isUser
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-gray-700 text-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          <p className="text-xs opacity-60 mt-2">
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
                      <div className="flex gap-2 max-w-[85%]">
                        <div className="w-8 h-8 bg-gray-700 text-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <Waves className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-700 text-gray-100 p-3 rounded-xl rounded-bl-md">
                          <div className="flex items-center gap-2">
                            <Loader className="w-4 h-4 animate-spin text-blue-400" />
                            <span className="text-sm">Analyzing your query...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-700">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Try: 'Go to Toronto' or 'Show satellite data for this area'..."
                    className="w-full bg-gray-700 text-white rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition-colors placeholder-gray-400 resize-none"
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                    {chatInput.length}/500
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-2xl p-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Press Enter to send
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button - Only show when sidebar is closed */}
      <AnimatePresence>
        {!sidebarOpen && !chatOpen && (
          <motion.button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center group"
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Waves className="w-6 h-6 group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Visualization Info Panel */}
      {visualizationData && visualizationData.type === 'sentinel2' && (
        <motion.div
          className="absolute top-20 right-6 bg-gray-800/95 backdrop-blur-sm text-white rounded-xl p-4 shadow-lg border border-gray-700 max-w-sm"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-semibold">Sentinel-2 Imagery</span>
          </div>
          <div className="text-xs text-gray-300 space-y-1">
            <div>Period: {visualizationData.metadata?.dateRange}</div>
            <div>Images: {visualizationData.metadata?.imageCount}</div>
            <div>Max Cloud: {visualizationData.metadata?.cloudCover}%</div>
          </div>
          <button
            onClick={() => setVisualizationData(null)}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
          >
            Hide overlay
          </button>
        </motion.div>
      )}

      {/* Coordinates Display */}
      <motion.div
        className={`absolute bottom-6 ${chatOpen || !sidebarOpen ? 'left-6' : 'right-6'} bg-gray-800/95 backdrop-blur-sm text-white rounded-xl p-3 shadow-lg border border-gray-700 font-mono text-sm transition-all duration-300`}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold">Current View</span>
        </div>
        <div className="text-xs text-gray-300">
          Lat: {viewState.latitude.toFixed(4)}°<br />
          Lon: {viewState.longitude.toFixed(4)}°<br />
          Zoom: {viewState.zoom.toFixed(1)}x
        </div>
      </motion.div>
    </div>
  )
}
