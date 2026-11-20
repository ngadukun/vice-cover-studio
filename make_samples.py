"""Generate the three bundled sample scenes for Vice Cover Studio.

They are stylised stand-ins for user photos — gradient skies, silhouettes
and film grain drawn with PIL — so the app can be tried (and screenshotted)
before anyone uploads a real picture. Run: python3 make_samples.py
"""

import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 900, 675  # 4:3, a typical phone-photo shape
random.seed(20261120)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def sky(draw, stops, w=W, h=H):
    """Paint a vertical gradient from (pos, colour) stops."""
    for y in range(h):
        t = y / h
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                draw.line([(0, y), (w, y)], fill=lerp(c0, c1, (t - p0) / max(p1 - p0, 1e-6)))
                break


def grain(img, amount=9):
    noise = Image.effect_noise(img.size, 14).convert("L")
    img = Image.composite(img, img.point(lambda v: max(0, v - amount)), noise.point(lambda v: 255 if v > 200 else 0))
    return img.filter(ImageFilter.GaussianBlur(0.4))


def palm(draw, x, y, s, colour):
    draw.line([(x, y), (x + 6 * s, y - 46 * s)], fill=colour, width=max(2, int(3 * s)))
    top = (x + 6 * s, y - 46 * s)
    for ang in range(-160, -10, 18):
        rad = math.radians(ang)
        ex = top[0] + math.cos(rad) * 30 * s
        ey = top[1] - abs(math.sin(rad)) * 10 * s + 12 * s
        draw.arc([top[0] - 30 * s, top[1] - 14 * s, top[0] + 30 * s, top[1] + 16 * s],
                 start=ang, end=ang + 40, fill=colour, width=max(2, int(2 * s)))
        draw.line([top, (ex, ey)], fill=colour, width=max(1, int(1.6 * s)))


def sunset_boulevard():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    sky(d, [(0.0, (38, 16, 66)), (0.42, (196, 62, 110)), (0.62, (255, 122, 69)), (0.72, (255, 186, 92)), (1.0, (30, 12, 40))])
    d.ellipse([W * 0.60, H * 0.40, W * 0.86, H * 0.66], fill=(255, 214, 130))  # sun
    d.rectangle([0, H * 0.70, W, H], fill=(24, 10, 34))  # ground
    for i, bx in enumerate(range(-20, W, 92)):  # skyline
        bh = 60 + (i * 53) % 130
        d.rectangle([bx, H * 0.70 - bh, bx + 64, H * 0.70], fill=(16, 8, 28))
        for wy in range(int(H * 0.70 - bh) + 8, int(H * 0.70) - 6, 14):
            for wx in range(bx + 6, bx + 58, 12):
                if (wx * 7 + wy * 13) % 5 == 0:
                    d.rectangle([wx, wy, wx + 5, wy + 7], fill=(255, 196, 96))
    d.polygon([(W * 0.38, H), (W * 0.52, H * 0.70), (W * 0.60, H * 0.70), (W * 0.86, H)], fill=(52, 26, 60))  # road
    for t in range(6):
        y = H * (0.74 + 0.045 * t)
        d.line([(W * (0.50 + 0.028 * t), y), (W * (0.575 + 0.028 * t), y)], fill=(255, 220, 150), width=3)
    for px, ps in [(70, 1.5), (150, 2.1), (760, 1.8), (845, 1.3)]:
        palm(d, px, int(H * 0.99), ps, (10, 5, 16))
    return grain(img)


def neon_pier():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    sky(d, [(0.0, (4, 18, 34)), (0.55, (8, 52, 74)), (0.62, (10, 96, 110)), (1.0, (4, 26, 44))])
    d.rectangle([0, H * 0.60, W, H], fill=(5, 32, 48))  # water
    for i in range(46):  # string lights across the pier
        x = 30 + i * 19
        y = int(H * 0.30 + 26 * math.sin(i / 5.2))
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 214, 130))
        d.line([(x, y), (x, H * 0.86)], fill=(255, 190, 110), width=1)  # reflection
    d.line([(0, H * 0.28), (W, H * 0.33)], fill=(255, 214, 130), width=2)
    d.rectangle([0, H * 0.52, W, H * 0.60], fill=(8, 14, 26))  # pier deck
    for x in range(20, W, 70):
        d.rectangle([x, H * 0.60, x + 8, H * 0.70], fill=(6, 10, 20))
    d.rectangle([W * 0.66, H * 0.20, W * 0.94, H * 0.52], fill=(10, 20, 36))  # pavilion
    d.polygon([(W * 0.64, H * 0.20), (W * 0.80, H * 0.10), (W * 0.96, H * 0.20)], fill=(240, 80, 140))
    for i, wx in enumerate(range(int(W * 0.69), int(W * 0.92), 26)):
        d.rectangle([wx, H * 0.30, wx + 15, H * 0.44], fill=(64, 224, 255) if i % 2 else (255, 120, 200))
    return grain(img)


def portrait_neon():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    sky(d, [(0.0, (24, 8, 44)), (0.6, (120, 30, 92)), (1.0, (255, 110, 88))])
    for i in range(60):  # wall bricks glow
        x = (i * 149) % W
        y = (i * 83) % H
        d.rectangle([x, y, x + 3, y + 3], fill=(255, 230, 170))
    cx = W // 2  # a person, head-and-shoulders silhouette
    ink = (14, 6, 20)
    d.ellipse([cx - 235, H * 0.52, cx + 235, H * 1.25], fill=ink)  # shoulders and torso
    d.rectangle([cx - 34, H * 0.44, cx + 34, H * 0.60], fill=ink)  # neck
    d.ellipse([cx - 82, H * 0.14, cx + 82, H * 0.14 + 190], fill=ink)  # head
    d.pieslice([cx - 88, H * 0.10, cx + 88, H * 0.14 + 150], start=180, end=360, fill=ink)  # hair sweep
    d.arc([cx - 82, H * 0.12, cx + 82, H * 0.14 + 190], start=195, end=320, fill=(64, 224, 255), width=5)  # neon rim
    d.arc([cx - 82, H * 0.12, cx + 82, H * 0.14 + 190], start=15, end=110, fill=(255, 120, 200), width=5)
    return grain(img)


if __name__ == "__main__":
    sunset_boulevard().save("app/samples/sunset.jpg", quality=88)
    neon_pier().save("app/samples/pier.jpg", quality=88)
    portrait_neon().save("app/samples/portrait.jpg", quality=88)
    print("samples written")
