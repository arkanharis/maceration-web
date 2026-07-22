import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Gauge, Thermometer, Sparkles } from "lucide-react";

/**
 * MacerationBeakerAnimation Component
 *
 * Renders a side-top perspective (3D-ish isometric view) of a laboratory beaker
 * filled with botanical extraction solvent. Features dynamic vortex liquid animation,
 * rotating magnetic stir bar, floating plant extract particles, and interactive RPM controls.
 */
export default function MacerationBeakerAnimation() {
  const canvasRef = useRef(null);
  const [rpm, setRpm] = useState(650);
  const [isStirring, setIsStirring] = useState(true);
  const [temp, setTemp] = useState(38.5);

  const stateRef = useRef({
    rpm,
    isStirring,
    rotationAngle: 0,
    particles: [],
    bubbles: [],
  });

  // Keep ref updated for requestAnimationFrame loop
  useEffect(() => {
    stateRef.current.rpm = rpm;
    stateRef.current.isStirring = isStirring;
  }, [rpm, isStirring]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Initialize particles (botanical extract bits)
    const particleCount = 45;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 15 + Math.random() * 85, // distance from center
        yOffset: 40 + Math.random() * 140, // depth inside beaker
        size: 1.5 + Math.random() * 3,
        speedFactor: 0.7 + Math.random() * 0.6,
        color: Math.random() > 0.4 ? "#D97736" : "#3A5F43", // Amber extract or botanical green
        alpha: 0.4 + Math.random() * 0.5,
      });
    }
    stateRef.current.particles = particles;

    // Initialize bubbles
    const bubbleCount = 20;
    const bubbles = [];
    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: (Math.random() - 0.5) * 140,
        y: 170 + Math.random() * 20,
        r: 1 + Math.random() * 2.5,
        speed: 0.4 + Math.random() * 0.8,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }
    stateRef.current.bubbles = bubbles;

    let animId;

    const render = () => {
      const { rpm: currentRpm, isStirring: stirring, particles, bubbles } = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = 90; // Top rim center y

      ctx.clearRect(0, 0, width, height);

      // Speed calculation
      const speedRps = stirring ? (currentRpm / 60) * 0.05 : 0.005;
      stateRef.current.rotationAngle += speedRps;
      const angleOffset = stateRef.current.rotationAngle;

      // Beaker Dimensions (Side-Top Isometric POV)
      const rx = 105; // horizontal radius of beaker top/bottom
      const ry = 32;  // vertical radius of perspective ellipse (tilt)
      const beakerHeight = 180;
      const liquidLevelY = centerY + 30; // Liquid surface y
      const bottomY = centerY + beakerHeight;

      // ── 1. Draw Beaker Back Wall & Bottom Shadow ─────────────────────────────
      // Shadow under beaker
      ctx.beginPath();
      ctx.ellipse(centerX, bottomY + 15, rx + 10, ry + 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(26, 26, 26, 0.06)";
      ctx.fill();

      // Outer glass shadow / backlight
      ctx.beginPath();
      ctx.ellipse(centerX, bottomY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(241, 240, 234, 0.8)";
      ctx.fill();

      // ── 2. Draw Liquid Body (Inside Container) ──────────────────────────────
      const liquidBottomY = bottomY - 10;
      const liquidTopY = liquidLevelY;
      const liquidH = liquidBottomY - liquidTopY;

      // Liquid back fill gradient (Warm Amber Botanical Solvent)
      const liquidGrad = ctx.createLinearGradient(centerX - rx, liquidTopY, centerX + rx, liquidBottomY);
      liquidGrad.addColorStop(0, "rgba(217, 119, 54, 0.75)"); // Warm Amber Gold
      liquidGrad.addColorStop(0.5, "rgba(180, 95, 35, 0.85)"); // Rich Solvent
      liquidGrad.addColorStop(1, "rgba(58, 95, 67, 0.8)"); // Sage botanical hue

      ctx.save();
      // Path of liquid cylinder
      ctx.beginPath();
      ctx.ellipse(centerX, liquidTopY, rx - 3, ry - 1, 0, Math.PI, Math.PI * 2, true); // top curve back
      ctx.lineTo(centerX + rx - 3, liquidBottomY);
      ctx.ellipse(centerX, liquidBottomY, rx - 3, ry - 1, 0, 0, Math.PI, false); // bottom curve front
      ctx.lineTo(centerX - rx + 3, liquidTopY);
      ctx.closePath();
      ctx.fillStyle = liquidGrad;
      ctx.fill();
      ctx.restore();

      // ── 3. Draw Rotating Stirrer Magnet at Bottom ─────────────────────────
      const barY = liquidBottomY - 12;
      const barLength = 55;
      const barAngle = angleOffset * 3;
      const barX1 = centerX + Math.cos(barAngle) * (barLength / 2);
      const barZ1 = Math.sin(barAngle) * (ry * 0.5);
      const barX2 = centerX - Math.cos(barAngle) * (barLength / 2);
      const barZ2 = -Math.sin(barAngle) * (ry * 0.5);

      ctx.beginPath();
      ctx.moveTo(barX1, barY + barZ1);
      ctx.lineTo(barX2, barY + barZ2);
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.strokeStyle = stirring ? "#1A1A1A" : "#6B6862";
      ctx.stroke();

      // Stirrer center highlight
      ctx.beginPath();
      ctx.arc(centerX, barY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#F9F8F3";
      ctx.fill();

      // ── 4. Swirling Botanical Particles & Bubbles (3D Depth Sorted) ────────
      // Update and draw rising bubbles
      bubbles.forEach((b) => {
        if (stirring) {
          b.y -= b.speed * (currentRpm / 400);
          b.x += Math.sin(angleOffset * 4 + b.y * 0.05) * 0.8;
          if (b.y < liquidTopY + 15) {
            b.y = liquidBottomY - 5;
            b.x = (Math.random() - 0.5) * (rx * 1.4);
          }
        }
        ctx.beginPath();
        ctx.arc(centerX + b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 248, 243, ${b.alpha})`;
        ctx.fill();
      });

      // Update & sort particles by Z-index (sine of angle)
      particles.forEach((p) => {
        if (stirring) {
          // Vortex effect: particles closer to center rotate faster
          const normDist = p.radius / rx;
          const vortexSpin = (1.2 - normDist) * speedRps * p.speedFactor * 2.5;
          p.angle += vortexSpin;
        }

        p.currX = centerX + Math.cos(p.angle) * (p.radius * 0.9);
        // Elliptical perspective y offset
        p.currZ = Math.sin(p.angle); // -1 back, +1 front
        p.currY = liquidTopY + p.yOffset + p.currZ * (ry * 0.35);

        // Vortex pull downwards in center
        const centerDist = p.radius / rx;
        p.vortexDip = stirring ? (1 - centerDist) * 18 * Math.sin(angleOffset * 2) : 0;
      });

      // Sort back-to-front
      particles.sort((a, b) => a.currZ - b.currZ);

      particles.forEach((p) => {
        const finalY = p.currY + p.vortexDip;
        if (finalY > liquidTopY + 5 && finalY < liquidBottomY - 5) {
          ctx.beginPath();
          const pSize = p.size * (0.8 + (p.currZ + 1) * 0.3); // larger when in front
          ctx.arc(p.currX, finalY, pSize, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.currZ < 0 ? p.alpha * 0.5 : p.alpha; // dimmer in back
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      // ── 5. Liquid Top Surface & Vortex Cone ────────────────────────────────
      // Surface meniscus ellipse
      ctx.beginPath();
      ctx.ellipse(centerX, liquidTopY, rx - 3, ry - 1, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(217, 119, 54, 0.4)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 248, 235, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Swirling Vortex Center Dip (if stirring)
      if (stirring && currentRpm > 100) {
        const vortexDepth = Math.min(45, (currentRpm / 1200) * 45);
        ctx.beginPath();
        ctx.ellipse(centerX, liquidTopY + vortexDepth * 0.5, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 95, 35, 0.6)";
        ctx.fill();
        ctx.strokeStyle = "rgba(217, 119, 54, 0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Swirl spiral line art
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.2) {
          const r = (a / (Math.PI * 4)) * (rx * 0.5);
          const sx = centerX + Math.cos(a + angleOffset * 4) * r;
          const sy = liquidTopY + Math.sin(a + angleOffset * 4) * (r * (ry / rx)) + (r / (rx * 0.5)) * (vortexDepth * 0.4);
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = "rgba(249, 248, 243, 0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── 6. Beaker Glass Outline & Measurement Markings (Front Layer) ────────
      // Beaker Top Rim Ellipse
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(249, 248, 243, 0.15)";
      ctx.fill();

      // Spout lip notch at top left
      ctx.beginPath();
      ctx.moveTo(centerX - rx + 2, centerY - 2);
      ctx.quadraticCurveTo(centerX - rx - 12, centerY - 10, centerX - rx + 15, centerY - 14);
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glass Side Walls
      ctx.beginPath();
      ctx.moveTo(centerX - rx, centerY);
      ctx.lineTo(centerX - rx, bottomY);
      ctx.ellipse(centerX, bottomY, rx, ry, 0, Math.PI, 0, true); // bottom front curve
      ctx.lineTo(centerX + rx, centerY);
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Glass Double Highlight (Reflection Reflection Strip)
      ctx.beginPath();
      ctx.moveTo(centerX - rx + 8, centerY + 15);
      ctx.lineTo(centerX - rx + 8, bottomY - 15);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + rx - 10, centerY + 20);
      ctx.lineTo(centerX + rx - 10, bottomY - 20);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Scientific Measurement Tick Marks (100ml to 1000ml)
      const ticks = [
        { label: "1000 ml", y: centerY + 30 },
        { label: "750 ml", y: centerY + 65 },
        { label: "500 ml", y: centerY + 100 },
        { label: "250 ml", y: centerY + 135 },
      ];

      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#6B6862";
      ctx.strokeStyle = "#6B6862";
      ctx.lineWidth = 1;

      ticks.forEach((tick) => {
        // Ticks on left wall
        const tickX = centerX - rx + 4;
        ctx.beginPath();
        ctx.moveTo(tickX, tick.y);
        ctx.lineTo(tickX + 14, tick.y);
        ctx.stroke();

        ctx.fillText(tick.label, tickX + 18, tick.y + 3);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Temperature mild fluctuation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTemp((prev) => +(prev + (Math.random() * 0.2 - 0.1)).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Visual Header Badge */}
      <div className="flex items-center gap-2 mb-2 bg-[#F1F0EA] border border-[#E2E0D7] px-3 py-1 rounded-full text-xs font-mono text-[#6B6862] shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-[#D97736] animate-spin" style={{ animationDuration: "8s" }} />
        <span>SIMULASI MASERASI AKTIF</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#3A5F43] animate-pulse-live" />
      </div>

      {/* Main Canvas Container with Botanical Lab Styling */}
      <div className="relative w-full aspect-square max-w-[380px] sm:max-w-[420px] bg-[#F1F0EA]/60 border border-[#E2E0D7] rounded-sm p-4 shadow-sm flex items-center justify-center overflow-hidden">
        {/* Background Subtle Lab Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1A1A1A 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />

        {/* Dynamic Canvas */}
        <canvas
          ref={canvasRef}
          width={360}
          height={320}
          className="relative z-10 drop-shadow-md cursor-pointer"
          title="Klik kontrol di bawah untuk mengatur kecepatan aduk"
        />

        {/* Live Floating Telemetry Pills */}
        <div className="absolute top-4 left-4 bg-[#F9F8F3]/90 backdrop-blur-xs border border-[#E2E0D7] px-2.5 py-1.5 rounded-xs text-[11px] font-mono text-[#1A1A1A] flex items-center gap-1.5 shadow-xs z-20">
          <Gauge className="w-3.5 h-3.5 text-[#D97736]" />
          <span>{isStirring ? `${rpm} RPM` : "OFF"}</span>
        </div>

        <div className="absolute top-4 right-4 bg-[#F9F8F3]/90 backdrop-blur-xs border border-[#E2E0D7] px-2.5 py-1.5 rounded-xs text-[11px] font-mono text-[#1A1A1A] flex items-center gap-1.5 shadow-xs z-20">
          <Thermometer className="w-3.5 h-3.5 text-[#3A5F43]" />
          <span>{temp} °C</span>
        </div>

        <div className="absolute bottom-3 left-4 right-4 bg-[#F9F8F3]/90 backdrop-blur-xs border border-[#E2E0D7] px-3 py-1.5 rounded-xs text-[10px] font-mono text-[#6B6862] flex items-center justify-between z-20">
          <span>PELARUT: ETHANOL 70%</span>
          <span className="text-[#3A5F43] font-bold">EKSTRAKSI AKTIF</span>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="w-full max-w-[380px] sm:max-w-[420px] mt-3 bg-[#F1F0EA] border border-[#E2E0D7] p-3 rounded-sm flex items-center justify-between gap-3 text-xs">
        <button
          onClick={() => setIsStirring(!isStirring)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono font-semibold transition-colors ${
            isStirring
              ? "bg-[#3A5F43] text-[#F9F8F3] hover:bg-[#2F4E36]"
              : "bg-[#D97736] text-[#F9F8F3] hover:bg-[#b85f24]"
          }`}
        >
          {isStirring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isStirring ? "PAUSE STIR" : "START STIR"}</span>
        </button>

        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <span className="font-mono text-[10px] text-[#6B6862]">RPM:</span>
          <input
            type="range"
            min="200"
            max="1200"
            step="50"
            value={rpm}
            disabled={!isStirring}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="w-full accent-[#D97736] cursor-pointer disabled:opacity-40"
          />
          <span className="font-mono text-[11px] font-bold w-12 text-right">{rpm}</span>
        </div>
      </div>
    </div>
  );
}
