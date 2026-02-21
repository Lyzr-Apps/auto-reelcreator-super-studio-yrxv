'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import { listSchedules, getSchedule, getScheduleLogs, pauseSchedule, resumeSchedule, cronToHuman, triggerScheduleNow } from '@/lib/scheduler'
import type { Schedule, ExecutionLog } from '@/lib/scheduler'
import { HiHome, HiPencilAlt, HiClock, HiCalendar, HiCog, HiFilm, HiDownload, HiRefresh, HiTrash, HiPlus, HiX, HiPlay, HiPause, HiChevronRight, HiCheck, HiExclamation, HiLightningBolt } from 'react-icons/hi'
import { FiFilm, FiCamera, FiMusic, FiScissors, FiTarget, FiTrendingUp } from 'react-icons/fi'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANAGER_AGENT_ID = '69996933e3502b03b1c6e0b1'
const VISUAL_AGENT_ID = '69996934deebc613f158666b'
const SCHEDULE_ID = '6999693e399dfadeac37e371'

const THEME_VARS = {
  '--background': '20 40% 4%',
  '--foreground': '30 30% 95%',
  '--card': '20 40% 6%',
  '--card-foreground': '30 30% 95%',
  '--popover': '20 40% 9%',
  '--secondary': '20 35% 12%',
  '--accent': '24 80% 45%',
  '--accent-foreground': '30 30% 98%',
  '--destructive': '0 63% 31%',
  '--muted': '20 30% 15%',
  '--muted-foreground': '30 20% 60%',
  '--border': '20 30% 15%',
  '--input': '20 30% 20%',
  '--ring': '24 80% 45%',
  '--primary': '24 80% 45%',
  '--primary-foreground': '30 30% 98%',
  '--sidebar-bg': '20 40% 5%',
  '--sidebar-border': '20 30% 12%',
  '--sidebar-primary': '24 80% 45%',
  '--radius': '1rem',
} as React.CSSProperties

type Screen = 'dashboard' | 'review' | 'history' | 'schedule' | 'settings'

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface SceneData {
  scene_number: number
  duration_seconds: number
  voiceover_text: string
  visual_description: string
  text_overlay: string
  b_roll_cue: string
  transition: string
  camera_direction: string
}

interface MusicDirection {
  style: string
  bpm: string
  energy_progression: string
}

interface CTAData {
  text: string
  placement: string
  timing: string
}

interface VideoData {
  video_number: number
  title: string
  topic_tag: string
  hook: string
  total_duration_seconds: number
  platform_target: string
  aspect_ratio: string
  scenes: SceneData[]
  music_direction: MusicDirection
  cta: CTAData
}

interface ResearchSummary {
  key_findings: string[]
  angles_used: string[]
  data_sources_count: number
}

interface ManagerResponse {
  research_summary: ResearchSummary
  videos: VideoData[]
  content_strategy_notes: string
  visual_style_recommendations: string
}

interface VisualSceneFrame {
  scene_number: number
  frame_description: string
  visual_style_notes: string
}

interface VisualResponse {
  video_number: number
  video_title: string
  thumbnail_description: string
  scene_frames: VisualSceneFrame[]
  overall_visual_direction: string
}

interface SettingsData {
  productName: string
  productUrl: string
  keyFeatures: string[]
  targetAudience: string
  brandVoice: string
  contentPillars: string[]
  platformTargets: string[]
}

interface HistoryEntry {
  id: string
  timestamp: string
  productName: string
  videos: VideoData[]
  researchSummary: ResearchSummary | null
  contentStrategyNotes: string
  visualStyleRecommendations: string
}

// ---------------------------------------------------------------------------
// Sample Data
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: SettingsData = {
  productName: 'Emergent',
  productUrl: 'https://emergent.sh',
  keyFeatures: ['AI-powered app builder', 'No coding required', 'Visual interface', 'Rapid app development'],
  targetAudience: 'Non-technical entrepreneurs, startup founders, small business owners, and teams looking to build apps without developers',
  brandVoice: 'Empowering, modern, accessible, bold',
  contentPillars: ['Features', 'Use Cases', 'Problem-Solution'],
  platformTargets: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
}

const SAMPLE_SETTINGS: SettingsData = { ...DEFAULT_SETTINGS }

