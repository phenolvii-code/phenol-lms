'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Atom,
  Compass,
  Layers,
  Sparkles,
  BookOpen,
  Send,
  Mail,
  FlaskConical,
  Activity,
  Cpu,
  Boxes,
  Scroll,
} from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function AboutPage() {
  const { user: currentUser } = useCurrentUser();
  const educationalPrinciples = [
    {
      num: '01',
      title: 'Understanding Before Memorization',
      body: 'Students should understand the physical and chemical meaning behind equations, definitions, and reactions before being expected to recall them. Memorization may assist learning, but it cannot replace conceptual understanding.',
    },
    {
      num: '02',
      title: 'Mechanisms Before Observations',
      body: 'I place particular emphasis on explaining why phenomena occur. Rather than presenting a chemical relationship as an isolated fact, I seek to uncover the sequence of interactions and principles responsible for it.',
    },
    {
      num: '03',
      title: 'Connecting Different Levels of Explanation',
      body: 'Chemistry operates across multiple levels: the macroscopic world of observable phenomena, the microscopic world of atoms and molecules, and the symbolic world of equations and mathematical representations. Effective learning requires moving between these levels and understanding how they relate.',
    },
    {
      num: '04',
      title: 'Scientific Reasoning Over Pattern Recognition',
      body: 'A student should be able to approach an unfamiliar problem by identifying relevant principles, analyzing available information, and constructing a logical solution—not merely by recognizing a familiar question pattern.',
    },
    {
      num: '05',
      title: 'Precision Without Unnecessary Complexity',
      body: 'Scientific accuracy and accessibility should not be treated as opposing goals. Complex ideas can be explained clearly without sacrificing the depth or precision that makes them scientifically meaningful.',
    },
  ];

  const scientificAreas = [
    {
      title: 'Physical Chemistry',
      icon: Activity,
      desc: 'Thermodynamics, chemical kinetics, molecular behavior, and the energetic foundations of chemical processes.',
    },
    {
      title: 'Quantum Chemistry',
      icon: Atom,
      desc: 'The quantum-mechanical description of atoms and molecules, electronic structure, and the origins of chemical bonding.',
    },
    {
      title: 'Inorganic Chemistry',
      icon: Boxes,
      desc: 'Periodic relationships, coordination chemistry, transition-metal chemistry, and structure–property relationships.',
    },
    {
      title: 'Organic Chemistry',
      icon: FlaskConical,
      desc: 'Reaction mechanisms, molecular structure, electronic effects, and the principles governing chemical transformations.',
    },
    {
      title: 'Materials and Solid-State Chemistry',
      icon: Cpu,
      desc: 'The relationship between atomic arrangement, bonding, electronic properties, and the behavior of materials.',
    },
    {
      title: 'Philosophy and History of Science',
      icon: Scroll,
      desc: 'The development of scientific ideas, the nature of scientific explanations, and the relationship between theoretical models and experimental evidence.',
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Top Editorial Academic Header */}
      <header className="border-b border-hairline bg-ivory-100/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-100 hover:text-burgundy-500 transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <PhenolLogo size={32} subtitle="Dr. Omar Magdi" />

          <div className="flex items-center gap-2">
            <Link
              href="/courses"
              className="px-4 py-2 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-all shadow-sm hover:shadow"
            >
              Explore Courses
            </Link>
            {currentUser && (
              <Link
                href="/dashboard"
                className="px-3.5 py-2 rounded-lg border border-hairline bg-ivory-100 hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-16 sm:space-y-20">
        {/* Masthead Profile & Monogram */}
        <section className="border-b border-hairline pb-12 sm:pb-16 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-hairline bg-ivory-100">
            <GraduationCap className="w-3.5 h-3.5 text-burgundy-500" />
            <span className="font-editorial uppercase text-burgundy-500 font-bold tracking-widest text-xs">
              PHENOL
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-charcoal-900 font-sans font-semibold text-xs tracking-wide">
              Faculty Profile & Academic Manifesto
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 font-display tracking-tight">
              Dr. Omar Magdi
            </h1>
            <p className="text-lg sm:text-xl text-burgundy-500 font-sans font-semibold tracking-wide">
              Chemistry Educator | Scientific Thinker | Lifelong Learner
            </p>
          </div>

          {/* Direct Social & Mentorship Links Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-sans text-charcoal-100">
            <span className="font-semibold text-charcoal-900">Direct Mentorship Channels:</span>
            <div className="flex items-center gap-2.5">
              <a
                href="https://wa.me/201029208993"
                target="_blank"
                rel="noopener noreferrer"
                title="Direct WhatsApp (+201029208993)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-ivory-100 hover:border-emerald-300 hover:text-emerald-700 transition-colors font-medium"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-emerald-600" />
                <span>+20 102 920 8993</span>
              </a>
              <a
                href="https://t.me/Feynmanvii"
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram (@Feynmanvii)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-ivory-100 hover:border-sky-300 hover:text-sky-700 transition-colors font-medium"
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>@Feynmanvii</span>
              </a>
              <a
                href="mailto:phenolvii@gmail.com"
                title="Email (phenolvii@gmail.com)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-ivory-100 hover:border-burgundy-300 hover:text-burgundy-700 transition-colors font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-burgundy-500" />
                <span>phenolvii@gmail.com</span>
              </a>
            </div>
          </div>
        </section>

        {/* Section 01: About Me */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SECTION 01 • BIOGRAPHY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
            About Me
          </h2>

          <div className="space-y-5 text-base sm:text-lg text-charcoal-100 leading-relaxed font-sans">
            <p>
              I am Dr. Omar Magdi, a PharmD graduate and chemistry educator with a particular interest in the fundamental principles that govern matter, its transformations, and the intricate mechanisms underlying chemical phenomena.
            </p>
            <p>
              My academic background in pharmaceutical sciences has shaped the way I approach chemistry: not merely as a collection of equations, reactions, and theoretical rules, but as a coherent scientific discipline whose concepts are deeply interconnected. I am particularly interested in understanding the reasoning behind chemical behavior, exploring the relationship between microscopic structures and macroscopic observations, and examining how fundamental principles emerge from the interactions of atoms, molecules, and energy.
            </p>
            <div className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border-l-4 border-burgundy-500 shadow-quiet my-6">
              <p className="font-serif italic text-lg sm:text-xl text-charcoal-900 leading-relaxed">
                “For me, scientific understanding begins where memorization ends. Knowing that a reaction occurs is only the beginning; understanding why it occurs, what drives it, how its mechanism unfolds, and which principles determine its outcome is where meaningful learning takes place.”
              </p>
            </div>
            <p>
              This perspective informs both my approach to teaching and my continued exploration of chemistry.
            </p>
          </div>
        </section>

        {/* Section 02: A Way of Thinking About Chemistry */}
        <section className="space-y-6 border-t border-hairline pt-12 sm:pt-16">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              SECTION 02 • EPISTEMOLOGY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
            A Way of Thinking About Chemistry
          </h2>

          <div className="space-y-5 text-base sm:text-lg text-charcoal-100 leading-relaxed font-sans">
            <p>
              Chemistry occupies a remarkable position among the natural sciences. It connects the abstract language of physics and mathematics to the tangible complexity of the material world. It explains how electronic structure influences chemical reactivity, how molecular interactions give rise to physical properties, how energy governs spontaneous processes, and how seemingly simple atomic arrangements can produce extraordinarily diverse materials.
            </p>
            <p>
              I believe that chemistry becomes far more intelligible when it is approached through its underlying principles rather than as a sequence of disconnected facts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              <div className="p-6 rounded-xl bg-ivory-100 border border-hairline space-y-3">
                <span className="font-formula text-xs font-bold text-burgundy-500 uppercase tracking-widest block">
                  Causal Analysis
                </span>
                <h3 className="font-display font-bold text-base text-charcoal-900">
                  Equations as Physical Transformations
                </h3>
                <p className="text-sm text-charcoal-100 leading-relaxed font-sans">
                  A chemical equation, for example, should not be treated merely as an expression to balance. It represents a physical transformation governed by conservation laws, energetic considerations, molecular interactions, and reaction mechanisms.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-ivory-100 border border-hairline space-y-3">
                <span className="font-formula text-xs font-bold text-burgundy-500 uppercase tracking-widest block">
                  Structural Origin
                </span>
                <h3 className="font-display font-bold text-base text-charcoal-900">
                  Trends as Observable Consequences
                </h3>
                <p className="text-sm text-charcoal-100 leading-relaxed font-sans">
                  Likewise, a periodic trend is not simply a pattern to remember; it is an observable consequence of atomic structure, effective nuclear charge, electron configuration, and the balance of competing physical interactions.
                </p>
              </div>
            </div>

            <p className="font-medium text-charcoal-900">
              My approach is therefore centered on connecting observations to explanations, and explanations to fundamental scientific principles.
            </p>
          </div>
        </section>

        {/* Section 03: My Educational Philosophy */}
        <section className="space-y-8 border-t border-hairline pt-12 sm:pt-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                SECTION 03 • PEDAGOGY
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              My Educational Philosophy
            </h2>

            <p className="text-base text-charcoal-100 leading-relaxed font-sans">
              I approach teaching as an intellectual process: helping students construct a coherent understanding of scientific ideas rather than simply delivering information.
            </p>
            <p className="text-base text-charcoal-100 leading-relaxed font-sans">
              The objective is not to make difficult subjects appear artificially simple, but to make their complexity understandable through careful reasoning, logical progression, and meaningful connections.
            </p>
          </div>

          {/* 5 Core Principles Cards */}
          <div className="space-y-4">
            {educationalPrinciples.map((item) => (
              <div
                key={item.num}
                className="p-6 sm:p-7 rounded-2xl bg-ivory-100 border border-hairline hover:border-burgundy-500/40 transition-colors shadow-quiet"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                  <div className="w-10 h-10 rounded-xl bg-burgundy-500/10 border border-burgundy-500/20 flex items-center justify-center shrink-0">
                    <span className="font-formula text-sm font-bold text-burgundy-500">
                      {item.num}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-charcoal-900">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 04: Areas of Scientific Interest */}
        <section className="space-y-8 border-t border-hairline pt-12 sm:pt-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                SECTION 04 • DISCIPLINES
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              Areas of Scientific Interest
            </h2>

            <p className="text-base text-charcoal-100 leading-relaxed font-sans">
              My interests extend beyond the boundaries of introductory chemistry into the theoretical foundations and broader intellectual landscape of the discipline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scientificAreas.map((area) => {
              const IconComp = area.icon;
              return (
                <div
                  key={area.title}
                  className="p-6 rounded-2xl bg-ivory-100 border border-hairline hover:border-ochre/60 transition-all shadow-quiet flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-ivory-300 flex items-center justify-center text-burgundy-500 border border-hairline">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-base text-charcoal-900">
                      {area.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
                      {area.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs sm:text-sm text-charcoal-100 font-serif italic pt-2">
            These interests reflect an ongoing process of scientific exploration and intellectual development.
          </p>
        </section>

        {/* Section 05: The Purpose Behind PHENOL */}
        <section className="space-y-6 border-t border-hairline pt-12 sm:pt-16">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5" />
              SECTION 05 • INSTITUTIONAL MISSION
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
            The Purpose Behind PHENOL
          </h2>

          <div className="space-y-5 text-base sm:text-lg text-charcoal-100 leading-relaxed font-sans">
            <p>
              PHENOL is an educational platform built around a particular conviction: chemistry deserves to be understood as a connected science, not experienced as a burden of disconnected information.
            </p>
            <p>
              It is intended to provide a structured learning environment where scientific concepts are presented with clarity, where explanations move beyond superficial descriptions, and where students are encouraged to develop the ability to reason independently.
            </p>
            <p>
              The platform brings together educational content, organized learning materials, and digital tools designed to support a more coherent learning experience.
            </p>
            <div className="p-6 sm:p-8 rounded-2xl bg-burgundy-900 text-ivory-100 shadow-lift space-y-3">
              <span className="font-formula text-xs font-bold text-ochre-light uppercase tracking-widest block">
                The Foundational Goal
              </span>
              <p className="font-display font-medium text-lg sm:text-xl leading-relaxed text-ivory-100">
                “Ultimately, I want PHENOL to encourage a different relationship with scientific knowledge—one in which students do not simply ask what they need to remember, but begin to ask what they need to understand.”
              </p>
            </div>
          </div>
        </section>

        {/* Section 06: Beyond the Classroom */}
        <section className="space-y-6 border-t border-hairline pt-12 sm:pt-16">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SECTION 06 • LIFELONG INQUIRY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
            Beyond the Classroom
          </h2>

          <div className="space-y-5 text-base sm:text-lg text-charcoal-100 leading-relaxed font-sans">
            <p>
              Scientific learning does not end when a lecture concludes, nor is genuine understanding confined to the boundaries of a curriculum.
            </p>
            <p>
              It develops through questioning, observation, experimentation, reading, and the willingness to reconsider what one thinks one already knows.
            </p>
            <p>
              I believe that intellectual progress requires curiosity, skepticism, patience, and respect for evidence. A scientific explanation should not be accepted merely because it sounds convincing; it should be examined in light of the principles and evidence that support it.
            </p>
            <p>
              My own journey through chemistry is an ongoing process of learning, questioning, and refining ideas. Teaching is part of that process: explaining a concept demands clarity of thought, while encountering a student’s question often reveals a new way to examine an apparently familiar idea.
            </p>
          </div>
        </section>

        {/* Section 07: A Final Thought & Signature Motto */}
        <section className="border-t border-hairline pt-12 sm:pt-16">
          <div className="p-8 sm:p-12 rounded-3xl bg-ivory-100 border-2 border-ochre/40 shadow-editorial space-y-8 text-center max-w-4xl mx-auto relative overflow-hidden">
            {/* Subtle Watermark Monogram */}
            <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
              <img
                src="/images/phenol-symbol-burgundy.png"
                alt="PHENOL"
                className="w-72 h-72 object-contain"
              />
            </div>

            <div className="space-y-3">
              <span className="font-formula text-xs font-bold text-burgundy-500 uppercase tracking-widest block">
                A FINAL THOUGHT
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-charcoal-900 font-display">
                The Enduring Purpose of Chemistry
              </h2>
            </div>

            <div className="space-y-5 text-base sm:text-lg text-charcoal-900 leading-relaxed font-sans max-w-2xl mx-auto">
              <p>
                I do not believe that the purpose of learning chemistry is simply to know more chemical facts.
              </p>
              <p>
                It is to develop a way of thinking that allows us to interpret the material world, recognize the principles beneath its complexity, and approach unfamiliar problems with reason and intellectual confidence.
              </p>
              <p className="font-serif italic text-lg sm:text-xl text-burgundy-500 pt-2">
                “Because behind every reaction lies a mechanism, behind every pattern lies a principle, and behind every meaningful scientific answer lies a question worth asking.”
              </p>
            </div>

            <div className="pt-6 border-t border-hairline max-w-md mx-auto space-y-2">
              <p className="text-lg sm:text-xl font-extrabold text-charcoal-900 font-display tracking-wide uppercase">
                Understand the principles. Explore the mechanisms. Think scientifically.
              </p>
              <p className="font-editorial text-sm font-bold text-burgundy-500 uppercase tracking-widest">
                — Dr. Omar Magdi
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Call to Action */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-charcoal-900 font-display text-lg sm:text-xl">
              Ready to Study Under Dr. Omar Magdi?
            </h4>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
              Explore our structured academic syllabi and comprehensive chemistry tracks.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/courses"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {currentUser ? (
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border border-hairline text-charcoal-900 font-sans font-bold text-sm transition-all shadow-quiet"
              >
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/register"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border border-hairline text-charcoal-900 font-sans font-bold text-sm transition-all shadow-quiet"
              >
                <span>Join Cohort</span>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
