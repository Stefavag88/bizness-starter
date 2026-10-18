"""Offline original sample artwork source. Standard library only; never used at runtime."""
from pathlib import Path
import struct
import zlib


def png(width, height, portrait):
    pixels = bytearray()
    for y in range(height):
        pixels.append(0)
        for x in range(width):
            color = (234, 239, 237)
            if (x-width*0.68)**2 + (y-height*0.28)**2 < (min(width,height)*0.15)**2:
                color = (205, 166, 98)
            if y > height*0.6 + x*0.12:
                color = (106, 143, 135)
            if y > height*0.85 - x*0.18:
                color = (58, 91, 89)
            if portrait and width*0.2 < x < width*0.4 and height*0.35 < y < height*0.8:
                color = (160, 185, 177)
            pixels.extend(color)
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind+data))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width,height,8,2,0,0,0)) + chunk(b"IDAT",zlib.compress(bytes(pixels),9)) + chunk(b"IEND",b"")


if __name__ == "__main__":
    target = Path(__file__).resolve().parents[2] / "apps/site/public/uploads/starter-samples"
    target.mkdir(parents=True, exist_ok=True)
    for name, width, height, portrait in [("abstract-landscape",480,320,False),("abstract-portrait",320,480,True)]:
        with (target / (name+".png")).open("xb") as out:
            out.write(png(width,height,portrait))