const SAMPLE_VIDEOS: VideoData[] = [
  {
    video_number: 1,
    title: 'You Do NOT Need a Developer to Build Your App',
    topic_tag: '#NoCode',
    hook: 'What if I told you that you could build a full app in 10 minutes with zero code?',
    total_duration_seconds: 42,
    platform_target: 'TikTok',
    aspect_ratio: '9:16',
    scenes: [
      { scene_number: 1, duration_seconds: 5, voiceover_text: 'What if I told you that you could build a full app in 10 minutes with zero code?', visual_description: 'Person staring at complex code on screen, then pushing laptop away', text_overlay: 'ZERO CODE NEEDED', b_roll_cue: 'Time-lapse of frustrated coding session', transition: 'Quick zoom', camera_direction: 'Close-up on face, dramatic pull back' },
      { scene_number: 2, duration_seconds: 8, voiceover_text: 'Emergent lets you describe your app idea in plain English and AI builds it for you.', visual_description: 'Clean Emergent interface with text prompt being typed', text_overlay: 'Just Describe It', b_roll_cue: 'Screen recording of Emergent builder', transition: 'Slide left', camera_direction: 'Screen capture showing prompt to app flow' },
      { scene_number: 3, duration_seconds: 10, voiceover_text: 'No frameworks. No debugging. No hiring a dev team. Just your idea turned into a real working app.', visual_description: 'Split screen: left shows traditional dev process, right shows Emergent one-step flow', text_overlay: 'Idea to App. Instantly.', b_roll_cue: 'Side-by-side comparison animation', transition: 'Morph', camera_direction: 'Wide shot comparison' },
      { scene_number: 4, duration_seconds: 7, voiceover_text: 'Thousands of founders are already building with Emergent. Why are you still waiting?', visual_description: 'Montage of different app types built with Emergent', text_overlay: 'BUILD YOURS NOW', b_roll_cue: 'Rapid app showcase montage', transition: 'Wipe', camera_direction: 'Quick cuts between apps' },
    ],
    music_direction: { style: 'Electronic / Trap beat', bpm: '115', energy_progression: 'Low to High build with drop at Scene 3' },
    cta: { text: 'Try Emergent free at emergent.sh', placement: 'Bottom third + pinned comment', timing: 'Last 5 seconds' },
  },
  {
    video_number: 2,
    title: 'Stop Paying Developers $150/hr for Simple Apps',
    topic_tag: '#StartupHacks',
    hook: 'You are burning cash on developers for apps that AI can build in minutes.',
    total_duration_seconds: 36,
    platform_target: 'Instagram Reels',
    aspect_ratio: '9:16',
    scenes: [
      { scene_number: 1, duration_seconds: 4, voiceover_text: 'You are burning cash on developers for apps that AI can build in minutes.', visual_description: 'Money flying out of wallet with developer invoice', text_overlay: '$150/HR FOR THIS?', b_roll_cue: 'Stack of invoices being tossed', transition: 'Shake effect', camera_direction: 'Top-down dramatic reveal' },
      { scene_number: 2, duration_seconds: 8, voiceover_text: 'Emergent is an AI app builder. Describe what you want, and watch it come to life. No code. No waiting weeks.', visual_description: 'Emergent interface building an app in real-time', text_overlay: 'AI Builds It For You', b_roll_cue: 'Product demo with live generation', transition: 'Smooth slide', camera_direction: 'Screen recording with highlights' },
      { scene_number: 3, duration_seconds: 6, voiceover_text: 'From idea to launch in one afternoon. That is the Emergent difference.', visual_description: 'Before/after timeline: 6 weeks vs 1 afternoon', text_overlay: '6 Weeks vs 1 Afternoon', b_roll_cue: 'Animated timeline comparison', transition: 'Pop zoom', camera_direction: 'Clean infographic animation' },
    ],
    music_direction: { style: 'Upbeat electronic', bpm: '120', energy_progression: 'Medium to High' },
    cta: { text: 'Link in bio - emergent.sh', placement: 'End card overlay', timing: 'Last 4 seconds' },
  },
]

const SAMPLE_RESEARCH: ResearchSummary = {
  key_findings: [
    'No-code app market projected to reach $65B by 2027',
    'AI-assisted development reduces time-to-market by 80%',
    '72% of entrepreneurs say lack of technical skills is their biggest barrier',
    'Short-form video content drives 3x more SaaS signups than blog posts',
    'Emergent enables full app creation from natural language descriptions',
  ],
  angles_used: ['Cost savings vs hiring devs', 'Speed to market', 'Democratizing app development'],
  data_sources_count: 15,
}

const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: 'hist_001',
    timestamp: '2026-02-20T14:30:00Z',
    productName: 'Emergent',
    videos: SAMPLE_VIDEOS,
    researchSummary: SAMPLE_RESEARCH,
    contentStrategyNotes: 'Lead with the cost/time pain point of traditional development. Show the contrast between weeks of dev work and minutes with Emergent. Target founders and solopreneurs who feel blocked by technical barriers.',
    visualStyleRecommendations: 'Use bold, high-contrast text overlays on dark backgrounds. Show actual product UI for credibility. Quick cuts to match the energetic no-code builder vibe.',
  },
  {
    id: 'hist_002',
    timestamp: '2026-02-19T09:15:00Z',
    productName: 'Emergent',
    videos: [SAMPLE_VIDEOS[0]],
    researchSummary: SAMPLE_RESEARCH,
    contentStrategyNotes: 'Test the "you don\'t need a developer" angle against the "save money" angle. Both resonate strongly with the solopreneur audience.',
    visualStyleRecommendations: 'Split-screen before/after comparisons work well. Show the traditional dev process vs the Emergent one-prompt flow.',
  },
]

// ---------------------------------------------------------------------------
// Pillars & Platforms
// ---------------------------------------------------------------------------

