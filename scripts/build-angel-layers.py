"""Split the static angel PNG into animation layers.

usage: build.py <src.png> <out_dir> <preview_dir>

Layers are all exported on the same canvas so they stack with no offsets:
  body.png   – angel without wings
  wing-l.png / wing-r.png – wings, extended under the body
  happy.png  – face overlay: squinted smiling eyes, wider smile, blush
  blink.png  – face overlay: eyes closed (for blinking)
  glow.png   – soft light around the halo and the heart
"""
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC, OUT, PREV = sys.argv[1:4]
OUT_W, OUT_H = 450, 540

im = Image.open(SRC).convert('RGBA')
W, H = im.size
arr = np.asarray(im).astype(np.float32)
rgb = arr[..., :3].copy()
alpha = arr[..., 3] / 255.0
solid = alpha > 0.03

# ── Wings ────────────────────────────────────────────────────────────────────
CUT_L = [(344, 616), (337, 623), (319, 643), (301, 667), (287, 687),
         (276, 707), (269, 727), (266, 738), (264, 752)]
CUT_R = [(551, 612), (560, 621), (580, 638), (600, 663), (617, 693),
         (627, 720), (632, 740), (634, 752)]
SEED_L, SEED_R = (200, 620), (690, 620)


def cut_mask(poly, width):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).line(poly, fill=255, width=width, joint='curve')
    return np.asarray(m) > 0


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def wing(poly, seed, clip):
    cut = cut_mask(poly, 3)
    n, labels = cv2.connectedComponents((solid & ~cut).astype(np.uint8), connectivity=4)
    comp = labels == labels[seed[1], seed[0]]
    area = int(comp.sum())
    assert 8000 < area < 60000, f'wing not isolated, area={area}'
    # Wing pixels incl. its antialiased outline.
    grown = ndimage.binary_dilation(comp, iterations=2) & (alpha > 0)
    # Extension hidden under the body so rotating the wing never opens a gap.
    # `clip` keeps it inside the wing's own outline continued behind the body,
    # so whatever a flap exposes reads as more wing, not a stray sliver.
    dist = ndimage.distance_transform_edt(~cut_mask(poly[1:-1], 1))
    ext = (dist < 34) & solid & ~comp & clip
    core = ndimage.binary_erosion(comp, iterations=4)
    _, (iy, ix) = ndimage.distance_transform_edt(~core, return_indices=True)
    fill = cv2.GaussianBlur(rgb[iy, ix], (0, 0), 5)
    w_rgb = np.where(grown[..., None], rgb, fill)
    w_a = np.where(grown, alpha, 0.0)
    ext_a = cv2.GaussianBlur(ext.astype(np.float32), (0, 0), 1.2)
    ext_a = ext_a * np.clip((34 - dist) / 6.0, 0, 1)
    w_a = np.maximum(w_a, np.where(solid & ~comp, ext_a, 0.0))
    return comp, w_rgb, w_a


# Continue each wing's top and bottom outline behind the body.
clipL = (yy <= 741) & (yy >= 623 + 0.9 * (xx - 337) - 2)
clipR = (yy <= 739) & (yy >= 621 - 0.8 * (xx - 560) - 2)
compL, wl_rgb, wl_a = wing(CUT_L, SEED_L, clipL)
compR, wr_rgb, wr_a = wing(CUT_R, SEED_R, clipR)

# ── Body (wings removed) ─────────────────────────────────────────────────────
wings_grown = ndimage.binary_dilation(compL | compR, iterations=3)
body_a = alpha * (1.0 - cv2.GaussianBlur(wings_grown.astype(np.float32), (0, 0), 0.8))
body_a = np.where(wings_grown, 0.0, body_a)
# Drop stray specks left between wing and body.
n, labels, stats, _ = cv2.connectedComponentsWithStats((body_a > 0.03).astype(np.uint8), connectivity=8)
main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
body_a = np.where(labels == main, body_a, 0.0)

