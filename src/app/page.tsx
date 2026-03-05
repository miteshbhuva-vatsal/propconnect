'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield, Zap, Users, TrendingUp, MessageSquare,
  Building2, CheckCircle2, ArrowRight, Star, Lock
} from 'lucide-react'

const FEATURES = [
  {
    icon: <Lock size={24} />,
    title: 'End-to-End Encrypted',
    desc: 'All messages protected with Signal Protocol. Zero knowledge on our servers.',
  },
  {
    icon: <Zap size={24} />,
    title: 'AI Matchmaking',
    desc: 'Smart property matching based on your preferences and behavior.',
  },
  {
    icon: <Building2 size={24} />,
    title: '13 Property Types',
    desc: 'From apartments to farmlands, JV deals to barter transactions.',
  },
  {
    icon: <Users size={24} />,
    title: 'Verified Network',
    desc: 'RERA-verified developers and KYC-verified brokers only.',
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'WhatsApp-Simple UI',
    desc: 'Familiar interface your team adopts in minutes, not weeks.',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Built-in CRM',
    desc: 'Full deal pipeline management without leaving the platform.',
  },
]

const STATS = [
  { value: '50K+', label: 'Verified Listings' },
  { value: '15K+', label: 'Active Brokers' },
  { value: '₹2,400 Cr', label: 'Deals Facilitated' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const TESTIMONIALS = [
  {
    name: 'Rajesh Mehta',
    role: 'Senior Broker, Mumbai',
    text: 'PropConnect has transformed how I connect with investors. Closed 3 deals last month that started as WhatsApp shares from the app.',
    rating: 5,
    avatar: 'RM',
  },
  {
    name: 'Priya Sharma',
    role: 'Real Estate Developer, Pune',
    text: 'The admin approval workflow gives us confidence that our listings reach serious investors only. No time-wasters.',
    rating: 5,
    avatar: 'PS',
  },
  {
    name: 'Vikram Agarwal',
    role: 'Investor, Bengaluru',
    text: 'AI matching saved me hours of searching. I get exactly the kind of distressed properties I look for, automatically.',
    rating: 5,
    avatar: 'VA',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    deals: '5 deal interactions',
    features: ['Browse all listings', 'Basic search filters', 'Express interest × 5', 'Basic profile'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro Broker',
    price: '₹1,999',
    period: '/month',
    deals: 'Unlimited deal interactions',
    features: ['Everything in Free', 'Unlimited deal interactions', 'CRM with pipeline tracking', 'AI property card generation', 'Priority listing placement', 'Advanced analytics', 'Verified badge'],
    cta: 'Start 7-Day Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    deals: 'Team deal management',
    features: ['Everything in Pro', 'Team seats (up to 50)', 'Dedicated account manager', 'White-label option', 'API access', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-wp-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-wp-teal rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-wp-teal text-lg">PropConnect</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-wp-text-secondary">
            <a href="#features" className="hover:text-wp-teal transition-colors">Features</a>
            <a href="#pricing" className="hover:text-wp-teal transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-wp-teal transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-wp-teal font-medium hover:underline hidden sm:block">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary py-2 px-5 text-sm rounded-xl">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-br from-wp-teal via-wp-green-dark to-wp-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
              <Shield size={14} />
              End-to-End Encrypted · Trusted by 15,000+ Brokers
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Close Real Estate Deals{' '}
              <span className="text-wp-green-light">Faster & Safer</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The WhatsApp-inspired platform for brokers, developers, and investors
              to share verified property deals, manage leads, and grow their network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn-primary bg-white text-wp-teal hover:bg-white/90 text-base px-8 py-4 rounded-2xl shadow-xl inline-flex items-center gap-2">
                Start for Free <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20 text-base px-8 py-4 rounded-2xl inline-flex items-center gap-2 backdrop-blur-sm">
                See How It Works
              </a>
            </div>
          </motion.div>
        </div>

        {/* Floating phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-sm mx-auto mt-16 relative"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/20 shadow-2xl">
            {/* Mock property card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-br from-wp-teal to-wp-green h-32 flex items-center justify-center">
                <Building2 size={48} className="text-white opacity-60" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="tag bg-wp-green/10 text-wp-green-dark">Apartment</span>
                  <span className="tag bg-blue-50 text-blue-700">Sale</span>
                </div>
                <p className="font-semibold text-wp-text mt-2">3BHK Apartment · Bandra West</p>
                <p className="text-wp-green font-bold text-lg">₹2.8 Cr</p>
                <p className="text-wp-text-secondary text-sm">1,250 sq ft · 2 floor</p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-wp-green text-white text-sm py-2 rounded-xl font-medium">Inquire</button>
                  <button className="px-3 py-2 border border-wp-border rounded-xl">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-wp-green fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-wp-teal">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-wp-text mb-4">
              Everything you need to <span className="text-gradient">close more deals</span>
            </h2>
            <p className="text-wp-text-secondary text-lg max-w-xl mx-auto">
              Built by real estate professionals, for real estate professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-wp-green/10 rounded-xl flex items-center justify-center text-wp-green mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-wp-text mb-2">{f.title}</h3>
                <p className="text-wp-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-wp-text mb-12">
            Trusted by top brokers across India
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-wp-text-secondary text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-wp-teal rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-wp-text text-sm">{t.name}</p>
                    <p className="text-wp-text-secondary text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-wp-text mb-4">Simple, honest pricing</h2>
            <p className="text-wp-text-secondary">Start free. Upgrade when you're ready to scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`card p-6 ${plan.highlighted
                  ? 'border-wp-green ring-2 ring-wp-green bg-white relative'
                  : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-wp-green text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-bold text-wp-text text-lg">{plan.name}</h3>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-bold text-wp-teal">{plan.price}</span>
                  <span className="text-wp-text-secondary text-sm"> {plan.period}</span>
                </div>
                <p className="text-wp-green text-sm font-medium mb-4">{plan.deals}</p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-wp-text-secondary">
                      <CheckCircle2 size={15} className="text-wp-green flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={plan.highlighted
                    ? 'btn-primary w-full text-center block'
                    : 'btn-secondary w-full text-center block'
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-wp-teal text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to grow your deal network?
        </h2>
        <p className="text-white/70 mb-8 text-lg">
          Join 15,000+ brokers already closing deals on PropConnect.
        </p>
        <Link href="/login" className="btn-primary bg-white text-wp-teal hover:bg-white/90 text-lg px-10 py-4 rounded-2xl inline-flex items-center gap-2 shadow-xl">
          Get Started Free <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-wp-green rounded-lg flex items-center justify-center">
                <Building2 size={14} className="text-white" />
              </div>
              <span className="font-bold text-white">PropConnect</span>
            </div>
            <p className="text-sm max-w-xs">
              The secure real estate deal network for brokers, developers, and investors.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="text-white font-medium mb-3">Product</p>
              <div className="space-y-2">
                <a href="#features" className="block hover:text-white">Features</a>
                <a href="#pricing" className="block hover:text-white">Pricing</a>
              </div>
            </div>
            <div>
              <p className="text-white font-medium mb-3">Legal</p>
              <div className="space-y-2">
                <a href="#" className="block hover:text-white">Privacy Policy</a>
                <a href="#" className="block hover:text-white">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()} PropConnect. All rights reserved. | DPDP Act 2023 Compliant
        </div>
      </footer>
    </div>
  )
}
