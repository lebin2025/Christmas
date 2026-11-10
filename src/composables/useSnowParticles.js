import { FLAKES } from '../assets/assets.js'

/**
 * Canvas 2D snow engine — three depth planes, real snowflake sprites in the
 * near/mid planes, procedural dots in the far plane. No WebGL needed: the
 * snow is an atmospheric layer, not a 3D object.
 */
export class SnowEngine {
  constructor(canvas, { density = 1, reducedMotion = false } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })
    this.density = density
    this.reducedMotion = reducedMotion
    this.sprites = []
    this.particles = []
    this.running = false
    this.enabled = true
    this.last = 0
    this.raf = 0
    this.wind = 0
    this.pointerX = 0
    this._onResize = () => this.resize()
    this._onPointer = (e) => { this.pointerX = (e.clientX / window.innerWidth - 0.5) * 2 }
    this._onVisibility = () => {
      if (document.hidden) this.stop()
      else if (this.enabled) this.start()
    }
  }

  async loadSprites() {
    this.sprites = await Promise.all(
      FLAKES.map((src) => new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })),
    )
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.width = Math.round(this.w * dpr)
    this.canvas.height = Math.round(this.h * dpr)
    this.canvas.style.width = `${this.w}px`
    this.canvas.style.height = `${this.h}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.seed()
  }

  rand(a, b) { return a + Math.random() * (b - a) }

  make(initial = false) {
    const roll = Math.random()
    const layer = roll < 0.12 ? 2 : roll < 0.46 ? 1 : 0  // 0 far, 1 mid, 2 near
    const radius = layer === 2 ? this.rand(14, 38)
      : layer === 1 ? this.rand(4, 11)
        : this.rand(0.8, 2.4)
    return {
      layer,
      x: this.rand(-40, this.w + 40),
      y: initial ? this.rand(-this.h * 0.1, this.h) : this.rand(-120, -20),
      r: radius,
      vy: layer === 2 ? this.rand(22, 46) : layer === 1 ? this.rand(14, 32) : this.rand(8, 20),
      vx: this.rand(-9, 9),
      sway: this.rand(0.35, 1.15),
      phase: this.rand(0, Math.PI * 2),
      alpha: layer === 2 ? this.rand(0.05, 0.15) : layer === 1 ? this.rand(0.22, 0.5) : this.rand(0.22, 0.62),
      sprite: layer === 0 ? null : this.sprites[(Math.random() * this.sprites.length) | 0],
      rot: this.rand(0, Math.PI * 2),
      vr: this.rand(-0.35, 0.35),
    }
  }

  seed() {
    const base = Math.round((this.w * this.h) / 11000)
    const count = Math.min(260, Math.max(60, Math.round(base * this.density)))
    this.particles = Array.from({ length: count }, () => this.make(true))
  }

  setDensity(d) {
    const next = Math.max(0.25, Math.min(1.5, d))
    if (Math.abs(next - this.density) < 0.01) return
    this.density = next
    this.seed()
  }

  frame = (now) => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016)
    this.last = now
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    this.wind += (this.pointerX * 9 - this.wind) * Math.min(1, dt * 1.4)

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      p.phase += p.sway * dt
      p.y += p.vy * dt * (this.reducedMotion ? 0.22 : 1)
      p.x += (p.vx + Math.sin(p.phase) * (6 + p.layer * 7) + this.wind * (0.3 + p.layer * 0.5)) * dt
      p.rot += p.vr * dt

      if (p.y - p.r > this.h + 30 || p.x < -120 || p.x > this.w + 120) {
        this.particles[i] = this.make(false)
        continue
      }

      ctx.globalAlpha = p.alpha
      if (p.layer === 0 || !p.sprite) {
        ctx.beginPath()
        ctx.fillStyle = '#eaf4ff'
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.save()
        if (p.layer === 2) ctx.filter = 'blur(1px)'
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.drawImage(p.sprite, -p.r, -p.r, p.r * 2, p.r * 2)
        ctx.restore()
      }
    }
    ctx.globalAlpha = 1
    this.raf = requestAnimationFrame(this.frame)
  }

  setEnabled(on) {
    this.enabled = on
    if (on && !document.hidden) this.start()
    else this.stop()
  }

  start() {
    if (this.running || !this.enabled || document.hidden) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  mount() {
    this.resize()
    window.addEventListener('resize', this._onResize)
    window.addEventListener('pointermove', this._onPointer, { passive: true })
    document.addEventListener('visibilitychange', this._onVisibility)
    this.start()
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._onPointer)
    document.removeEventListener('visibilitychange', this._onVisibility)
  }
}
