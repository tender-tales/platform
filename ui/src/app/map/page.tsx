'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Map, { NavigationControl, Source, Layer, Popup } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { motion } from 'framer-motion'
import { ArrowLeft, Satellite, MapPin, Info, Layers, Eye, Search, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SatelliteEmbedding, EarthEngineError, fetchEmbeddingData, fetchSimilarityHeatmap, getTypeColor, DEMO_LOCATIONS } from '../../lib/earthengine'
import { apiClient } from '../../lib/api'

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

export default function MapPage() {
  const router = useRouter()
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE)
  const [showSatelliteInfo, setShowSatelliteInfo] = useState(true)
  // Removed embedding data and selected point - heatmap only now
  const [isLoading, setIsLoading] = useState(false)
  const [referenceYear, setReferenceYear] = useState(2020)
  const [targetYear, setTargetYear] = useState(2024)
  // Removed viewMode - only heatmap mode now
  const [heatmapData, setHeatmapData] = useState<any>(null)
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [lastError, setLastError] = useState<EarthEngineError | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.65)
  const [currentBounds, setCurrentBounds] = useState<string>('')
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [estimatedTime, setEstimatedTime] = useState<string>('')

  const loadDataTimeout = useRef<NodeJS.Timeout | null>(null)
  const currentRequest = useRef<AbortController | null>(null)
  const processingTimer = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(async (cancelPrevious = true) => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds()
    if (!bounds) return;

    const boundsKey = `${bounds.getNorth()},${bounds.getSouth()},${bounds.getEast()},${bounds.getWest()},${referenceYear},${targetYear}`

    // Skip if we're already processing a request (prevents duplicate requests)
    if (currentRequest.current && !currentRequest.current.signal.aborted) {
      console.log('⏭️  Skipping request - another request is already in progress')
      return
    }

    // Cancel any existing request safely
    if (cancelPrevious && currentRequest.current) {
      try {
        // Only abort if not already aborted
        if (!currentRequest.current.signal.aborted) {
          console.log('🚫 Cancelling previous request')
          currentRequest.current.abort()
        } else {
          console.log('🚫 Previous request already aborted')
        }
      } catch (error) {
        console.warn('⚠️  Error aborting previous request:', error)
      }
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    currentRequest.current = abortController

    setIsLoading(true)
    setApiStatus('loading')
    setCurrentBounds(boundsKey)
    setProcessingTime(0)

    // Calculate expected processing time based on area size
    const areaWidth = Math.abs(bounds.getEast() - bounds.getWest());
    const areaHeight = Math.abs(bounds.getNorth() - bounds.getSouth());
    const areaSize = areaWidth * areaHeight;

    let calculatedEstimatedTime: string;
    if (areaSize > 25) {
      calculatedEstimatedTime = '30-60 seconds (large area)';
    } else if (areaSize > 5) {
      calculatedEstimatedTime = '15-30 seconds (medium area)';
    } else {
      calculatedEstimatedTime = '5-15 seconds (small area)';
    }
    setEstimatedTime(calculatedEstimatedTime);

    // Start processing timer
    const startTime = Date.now()
    processingTimer.current = setInterval(() => {
      setProcessingTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    console.log(`🗺️  Loading data for bounds: ${bounds.getNorth().toFixed(3)}, ${bounds.getSouth().toFixed(3)}, ${bounds.getEast().toFixed(3)}, ${bounds.getWest().toFixed(3)}`)
    console.log(`📈 Area size: ${areaSize.toFixed(6)}°² - estimated time: ${calculatedEstimatedTime}`)

    try {
      // Load similarity heatmap with cancellation support
      const result = await fetchSimilarityHeatmap({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      }, referenceYear, targetYear, abortController.signal)

      // Check if this request was cancelled
      if (abortController.signal.aborted) {
        console.log('🚫 Request was cancelled before completion')
        return
      }

      if (result.error) {
        setLastError(result.error)
        setApiStatus('error')
        setHeatmapData(null)
      } else {
        setHeatmapData(result.data)
        setApiStatus('success')
        setLastError(null)
        console.log('✅ Heatmap data loaded successfully')
      }
    } catch (error) {
      // Check if error was due to cancellation
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          console.log('🚫 Request cancelled:', error.message)
          return
        }
        if (error.message.includes('signal is aborted without reason')) {
          console.log('🚫 Request cancelled (signal aborted)')
          return
        }
      }

      console.error('Error loading data:', error)
      setLastError({
        success: false,
        error: 'Unexpected error',
        message: 'An unexpected error occurred while loading data',
        errorType: 'CONNECTION_ERROR'
      })
      setApiStatus('error')
    } finally {
      // Only update loading state if this request wasn't cancelled
      if (!abortController.signal.aborted) {
        setIsLoading(false)
        setProcessingTime(0)
        setEstimatedTime('')
      }

      // Clear processing timer
      if (processingTimer.current) {
        clearInterval(processingTimer.current)
        processingTimer.current = null
      }
    }
  }, [referenceYear, targetYear])

  const handleViewStateChange = useCallback((evt: any) => {
    setViewState(evt.viewState)

    // Cancel any existing timeout
    if (loadDataTimeout.current) {
      clearTimeout(loadDataTimeout.current)
    }

    // Immediately cancel any ongoing request and start new one with shorter debounce
    loadDataTimeout.current = setTimeout(() => {
      console.log('🗺️  Map moved, updating data...')
      loadData(true) // true = cancel previous request
    }, 300) // Reduced debounce for better responsiveness
  }, [loadData])

  const handleGoBack = () => {
    router.push('/')
  }

  // Removed map click handling - no points mode

  const jumpToLocation = (location: typeof DEMO_LOCATIONS[0]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 10,
        duration: 2000
      })
    }
  }

  useEffect(() => {
    // Auto-hide info panel after 10 seconds
    const timer = setTimeout(() => {
      setShowSatelliteInfo(false)
    }, 10000)

    return () => {
      clearTimeout(timer)
      // Cleanup debounce timeout on unmount
      if (loadDataTimeout.current) {
        clearTimeout(loadDataTimeout.current)
      }
      // Cancel any ongoing request on unmount safely
      if (currentRequest.current) {
        try {
          if (!currentRequest.current.signal.aborted) {
            currentRequest.current.abort()
          }
        } catch (error) {
          console.warn('⚠️  Error aborting request on unmount:', error)
        } finally {
          currentRequest.current = null
        }
      }
      // Clear processing timer
      if (processingTimer.current) {
        clearInterval(processingTimer.current)
        processingTimer.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Test backend connection first
    const testConnection = async () => {
      console.log('🔍 Testing backend connection...');
      const healthCheck = await apiClient.healthCheck();

      if (healthCheck.error) {
        console.error('❌ Backend connection failed:', healthCheck.error);
        setLastError({
          success: false,
          error: 'Backend connection failed',
          message: healthCheck.error,
          errorType: 'CONNECTION_ERROR'
        });
        setApiStatus('error');
      } else {
        console.log('✅ Backend connection successful');
        // Load initial data after confirming connection
        setTimeout(() => loadData(false), 1000); // false = don't cancel previous (there is none)
      }
    };

    testConnection();
  }, [loadData])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Satellite className="w-16 h-16 mx-auto mb-4 text-red-400" />
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
              <Satellite className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">
                Satellite Embedding Explorer
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Year selection for heatmap comparison */}
                <div className="flex items-center gap-3 bg-gray-800/60 px-3 py-2 rounded-lg border border-gray-600">
                  <span className="text-xs text-gray-300 font-medium">Compare:</span>
                  <select
                    value={referenceYear}
                    onChange={(e) => setReferenceYear(parseInt(e.target.value))}
                    className="bg-gray-700/80 text-white px-3 py-1 rounded-md border border-gray-500 text-sm font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  >
                    {[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm px-1">→</span>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value))}
                    className="bg-gray-700/80 text-white px-3 py-1 rounded-md border border-gray-500 text-sm font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  >
                    {[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-2 rounded-lg border border-gray-600">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  apiStatus === 'loading' ? 'bg-yellow-400 animate-pulse shadow-yellow-400/50 shadow-sm' :
                  apiStatus === 'success' ? 'bg-green-400 shadow-green-400/50 shadow-sm' :
                  'bg-red-400 shadow-red-400/50 shadow-sm'
                }`}></div>
                <span className="text-xs font-medium text-gray-200">
                  {apiStatus === 'loading' ? 'Processing' :
                   apiStatus === 'success' ? 'Live Data' :
                   lastError?.errorType === 'AUTHENTICATION_ERROR' ? 'Auth Error' :
                   'Connection Failed'}
                </span>
              </div>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  showHeatmap
                    ? 'bg-blue-600/80 text-white border-blue-500 hover:bg-blue-500/80'
                    : 'bg-gray-700/80 text-gray-300 border-gray-600 hover:bg-gray-600/80'
                }`}
                title={showHeatmap ? "Hide heatmap (switch to satellite view)" : "Show heatmap (switch to neutral base map)"}
              >
                {showHeatmap ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                <span className="text-sm font-medium">Heatmap</span>
                {showHeatmap && <span className="text-xs opacity-75">(Neutral Map)</span>}
              </button>
              <button
                onClick={() => loadData(true)}
                disabled={isLoading}
                className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowSatelliteInfo(!showSatelliteInfo)}
                className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
              >
                <Info className="w-5 h-5" />
                Info
              </button>
            </div>
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
          mapStyle={showHeatmap ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/satellite-v9"}
          mapboxAccessToken={MAPBOX_TOKEN}
          reuseMaps
        >
          <NavigationControl position="top-right" style={{ top: '80px' }} />

          {/* Similarity image overlay */}
          {showHeatmap && heatmapData && heatmapData.image_url && (
              <Source
                id="similarity-image"
                type="image"
                url={heatmapData.image_url}
                coordinates={heatmapData.coordinates}
              >
                <Layer
                  id="similarity-overlay"
                  type="raster"
                  paint={{
                    'raster-fade-duration': 300,
                    'raster-opacity': showHeatmap ? heatmapOpacity : 0,
                    'raster-opacity-transition': { duration: 300 }
                  }}
                  layout={{
                    'visibility': showHeatmap ? 'visible' : 'none'
                  }}
                />
              </Source>
          )}

        </Map>
      </div>

      {/* Earth Engine Connection Error Overlay */}
      {apiStatus === 'error' && lastError && (
        <motion.div
          className="absolute inset-0 z-30 bg-red-900/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-red-800 border border-red-600 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Satellite className="w-8 h-8 text-red-200" />
              </div>
              <h2 className="text-2xl font-bold text-red-100 mb-3">
                Earth Engine Connection Failed
              </h2>
              <p className="text-red-200 mb-4">
                {lastError.message}
              </p>

              {lastError.errorType === 'AUTHENTICATION_ERROR' && (
                <div className="bg-red-700/50 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm text-red-200 mb-2">
                    <strong>Required Setup:</strong>
                  </p>
                  <ul className="text-xs text-red-300 space-y-1">
                    <li>• Configure service account credentials</li>
                    <li>• Set EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL</li>
                    <li>• Set EARTH_ENGINE_PRIVATE_KEY</li>
                    <li>• Enable Earth Engine API in project health-rec-439320</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => loadData(true)}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </button>
                <button
                  onClick={() => {setApiStatus('loading'); setLastError(null);}}
                  className="bg-red-700/50 hover:bg-red-600/50 text-red-200 px-4 py-2 rounded-lg"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Combined Info & Legend Panel */}
      {showSatelliteInfo && (
        <motion.div
          className="absolute top-24 right-6 bg-gray-800/95 backdrop-blur-sm text-white rounded-xl p-4 shadow-lg border border-gray-700 max-w-xs"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold">Change Detection</h3>
            </div>
            <button
              onClick={() => setShowSatelliteInfo(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          {/* Description */}
          <div className="text-xs text-gray-300 mb-4 leading-relaxed">
            Satellite imagery comparison from <span className="text-white font-medium">{referenceYear}</span> to <span className="text-white font-medium">{targetYear}</span> using Google Earth Engine embeddings.
          </div>

          {/* Gradient Legend */}
          <div className="mb-4">
            <div className="h-3 w-full rounded-md mb-2" style={{
              background: 'linear-gradient(to right, #000004, #2C105C, #711F81, #B63679, #EE605E, #FDAE78, #FCFDBF)'
            }}></div>
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>Most Different</span>
              <span>Very Similar</span>
            </div>

            {/* Key color points */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{backgroundColor: '#000004'}}></div>
                  <span>Significant changes</span>
                </div>
                <span className="text-purple-400 font-mono">0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{backgroundColor: '#B63679'}}></div>
                  <span>Moderate changes</span>
                </div>
                <span className="text-pink-400 font-mono">0.5</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{backgroundColor: '#FCFDBF'}}></div>
                  <span>Very similar</span>
                </div>
                <span className="text-yellow-300 font-mono">1.0</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          {showHeatmap && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">Overlay Opacity</span>
                <span className="text-xs text-gray-400">{Math.round(heatmapOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          )}

          {/* Statistics */}
          {heatmapData?.statistics && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <div className="text-xs font-medium text-white mb-2">Statistics</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Min:</span>
                  <span className="font-mono">{heatmapData.statistics.min_similarity.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max:</span>
                  <span className="font-mono">{heatmapData.statistics.max_similarity.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg:</span>
                  <span className="font-mono">{heatmapData.statistics.mean_similarity.toFixed(3)}</span>
                </div>
                {heatmapData.statistics.std_similarity && (
                  <div className="flex justify-between">
                    <span>Std:</span>
                    <span className="font-mono">{heatmapData.statistics.std_similarity.toFixed(3)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {apiStatus === 'error' && lastError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-200 font-medium mb-1">Connection Failed</p>
              <p className="text-xs text-red-300">{lastError.message}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Demo Locations Panel */}
      <motion.div
        className="absolute top-24 left-6 bg-gray-800/95 backdrop-blur-sm text-white rounded-xl p-4 shadow-lg border border-gray-700 max-w-xs"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-blue-400" />
          <h4 className="font-semibold text-sm">Demo Locations</h4>
        </div>

        <div className="space-y-2">
          {DEMO_LOCATIONS.map((location, index) => (
            <button
              key={index}
              onClick={() => jumpToLocation(location)}
              className="w-full text-left p-2 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-gray-700/50 transition-all text-xs"
            >
              <div className="font-medium text-blue-400">{location.name}</div>
              <div className="text-gray-400 text-xs mt-1">{location.description}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Coordinates Display */}
      <motion.div
        className="absolute bottom-6 right-6 bg-gray-800/95 backdrop-blur-sm text-white rounded-xl p-3 shadow-lg border border-gray-700 font-mono text-sm"
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
          Zoom: {viewState.zoom.toFixed(1)}x<br />
          Heatmap: {showHeatmap ? 'On' : 'Off'}
        </div>
      </motion.div>
    </div>
  )
}
