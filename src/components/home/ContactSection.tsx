'use client';

import React from 'react';
import { Mail, Send, ExternalLink, MessageCircle, Youtube, Facebook } from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';

export const ContactSection: React.FC = () => {
  const contactChannels = [
    {
      id: 'whatsapp',
      name: 'Direct WhatsApp',
      handle: '+20 102 920 8993',
      rawHandle: '01029208993',
      href: 'https://wa.me/201029208993',
      category: 'Instant Messaging',
      description: 'Direct communication for cohort admissions, problem-set inquiries, and urgent academic questions.',
      actionText: 'Open WhatsApp Chat',
      icon: (
        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <WhatsAppIcon className="w-5 h-5 fill-current" />
        </div>
      ),
      highlight: true,
      badge: 'Fastest Response',
    },
    {
      id: 'telegram',
      name: 'Telegram Channel & Direct',
      handle: '@Feynmanvii',
      rawHandle: '@Feynmanvii',
      href: 'https://t.me/Feynmanvii',
      category: 'Direct Messaging',
      description: 'Direct scientific consultations, concept queries, and supplementary chemistry discussion.',
      actionText: 'Message on Telegram',
      icon: (
        <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
          <Send className="w-5 h-5" />
        </div>
      ),
      highlight: false,
      badge: 'Academic Direct',
    },
    {
      id: 'email',
      name: 'Official Academic Email',
      handle: 'phenolvii@gmail.com',
      rawHandle: 'phenolvii@gmail.com',
      href: 'mailto:phenolvii@gmail.com',
      category: 'Formal Inquiries',
      description: 'Formal correspondence, parental inquiries, institutional partnerships, and syllabus consultations.',
      actionText: 'Send Email',
      icon: (
        <div className="w-10 h-10 rounded-full bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-500 group-hover:bg-burgundy-500 group-hover:text-white transition-colors">
          <Mail className="w-5 h-5" />
        </div>
      ),
      highlight: false,
      badge: 'Official Office',
    },
    {
      id: 'youtube',
      name: 'YouTube: Phenol Talks',
      handle: '@phenoltalks',
      rawHandle: 'youtube.com/@phenoltalks',
      href: 'https://youtube.com/@phenoltalks',
      category: 'Video Masterclasses',
      description: 'Comprehensive video explanations, organic mechanism animations, and analytical exam deconstructions.',
      actionText: 'Visit YouTube Channel',
      icon: (
        <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
          <Youtube className="w-5 h-5" />
        </div>
      ),
      highlight: false,
      badge: 'Lectures & Talks',
    },
    {
      id: 'facebook',
      name: 'Facebook Academic Profile',
      handle: 'phenolVII',
      rawHandle: 'facebook.com/phenolVII',
      href: 'https://www.facebook.com/phenolVII',
      category: 'Social Updates',
      description: 'Academic articles, cohort announcements, student reflections, and scientific commentary by Dr. Omar Magdi.',
      actionText: 'Follow on Facebook',
      icon: (
        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <Facebook className="w-5 h-5" />
        </div>
      ),
      highlight: false,
      badge: 'Official Profile',
    },
  ];

  return (
    <section
      id="contact"
      className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 09
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
              Academic Office & Direct Communications
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            Direct Access to Dr. Omar Magdi
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            Personal academic supervision is central to the PHENOL ethos. Reach out directly through the verified communication channels below for cohort enrollment, problem-set reviews, or scientific inquiries.
          </p>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactChannels.map((ch) => (
            <a
              key={ch.id}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative rounded border p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-subtle ${
                ch.highlight
                  ? 'bg-ivory-100 border-burgundy-500/40 shadow-quiet'
                  : 'bg-ivory-100 border-hairline hover:border-hairline-strong'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {ch.icon}
                  <span className="font-formula text-[11px] px-2 py-0.5 rounded bg-ivory-300 text-charcoal-100 font-medium tracking-wide">
                    {ch.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-formula text-burgundy-500 font-semibold tracking-wider uppercase">
                    {ch.category}
                  </div>
                  <h3 className="text-lg font-bold font-display text-charcoal-900 group-hover:text-burgundy-600 transition-colors">
                    {ch.name}
                  </h3>
                  <p className="text-sm font-semibold font-formula text-charcoal-900 break-all">
                    {ch.handle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans pt-1">
                  {ch.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-hairline flex items-center justify-between text-xs font-semibold text-burgundy-600 group-hover:text-burgundy-800 font-sans">
                <span>{ch.actionText}</span>
                <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>
          ))}

          {/* Academic Consultation Summary Card */}
          <div className="rounded border border-hairline bg-gradient-to-br from-ivory-100 to-ivory-300 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
                Office Policy
              </span>
              <h4 className="text-base font-bold font-display text-charcoal-900">
                Direct Supervision Protocol
              </h4>
              <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
                Every inquiry is addressed personally by Dr. Omar Magdi. Whether you are an enrolled student submitting problem sets or a prospective student inquiring about the 2026/2027 cohort, expect disciplined and prompt feedback.
              </p>
            </div>

            <div className="pt-4 border-t border-hairline space-y-1 text-xs font-sans text-charcoal-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-charcoal-900">Office Hours: Daily (10:00 AM – 10:00 PM CLT)</span>
              </div>
              <p className="text-[11px] text-charcoal-50 font-formula">
                Direct coordination across Cairo & International timezones
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
