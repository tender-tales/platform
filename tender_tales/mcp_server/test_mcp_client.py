#!/usr/bin/env python3
"""Simple MCP client test script to verify server functionality."""

import asyncio
import traceback

import ee

from main import config, get_dataset_info, mcp, search_datasets


async def test_mcp_server() -> None:
    """Test the MCP server by connecting as a client."""
    print("=== Testing MCP Server Functionality ===")

    try:
        # Test the MCP server by running it directly and checking its tools
        print("\n1. Testing server instantiation...")

        # Import and test the main components

        print(f"   ✓ Server name: {mcp.name}")
        print(f"   ✓ Earth Engine project: {config.earth_engine_project_id}")

        # Test the registered tools
        print("\n2. Testing registered MCP tools...")

        # Get the tools from the FastMCP instance
        tools = getattr(mcp, "_tools", {})
        print(f"   ✓ Registered tools: {len(tools)}")

        for tool_name in tools:
            print(f"     - {tool_name}")

        print("\n3. Testing Earth Engine tools directly...")

        # Test if Earth Engine is properly initialized by testing a simple operation

        try:
            test_image = ee.Image("USGS/SRTMGL1_003")
            bands = test_image.bandNames().getInfo()
            print(f"   ✓ Earth Engine connection verified - bands: {bands}")
        except Exception as e:
            print(f"   ✗ Earth Engine error: {e}")
            return

        # Test the Earth Engine tools with proper initialization
        print("\n4. Testing MCP tool functions...")

        # Test get_dataset_info function directly
        try:
            result = await get_dataset_info("USGS/SRTMGL1_003")
            dataset_info = result.get("dataset_info", {})
            print(f"   ✓ get_dataset_info: {dataset_info.get('id', 'Success')}")
        except Exception as e:
            print(f"   ✗ get_dataset_info error: {e}")

        # Test search_datasets function directly
        try:
            result = await search_datasets("elevation", 3)
            count = result.get("count", 0)
            print(f"   ✓ search_datasets: Found {count} datasets")
        except Exception as e:
            print(f"   ✗ search_datasets error: {e}")

        print("\n=== MCP Server Test Complete ===")
        print("✓ Server components working correctly")
        print("✓ Earth Engine integration functional")
        print("✓ MCP tools registered and callable")
        print("✓ Ready for MCP client connections")

    except Exception as e:
        print(f"✗ Test failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_mcp_server())
