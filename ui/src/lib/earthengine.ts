// Google Earth Engine utility functions
// This connects to our server-side Earth Engine API

import { apiClient } from './api';

export interface SatelliteEmbedding {
  longitude: number;
  latitude: number;
  embedding: number[];
  similarity: number;
  year: number;
  type: 'urban_expansion' | 'deforestation' | 'coastal_change' | 'agricultural_change' | 'glacial_retreat';
  analysisDate?: string;
}

// Interface for API error responses
export interface EarthEngineError {
  success: false;
  error: string;
  message: string;
  errorType: 'AUTHENTICATION_ERROR' | 'CONNECTION_ERROR';
}

// Fetch embedding data from our Earth Engine API
export async function fetchEmbeddingData(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  year: number = 2023
): Promise<{ data?: SatelliteEmbedding[], error?: EarthEngineError }> {
  console.log(`🛰️  Fetching embeddings for year ${year}`);

  const params = new URLSearchParams({
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString(),
    year: year.toString()
  });

  const result = await apiClient.makeRequest<any>(`/api/embeddings?${params}`);

  if (result.error) {
    console.error('❌ Earth Engine API error:', result.error);
    return {
      error: {
        success: false,
        error: result.error,
        message: 'Failed to connect to Earth Engine API',
        errorType: 'CONNECTION_ERROR'
      }
    };
  }

  if (!result.data?.success) {
    console.error('❌ Earth Engine service error:', result.data?.error);
    return {
      error: {
        success: false,
        error: result.data?.error || 'Unknown error',
        message: result.data?.message || 'Unknown error from Earth Engine service',
        errorType: result.data?.error_type || 'CONNECTION_ERROR'
      }
    };
  }

  console.log(`✅ Successfully fetched ${result.data.data?.length || 0} embeddings`);
  return { data: result.data.data };
}

// Fetch similarity heatmap between two years with cancellation support
export async function fetchSimilarityHeatmap(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  referenceYear: number,
  targetYear: number,
  abortSignal?: AbortSignal
): Promise<{ data?: any, error?: EarthEngineError }> {
  // Calculate area size to provide user feedback
  const areaWidth = Math.abs(bounds.east - bounds.west);
  const areaHeight = Math.abs(bounds.north - bounds.south);
  const areaSize = areaWidth * areaHeight;

  console.log(`🗺️  Fetching similarity heatmap: ${referenceYear} vs ${targetYear}`);
  console.log(`📊 Area size: ${areaWidth.toFixed(3)}° × ${areaHeight.toFixed(3)}° = ${areaSize.toFixed(6)}°²`);

  // Provide user feedback based on expected processing time
  if (areaSize > 25) {
    console.log('⏳ Large area detected - processing may take 30-60 seconds');
  } else if (areaSize > 5) {
    console.log('⏳ Medium area - processing may take 15-30 seconds');
  } else {
    console.log('⏳ Small area - processing should complete in 5-15 seconds');
  }

  const params = new URLSearchParams({
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString(),
    reference_year: referenceYear.toString(),
    target_year: targetYear.toString()
  });

  const result = await apiClient.makeRequest<any>(`/api/similarity-heatmap?${params}`, {
    signal: abortSignal
  });

  if (result.error) {
    console.error('❌ Similarity heatmap API error:', result.error);

    // Provide more user-friendly error messages
    let userMessage = 'Failed to connect to Earth Engine API';
    let errorType: 'AUTHENTICATION_ERROR' | 'CONNECTION_ERROR' = 'CONNECTION_ERROR';

    if (result.error.includes('timed out')) {
      userMessage = 'Processing timed out - try a smaller area or different years';
    } else if (result.error.includes('cancelled')) {
      userMessage = 'Request was cancelled';
    } else if (result.error.includes('Failed after')) {
      userMessage = 'Multiple connection attempts failed - check network connection';
    } else if (result.error.includes('Auth') || result.error.includes('auth')) {
      userMessage = 'Earth Engine authentication error';
      errorType = 'AUTHENTICATION_ERROR';
    }

    return {
      error: {
        success: false,
        error: result.error,
        message: userMessage,
        errorType
      }
    };
  }

  if (!result.data?.success) {
    console.error('❌ Similarity heatmap service error:', result.data?.error);
    return {
      error: {
        success: false,
        error: result.data?.error || 'Unknown error',
        message: result.data?.message || 'Unknown error from Earth Engine service',
        errorType: result.data?.error_type || 'CONNECTION_ERROR'
      }
    };
  }

  console.log(`✅ Successfully fetched similarity heatmap data`);
  return { data: result.data.data };
}


// Get type-specific color
export function getTypeColor(type: string): string {
  switch (type) {
    case 'urban_expansion': return '#3b82f6'; // blue
    case 'deforestation': return '#dc2626'; // red
    case 'coastal_change': return '#10b981'; // green
    case 'agricultural_change': return '#f59e0b'; // yellow
    case 'glacial_retreat': return '#6366f1'; // indigo
    default: return '#8b5cf6'; // purple
  }
}

// Sample locations for similarity search demonstrations
export const DEMO_LOCATIONS = [
  {
    name: 'Amazon Rainforest',
    longitude: -60.0,
    latitude: -3.0,
    description: 'Deforestation monitoring in the Amazon Basin'
  },
  {
    name: 'California Central Valley',
    longitude: -121.0,
    latitude: 36.5,
    description: 'Agricultural expansion and water usage patterns'
  },
  {
    name: 'Dubai Urban Development',
    longitude: 55.2708,
    latitude: 25.2048,
    description: 'Rapid urban expansion in the desert'
  },
  {
    name: 'Greenland Ice Sheet',
    longitude: -42.0,
    latitude: 72.0,
    description: 'Glacial retreat and climate change impacts'
  }
];
