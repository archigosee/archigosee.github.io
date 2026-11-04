import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { View } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { layers, profile, projects, type Category, type Project } from './data'
import { device, motion } from './motion'
import { BackgroundView, GLCanvas } from './three/Scene'
import { CoverPlane, type CoverState } from './three/CoverPlane'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
const scrollToId = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 })
  else el.scrollIntoView({ behavior: device.reducedMotion ? 'auto' : 'smooth' })
}

const NAV = [
  ['about', 'About'],
  ['stack', 'System'],
  ['projects', 'Work'],
  ['contact', 'Contact'],
] as const

function useSmoothScrollAndChoreography() {
  useLayoutEffect(() => {
    if (!device.reducedMotion) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true })
      lenis.on('scroll', ScrollTrigger.update)
      const raf = (time: number) => lenis?.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from('.hero .char', { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.035, delay: 0.2 })
      gsap.from('.hero .fade-in', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.7 })

      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        onUpdate: (s) => (motion.heroOut = s.progress),
      })

      // Phase 2: pin the system section and drive the exploded architecture view
      const layerEls = gsap.utils.toArray<HTMLElement>('.layer')
      ScrollTrigger.create({
        trigger: '#stack',
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: true,
        onUpdate: (s) => {
          motion.explode = Math.min(1, s.progress / 0.45)
          const active = s.progress < 0.08 ? -1 : Math.min(2, Math.floor(((s.progress - 0.08) / 0.92) * 3))
          layerEls.forEach((el, i) => el.classList.toggle('active', i === active))
        },
        onLeaveBack: () => (motion.explode = 0),
      })

      // Phase 3: the network recedes as the project wall arrives
      ScrollTrigger.create({
        trigger: '#projects',
        start: 'top bottom',
        end: 'top 20%',
        scrub: true,
        onUpdate: (s) => (motion.exit = s.progress),
      })

      ScrollTrigger.batch('.reveal', {
        start: 'top 88%',
        onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      })

      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const to = Number(el.dataset.count)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: to,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
          onUpdate: () => {
            el.textContent = Math.round(obj.v) + (el.dataset.suffix ?? '')
          },
        })
      })
    })

    const onMove = (e: PointerEvent) => {
      motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      motion.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
      motion.pointer.active = true
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--my', `${e.clientY}px`)
    }
    const onLeave = () => (motion.pointer.active = false)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      ctx.revert()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      lenis?.destroy()
      lenis = null
    }
  }, [])
}

function SplitText({ text }: { text: string }) {
  return (
    <span className="split" aria-label={text}>
      {text.split('').map((c, i) => (
        <span className="char-wrap" key={i} aria-hidden>
          <span className="char">{c === ' ' ? ' ' : c}</span>
        </span>
      ))}
    </span>
  )
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <button className="brand" onClick={() => scrollToId('hero')} aria-label="Back to top">
        <span className="brand-mark" aria-hidden>
          <i /> <i /> <i />
        </span>
        <span>KM</span>
      </button>
      <nav>
        {NAV.map(([id, label]) => (
          <button key={id} onClick={() => scrollToId(id)}>
            {label}
          </button>
        ))}
      </nav>
      <a className="nav-cta" href={profile.github} target="_blank" rel="noreferrer">
        GitHub ↗
      </a>
    </header>
  )
}

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-inner">
        <p className="eyebrow fade-in">
          <span className="live-dot" /> Available for projects · {profile.location}
        </p>
        <h1 className="hero-title">
          <SplitText text={profile.first} />
          <br />
          <span className="outline">
            <SplitText text={profile.last} />
          </span>
        </h1>
        <p className="hero-role fade-in">
          {profile.role} <span className="sep">/</span> <span className="grad">{profile.role2}</span>
        </p>
        <p className="hero-lede fade-in">
          I design and ship complete systems: healthcare platforms, fintech rails, and AI automations that take busy work off people's hands. From interface to API to database.
        </p>
        <div className="hero-actions fade-in">
          <button className="btn primary" onClick={() => scrollToId('projects')}>
            View my work
          </button>
          <button className="btn ghost" onClick={() => scrollToId('contact')}>
            Get in touch
          </button>
        </div>
      </div>
      <div className="scroll-hint fade-in" aria-hidden>
        <span>Scroll</span>
        <i />
      </div>
      <p className="hero-hint fade-in" aria-hidden>
        {device.mobile ? 'A living system of nodes and data' : 'Move your cursor through the network →'}
      </p>
    </section>
  )
}

