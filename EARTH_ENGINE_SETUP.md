# Google Earth Engine Setup Guide

This guide explains how to set up Google Earth Engine authentication for accessing the satellite embedding dataset.

## Prerequisites

1. **Google Cloud Project**: You need the project ID `ocean-health-468302`
2. **Earth Engine Access**: Register at [Google Earth Engine](https://earthengine.google.com/)
3. **Service Account**: Create a service account for server-side authentication

## Step 1: Enable Earth Engine API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `ocean-health-468302`
3. Navigate to "APIs & Services" > "Library"
4. Search for "Google Earth Engine API" and enable it

## Step 2: Create Service Account

1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `earth-engine-service`
4. Description: `Service account for Earth Engine API access`
5. Click "Create and Continue"

## Step 3: Assign Permissions

Assign these roles to the service account:
- `Earth Engine Resource Admin`
- `Earth Engine Resource Viewer`

## Step 4: Generate Private Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the private key file

## Step 5: Register Service Account with Earth Engine

Run this command with your service account email:
```bash
earthengine authenticate --service-account your-service-account@ocean-health-468302.iam.gserviceaccount.com --key-file path/to/your/private-key.json
```

## Step 6: Environment Variables

Add these to your `.env.local`:

```env
GOOGLE_CLOUD_PROJECT=ocean-health-468302
EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL=your-service-account@ocean-health-468302.iam.gserviceaccount.com
EARTH_ENGINE_PRIVATE_KEY_FILE=path/to/your/private-key.json
```

## Step 7: Update API Route

Update `/src/app/api/earthengine/route.ts` with proper authentication:

```typescript
const serviceAccount = {
  type: "service_account",
  project_id: process.env.GOOGLE_CLOUD_PROJECT,
  private_key_id: "...",
  private_key: process.env.EARTH_ENGINE_PRIVATE_KEY,
  client_email: process.env.EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL,
  client_id: "...",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token"
};

await ee.data.authenticateViaPrivateKey(serviceAccount);
```

## Testing the Dataset Access

Once authenticated, you can test access to the satellite embedding dataset:

```javascript
const dataset = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL');
const image = dataset
  .filterDate('2023-01-01', '2023-12-31')
  .first();

// Get embedding vectors for a specific location
const point = ee.Geometry.Point([-122.4194, 37.7749]);
const sample = image.sampleRegions({
  collection: ee.FeatureCollection([ee.Feature(point)]),
  scale: 10,
  projection: 'EPSG:4326'
});
```

## Dataset Information

- **Collection ID**: `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`
- **Temporal Coverage**: 2017-2024 (annual)
- **Spatial Resolution**: 10 meters
- **Bands**: 64 embedding dimensions (A00-A63)
- **Data Type**: Float32 (-1 to 1 range)
- **Global Coverage**: Land surfaces and shallow water

## Troubleshooting

1. **Authentication Errors**: Ensure service account has Earth Engine access
2. **Permission Denied**: Check IAM roles and Earth Engine registration
3. **Quota Exceeded**: Monitor Earth Engine usage limits
4. **Invalid Project**: Verify project ID `ocean-health-468302` is correct

## Current Status

The application currently uses mock data while Earth Engine authentication is being set up. Once configured, the API will return real satellite embedding vectors from the Google dataset.