const ALL_PILLARS = ['Features', 'Testimonials', 'Trends', 'Use Cases', 'Problem-Solution']
const ALL_PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function generateId() {
  return 'hist_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

// ---------------------------------------------------------------------------
// ErrorBoundary
// ---------------------------------------------------------------------------

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ activeScreen, setActiveScreen }: { activeScreen: Screen; setActiveScreen: (s: Screen) => void }) {
  const navItems: { key: Screen; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <HiHome className="w-5 h-5" /> },
    { key: 'review', label: 'Review & Edit', icon: <HiPencilAlt className="w-5 h-5" /> },
    { key: 'history', label: 'Video History', icon: <HiClock className="w-5 h-5" /> },
    { key: 'schedule', label: 'Schedule', icon: <HiCalendar className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <HiCog className="w-5 h-5" /> },
  ]

  return (
    <div className="w-64 min-h-screen flex flex-col border-r" style={{ background: 'hsl(20,40%,5%)', borderColor: 'hsl(20,30%,12%)' }}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsl(24,80%,45%)' }}>
          <HiFilm className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold text-lg tracking-tight" style={{ color: 'hsl(30,30%,95%)' }}>Viral Video Creator</span>
      </div>
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const active = activeScreen === item.key
          return (
            <button
              key={item.key}
              onClick={() => setActiveScreen(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: active ? 'hsl(24,80%,45%,0.15)' : 'transparent',
                color: active ? 'hsl(24,80%,45%)' : 'hsl(30,20%,60%)',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="p-4 mx-3 mb-4 rounded-xl" style={{ background: 'hsl(20,30%,15%)' }}>
        <div className="flex items-center gap-2 mb-1">
          <FiTrendingUp className="w-4 h-4" style={{ color: 'hsl(24,80%,45%)' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>Agents</span>
        </div>
        <div className="space-y-1">
          <AgentStatusLine label="Production Manager" agentId={MANAGER_AGENT_ID} />
          <AgentStatusLine label="Visual Generator" agentId={VISUAL_AGENT_ID} />
        </div>
      </div>
    </div>
  )
}

function AgentStatusLine({ label, agentId }: { label: string; agentId: string }) {
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(30,20%,60%)' }}>
      <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(140,60%,40%)' }} />
      <span className="truncate">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Screen
// ---------------------------------------------------------------------------

function DashboardScreen({
  settings,
  managerData,
  videos,
  generating,
  generationPhase,
  onGenerate,
  history,
  showSample,
}: {
  settings: SettingsData | null
  managerData: ManagerResponse | null
  videos: VideoData[]
  generating: boolean
  generationPhase: string
  onGenerate: () => void
  history: HistoryEntry[]
  showSample: boolean
}) {
  const displayVideos = showSample ? SAMPLE_VIDEOS : videos
  const displayResearch = showSample ? SAMPLE_RESEARCH : managerData?.research_summary
  const displayHistory = showSample ? SAMPLE_HISTORY : history
  const displaySettings = showSample ? SAMPLE_SETTINGS : settings
  const hasSettings = displaySettings && displaySettings.productName

  const videoStatuses = displayVideos.map((v, i) => ({
    label: `Video ${v.video_number ?? i + 1}`,
    title: v.title || 'Untitled',
    duration: v.total_duration_seconds ?? 0,
    platform: v.platform_target || 'TikTok',
    status: 'Ready' as string,
  }))

  while (videoStatuses.length < 2) {
    videoStatuses.push({
      label: `Video ${videoStatuses.length + 1}`,
      title: generating ? generationPhase : 'Idle',
      duration: 0,
      platform: '-',
      status: generating ? generationPhase : 'Idle',
    })
  }

  const totalGenerated = displayHistory.length * 2
  const thisWeek = displayHistory.filter((h) => {
    const d = new Date(h.timestamp)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    return diff < 7 * 24 * 60 * 60 * 1000
  }).length
  const pendingReview = displayVideos.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'hsl(30,30%,95%)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(30,20%,60%)' }}>{hasSettings ? `Creating viral content for ${displaySettings?.productName}` : 'Configure your SaaS details to get started'}</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating || !hasSettings}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'hsl(24,80%,45%)', color: 'white' }}
        >
          {generating ? (
            <>
              <HiRefresh className="w-4 h-4 animate-spin" />
              {generationPhase}
            </>
          ) : (
            <>
              <HiLightningBolt className="w-4 h-4" />
              Generate Videos
            </>
          )}
        </button>
      </div>

      {/* Video Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videoStatuses.slice(0, 2).map((vs, i) => (
          <div key={i} className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'hsl(30,20%,60%)' }}>{vs.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                background: vs.status === 'Ready' ? 'hsl(140,60%,40%,0.15)' : vs.status === 'Idle' ? 'hsl(20,30%,15%)' : 'hsl(24,80%,45%,0.15)',
                color: vs.status === 'Ready' ? 'hsl(140,60%,50%)' : vs.status === 'Idle' ? 'hsl(30,20%,60%)' : 'hsl(24,80%,45%)',
              }}>
                {vs.status === 'Ready' ? <HiCheck className="w-3 h-3 inline mr-1" /> : null}
                {vs.status}
              </span>
            </div>
            <h3 className="font-semibold text-sm truncate mb-2" style={{ color: 'hsl(30,30%,95%)' }}>{vs.title}</h3>
            {vs.duration > 0 && (
              <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(30,20%,60%)' }}>
                <span className="flex items-center gap-1"><FiFilm className="w-3 h-3" />{vs.duration}s</span>
                <span className="flex items-center gap-1"><FiTarget className="w-3 h-3" />{vs.platform}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Videos', value: totalGenerated, icon: <FiFilm className="w-5 h-5" /> },
          { label: 'This Week', value: thisWeek, icon: <FiTrendingUp className="w-5 h-5" /> },
          { label: 'Pending Review', value: pendingReview, icon: <FiScissors className="w-5 h-5" /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(24,80%,45%,0.12)', color: 'hsl(24,80%,45%)' }}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-extrabold" style={{ color: 'hsl(30,30%,95%)' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Research Summary */}
      {displayResearch && (
        <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'hsl(30,30%,95%)' }}>
            <FiTarget className="w-4 h-4" style={{ color: 'hsl(24,80%,45%)' }} />
            Research Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(30,20%,60%)' }}>Key Findings</p>
              <ul className="space-y-1">
                {Array.isArray(displayResearch?.key_findings) && displayResearch.key_findings.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'hsl(30,30%,95%)' }}>
                    <HiChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'hsl(24,80%,45%)' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(30,20%,60%)' }}>Angles Used</p>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(displayResearch?.angles_used) && displayResearch.angles_used.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(20,30%,15%)', color: 'hsl(30,30%,95%)' }}>{a}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(30,20%,60%)' }}>Data Sources</p>
              <div className="text-3xl font-extrabold" style={{ color: 'hsl(24,80%,45%)' }}>{displayResearch?.data_sources_count ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'hsl(30,30%,95%)' }}>Recent Generations</h3>
        {displayHistory.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: 'hsl(30,20%,60%)' }}>No generation history yet. Generate your first video package above.</p>
        ) : (
          <div className="space-y-2">
            {displayHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors" style={{ background: 'hsl(20,30%,15%,0.5)' }}>
                <div className="flex items-center gap-3">
                  <FiFilm className="w-4 h-4" style={{ color: 'hsl(24,80%,45%)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{entry.productName}</p>
                    <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{Array.isArray(entry.videos) ? entry.videos.length : 0} videos</p>
                  </div>
                </div>
                <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Review & Edit Screen
// ---------------------------------------------------------------------------

function ReviewScreen({
  videos,
  showSample,
  visualData,
  visualImages,
  visualLoading,
  onGenerateVisuals,
}: {
  videos: VideoData[]
  showSample: boolean
  visualData: VisualResponse | null
  visualImages: string[]
  visualLoading: boolean
  onGenerateVisuals: (videoIndex: number) => void
}) {
  const [activeTab, setActiveTab] = useState(0)
  const displayVideos = showSample ? SAMPLE_VIDEOS : videos

  if (displayVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiFilm className="w-12 h-12 mb-4" style={{ color: 'hsl(30,20%,60%)' }} />
        <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(30,30%,95%)' }}>No Videos to Review</h2>
        <p className="text-sm" style={{ color: 'hsl(30,20%,60%)' }}>Generate a video package from the Dashboard first.</p>
      </div>
    )
  }

  const video = displayVideos[activeTab] ?? displayVideos[0]
  if (!video) return null
  const scenes = Array.isArray(video?.scenes) ? video.scenes : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'hsl(30,30%,95%)' }}>Review & Edit</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'hsl(20,30%,15%)', color: 'hsl(30,30%,95%)' }}
        >
          <HiDownload className="w-4 h-4" />
          Export Package
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {displayVideos.map((v, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeTab === i ? 'hsl(24,80%,45%)' : 'hsl(20,30%,15%)',
              color: activeTab === i ? 'white' : 'hsl(30,20%,60%)',
            }}
          >
            Video {v.video_number ?? i + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Script Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Card */}
          <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'hsl(30,30%,95%)' }}>{video.title || 'Untitled'}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'hsl(24,80%,45%,0.15)', color: 'hsl(24,80%,45%)' }}>{video.topic_tag || 'No tag'}</span>
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(20,30%,15%)', color: 'hsl(30,20%,60%)' }}>{video.platform_target || 'Platform'}</span>
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(20,30%,15%)', color: 'hsl(30,20%,60%)' }}>{video.aspect_ratio || '9:16'}</span>
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(20,30%,15%)', color: 'hsl(30,20%,60%)' }}>{video.total_duration_seconds ?? 0}s</span>
            </div>
          </div>

          {/* Hook */}
          <div className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: 'hsl(24,80%,45%)' }}>Hook</p>
            <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.hook || 'No hook defined'}</p>
          </div>

          {/* Scenes */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold" style={{ color: 'hsl(30,30%,95%)' }}>Scenes ({scenes.length})</h3>
            {scenes.map((scene) => (
              <div key={scene.scene_number} className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: 'hsl(24,80%,45%)' }}>Scene {scene.scene_number}</span>
                  <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{scene.duration_seconds}s</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Voiceover</p>
                    <p className="text-sm" style={{ color: 'hsl(30,30%,95%)' }}>{scene.voiceover_text || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Visual Description</p>
                    <p className="text-sm" style={{ color: 'hsl(30,30%,95%)' }}>{scene.visual_description || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Text Overlay</p>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(24,80%,45%)' }}>{scene.text_overlay || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>B-Roll Cue</p>
                    <p className="text-sm" style={{ color: 'hsl(30,30%,95%)' }}>{scene.b_roll_cue || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Transition</p>
                    <p className="text-sm" style={{ color: 'hsl(30,30%,95%)' }}>{scene.transition || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Camera Direction</p>
                    <p className="text-sm" style={{ color: 'hsl(30,30%,95%)' }}>{scene.camera_direction || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Music Direction */}
          <div className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-2 flex items-center gap-2" style={{ color: 'hsl(30,30%,95%)' }}>
              <FiMusic className="w-4 h-4" style={{ color: 'hsl(24,80%,45%)' }} />
              Music Direction
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Style</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.music_direction?.style || '-'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>BPM</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.music_direction?.bpm || '-'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Energy</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.music_direction?.energy_progression || '-'}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <p className="text-xs font-bold tracking-wider uppercase mb-2 flex items-center gap-2" style={{ color: 'hsl(30,30%,95%)' }}>
              <FiTarget className="w-4 h-4" style={{ color: 'hsl(24,80%,45%)' }} />
              Call to Action
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Text</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.cta?.text || '-'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Placement</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.cta?.placement || '-'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Timing</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{video.cta?.timing || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Visuals */}
        <div className="space-y-4">
          <button
            onClick={() => onGenerateVisuals(activeTab)}
            disabled={visualLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: 'hsl(24,80%,45%)', color: 'white' }}
          >
            {visualLoading ? (
              <>
                <HiRefresh className="w-4 h-4 animate-spin" />
                Generating Visuals...
              </>
            ) : (
              <>
                <FiCamera className="w-4 h-4" />
                Generate Visuals
              </>
            )}
          </button>

          {/* Visual Data */}
          {visualData && (
            <div className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: 'hsl(30,30%,95%)' }}>Visual Direction</h4>
              <p className="text-xs mb-3" style={{ color: 'hsl(30,20%,60%)' }}>{visualData.overall_visual_direction || ''}</p>
              <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Thumbnail</p>
              <p className="text-xs mb-3" style={{ color: 'hsl(30,30%,95%)' }}>{visualData.thumbnail_description || ''}</p>
              {Array.isArray(visualData?.scene_frames) && visualData.scene_frames.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Scene Frames</p>
                  {visualData.scene_frames.map((sf) => (
                    <div key={sf.scene_number} className="p-2 rounded-lg" style={{ background: 'hsl(20,30%,15%)' }}>
                      <p className="text-xs font-bold" style={{ color: 'hsl(24,80%,45%)' }}>Scene {sf.scene_number}</p>
                      <p className="text-xs" style={{ color: 'hsl(30,30%,95%)' }}>{sf.frame_description || ''}</p>
                      <p className="text-xs italic mt-1" style={{ color: 'hsl(30,20%,60%)' }}>{sf.visual_style_notes || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {visualImages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold" style={{ color: 'hsl(30,30%,95%)' }}>Generated Assets</h4>
              {visualImages.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(20,30%,15%)' }}>
                  <img src={url} alt={`Visual asset ${i + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          )}

          {!visualData && visualImages.length === 0 && !visualLoading && (
            <div className="rounded-xl p-8 border text-center" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
              <FiCamera className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(30,20%,60%)' }} />
              <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Click "Generate Visuals" to create storyboard frames and thumbnails for this video.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// History Screen
// ---------------------------------------------------------------------------

function HistoryScreen({
  history,
  showSample,
  onDelete,
}: {
  history: HistoryEntry[]
  showSample: boolean
  onDelete: (id: string) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const displayHistory = showSample ? SAMPLE_HISTORY : history
  const selected = displayHistory.find((h) => h.id === selectedId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'hsl(30,30%,95%)' }}>Video History</h1>

      {displayHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <HiClock className="w-12 h-12 mb-4" style={{ color: 'hsl(30,20%,60%)' }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(30,30%,95%)' }}>No History Yet</h2>
          <p className="text-sm" style={{ color: 'hsl(30,20%,60%)' }}>Generated video packages will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="space-y-2">
            {displayHistory.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id === selectedId ? null : entry.id)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: selectedId === entry.id ? 'hsl(24,80%,45%,0.1)' : 'hsl(20,40%,6%)',
                  borderColor: selectedId === entry.id ? 'hsl(24,80%,45%,0.3)' : 'hsl(20,30%,15%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{entry.productName}</p>
                    <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{Array.isArray(entry.videos) ? entry.videos.length : 0} videos - {new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }}
                      className="p-1 rounded-lg transition-all hover:opacity-80"
                      style={{ color: 'hsl(0,63%,50%)' }}
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                    <HiChevronRight className="w-4 h-4" style={{ color: 'hsl(30,20%,60%)' }} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected ? (
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold" style={{ color: 'hsl(30,30%,95%)' }}>{selected.productName}</h3>
                  <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{new Date(selected.timestamp).toLocaleString()}</span>
                </div>

                {/* Strategy & Visual notes */}
                {selected.contentStrategyNotes && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Content Strategy</p>
                    <div style={{ color: 'hsl(30,30%,95%)' }}>{renderMarkdown(selected.contentStrategyNotes)}</div>
                  </div>
                )}
                {selected.visualStyleRecommendations && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Visual Recommendations</p>
                    <div style={{ color: 'hsl(30,30%,95%)' }}>{renderMarkdown(selected.visualStyleRecommendations)}</div>
                  </div>
                )}

                {/* Research */}
                {selected.researchSummary && (
                  <div className="mb-3 p-3 rounded-lg" style={{ background: 'hsl(20,30%,15%)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(24,80%,45%)' }}>Research ({selected.researchSummary?.data_sources_count ?? 0} sources)</p>
                    <ul className="space-y-1">
                      {Array.isArray(selected.researchSummary?.key_findings) && selected.researchSummary.key_findings.map((f, i) => (
                        <li key={i} className="text-xs flex items-start gap-1" style={{ color: 'hsl(30,30%,95%)' }}>
                          <HiChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'hsl(24,80%,45%)' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Videos */}
                {Array.isArray(selected.videos) && selected.videos.map((v) => (
                  <div key={v.video_number} className="p-3 rounded-lg mb-2" style={{ background: 'hsl(20,30%,15%)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold" style={{ color: 'hsl(30,30%,95%)' }}>Video {v.video_number}: {v.title || 'Untitled'}</p>
                      <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{v.total_duration_seconds ?? 0}s</span>
                    </div>
                    <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Hook: {v.hook || '-'}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(24,80%,45%,0.15)', color: 'hsl(24,80%,45%)' }}>{v.platform_target || '-'}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'hsl(20,40%,6%)', color: 'hsl(30,20%,60%)' }}>{Array.isArray(v.scenes) ? v.scenes.length : 0} scenes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center rounded-xl border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)', minHeight: 300 }}>
              <p className="text-sm" style={{ color: 'hsl(30,20%,60%)' }}>Select an entry to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Schedule Screen
// ---------------------------------------------------------------------------

function ScheduleScreen() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSchedule = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSchedule(SCHEDULE_ID)
      if (res.success && res.schedule) {
        setSchedule(res.schedule)
      } else {
        setError(res.error || 'Failed to load schedule')
      }
    } catch {
      setError('Failed to load schedule')
    }
    setLoading(false)
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await getScheduleLogs(SCHEDULE_ID, { limit: 20 })
      if (res.success && Array.isArray(res.executions)) {
        setLogs(res.executions)
      }
    } catch {
      // Ignore log errors
    }
    setLogsLoading(false)
  }, [])

  useEffect(() => {
    loadSchedule()
    loadLogs()
  }, [loadSchedule, loadLogs])

  const handleToggle = async () => {
    if (!schedule) return
    setActionLoading(true)
    try {
      if (schedule.is_active) {
        await pauseSchedule(SCHEDULE_ID)
      } else {
        await resumeSchedule(SCHEDULE_ID)
      }
      await loadSchedule()
    } catch {
      setError('Failed to toggle schedule')
    }
    setActionLoading(false)
  }

  const handleRunNow = async () => {
    setActionLoading(true)
    try {
      await triggerScheduleNow(SCHEDULE_ID)
      await loadLogs()
    } catch {
      setError('Failed to trigger schedule')
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'hsl(30,30%,95%)' }}>Schedule</h1>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'hsl(0,63%,31%,0.15)', color: 'hsl(0,63%,60%)' }}>
          <HiExclamation className="w-4 h-4" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><HiX className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <HiRefresh className="w-6 h-6 animate-spin" style={{ color: 'hsl(24,80%,45%)' }} />
        </div>
      ) : (
        <>
          {/* Schedule Info */}
          <div className="rounded-xl p-6 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: schedule?.is_active ? 'hsl(140,60%,40%,0.15)' : 'hsl(20,30%,15%)' }}>
                  {schedule?.is_active ? <HiPlay className="w-5 h-5" style={{ color: 'hsl(140,60%,50%)' }} /> : <HiPause className="w-5 h-5" style={{ color: 'hsl(30,20%,60%)' }} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'hsl(30,30%,95%)' }}>Daily Video Generation</h3>
                  <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>{schedule?.cron_expression ? cronToHuman(schedule.cron_expression) : 'Loading...'}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                background: schedule?.is_active ? 'hsl(140,60%,40%,0.15)' : 'hsl(0,63%,31%,0.15)',
                color: schedule?.is_active ? 'hsl(140,60%,50%)' : 'hsl(0,63%,60%)',
              }}>
                {schedule?.is_active ? 'Active' : 'Paused'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Timezone</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{schedule?.timezone || 'America/New_York'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Next Run</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{schedule?.next_run_time ? new Date(schedule.next_run_time).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Last Run</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(30,30%,95%)' }}>{schedule?.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : 'Never'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Last Run Status</p>
                <p className="text-sm font-semibold" style={{ color: schedule?.last_run_success === true ? 'hsl(140,60%,50%)' : schedule?.last_run_success === false ? 'hsl(0,63%,60%)' : 'hsl(30,20%,60%)' }}>
                  {schedule?.last_run_success === true ? 'Success' : schedule?.last_run_success === false ? 'Failed' : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleToggle}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: schedule?.is_active ? 'hsl(0,63%,31%,0.2)' : 'hsl(140,60%,40%,0.15)', color: schedule?.is_active ? 'hsl(0,63%,60%)' : 'hsl(140,60%,50%)' }}
              >
                {actionLoading ? <HiRefresh className="w-4 h-4 animate-spin" /> : schedule?.is_active ? <HiPause className="w-4 h-4" /> : <HiPlay className="w-4 h-4" />}
                {schedule?.is_active ? 'Pause Schedule' : 'Resume Schedule'}
              </button>
              <button
                onClick={handleRunNow}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'hsl(24,80%,45%)', color: 'white' }}
              >
                {actionLoading ? <HiRefresh className="w-4 h-4 animate-spin" /> : <HiLightningBolt className="w-4 h-4" />}
                Run Now
              </button>
              <button
                onClick={() => { loadSchedule(); loadLogs() }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'hsl(20,30%,15%)', color: 'hsl(30,30%,95%)' }}
              >
                <HiRefresh className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: 'hsl(30,30%,95%)' }}>Execution Logs</h3>
              {logsLoading && <HiRefresh className="w-4 h-4 animate-spin" style={{ color: 'hsl(24,80%,45%)' }} />}
            </div>
            {logs.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'hsl(30,20%,60%)' }}>No execution logs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(20,30%,15%)' }}>
                      <th className="text-left py-2 px-2 font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Executed At</th>
                      <th className="text-left py-2 px-2 font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Status</th>
                      <th className="text-left py-2 px-2 font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Attempt</th>
                      <th className="text-left py-2 px-2 font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Response</th>
                      <th className="text-left py-2 px-2 font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid hsl(20,30%,12%)' }}>
                        <td className="py-2 px-2" style={{ color: 'hsl(30,30%,95%)' }}>{new Date(log.executed_at).toLocaleString()}</td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
                            background: log.success ? 'hsl(140,60%,40%,0.15)' : 'hsl(0,63%,31%,0.15)',
                            color: log.success ? 'hsl(140,60%,50%)' : 'hsl(0,63%,60%)',
                          }}>
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-2 px-2" style={{ color: 'hsl(30,30%,95%)' }}>{log.attempt}/{log.max_attempts}</td>
                        <td className="py-2 px-2" style={{ color: 'hsl(30,20%,60%)' }}>{log.response_status}</td>
                        <td className="py-2 px-2 max-w-xs truncate" style={{ color: 'hsl(0,63%,60%)' }}>{log.error_message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings Screen
// ---------------------------------------------------------------------------

function SettingsScreen({
  settings,
  onSave,
}: {
  settings: SettingsData
  onSave: (s: SettingsData) => void
}) {
  const [form, setForm] = useState<SettingsData>(settings)
  const [featureInput, setFeatureInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const handleSave = () => {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addFeature = () => {
    if (!featureInput.trim()) return
    setForm((prev) => ({ ...prev, keyFeatures: [...prev.keyFeatures, featureInput.trim()] }))
    setFeatureInput('')
  }

  const removeFeature = (idx: number) => {
    setForm((prev) => ({ ...prev, keyFeatures: prev.keyFeatures.filter((_, i) => i !== idx) }))
  }

  const togglePillar = (p: string) => {
    setForm((prev) => ({
      ...prev,
      contentPillars: prev.contentPillars.includes(p) ? prev.contentPillars.filter((x) => x !== p) : [...prev.contentPillars, p],
    }))
  }

  const togglePlatform = (p: string) => {
    setForm((prev) => ({
      ...prev,
      platformTargets: prev.platformTargets.includes(p) ? prev.platformTargets.filter((x) => x !== p) : [...prev.platformTargets, p],
    }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'hsl(30,30%,95%)' }}>Settings</h1>

      {/* Product Info */}
      <div className="rounded-xl p-5 border space-y-4" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
        <h3 className="text-sm font-bold" style={{ color: 'hsl(30,30%,95%)' }}>Product Information</h3>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Product Name *</label>
          <input
            type="text"
            value={form.productName}
            onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
            placeholder="e.g., FlowSync"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border"
            style={{ background: 'hsl(20,30%,20%)', borderColor: 'hsl(20,30%,25%)', color: 'hsl(30,30%,95%)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Product URL</label>
          <input
            type="url"
            value={form.productUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, productUrl: e.target.value }))}
            placeholder="https://yourproduct.com"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border"
            style={{ background: 'hsl(20,30%,20%)', borderColor: 'hsl(20,30%,25%)', color: 'hsl(30,30%,95%)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Key Features</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
              placeholder="Add a feature..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all border"
              style={{ background: 'hsl(20,30%,20%)', borderColor: 'hsl(20,30%,25%)', color: 'hsl(30,30%,95%)' }}
            />
            <button onClick={addFeature} className="px-3 py-2 rounded-xl" style={{ background: 'hsl(24,80%,45%)', color: 'white' }}>
              <HiPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(form.keyFeatures) && form.keyFeatures.map((f, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'hsl(24,80%,45%,0.15)', color: 'hsl(24,80%,45%)' }}>
                {f}
                <button onClick={() => removeFeature(i)}><HiX className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Target Audience</label>
          <input
            type="text"
            value={form.targetAudience}
            onChange={(e) => setForm((prev) => ({ ...prev, targetAudience: e.target.value }))}
            placeholder="e.g., SaaS founders and product managers"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border"
            style={{ background: 'hsl(20,30%,20%)', borderColor: 'hsl(20,30%,25%)', color: 'hsl(30,30%,95%)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'hsl(30,20%,60%)' }}>Brand Voice</label>
          <input
            type="text"
            value={form.brandVoice}
            onChange={(e) => setForm((prev) => ({ ...prev, brandVoice: e.target.value }))}
            placeholder="e.g., Confident, innovative, approachable"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border"
            style={{ background: 'hsl(20,30%,20%)', borderColor: 'hsl(20,30%,25%)', color: 'hsl(30,30%,95%)' }}
          />
        </div>
      </div>

      {/* Content Pillars */}
      <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'hsl(30,30%,95%)' }}>Content Pillars</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_PILLARS.map((p) => {
            const active = Array.isArray(form.contentPillars) && form.contentPillars.includes(p)
            return (
              <button
                key={p}
                onClick={() => togglePillar(p)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={{
                  background: active ? 'hsl(24,80%,45%,0.15)' : 'transparent',
                  borderColor: active ? 'hsl(24,80%,45%,0.3)' : 'hsl(20,30%,15%)',
                  color: active ? 'hsl(24,80%,45%)' : 'hsl(30,20%,60%)',
                }}
              >
                {active && <HiCheck className="w-3 h-3" />}
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Platform Targets */}
      <div className="rounded-xl p-5 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'hsl(30,30%,95%)' }}>Platform Targets</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((p) => {
            const active = Array.isArray(form.platformTargets) && form.platformTargets.includes(p)
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={{
                  background: active ? 'hsl(24,80%,45%,0.15)' : 'transparent',
                  borderColor: active ? 'hsl(24,80%,45%,0.3)' : 'hsl(20,30%,15%)',
                  color: active ? 'hsl(24,80%,45%)' : 'hsl(30,20%,60%)',
                }}
              >
                {active && <HiCheck className="w-3 h-3" />}
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
        style={{ background: saved ? 'hsl(140,60%,40%)' : 'hsl(24,80%,45%)', color: 'white' }}
      >
        {saved ? (
          <>
            <HiCheck className="w-4 h-4" />
            Saved!
          </>
        ) : (
          'Save Settings'
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function Page() {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard')
  const [showSample, setShowSample] = useState(false)
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [managerData, setManagerData] = useState<ManagerResponse | null>(null)
  const [videos, setVideos] = useState<VideoData[]>([])
  const [generating, setGenerating] = useState(false)
  const [generationPhase, setGenerationPhase] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [visualData, setVisualData] = useState<VisualResponse | null>(null)
  const [visualImages, setVisualImages] = useState<string[]>([])
  const [visualLoading, setVisualLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Load from localStorage, default to Emergent settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vvc_settings')
      if (stored) {
        setSettings(JSON.parse(stored))
      } else {
        setSettings(DEFAULT_SETTINGS)
        localStorage.setItem('vvc_settings', JSON.stringify(DEFAULT_SETTINGS))
      }
      const storedHistory = localStorage.getItem('vvc_history')
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    }
  }, [])

  const saveSettings = useCallback((s: SettingsData) => {
    setSettings(s)
    try { localStorage.setItem('vvc_settings', JSON.stringify(s)) } catch { /* ignore */ }
  }, [])

  const saveHistory = useCallback((h: HistoryEntry[]) => {
    setHistory(h)
    try { localStorage.setItem('vvc_history', JSON.stringify(h)) } catch { /* ignore */ }
  }, [])

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id)
      try { localStorage.setItem('vvc_history', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Generate Videos
  const handleGenerate = useCallback(async () => {
    if (!settings?.productName) return
    setGenerating(true)
    setGenerationError('')
    setGenerationPhase('Researching...')
    setActiveAgentId(MANAGER_AGENT_ID)

    try {
      const message = `Create a 2-video viral content package for the SaaS product "${settings.productName}"${settings.productUrl ? ` (${settings.productUrl})` : ''}.
Key features: ${Array.isArray(settings.keyFeatures) ? settings.keyFeatures.join(', ') : 'N/A'}.
Target audience: ${settings.targetAudience || 'general SaaS users'}.
Brand voice: ${settings.brandVoice || 'professional'}.
Content pillars to focus on: ${Array.isArray(settings.contentPillars) ? settings.contentPillars.join(', ') : 'Features'}.
Platform targets: ${Array.isArray(settings.platformTargets) ? settings.platformTargets.join(', ') : 'TikTok'}.`

      setGenerationPhase('Writing scripts...')
      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      if (result.success && result?.response?.result) {
        const data = result.response.result as Record<string, unknown>
        const parsedVideos = Array.isArray(data?.videos) ? (data.videos as VideoData[]) : []
        const researchSummary: ResearchSummary | null = data?.research_summary ? {
          key_findings: Array.isArray((data.research_summary as Record<string, unknown>)?.key_findings) ? (data.research_summary as ResearchSummary).key_findings : [],
          angles_used: Array.isArray((data.research_summary as Record<string, unknown>)?.angles_used) ? (data.research_summary as ResearchSummary).angles_used : [],
          data_sources_count: typeof (data.research_summary as Record<string, unknown>)?.data_sources_count === 'number' ? (data.research_summary as ResearchSummary).data_sources_count : 0,
        } : null

        const mgrData: ManagerResponse = {
          research_summary: researchSummary || { key_findings: [], angles_used: [], data_sources_count: 0 },
          videos: parsedVideos,
          content_strategy_notes: typeof data?.content_strategy_notes === 'string' ? data.content_strategy_notes as string : '',
          visual_style_recommendations: typeof data?.visual_style_recommendations === 'string' ? data.visual_style_recommendations as string : '',
        }

        setManagerData(mgrData)
        setVideos(parsedVideos)
        setGenerationPhase('Complete!')

        // Save to history
        const entry: HistoryEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          productName: settings.productName,
          videos: parsedVideos,
          researchSummary: researchSummary,
          contentStrategyNotes: mgrData.content_strategy_notes,
          visualStyleRecommendations: mgrData.visual_style_recommendations,
        }
        saveHistory([entry, ...history])
      } else {
        setGenerationError('Agent returned no data. Please try again.')
        setGenerationPhase('Failed')
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Generation failed')
      setGenerationPhase('Failed')
    }

    setActiveAgentId(null)
    setTimeout(() => setGenerating(false), 1500)
  }, [settings, history, saveHistory])

  // Generate Visuals
  const handleGenerateVisuals = useCallback(async (videoIndex: number) => {
    const displayVideos = showSample ? SAMPLE_VIDEOS : videos
    const video = displayVideos[videoIndex]
    if (!video) return

    setVisualLoading(true)
    setVisualData(null)
    setVisualImages([])
    setActiveAgentId(VISUAL_AGENT_ID)

    try {
      const sceneDescriptions = Array.isArray(video.scenes)
        ? video.scenes.map((s) => `Scene ${s.scene_number}: ${s.visual_description || ''} - Text overlay: "${s.text_overlay || ''}" - B-roll: ${s.b_roll_cue || ''}`).join('\n')
        : ''

      const message = `Generate visual storyboard frames and a thumbnail for Video ${video.video_number}: "${video.title || ''}".
Hook: ${video.hook || ''}
Platform: ${video.platform_target || 'TikTok'}
Aspect ratio: ${video.aspect_ratio || '9:16'}
Scenes:
${sceneDescriptions}
Create eye-catching visuals that match the viral short-form video style.`

      const result = await callAIAgent(message, VISUAL_AGENT_ID)

      if (result.success && result?.response?.result) {
        const data = result.response.result as Record<string, unknown>
        const visResp: VisualResponse = {
          video_number: typeof data?.video_number === 'number' ? data.video_number as number : video.video_number,
          video_title: typeof data?.video_title === 'string' ? data.video_title as string : video.title || '',
          thumbnail_description: typeof data?.thumbnail_description === 'string' ? data.thumbnail_description as string : '',
          scene_frames: Array.isArray(data?.scene_frames) ? (data.scene_frames as VisualSceneFrame[]) : [],
          overall_visual_direction: typeof data?.overall_visual_direction === 'string' ? data.overall_visual_direction as string : '',
        }
        setVisualData(visResp)
      }

      // Images from module_outputs at top level
      const files = Array.isArray(result?.module_outputs?.artifact_files) ? result.module_outputs.artifact_files : []
      const imageUrls = files.map((f: { file_url?: string }) => f?.file_url).filter((u): u is string => !!u)
      setVisualImages(imageUrls)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Visual generation failed')
    }

    setActiveAgentId(null)
    setVisualLoading(false)
  }, [videos, showSample])

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen flex font-sans" >
        <div className="min-h-screen" style={{ background: 'hsl(20,40%,4%)' }}>
          <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        </div>

        <div className="flex-1 min-h-screen overflow-y-auto" style={{ background: 'hsl(20,40%,4%)' }}>
          {/* Top Bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b" style={{ background: 'hsl(20,40%,4%,0.9)', borderColor: 'hsl(20,30%,15%)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-3">
              {activeAgentId && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'hsl(24,80%,45%,0.15)' }}>
                  <HiRefresh className="w-3 h-3 animate-spin" style={{ color: 'hsl(24,80%,45%)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'hsl(24,80%,45%)' }}>
                    {activeAgentId === MANAGER_AGENT_ID ? 'Production Manager' : 'Visual Generator'} working...
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: 'hsl(30,20%,60%)' }}>Sample Data</span>
              <button
                onClick={() => setShowSample(!showSample)}
                className="relative w-11 h-6 rounded-full transition-all duration-200"
                style={{ background: showSample ? 'hsl(24,80%,45%)' : 'hsl(20,30%,20%)' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
                  style={{
                    background: 'white',
                    left: showSample ? '22px' : '2px',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Error banner */}
          {generationError && (
            <div className="mx-8 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'hsl(0,63%,31%,0.15)', color: 'hsl(0,63%,60%)' }}>
              <HiExclamation className="w-4 h-4" />
              <span className="text-sm">{generationError}</span>
              <button onClick={() => setGenerationError('')} className="ml-auto"><HiX className="w-4 h-4" /></button>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {activeScreen === 'dashboard' && (
              <DashboardScreen
                settings={settings}
                managerData={managerData}
                videos={videos}
                generating={generating}
                generationPhase={generationPhase}
                onGenerate={handleGenerate}
                history={history}
                showSample={showSample}
              />
            )}
            {activeScreen === 'review' && (
              <ReviewScreen
                videos={videos}
                showSample={showSample}
                visualData={visualData}
                visualImages={visualImages}
                visualLoading={visualLoading}
                onGenerateVisuals={handleGenerateVisuals}
              />
            )}
            {activeScreen === 'history' && (
              <HistoryScreen
                history={history}
                showSample={showSample}
                onDelete={deleteHistoryEntry}
              />
            )}
            {activeScreen === 'schedule' && (
              <ScheduleScreen />
            )}
            {activeScreen === 'settings' && (
              <SettingsScreen
                settings={settings || DEFAULT_SETTINGS}
                onSave={saveSettings}
              />
            )}
          </div>

          {/* Agent Status Footer */}
          <div className="px-8 pb-6">
            <div className="rounded-xl p-4 border" style={{ background: 'hsl(20,40%,6%)', borderColor: 'hsl(20,30%,15%)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: activeAgentId === MANAGER_AGENT_ID ? 'hsl(24,80%,45%)' : 'hsl(140,60%,40%)' }} />
                    <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Video Production Manager</span>
                    {activeAgentId === MANAGER_AGENT_ID && <HiRefresh className="w-3 h-3 animate-spin" style={{ color: 'hsl(24,80%,45%)' }} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: activeAgentId === VISUAL_AGENT_ID ? 'hsl(24,80%,45%)' : 'hsl(140,60%,40%)' }} />
                    <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Visual Asset Generator</span>
                    {activeAgentId === VISUAL_AGENT_ID && <HiRefresh className="w-3 h-3 animate-spin" style={{ color: 'hsl(24,80%,45%)' }} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(140,60%,40%)' }} />
                    <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>SaaS Research Agent (sub)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(140,60%,40%)' }} />
                    <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Script Director (sub)</span>
                  </div>
                </div>
                <span className="text-xs" style={{ color: 'hsl(30,20%,60%)' }}>Schedule: Daily 8 AM EST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