function About() {
  const years = new Date().getFullYear() - 2022
  return (
    <section id="about" className="about">
      <div className="section-head reveal">
        <span className="kicker">01 — About</span>
        <h2>
          Building software that <span className="grad">works in the real world</span>, for real people.
        </h2>
      </div>
      <div className="about-grid">
        <div className="about-copy reveal glass">
          <p>
            I'm Kaleab, a full-stack developer from Ethiopia. Since my first commit as an ALX software engineering student, I've built clinic and hospital platforms, a national-ID-linked payment app, e-commerce stores, booking systems and Telegram automations.
          </p>
          <p>
            Lately I focus on <strong>AI automation</strong>: wiring language models like Gemini into products so they handle the repetitive work. I'm also growing as a <strong>junior cybersecurity practitioner</strong>, which shapes how I handle auth, identity and data.
          </p>
          <blockquote>“{profile.quote}”</blockquote>
        </div>
        <div className="stats">
          {[
            [years, '+', 'Years building'],
            [55, '+', 'Repositories'],
            [projects.length, '', 'Featured products'],
            [4, '', 'Industries served'],
          ].map(([n, suf, label]) => (
            <div className="stat reveal glass" key={label as string}>
              <span className="stat-n" data-count={n} data-suffix={suf}>
                0
              </span>
              <span className="stat-l">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stack() {
  return (
    <section id="stack" className="stack">
      <div className="stack-inner">
        <div className="section-head">
          <span className="kicker">02 — The System</span>
          <h2>
            One engineer, <span className="grad">every layer</span>.
          </h2>
          <p className="muted">Keep scrolling: the core splits into the layers I build across.</p>
        </div>
        <div className="layers">
          {layers.map((l) => (
            <article className="layer glass" key={l.key} style={{ ['--c' as string]: l.color }}>
              <header>
                <span className="layer-i">{l.index}</span>
                <div>
                  <h3>{l.name}</h3>
                  <p>{l.caption}</p>
                </div>
              </header>
              <ul>
                {l.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: (p: Project, rect: DOMRect, state: CoverState) => void }) {
  const cover = useRef<HTMLButtonElement>(null!)
  const glView = useRef<HTMLElement>(null!)
  const state = useMemo<CoverState>(() => ({ hover: 0, mx: 0.5, my: 0.5, zoom: 0 }), [])
  const move = (e: React.PointerEvent) => {
    const r = cover.current.getBoundingClientRect()
    state.mx = (e.clientX - r.left) / r.width
    state.my = 1 - (e.clientY - r.top) / r.height
  }
  return (
    <article
      className="card reveal"
      style={{ ['--c' as string]: project.accent }}
      onPointerEnter={() => (state.hover = 1)}
      onPointerLeave={() => {
        state.hover = 0
        state.mx = state.my = 0.5
      }}
      onPointerMove={move}
    >
      <button className="card-cover" ref={cover} onClick={() => onOpen(project, cover.current.getBoundingClientRect(), state)} aria-label={`Open case study: ${project.title}`}>
        <View ref={glView} className="cover-gl" index={index + 2}>
          <CoverPlane project={project} index={index} state={state} track={glView} />
        </View>
      </button>
      <div className="card-body">
        <div className="card-meta">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <ul className="chips">
          {project.stack.slice(0, 4).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="card-links">
          <button className="link" onClick={() => onOpen(project, cover.current.getBoundingClientRect(), state)}>
            Case study →
          </button>
          {project.live && (
            <a className="link" href={project.live} target="_blank" rel="noreferrer">
              Live ↗
            </a>
          )}
          {project.apk && (
            <a className="link" href={project.apk} download>
              Download APK ↓
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

const FILTERS: ('All' | Category)[] = ['All', 'Health', 'Fintech', 'Web', 'AI & Bots']

function Projects({ onOpen }: { onOpen: (p: Project, rect: DOMRect, state: CoverState) => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const list = projects.filter((p) => filter === 'All' || p.category === filter)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // newly mounted cards should be visible immediately after a filter change
    gsap.to('.card.reveal', { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05 })
    ScrollTrigger.refresh()
  }, [filter])
  return (
    <section id="projects" className="projects">
      <div className="section-head reveal">
        <span className="kicker">03 — Selected Work</span>
        <h2>
          Products I've <span className="grad">designed, built and shipped</span>.
        </h2>
      </div>
      <div className="filters reveal" role="tablist">
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
            {f}
            <span>{f === 'All' ? projects.length : projects.filter((p) => p.category === f).length}</span>
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((p) => (
          <ProjectCard key={p.id} project={p} index={projects.indexOf(p)} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

function CaseStudy({ open, onClose }: { open: { project: Project; rect: DOMRect } | null; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!open || !panel.current) return
    const { rect } = open
    const vw = window.innerWidth
    const vh = window.innerHeight
    gsap.fromTo(
      panel.current,
      { clipPath: `inset(${rect.top}px ${vw - rect.right}px ${vh - rect.bottom}px ${rect.left}px round 18px)` },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.8, ease: 'expo.inOut' },
    )
    gsap.from(panel.current.querySelectorAll('.cs-anim'), { y: 30, opacity: 0, duration: 0.7, stagger: 0.06, delay: 0.45, ease: 'power3.out' })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    panel.current.querySelector<HTMLButtonElement>('.cs-close')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const p = open.project
  return (
    <div className="cs" ref={panel} role="dialog" aria-modal="true" aria-label={`${p.title} case study`} style={{ ['--c' as string]: p.accent }} data-lenis-prevent>
      <button className="cs-close" onClick={onClose} aria-label="Close case study">
        ✕
      </button>
      <div className="cs-inner">
        <span className="kicker cs-anim">
          {p.category} · {p.year}
        </span>
        <h2 className="cs-anim">{p.title}</h2>
        <p className="cs-summary cs-anim">{p.summary}</p>
        <div className="cs-cols">
          <div className="cs-anim">
            <h4>Highlights</h4>
            <ul className="cs-list">
              {p.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="cs-anim">
            <h4>Built with</h4>
            <ul className="chips big">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="cs-actions cs-anim">
          {p.live && (
            <a className="btn primary" href={p.live} target="_blank" rel="noreferrer">
              Visit live site ↗
            </a>
          )}
          {p.apk && (
            <a className="btn ghost" href={p.apk} download>
              Download APK ↓
            </a>
          )}
          {p.repo ? (
            <a className="btn ghost" href={p.repo} target="_blank" rel="noreferrer">
              View source ↗
            </a>
          ) : (
            <span className="private">🔒 Private client repository</span>
          )}
        </div>
      </div>
    </div>
  )
}

function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(profile.email).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <section id="contact" className="contact">
      <div className="contact-card glass reveal">
        <span className="kicker">04 — Contact</span>
        <h2>
          Have a system in mind?
          <br />
          <span className="grad">Let's build it.</span>
        </h2>
        <p className="muted">Web platforms, mobile apps, AI automations or a rebuild of something that already exists. I'm open to freelance and full-time roles.</p>
        <a className="contact-email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <div className="hero-actions">
          <a className="btn primary" href={`mailto:${profile.email}`}>
            Email me
          </a>
          <button className="btn ghost" onClick={copy} aria-live="polite">
            {copied ? 'Copied ✓' : 'Copy email'}
          </button>
          <a className="btn ghost" href={profile.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
      </div>
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="muted">Built with React Three Fiber, GSAP & Lenis</span>
      </footer>
    </section>
  )
}

export default function App() {
  const root = useRef<HTMLDivElement>(null!)
  const [open, setOpen] = useState<{ project: Project; rect: DOMRect } | null>(null)
  const zoomed = useRef<CoverState | null>(null)
  useSmoothScrollAndChoreography()

  const onOpen = (project: Project, rect: DOMRect, state: CoverState) => {
    state.zoom = 1 // shader push-in before the case study expands from the card
    zoomed.current = state
    window.setTimeout(() => {
      lenis?.stop()
      document.body.style.overflow = 'hidden'
      setOpen({ project, rect })
    }, 260)
  }
  const onClose = useMemo(
    () => () => {
      if (zoomed.current) zoomed.current.zoom = 0
      document.body.style.overflow = ''
      lenis?.start()
      setOpen(null)
    },
    [],
  )

  return (
    <div ref={root} className="app">
      <GLCanvas eventSource={root} />
      <BackgroundView />
      <div className="cursor-glow" aria-hidden />
      <div className="grain" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <About />
        <Stack />
        <Projects onOpen={onOpen} />
        <Contact />
      </main>
      <CaseStudy open={open} onClose={onClose} />
    </div>
  )
}