# ── Happy face overlay ───────────────────────────────────────────────────────
EYES = [(348, 466), (546, 466)]
holes = Image.new('L', (W, H), 0)
hd = ImageDraw.Draw(holes)
for cx, cy in EYES:
    hd.ellipse([cx - 53, cy - 55, cx + 53, cy + 55], fill=255)
hd.ellipse([445 - 34, 529 - 15, 445 + 34, 529 + 15], fill=255)
holes_np = np.asarray(holes)

skin = cv2.inpaint(rgb.astype(np.uint8), holes_np, 7, cv2.INPAINT_TELEA).astype(np.float32)
# Telea leaves streaks in big holes — relax the filled area towards a smooth
# (harmonic) surface that still meets the surrounding skin exactly.
inside = holes_np[..., None] > 0
for _ in range(500):
    skin = np.where(inside, cv2.GaussianBlur(skin, (0, 0), 3), skin)

SS = 4  # supersample strokes


def stroke_layer(draw_fn):
    layer = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    return np.asarray(layer.resize((W, H), Image.LANCZOS)).astype(np.float32)


def arc_points(cx, cy, rx, ry, a0, a1, n=500):
    t = np.radians(np.linspace(a0, a1, n))
    return [((cx + rx * np.cos(a)) * SS, (cy + ry * np.sin(a)) * SS) for a in t]


def brush(d, pts, width, col):
    # Stamp round dabs along the path: smooth, round-capped stroke.
    r = width * SS / 2
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=col)


def draw_face(d):
    for cx, cy in EYES:
        brush(d, arc_points(cx, cy + 12, 34, 24, 200, 340), 11, (70, 42, 30, 255))  # ∩
    brush(d, arc_points(445, 516, 32, 24, 20, 160), 6, (196, 92, 58, 255))  # wide ∪


strokes = stroke_layer(draw_face)
s_a = strokes[..., 3:4] / 255.0

blush = np.zeros((H, W), np.float32)
for cx, cy in [(303, 532), (590, 532)]:
    blush = np.maximum(blush, np.exp(-(((xx - cx) / 34) ** 2 + ((yy - cy) / 24) ** 2)))
pink = np.array([255, 138, 118], np.float32)

happy_rgb = skin * (1 - 0.42 * blush[..., None]) + pink * (0.42 * blush[..., None])
happy_rgb = happy_rgb * (1 - s_a) + strokes[..., :3] * s_a
hole_a = cv2.GaussianBlur((holes_np > 0).astype(np.float32), (0, 0), 3.0)
hole_a = np.clip((hole_a - 0.25) * 2.0, 0, 1)  # feather inwards only
happy_a = np.maximum(np.maximum(hole_a, s_a[..., 0]), np.clip(blush * 1.2, 0, 1))
happy_a = happy_a * (alpha > 0.5)

# ── Blink overlay (eyes closed, mouth untouched) ─────────────────────────────
eye_holes = Image.new('L', (W, H), 0)
ed = ImageDraw.Draw(eye_holes)
for cx, cy in EYES:
    ed.ellipse([cx - 53, cy - 55, cx + 53, cy + 55], fill=255)
eye_np = np.asarray(eye_holes) > 0


def draw_lids(d):
    for cx, cy in EYES:
        brush(d, arc_points(cx, cy - 4, 36, 16, 15, 165), 9, (70, 42, 30, 255))  # lowered lid ∪


lids = stroke_layer(draw_lids)
l_a = lids[..., 3:4] / 255.0
blink_rgb = skin * (1 - l_a) + lids[..., :3] * l_a
eye_a = cv2.GaussianBlur(eye_np.astype(np.float32), (0, 0), 3.0)
eye_a = np.clip((eye_a - 0.25) * 2.0, 0, 1)
blink_a = np.maximum(eye_a, l_a[..., 0]) * (alpha > 0.5)

