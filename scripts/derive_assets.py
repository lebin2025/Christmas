"""Build optimised, browser-ready derivatives from the raw Christmas artwork.

The raw PNGs are 2048x2048 RGB with NO alpha channel and three different
background styles (white, black, full photographic).  This script uses only
Pillow + stdlib to:

  * downscale + re-encode the 2848x1600 scene plates as WebP
  * produce genuine alpha cut-outs (white-key) as WebP
  * keep photographic illustrations as softly-maskable "plates"
  * produce tiny snowflake sprites for the Canvas particle system

It never touches the original files.
"""
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'christmas'
OUT = ROOT / 'derived'
for sub in ('scenes', 'cutouts', 'plates', 'overlays', 'particles'):
    (OUT / sub).mkdir(parents=True, exist_ok=True)


def save_webp(im, path, quality=82):
    im.save(path, 'WEBP', quality=quality, method=5)
    print(f'  {path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {path.stat().st_size//1024} KB')


def fit(im, width, height=None):
    if height:
        return im.resize((width, height), Image.LANCZOS)
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def darkness(im):
    """255 - min(R,G,B): how far a pixel is from a light background."""
    r, g, b = im.split()
    return ImageChops.invert(ImageChops.darker(ImageChops.darker(r, g), b))


def border_level(dark):
    """Median darkness of the frame -> the background's own level."""
    w, h = dark.size
    k = max(2, min(w, h) // 30)
    px = dark.load()
    vals = []
    for x in range(0, w, 3):
        for y in list(range(0, k, 2)) + list(range(h - k, h, 2)):
            vals.append(px[x, y])
    for y in range(0, h, 3):
        for x in list(range(0, k, 2)) + list(range(w - k, w, 2)):
            vals.append(px[x, y])
    return median(vals)


def make_alpha(dark, low, high):
    scale = 255.0 / max(1.0, high - low)
    lut = [max(0, min(255, round((v - low) * scale))) for v in range(256)]
    return dark.point(lut)


def fill_small_holes(alpha_img, max_fraction=0.02):
    """Remove isolated transparent specks inside an object (specular highlights)
    while preserving large genuine holes such as the middle of a wreath."""
    w, h = alpha_img.size
    px = alpha_img.load()
    transparent = bytearray(w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            transparent[row + x] = 1 if px[x, y] < 26 else 0
    visited = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if transparent[i] and not visited[i]:
                visited[i] = 1
                q.append(i)
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if transparent[i] and not visited[i]:
                visited[i] = 1
                q.append(i)
    while q:
        i = q.popleft()
        y, x = divmod(i, w)
        for j in (i - w if y > 0 else -1,
                  i + w if y < h - 1 else -1,
                  i - 1 if x > 0 else -1,
                  i + 1 if x < w - 1 else -1):
            if j >= 0 and transparent[j] and not visited[j]:
                visited[j] = 1
                q.append(j)
    limit = int(w * h * max_fraction)
    for start in range(w * h):
        if transparent[start] and not visited[start]:
            comp = [start]
            visited[start] = 1
            head = 0
            while head < len(comp):
                i = comp[head]
                head += 1
                y, x = divmod(i, w)
                for j in (i - w if y > 0 else -1,
                          i + w if y < h - 1 else -1,
                          i - 1 if x > 0 else -1,
                          i + 1 if x < w - 1 else -1):
                    if j >= 0 and transparent[j] and not visited[j]:
                        visited[j] = 1
                        comp.append(j)
            if len(comp) <= limit:
                for i in comp:
                    y, x = divmod(i, w)
                    px[x, y] = 235
    return alpha_img


def white_key(src, size=760, spread=42, work=420, darken_edges=True):
    """Cut an object off a light background. `spread` = darkness range that
    maps to a soft alpha ramp; small values suit pale subjects."""
    im = Image.open(src).convert('RGB')
    small = fit(im, work)
    dark = darkness(small)
    low = border_level(dark) + 2.0
    alpha = make_alpha(dark, low, low + spread)
    alpha = fill_small_holes(alpha)
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    alpha = alpha.resize((size, size), Image.LANCZOS)

    rgb = im.resize((size, size), Image.LANCZOS)
    if darken_edges:
        # Erode the alpha used for colour pre-multiplication: near-white
        # background pixels at the silhouette get crushed to near-black,
        # so no white halo survives when composited over a night scene.
        eroded = alpha.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
        a_rgb = Image.merge('RGB', (eroded, eroded, eroded))
        rgb = ImageChops.multiply(rgb, a_rgb)
    rgb.putalpha(alpha)
    return rgb


def black_key(src, size=760, spread=95, work=420):
    """Lift a luminous object off a black ground into a genuine alpha cut-out."""
    im = Image.open(src).convert('RGB')
    small = fit(im, work)
    r, g, b = small.split()
    bright = ImageChops.lighter(ImageChops.lighter(r, g), b)
    px = bright.load()
    w, h = bright.size
    lo = median([px[x, 1] for x in range(0, w, 3)] + [px[x, h - 2] for x in range(0, w, 3)]) + 2
    lut = [max(0, min(255, round((v - lo) * 255.0 / spread))) for v in range(256)]
    alpha = bright.point(lut).filter(ImageFilter.GaussianBlur(0.6)).resize((size, size), Image.LANCZOS)
    rgb = im.resize((size, size), Image.LANCZOS)
    # boost the gold so dark facets still glow over a night scene
    rgb = ImageChops.multiply(rgb, Image.new('RGB', (size, size), (255, 244, 220)))
    rgb.putalpha(alpha)
    return rgb


def feather_plate(src, size=900, feather=0.115, shape='rect'):
    """Give a photographic square a soft alpha edge so it dissolves into the
    scene instead of reading as a pasted rectangle. Light-ground originals get
    an elliptical falloff (candlelit vignette); dark-ground ones keep more of
    the frame with a rounded-rectangle feather."""
    im = Image.open(src).convert('RGB').resize((size, size), Image.LANCZOS)
    if shape == 'ellipse':
        grad = Image.radial_gradient('L').resize((size, size), Image.BICUBIC)
        mask = grad.point(lambda v: max(0, min(255, round((0.79 - v / 255) / 0.30 * 255))))
        mask = mask.filter(ImageFilter.GaussianBlur(size * 0.02))
    else:
        from PIL import ImageDraw
        pad = round(size * feather)
        mask = Image.new('L', (size, size), 0)
        d = ImageDraw.Draw(mask)
        d.rounded_rectangle(
            [pad, pad, size - pad, size - pad],
            radius=round(size * (feather + 0.10)),
            fill=255,
        )
        mask = mask.filter(ImageFilter.GaussianBlur(size * feather * 0.72))
    # Darken the fringe as well as fading it: a bright white envelope corner
    # must fall into the night, not glow as a rectangle.
    vignette = mask.filter(ImageFilter.GaussianBlur(size * 0.13))
    vignette = vignette.point(lambda v: 44 + round(v * 211 / 255))
    toned = ImageChops.multiply(im, Image.merge('RGB', (vignette, vignette, vignette)))
    toned.putalpha(mask)
    return toned


def snow_sprite(src, size=256, spread=12):
    """A pale snowflake on white: amplify the tiny luminance difference into alpha."""
    im = Image.open(src).convert('RGB').resize((size, size), Image.LANCZOS)
    dark = darkness(im)
    low = border_level(dark) + 0.6
    alpha = make_alpha(dark, low, low + spread).filter(ImageFilter.GaussianBlur(0.7))
    tint = Image.new('RGB', (size, size), (218, 233, 255))
    tint.putalpha(alpha)
    return tint


print('\n[1/5] scene plates  (2848x1600 -> 2400px WebP)')
for p in sorted((ROOT / 'scenes').glob('*.webp')):
    save_webp(fit(Image.open(p).convert('RGB'), 2400), OUT / 'scenes' / f'{p.stem}.webp', 84)

print('\n[2/5] alpha cut-outs (white-key)')
WHITE_KEY = {
    'decorations/bell.png': ('bell', 46),
    'decorations/velvet-bow.png': ('velvet-bow', 46),
    'decorations/pine-branch.png': ('pine-branch', 40),
    'decorations/wreath.png': ('wreath', 36),
    'interactive/vinyl.png': ('vinyl', 44),
    'interactive/golden-star.png': ('golden-star', 30),
}
for rel, (name, spread) in WHITE_KEY.items():
    save_webp(white_key(ROOT / rel, spread=spread), OUT / 'cutouts' / f'{name}.webp', 88)
save_webp(black_key(ROOT / 'decorations' / 'star.png'), OUT / 'cutouts' / 'star.webp', 88)

print('\n[3/5] photographic plates (feathered alpha edges)')
# (source, output name, shape) — 'ellipse' for light-ground originals
PLATES = [
    ('decorations/envelope.png', 'envelope', 'ellipse'),
    ('decorations/gift-box.png', 'gift-box', 'rect'),
    ('decorations/key.png', 'key', 'rect'),
    ('decorations/ornament.png', 'ornament', 'rect'),
    ('decorations/snowflake.png', 'snowflake-ornament', 'rect'),
    ('decorations/star.png', 'star-on-black', 'rect'),
    ('interactive/candle.png', 'candle', 'ellipse'),
    ('interactive/gift-closed.png', 'gift-closed', 'rect'),
    ('interactive/gift-open.png', 'gift-open', 'rect'),
    ('interactive/letter-closed.png', 'letter-closed', 'ellipse'),
    ('interactive/letter-open.png', 'letter-open', 'ellipse'),
    ('interactive/golden-star.png', 'golden-star-plate', 'ellipse'),
]
for rel, name, shape in PLATES:
    save_webp(feather_plate(ROOT / rel, shape=shape), OUT / 'plates' / f'{name}.webp', 86)

print('\n[4/5] atmosphere layers')
for p in sorted((ROOT / 'overlays').glob('*.png')):
    save_webp(Image.open(p).convert('RGB').resize((1600, 900), Image.LANCZOS),
              OUT / 'overlays' / f'{p.stem}.webp', 78)

print('\n[5/5] snowflake sprites')
for p in sorted((ROOT / 'particles').glob('*.png')):
    save_webp(snow_sprite(p), OUT / 'particles' / f'{p.stem}.webp', 88)

print('\nDerived assets ready.')
