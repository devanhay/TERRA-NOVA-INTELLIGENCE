import React, { useState, useEffect, useRef } from 'react'
import './MarketeamLanding.css'

// ─────────────────────────────────────────────────────────────────────
//  CUSTOM HOOK: useCountUp
// ─────────────────────────────────────────────────────────────────────
function useCountUp(endVal = 20, durationMs = 2000, startDelayMs = 1200) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    let animationFrameId = null

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / durationMs, 1)
      const easedProgress = easeOutCubic(progress)
      setCount(Math.floor(easedProgress * endVal))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    const timer = setTimeout(() => {
      animationFrameId = requestAnimationFrame(step)
    }, startDelayMs)

    return () => {
      clearTimeout(timer)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [endVal, durationMs, startDelayMs])

  return count
}

// ─────────────────────────────────────────────────────────────────────
//  COMPONENT: TypewriterHeading
// ─────────────────────────────────────────────────────────────────────
function TypewriterHeading({ text, onFinished }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    let index = 0
    let interval = null

    const delayTimer = setTimeout(() => {
      setIsTyping(true)
      interval = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(index))
        index++
        if (index >= text.length) {
          clearInterval(interval)
          setIsTyping(false)
          if (onFinished) onFinished()
        }
      }, 35)
    }, 400)

    return () => {
      clearTimeout(delayTimer)
      if (interval) clearInterval(interval)
    }
  }, [text])

  // Color mapping: first 67 chars are black (#000000), rest are white (#ffffff)
  const renderColoredText = () => {
    if (displayedText.length <= 67) {
      return <span style={{ color: '#000000' }}>{displayedText}</span>
    } else {
      const blackPart = displayedText.slice(0, 67)
      const whitePart = displayedText.slice(67)
      return (
        <>
          <span style={{ color: '#000000' }}>{blackPart}</span>
          <span style={{ color: '#ffffff' }}>{whitePart}</span>
        </>
      )
    }
  }

  return (
    <h1 className="m-heading">
      {renderColoredText()}
      {isTyping && <span className="m-typewriter-cursor">|</span>}
    </h1>
  )
}

