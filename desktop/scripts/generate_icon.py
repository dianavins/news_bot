#!/usr/bin/env python3
"""
Simple script to generate a 16x16 black square PNG icon for system tray
"""

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL/Pillow not available, trying alternative approach...")

import os

def create_icon_with_pil():
    """Create icon using PIL/Pillow library"""
    # Create a new 16x16 image with transparent background
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a black square (leaving 1 pixel border for better visibility)
    draw.rectangle([1, 1, 14, 14], fill=(0, 0, 0, 255))
    
    # Save as PNG
    output_path = os.path.join(os.path.dirname(__file__), 'assets', 'tray-icon.png')
    img.save(output_path, 'PNG')
    print(f"Created 16x16 black square icon: {output_path}")
    return True

def create_icon_minimal():
    """Create minimal PNG without PIL - very basic approach"""
    import struct
    
    # Minimal PNG data for 16x16 black square
    # PNG signature + IHDR + IDAT + IEND chunks
    width = 16
    height = 16
    
    # PNG file signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (image header)
    ihdr_data = struct.pack('>2I5B', width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    ihdr_crc = 0x1f83ff61  # Pre-calculated CRC for this specific IHDR
    ihdr_chunk = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Simple IDAT chunk with black pixels
    # For 16x16 RGB image, we need 16 * (1 + 16*3) bytes = 16 * 49 = 784 bytes
    idat_raw = bytearray()
    for y in range(height):
        idat_raw.append(0)  # Filter type: None
        for x in range(width):
            if 1 <= x <= 14 and 1 <= y <= 14:  # Black square with border
                idat_raw.extend([0, 0, 0])  # Black pixel (RGB)
            else:
                idat_raw.extend([255, 255, 255])  # White pixel (RGB)
    
    # Compress the data (very basic, not optimal)
    import zlib
    compressed_data = zlib.compress(bytes(idat_raw))
    idat_crc = zlib.crc32(b'IDAT' + compressed_data) & 0xffffffff
    idat_chunk = struct.pack('>I', len(compressed_data)) + b'IDAT' + compressed_data + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = 0xae426082  # Standard IEND CRC
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    # Combine all parts
    png_data = png_signature + ihdr_chunk + idat_chunk + iend_chunk
    
    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), 'assets', 'tray-icon.png')
    with open(output_path, 'wb') as f:
        f.write(png_data)
    
    print(f"Created minimal 16x16 black square icon: {output_path}")
    return True

def main():
    print("Generating 16x16 black square tray icon...")
    
    # Ensure assets directory exists
    assets_dir = os.path.join(os.path.dirname(__file__), 'assets')
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
        print(f"Created assets directory: {assets_dir}")
    
    # Try PIL first, fallback to minimal approach
    if PIL_AVAILABLE:
        print("Using PIL/Pillow for high-quality icon...")
        try:
            return create_icon_with_pil()
        except Exception as e:
            print(f"PIL approach failed: {e}")
            print("Falling back to minimal PNG creation...")
    
    # Fallback approach
    try:
        return create_icon_minimal()
    except Exception as e:
        print(f"Minimal PNG creation failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("Icon generation completed successfully!")
    else:
        print("Icon generation failed. Please install Pillow: pip install Pillow")