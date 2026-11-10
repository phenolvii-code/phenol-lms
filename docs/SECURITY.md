# PHENOL ACADEMY LMS — Security Architecture & Threat Model

**Document Version:** 1.0.0  
**Last Updated:** November 2026  
**Status:** Active Production Reference

---

## 1. Threat Model & Asset Protection

PHENOL LMS is an academic learning management platform designed to deliver proprietary chemistry lectures taught by Dr. Omar Magdi.

### 1.1 Protected Assets
- **Video Lecture Media URLs:** Delivered exclusively through the `get_lesson_media(p_lesson_id)` Postgres RPC after server-side verification of active enrollment. Column-level permissions on `lessons` revoke direct `SELECT` access from the `authenticated` and `anon` roles.
- **Student Privacy & Telemetry:** Student profiles, phone numbers, and academic performance are isolated via Row-Level Security (RLS). Students cannot view rosters or peers' data.
- **Session Integrity:** Single active session enforcement preventing multi-user account sharing.

---

## 2. Watermarking, Tamper Guards & Client Heuristics

### 2.1 Dynamic Forensic Watermark
- **Content:** Student full name, permanent academic code (e.g. `PH-XXXX`), and masked phone number (last 4 digits).
- **Positioning:** Dynamically shifts across five pseudo-random viewport coordinates every 10 seconds to deter cropping and static masking in recording software.
- **Tamper Guard (`MutationObserver`):** A client-side observer watches the watermark DOM element. If an adversary attempts to hide (`display: none`, `visibility: hidden`, `opacity < 0.2`) or remove the element or its parent, video playback is immediately halted.

### 2.2 Client-Side Protections & Transparent Limitations
- **Click-Jacking / Pointer Shields:** Transparent overlays covering YouTube controls prevent accidental navigation away from the LMS. However, these are cosmetic UI barriers; any network inspector can view iframe traffic. Therefore, attribution (forensic watermarking) is the fundamental defense against intellectual property leaks, not client-side obfuscation.
- **DevTools Window Resizing Heuristic (Removed):** Previous iterations attempted to detect DevTools by monitoring `window.outerWidth - window.innerWidth > 175`. This heuristic has been **removed** because:
  1. It produced false positives for legitimate students using vertical tabs, browser sidebars (Chrome Side Panel, Edge Sidebar), split-screen views, or OS scaling.
  2. It failed to detect undocked DevTools.
  3. Real defense relies on server-side authorization and persistent watermarking.

---

## 3. Session Management & Enforcement

- **Database RPCs:** `register_session(device_id, ip_address)` and `check_session(device_id)`.
- **Policy:** One concurrent active session per student. When a student signs in on a new device, previous device tokens are evicted.
- **Heartbeat:** Handled via `useSessionEnforcer()`.

---

## 4. Supabase Project Keepalive Automation

To prevent Supabase projects on the free tier from being paused due to inactivity:
- A GitHub Actions workflow is provisioned at `.github/workflows/keepalive.yml`.
- **Schedule:** Runs every 3 days at 04:00 UTC.
- **Security:** Requires repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY`. No secrets are committed into version control.

---

## 5. Audit Review & Dependency Advisories (Next.js 14)

Static audit (`npm audit --omit=dev`) notes vulnerabilities related to Next.js 14 and PostCSS. An upgrade to Next.js 15/16 represents a major breaking change outside project scope.

### Applicability Analysis:
1. **SSRF via Rewrites (CVE-2024-34351 / GHSA-673w-99p7-7435):**
   - *Status:* **Not Applicable.** The application contains no custom rewrites in `next.config.mjs`.
2. **Image Optimization RCE / DoS (GHSA-7gfc-2v6g-6w9v):**
   - *Status:* **Not Applicable.** Next.js image optimization is not used. User avatars utilize CSS/SVG initials components (`<Initials />`), and course images use direct links.
3. **Windows-Hosted RCE (GHSA-953w-w76j-48hh):**
   - *Status:* **Not Applicable.** Target production hosting is Linux-based (Vercel Serverless / Edge Runtime).
4. **Server Actions DoS:**
   - *Status:* **Not Applicable.** PHENOL LMS does not define `"use server"` Server Actions; all data mutations route via Supabase client SDK and RPCs.
5. **PostCSS Advisory:**
   - *Status:* Build-time tool vulnerability; does not affect production runtime.

**Conclusion:** Staying on Next.js 14.2.35 LTS maintains zero runtime exposure under current architecture. Revisit when upgrading major dependencies during scheduled architectural overhauls.