# ── Glow ─────────────────────────────────────────────────────────────────────
ring = Image.new('L', (W, H), 0)
ImageDraw.Draw(ring).ellipse([446 - 125, 111 - 41, 446 + 125, 111 + 41], outline=255, width=20)
ring_np = cv2.GaussianBlur(np.asarray(ring).astype(np.float32) / 255.0, (0, 0), 16)
ring_np = ring_np / ring_np.max() * 0.55
heart = np.exp(-(((xx - 447) / 38) ** 2 + ((yy - 676) / 36) ** 2)) * 0.75
glow_a = np.maximum(ring_np, heart)
glow_rgb = np.zeros((H, W, 3), np.float32) + np.array([255, 241, 176], np.float32)


# ── Export ───────────────────────────────────────────────────────────────────
def to_img(c, a):
    out = np.dstack([np.clip(c, 0, 255), np.clip(a, 0, 1) * 255]).astype(np.uint8)
    return Image.fromarray(out)


def export(name, c, a):
    full = to_img(c, a)
    small = full.convert('RGBa').resize((OUT_W, OUT_H), Image.LANCZOS).convert('RGBA')
    small.save(f'{OUT}/{name}.png', optimize=True)
    return full


layers = {
    'body': export('body', rgb, body_a),
    'wing-l': export('wing-l', wl_rgb, wl_a),
    'wing-r': export('wing-r', wr_rgb, wr_a),
    'happy': export('happy', happy_rgb, happy_a),
    'blink': export('blink', blink_rgb, blink_a),
    'glow': export('glow', glow_rgb, glow_a),
}

# ── Preview: poses the app will animate through ──────────────────────────────
PIV_L, PIV_R = (300, 672), (600, 670)


def pose(deg, happy, glow, bg=(58, 40, 110, 255)):
    c = Image.new('RGBA', (W, H), bg)
    g = layers['glow'].copy()
    g.putalpha(g.getchannel('A').point(lambda v: int(v * glow)))
    c.alpha_composite(g)
    c.alpha_composite(layers['wing-l'].rotate(-deg, resample=Image.BICUBIC, center=PIV_L))
    c.alpha_composite(layers['wing-r'].rotate(deg, resample=Image.BICUBIC, center=PIV_R))
    c.alpha_composite(layers['body'])
    if happy:
        h = layers['happy'].copy()
        h.putalpha(h.getchannel('A').point(lambda v: int(v * happy)))
        c.alpha_composite(h)
    return c


poses = [pose(0, 0, 0.4), pose(-9, 0, 0.7), pose(15, 1, 1.0), pose(-9, 1, 1.0)]
sheet = Image.new('RGBA', (W * 4, H), (58, 40, 110, 255))
for i, p in enumerate(poses):
    sheet.paste(p, (i * W, 0))
sheet.convert('RGB').resize((W * 4 // 2, H // 2), Image.LANCZOS).save(f'{PREV}/sheet.jpg', quality=92)
# Wing root close-ups (gap check) and face close-up.
poses[1].crop((90, 480, 810, 800)).convert('RGB').save(f'{PREV}/wings-up.jpg', quality=92)
poses[2].crop((90, 480, 810, 800)).convert('RGB').save(f'{PREV}/wings-down.jpg', quality=92)
poses[2].crop((230, 330, 670, 620)).resize((880, 580), Image.LANCZOS).convert('RGB').save(f'{PREV}/face.jpg', quality=92)
# Actual on-screen size (79pt wide @3x).
small = Image.new('RGBA', (237 * 4, 288), (58, 40, 110, 255))
for i, p in enumerate(poses):
    small.paste(p.resize((237, 284), Image.LANCZOS), (i * 237, 2))
small.convert('RGB').save(f'{PREV}/onscreen.png')
blinking = poses[0].copy()
blinking.alpha_composite(layers['blink'])
blinking.crop((230, 330, 670, 620)).resize((880, 580), Image.LANCZOS).convert('RGB').save(f'{PREV}/face-blink.jpg', quality=92)
print('wing areas', int(compL.sum()), int(compR.sum()))
