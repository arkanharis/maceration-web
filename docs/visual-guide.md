### Revised Design System Prompt (English)

```markdown
# Visual Identity & Brand Guidelines: Real-Time Maceration Dashboard

This document defines the visual identity, brand aesthetics, and design philosophy for a real-time data web interface monitoring a pharmaceutical maceration machine. 

---

## 1. Core Concept & Design Philosophy

* **Concept:** *Modern Digital Apothecary / Scientific Botanical Lab*
* **Tone & Mood:** Minimalist, precise, scholarly, and authentic. 
* **Design Intent:** Avoid generic "black/neon cyberpunk" dashboards or cold, corporate "blue SaaS" templates. The goal is to blend high-precision scientific telemetry with the warm, organic aesthetic of botanical extraction and natural medicine.

---

## 2. Color Palette & Visual Tokens

Do NOT use pure white (`#FFFFFF`) or pure black (`#000000`). Prefer warm off-whites, muted graphite, and organic earth accents to evoke a laboratory log sheet or physical equipment.

### Core Palette
* **Primary Background (`#F9F8F3` - Parchment / Warm Off-White):** Main page canvas. Evokes natural paper and lab notes.
* **Surface Background (`#F1F0EA` - Warm Light Gray):** Background for containers, cards, and side panels.
* **Primary Text & Borders (`#1A1A1A` - Deep Charcoal):** Primary typography, sharp borders, and line-art elements.
* **Secondary Text (`#6B6862` - Muted Umber):** Labels, secondary metadata, unit labels, and timestamps.
* **Subtle Border (`#E2E0D7` - Warm Gray):** Minimalist divider lines and container borders.

### Accent & Status Palette
* **Active / Stirring Accent (`#D97736` - Warm Amber Gold):** Highlights active processes, stirring status, live data signals, and key metrics.
* **Stable / Safe Accent (`#3A5F43` - Botanical Sage Green):** Highlights normal operating conditions, ready states, or successful telemetry logs.
* **Alert / Warning Accent (`#C84B31` - Deep Terracotta / Ochre):** Out-of-bound temperature warnings or system alerts.

---

## 3. Typography System

Combine three distinct font styles to create high contrast and a custom, non-generic personality:

1. **Serif (Headings & Titles):**
   * *Font Options:* `Lora`, `Fraunces`, or `Playfair Display`
   * *Role:* Gives an academic, premium, and sophisticated botanical identity to primary titles and section headers.
2. **Sans-Serif (UI Labels & Navigation):**
   * *Font Options:* `Plus Jakarta Sans` or `DM Sans`
   * *Role:* Clean, high-legibility interface labels, form controls, and body copy.
3. **Monospace (Real-Time Telemetry & Data):**
   * *Font Options:* `JetBrains Mono`, `Space Mono`, or `IBM Plex Mono`
   * *Role:* Numerical data, sensor readings (RPM, °C, time logs), and technical status indicators to reflect scientific instrumentation.

---

## 4. UI Details & Micro-Interactions

* **Borders & Corners:** Use thin (1px) crisp borders. Avoid large, rounded pill shapes; keep border radii sharp or subtle (0px to 4px) to mimic physical scientific apparatus.
* **Visualizer Elements:** Incorporate clean 1.5px line-art sketches or dynamic line illustrations representing the beaker, stirring rod, or fluid movement.
* **Micro-Interactions:** Use soft pulse animations for live status indicators and subtle vertical transitions when real-time numbers update via WebSocket.

---

```