'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Send, Waves, Loader, User, Menu, X, LogOut, Settings, Layers, Eye, EyeOff, Trash2 } from 'lucide-react'
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

interface SatelliteLayer {
  id: string;
  tile_url: string;
  visualization_type: string;
  date_range: any;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  opacity: number;
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
  const [isLoadingSatellite, setIsLoadingSatellite] = useState(false)
  const [satelliteLayers, setSatelliteLayers] = useState<SatelliteLayer[]>([])
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
        // Check for direct satellite imagery result (viewport-based queries)
        const directSatelliteResult = response.data.find((result: any) => result.tool === 'get_satellite_imagery')
        if (directSatelliteResult?.result?.success) {
          console.log('Direct satellite imagery result found:', directSatelliteResult.result)

          const newLayer: SatelliteLayer = {
            id: `satellite-${Date.now()}`,
            tile_url: directSatelliteResult.result.tile_url,
            visualization_type: directSatelliteResult.result.visualization_type,
            date_range: directSatelliteResult.result.date_range,
            bounds: directSatelliteResult.result.bounds,
            opacity: 0.8
          }

          console.log('Creating direct satellite layer:', newLayer)
          setSatelliteLayers([newLayer])
        } else {
          // Look for geocoding result for navigation-based queries
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
            console.log('Setting new viewState:', newViewState) // Debug log
            setViewState(newViewState)

            // Also update using imperative API as fallback
            if (mapRef.current) {
              console.log('Also calling flyTo as fallback') // Debug log
              mapRef.current.flyTo({
                center: [coords.longitude, coords.latitude],
                zoom: coords.zoom,
                duration: 2000
              })

              // After navigation completes, fetch satellite imagery if required
              if (response.satelliteImagery?.enabled) {
                console.log('Satellite imagery required - waiting for navigation to complete')

                // Wait for flyTo to complete, then fetch satellite imagery for the viewport
                mapRef.current.once('moveend', async () => {
                  try {
                    setIsLoadingSatellite(true)
                    console.log('Navigation completed, fetching satellite imagery...')

                    const imagery = await fetchViewportSatelliteImagery(response.satelliteImagery.visualization)

                    if (imagery?.success) {
                      const newLayer: SatelliteLayer = {
                        id: `satellite-${Date.now()}`,
                        tile_url: imagery.tile_url,
                        visualization_type: imagery.visualization_type,
                        date_range: imagery.date_range,
                        bounds: imagery.bounds,
                        opacity: 0.8
                      }

                      console.log('Creating viewport satellite layer:', newLayer)
                      setSatelliteLayers([newLayer])
                    }
                  } catch (error) {
                    console.error('Failed to fetch viewport satellite imagery:', error)

                    // Add error message to chat
                    const errorMessage: ChatMessage = {
                      id: `satellite-error-${Date.now()}`,
                      text: `Failed to load satellite imagery: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      isUser: false,
                      timestamp: new Date()
                    }
                    setChatMessages(prev => [...prev, errorMessage])
                  } finally {
                    setIsLoadingSatellite(false)
                  }
                })
              } else {
                console.log('No satellite imagery required for this query')
              }
            }
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
    // Build proper conversation history with alternating user/assistant messages
    const conversationHistory = chatMessages.slice(-10).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }))

    // Call the backend MCP endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mcp/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        region: {
          north: currentView.latitude + 0.1,
          south: currentView.latitude - 0.1,
          east: currentView.longitude + 0.1,
          west: currentView.longitude - 0.1
        },
        conversation_history: conversationHistory
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
      satelliteImagery: data.satellite_imagery
    }
  }

  const fetchViewportSatelliteImagery = async (visualization: string): Promise<any> => {
    if (!mapRef.current) {
      throw new Error('Map reference not available')
    }

    try {
      // Get current viewport bounds
      const bounds = mapRef.current.getBounds()
      const viewportBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      }

      console.log('Fetching satellite imagery for viewport:', viewportBounds)
      console.log('Visualization type:', visualization)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/satellite/viewport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visualization: visualization,
          viewport_bounds: viewportBounds,
          cloud_coverage_max: 20.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Failed to fetch satellite imagery: ${response.statusText}. ${errorData.detail || ''}`)
      }

      const data = await response.json()
      console.log('Satellite imagery response:', data)
      return data

    } catch (error) {
      console.error('Error in fetchViewportSatelliteImagery:', error)
      throw error
    }
  }

  const exampleQueries = [
    "Show me NDVI for Central Park",
    "Display the Amazon rainforest in false color",
    "What does this area look like in false color?",
    "Show me NDVI of the current area",
    "Apply false color here",
    "What does Tokyo look like from space?",
    "Show satellite imagery for this region",
    "Take me to Mount Everest",
    "Navigate to Paris"
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

        {/* Satellite Layers Control Panel */}
        {(satelliteLayers.length > 0 || isLoadingSatellite) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3 max-w-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-ocean-400" />
              <h3 className="text-sm font-medium text-white">Satellite Layers</h3>
              {isLoadingSatellite && (
                <Loader className="w-3 h-3 animate-spin text-ocean-400" />
              )}
            </div>

            {isLoadingSatellite && satelliteLayers.length === 0 && (
              <div className="py-2 text-xs text-gray-400">
                Loading satellite imagery for viewport...
              </div>
            )}

            {satelliteLayers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between py-2 border-t border-gray-700 first:border-t-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">
                    {layer.visualization_type.replace('_', ' ').replace(/\bndvi\b/i, 'NDVI')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {layer.date_range.acquisition}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layer.opacity * 100}
                    onChange={(e) => {
                      const newOpacity = parseInt(e.target.value) / 100
                      setSatelliteLayers(layers =>
                        layers.map(l =>
                          l.id === layer.id
                            ? { ...l, opacity: newOpacity }
                            : l
                        )
                      )
                    }}
                    className="w-12 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #0EA5E9 0%, #0EA5E9 ${layer.opacity * 100}%, #374151 ${layer.opacity * 100}%, #374151 100%)`
                    }}
                  />
                  <button
                    onClick={() => {
                      setSatelliteLayers(layers => layers.filter(l => l.id !== layer.id))
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1 hover:bg-red-900/20 rounded"
                    title="Remove layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

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

          {/* Satellite Imagery Layers */}
          {satelliteLayers.map((layer) => (
            <Source
              key={layer.id}
              id={layer.id}
              type="raster"
              tiles={[layer.tile_url]}
              tileSize={256}
              minzoom={0}
              maxzoom={18}
            >
              <Layer
                id={`${layer.id}-layer`}
                type="raster"
                source={layer.id}
                paint={{
                  'raster-opacity': layer.opacity,
                  'raster-fade-duration': 300
                }}
                beforeId="waterway-label"
              />
            </Source>
          ))}
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
