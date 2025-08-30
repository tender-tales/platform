# Google Earth Engine Setup and Authentication

This guide explains how to set up Google Earth Engine authentication for accessing the satellite embedding dataset and configuring GitHub Actions deployment.

## Overview

The application uses Google Earth Engine service account authentication, which is the recommended approach for server-side applications. This eliminates the need for manual `earthengine authenticate` commands and works in automated CI/CD environments.

## Prerequisites

1. **Google Cloud Project**: Project ID `ocean-health-468302`
2. **Earth Engine Access**: Register at [Google Earth Engine](https://earthengine.google.com/)
3. **Service Account**: Create a service account for server-side authentication

## Initial Setup

### Step 1: Enable Earth Engine API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `ocean-health-468302`
3. Navigate to "APIs & Services" > "Library"
4. Search for "Google Earth Engine API" and enable it

### Step 2: Create Service Account

1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `earth-engine-service`
4. Description: `Service account for Earth Engine API access`
5. Click "Create and Continue"

### Step 3: Assign Permissions

Assign these roles to the service account:
- `Earth Engine Resource Admin`
- `Earth Engine Resource Viewer`

### Step 4: Generate Private Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the private key file

### Step 5: Register Service Account with Earth Engine

You can register the service account in two ways:

#### Method 1: Using Earth Engine CLI
```bash
earthengine authenticate --service-account your-service-account@ocean-health-468302.iam.gserviceaccount.com --key-file path/to/your/private-key.json
```

#### Method 2: Using Earth Engine Code Editor
- Go to https://code.earthengine.google.com/
- Click on "Assets" tab
- In the console, run:
  ```javascript
  // Replace with your service account email
  ee.data.setAuthToken(null, 'your-service-account@project.iam.gserviceaccount.com');
  ```

#### Method 3: Using Python API
```python
import ee
ee.Authenticate()  # Follow the prompts to register the service account
```

## GitHub Actions Configuration

### Required GitHub Secrets

Configure the following secrets in your GitHub repository:

#### 1. `EARTH_ENGINE_SERVICE_ACCOUNT_KEY`
This should contain the complete JSON service account key file content.

#### 2. `EARTH_ENGINE_PROJECT_ID`
Your Google Cloud project ID that has Earth Engine enabled (`ocean-health-468302`).

#### 3. `GCP_SA_KEY` (already configured)
Your existing Google Cloud service account key for deployment.

#### 4. `GCP_PROJECT_ID` (already configured)
Your Google Cloud project ID.

### How to Add Secrets

1. Copy the entire content of the downloaded JSON file
2. Go to your GitHub repository → Settings → Secrets and variables → Actions
3. Create a new secret named `EARTH_ENGINE_SERVICE_ACCOUNT_KEY`
4. Paste the complete JSON content

## Local Development Setup

### Environment Variables

Add these to your `.env.local`:

```env
GOOGLE_CLOUD_PROJECT=ocean-health-468302
EARTH_ENGINE_SERVICE_ACCOUNT_EMAIL=your-service-account@ocean-health-468302.iam.gserviceaccount.com
EARTH_ENGINE_PRIVATE_KEY_FILE=path/to/your/private-key.json
```

### Authentication Options

#### Option 1: Use the same service account key
```bash
# Copy the service account key to the expected location
cp /path/to/your-service-account-key.json tender_tales/credentials.json
```

#### Option 2: Use OAuth authentication (traditional method)
```bash
earthengine authenticate
```

## Authentication Flow

The updated Earth Engine service now:

1. **Checks multiple credential locations:**
   - `/app/credentials.json` (for Cloud Run deployment)
   - `/run/secrets/earthengine-credentials` (for Docker Compose)
   - `~/.config/earthengine/credentials` (for local development)

2. **Supports multiple authentication methods:**
   - Service account credentials (recommended for production)
   - OAuth credentials (for local development)
   - Application Default Credentials (fallback)

3. **Provides detailed logging:**
   - Shows which authentication method is being used
   - Logs service account email being used
   - Tests the connection after initialization

## Dataset Access

### Dataset Information

- **Collection ID**: `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`
- **Temporal Coverage**: 2017-2024 (annual)
- **Spatial Resolution**: 10 meters
- **Bands**: 64 embedding dimensions (A00-A63)
- **Data Type**: Float32 (-1 to 1 range)
- **Global Coverage**: Land surfaces and shallow water

### Testing Dataset Access

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

### API Integration

Update your API route with proper authentication:

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

## Deployment Pipeline

### GitHub Actions Workflow

The GitHub Actions workflow now:

1. **During build:** Uses the service account credentials to verify authentication works
2. **During deployment:** Uses the same service account credentials in Cloud Run
3. **During runtime:** The application will authenticate using the mounted credentials

### Docker Compose Compatibility

The setup maintains Docker Compose compatibility:
- Still supports mounting credentials as Docker secrets
- Works with existing `/run/secrets/earthengine-credentials` location

## Changes Made to Codebase

1. **Updated `services/earth_engine.py`:**
   - Improved service account authentication using `ee.ServiceAccountCredentials()`
   - Added support for multiple credential file locations
   - Enhanced error handling and logging

2. **Updated `.github/workflows/deploy-gcp.yml`:**
   - Changed to use `EARTH_ENGINE_SERVICE_ACCOUNT_KEY` secret
   - Uses the same secret for both build and deployment phases

3. **Maintained Docker Compose compatibility:**
   - Still supports mounting credentials as Docker secrets
   - Works with existing `/run/secrets/earthengine-credentials` location

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure service account has Earth Engine access and is properly registered
2. **Permission Denied**: Check IAM roles and Earth Engine registration
3. **Quota Exceeded**: Monitor Earth Engine usage limits
4. **Invalid Project**: Verify project ID `ocean-health-468302` is correct
5. **Service account not registered**: Make sure to complete Step 5 above

### Verification Steps

If you encounter issues:

1. **Verify the service account is registered with Earth Engine**
2. **Check that the JSON key format is correct**
3. **Ensure the project ID matches your Earth Engine project**
4. **Verify the service account has appropriate permissions**

### Testing the Setup

The GitHub Actions workflow includes authentication verification during the build process. Check the workflow logs to ensure Earth Engine authentication is working correctly.

## Current Status

The application has been updated to use service account authentication and should work seamlessly in both local development and production environments. The mock data approach has been replaced with real Earth Engine satellite embedding data access.