// ─────────────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────
export default function MarketeamLanding({ onEnterOS }) {
  const [typingFinished, setTypingFinished] = useState(false)
  const count = useCountUp(20, 2000, 1200)

  // 5 unique SVG logos repeated 4x
  const logos = [
    'https://polo-pecan-73837341.figma.site/_assets/v11/1e7b0e6fcc016cd28aec5c68990118b8c54c35a5.svg',
    'https://polo-pecan-73837341.figma.site/_assets/v11/3eac03c183db2ae080d910159211c14843398b61.svg',
    'https://polo-pecan-73837341.figma.site/_assets/v11/17705a4c0023a0e5a99154dfb10582adbbf4260b.svg',
    'https://polo-pecan-73837341.figma.site/_assets/v11/0e5f442b09dc5c248e3e60d40a65505fb1887228.svg',
    'https://polo-pecan-73837341.figma.site/_assets/v11/63f99030ceb459e3c9ab9e429cfa2353491d3816.svg',
  ]
  const tickerLogos = [...logos, ...logos, ...logos, ...logos]

  // Avatar specifications
  const avatars = [
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/aa51718fb3af3637e6d666b6543fc27a175fada6.png',
      orbit: 1, angle: 270, radius: 176.5, sizeClass: '', typeClass: 'square glow-purple', delay: '0.6s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/ca755f7f93c1126fb8bdbf99ab364a33aa9ab272.png',
      orbit: 2, angle: 60, radius: 250.5, sizeClass: '', typeClass: 'round glow-yellow', delay: '0.8s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/dc01064c7093dcc32674876ee3cf5e41c4a485c6.png',
      orbit: 2, angle: 180, radius: 250.5, sizeClass: 'large', typeClass: 'round glow-pink', delay: '1.0s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/d5470a58b02388336141575048720f19a50de832.png',
      orbit: 2, angle: 300, radius: 250.5, sizeClass: '', typeClass: 'square glow-blue', delay: '1.2s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/018736aa5d0275c4ce56cfebaf2ae3007d81ca1e.png',
      orbit: 3, angle: 130, radius: 324.5, sizeClass: 'xlarge', typeClass: 'round glow-pink', delay: '1.5s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/c76d8a0b99676de31c014344bfaf75bad090758d.png',
      orbit: 4, angle: 30, radius: 398.5, sizeClass: '', typeClass: 'round glow-purple', delay: '1.7s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/7b1b5f039de7b54cc9913e96c1923c3b15a157fa.png',
      orbit: 4, angle: 95, radius: 398.5, sizeClass: 'xlarge', typeClass: 'square-large glow-orange', delay: '1.9s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/9ae171d8895199349755c43fbff00e122221a027.png',
      orbit: 4, angle: 220, radius: 398.5, sizeClass: 'xlarge', typeClass: 'square-large glow-pink', delay: '2.1s'
    },
    {
      url: 'https://polo-pecan-73837341.figma.site/_assets/v11/926c9eb7b4bc1df846fa0e39f0b0dc3fefd80671.png',
      orbit: 4, angle: 320, radius: 398.5, sizeClass: '', typeClass: 'round glow-purple', delay: '2.3s'
    }
  ]

  return (
    <div className="marketeam-container">
      {/* HEADER */}
      <header className="m-header">
        <div className="m-header-left">
          <img 
            className="m-logo" 
            src="https://polo-pecan-73837341.figma.site/_assets/v11/17ae538989a509947a8de3892c644664895e69b1.png" 
            alt="Marketeam Logo" 
          />
          <nav className="m-nav">
            <span className="m-nav-link">Your Team</span>
            <span className="m-nav-link">Solutions</span>
            <span className="m-nav-link">Blog</span>
            <span className="m-nav-link">Pricing</span>
          </nav>
        </div>

        <div className="m-header-right">
          <span className="m-login-link">Log In</span>
          <div className="btn-border-wrap">
            <button className="m-btn m-btn-black">Join Now</button>
          </div>
          {onEnterOS && (
            <button 
              onClick={onEnterOS}
              style={{
                borderRadius: 50,
                background: '#A068FF',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(160,104,255,0.4)',
                marginLeft: 12
              }}
            >
              🚀 Launch ChemPilot OS
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
      <section className="m-hero">
        <div className="m-hero-left">
          <TypewriterHeading 
            text="Unlock Top Marketing Talent You Thought Was Out of Reach -- Now Just One Click Away!" 
            onFinished={() => setTypingFinished(true)}
          />

          {typingFinished && (
            <>
              <div className="m-start-proj-wrap">
                <div className="btn-border-wrap">
                  <button className="m-btn m-btn-dark" onClick={onEnterOS}>
                    Start Project
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* David Badge */}
              <div className="m-cursor-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#A068FF">
                  <path d="M4 3l16 7-9 2-2 9z" />
                </svg>
                <div className="m-badge-label">David</div>
              </div>
            </>
          )}
        </div>

        {/* HERO RIGHT: CIRCLES VISUALIZATION */}
        <div className="m-hero-right">
          {/* Inner Badge */}
          <div className="m-center-badge">
            <span className="m-center-count">{count}k+</span>
            <span className="m-center-label">Specialists</span>
          </div>

          {/* Concentric Orbits */}
          <div className="m-orbit m-orbit-1" />
          <div className="m-orbit m-orbit-2" />
          <div className="m-orbit m-orbit-3" />
          <div className="m-orbit m-orbit-4" />

          {/* Floating Avatars */}
          {avatars.map((av, idx) => {
            // Apply coordinates based on rotation formula
            // transform: translate(-50%, -50%) rotate(Xdeg) translate(radius) rotate(-Xdeg)
            const style = {
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${av.angle}deg) translate(${av.radius}px) rotate(-${av.angle}deg)`,
              animationDelay: av.delay
            }
            return (
              <img 
                key={idx}
                src={av.url}
                alt="Marketing Specialist"
                className={`m-avatar ${av.sizeClass} ${av.typeClass}`}
                style={style}
              />
            )
          })}
        </div>
      </section>

      {/* LOGO TICKER */}
      <footer className="m-ticker-container">
        <div className="m-ticker-track">
          {tickerLogos.map((url, idx) => (
            <img 
              key={idx}
              className="m-ticker-logo" 
              src={url} 
              alt="Partner Brand Logo" 
            />
          ))}
        </div>
      </footer>
    </div>
  )
}
