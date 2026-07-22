import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MacerationBeakerAnimation from "../components/MacerationBeakerAnimation";
import {
  Activity,
  Thermometer,
  RotateCw,
  Sliders,
  LayoutGrid,
  ArrowRight,
  Beaker,
  Award,
  BookOpen,
  Compass,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-[#1A1A1A] font-sans selection:bg-[#D97736]/20 selection:text-[#1A1A1A]">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-8 pb-16 md:pt-12 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E2E0D7]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & Hero Action */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 bg-[#F1F0EA] border border-[#E2E0D7] px-3.5 py-1.5 rounded-full text-xs font-mono text-[#6B6862]">
              <span className="w-2 h-2 rounded-full bg-[#D97736] animate-pulse-live" />
              <span className="font-semibold text-[#1A1A1A]">KILAB 2026</span>
              <span className="text-[#E2E0D7]">|</span>
              <span>Universitas Syiah Kuala (USK)</span>
            </div>

            {/* Main Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1A1A1A] leading-[1.15]">
                Smart Maceration System
              </h1>
              <p className="font-serif text-lg sm:text-xl text-[#D97736] font-medium leading-snug">
                Inovasi Teknologi untuk Proses Maserasi yang Lebih Cerdas dan Terintegrasi
              </p>
            </div>

            {/* Main Description */}
            <p className="text-sm sm:text-base text-[#6B6862] leading-relaxed max-w-2xl">
              Smart Maceration System merupakan inovasi yang dikembangkan untuk mendukung proses maserasi melalui
              pemantauan dan pengendalian yang lebih mudah, terukur, dan terintegrasi. Sistem ini menghubungkan perangkat
              maserasi dengan platform berbasis web, memungkinkan pengguna untuk memantau kondisi dan aktivitas proses
              melalui satu sistem yang sederhana dan mudah digunakan.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="px-6 py-3 bg-[#3A5F43] text-[#F9F8F3] text-sm font-semibold rounded-xs hover:bg-[#2F4E36] transition-colors shadow-xs flex items-center gap-2 group"
              >
                <span>{isAuthenticated ? "Ke Dashboard Telemetri" : "Mulai Monitoring"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => scrollToSection("tentang")}
                className="px-5 py-3 bg-[#F1F0EA] border border-[#E2E0D7] text-[#1A1A1A] text-sm font-medium rounded-xs hover:bg-[#E9E8E1] transition-colors flex items-center gap-2"
              >
                <span>Pelajari Lebih Lanjut</span>
                <ChevronDown className="w-4 h-4 text-[#6B6862]" />
              </button>
            </div>

            {/* Lab Feature Quick Badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#E2E0D7]/70 text-xs font-mono text-[#6B6862]">
              <div>
                <div className="text-[10px] uppercase text-[#6B6862]">Koneksi IoT</div>
                <div className="font-bold text-[#1A1A1A]">MQTT Real-Time</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#6B6862]">Akurasi Sensor</div>
                <div className="font-bold text-[#3A5F43]">±0.1°C &amp; RPM</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#6B6862]">Platform</div>
                <div className="font-bold text-[#D97736]">Web Telemetri</div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Interactive Maceration Beaker Visualizer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <MacerationBeakerAnimation />
          </div>
        </div>
      </section>

      {/* ── 2. TENTANG PROYEK SECTION ────────────────────────────────────────── */}
      <section id="tentang" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E2E0D7]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="lab-card p-6 md:p-8 space-y-6 relative overflow-hidden">
              <div className="w-10 h-10 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="badge-lab bg-[#3A5F43] text-[#F9F8F3]">SEJARAH &amp; LATAR BELAKANG</span>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  Pemberdayaan Digitalisasi Laboratorium
                </h3>
              </div>
              <p className="text-xs text-[#6B6862] leading-relaxed">
                Mengombinasikan metode klasik ekstraksi botani/farmasi dengan arsitektur telemetry web masa kini untuk
                menjamin presisi dan keterulangan (repeatability) ekstraksi.
              </p>
              <div className="p-4 bg-[#F9F8F3] border border-[#E2E0D7] rounded-xs space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B6862]">Kategori:</span>
                  <span className="font-bold">Teknologi Ekstraksi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6862]">Target User:</span>
                  <span className="font-bold">Laboran &amp; Peneliti</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6862]">Lisensi Program:</span>
                  <span className="font-bold text-[#3A5F43]">KILAB USK 2026</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="badge-lab bg-[#E2E0D7] text-[#1A1A1A]">TENTANG PROYEK</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-2">
                Transformasi Proses Maserasi Melalui Teknologi
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-[#6B6862] leading-relaxed">
              <p>
                Proses maserasi membutuhkan pemantauan kondisi yang baik untuk menjaga proses tetap berjalan sesuai
                kebutuhan. Smart Maceration System hadir dengan pendekatan digital untuk membantu pengguna dalam memantau
                dan mengelola proses maserasi secara lebih praktis.
              </p>
              <p>
                Melalui integrasi antara perangkat maserasi dan platform berbasis web, informasi mengenai proses dapat
                diakses dan dipantau dengan lebih mudah. Sistem ini dikembangkan untuk menghadirkan pengalaman pengelolaan
                proses yang lebih modern dan terstruktur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. APA YANG DAPAT DILAKUK (FEATURES) ─────────────────────────────── */}
      <section id="fitur" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E2E0D7]">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="badge-lab bg-[#D97736] text-[#F9F8F3]">KAPABILITAS SISTEM</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Apa yang Dapat Dilakukan?
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6862]">
            Fitur unggulan dirancang khusus untuk memenuhi kebutuhan kontrol dan pemantauan ekstraksi maserasi.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="lab-card p-6 space-y-4 lab-card-hover">
            <div className="w-10 h-10 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Pemantauan Proses
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Memantau kondisi dan aktivitas perangkat selama proses maserasi berlangsung secara kontinu.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="lab-card p-6 space-y-4 lab-card-hover">
            <div className="w-10 h-10 rounded bg-[#C84B31]/10 text-[#C84B31] flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Monitoring Suhu
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Memberikan informasi suhu selama proses berlangsung untuk membantu pengguna mengetahui kondisi proses secara
              lebih terukur.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="lab-card p-6 space-y-4 lab-card-hover">
            <div className="w-10 h-10 rounded bg-[#D97736]/10 text-[#D97736] flex items-center justify-center">
              <RotateCw className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Monitoring Kecepatan
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Memantau kecepatan putaran perangkat sehingga pengguna dapat mengetahui aktivitas pengadukan selama proses maserasi.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="lab-card p-6 space-y-4 lab-card-hover">
            <div className="w-10 h-10 rounded bg-[#3A5F43]/10 text-[#3A5F43] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Kontrol Terintegrasi
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Membantu pengelolaan perangkat melalui sistem yang terintegrasi untuk memberikan pengalaman penggunaan yang lebih praktis.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="lab-card p-6 space-y-4 lab-card-hover md:col-span-2 lg:col-span-2">
            <div className="w-10 h-10 rounded bg-[#1A1A1A]/10 text-[#1A1A1A] flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
              Informasi dalam Satu Platform
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Menyajikan informasi penting mengenai proses maserasi melalui antarmuka web yang sederhana dan mudah dipahami oleh seluruh tim laboratorium.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. OUR INNOVATION ───────────────────────────────────────────────── */}
      <section id="inovasi" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E2E0D7]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="badge-lab bg-[#3A5F43] text-[#F9F8F3]">OUR INNOVATION</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-2">
                Menghubungkan Proses Maserasi dengan Teknologi Digital
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-[#6B6862] leading-relaxed">
              <p>
                Smart Maceration System dikembangkan sebagai upaya untuk membawa proses maserasi menuju pendekatan yang
                lebih modern melalui pemanfaatan teknologi digital.
              </p>
              <p>
                Dengan menghubungkan perangkat fisik dan platform berbasis web, sistem ini memungkinkan proses pemantauan dan
                pengelolaan dilakukan dengan lebih mudah dalam satu ekosistem yang terintegrasi.
              </p>
              <p>
                Inovasi ini diharapkan dapat membantu menciptakan proses maserasi yang lebih praktis, terukur, dan mudah
                dipantau, sekaligus menjadi bagian dari pengembangan solusi berbasis teknologi yang dapat terus dikembangkan di
                masa mendatang.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="lab-card p-6 space-y-5">
              <h4 className="font-serif font-bold text-[#1A1A1A] text-base border-b border-[#E2E0D7] pb-3">
                Keunggulan Inovasi Digital
              </h4>

              <ul className="space-y-3.5 text-xs text-[#6B6862]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5F43] shrink-0 mt-0.5" />
                  <span><strong>Efisiensi Pemantauan:</strong> Mengurangi kebutuhan inspeksi manual berulang di lokasi instrumen.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5F43] shrink-0 mt-0.5" />
                  <span><strong>Keterukuran Data:</strong> Pencatatan telemetri yang konsisten untuk analisis proses ekstraksi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5F43] shrink-0 mt-0.5" />
                  <span><strong>Ekosistem Terbuka:</strong> Dapat dikembangkan secara berkelanjutan untuk berbagai tipe ekstraktor.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. KARYA INOVASI LABORAN 2026 ───────────────────────────────────── */}
      <section id="kilab" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E2E0D7]">
        <div className="bg-[#F1F0EA] border border-[#E2E0D7] rounded-sm p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E0D7] pb-8">
            <div className="space-y-2">
              <span className="badge-lab bg-[#D97736] text-[#F9F8F3]">PROGRAM HILIRISASI &amp; INOVASI</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                Dari Inovasi Laboratorium Menuju Solusi Digital
              </h2>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded bg-[#3A5F43] text-[#F9F8F3] flex items-center justify-center font-serif font-bold text-xl">
                USK
              </div>
              <div className="w-12 h-12 rounded bg-[#D97736] text-[#F9F8F3] flex items-center justify-center font-mono font-bold text-sm">
                KILAB
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-sm text-[#6B6862] leading-relaxed">
            <div className="lg:col-span-6 space-y-4">
              <p>
                Smart Maceration System merupakan proyek inovasi yang dikembangkan oleh tim dari{" "}
                <strong className="text-[#1A1A1A]">Universitas Syiah Kuala (USK)</strong> melalui pendanaan program{" "}
                <strong className="text-[#D97736]">Karya Inovasi Laboran (KILAB) 2026</strong>.
              </p>
              <p>
                Melalui program ini, pengembangan inovasi di lingkungan laboratorium didorong untuk menghasilkan karya yang
                dapat memberikan manfaat nyata serta mendukung peningkatan kualitas dan efektivitas kegiatan laboratorium.
              </p>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <p>
                Smart Maceration System menjadi salah satu bentuk implementasi inovasi tersebut dengan mengintegrasikan
                proses maserasi dan teknologi digital dalam sebuah sistem yang lebih modern dan mudah digunakan.
              </p>
              <div className="p-4 bg-[#F9F8F3] border border-[#E2E0D7] rounded-xs font-mono text-xs text-[#1A1A1A] space-y-1">
                <div className="font-bold text-[#3A5F43]">UNIVERSITAS SYIAH KUALA</div>
                <div className="text-[11px] text-[#6B6862]">Program Karya Inovasi Laboran (KILAB) Tahun 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. OUR VISION ───────────────────────────────────────────────────── */}
      <section id="visi" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-b border-[#E2E0D7]">
        <div className="space-y-6">
          <span className="badge-lab bg-[#3A5F43] text-[#F9F8F3]">OUR VISION</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Visi Laboratorium Masa Depan
          </h2>
          <blockquote className="font-serif text-lg sm:text-xl md:text-2xl text-[#1A1A1A] italic leading-relaxed max-w-3xl mx-auto px-4">
            "Kami percaya bahwa pemanfaatan teknologi dapat membuka peluang untuk meningkatkan kualitas, efisiensi, dan
            kemudahan dalam berbagai proses di lingkungan laboratorium. Melalui Smart Maceration System, kami berupaya
            menghadirkan inovasi yang tidak hanya mempermudah proses pemantauan dan pengelolaan maserasi, tetapi juga menjadi
            langkah menuju pengembangan laboratorium yang lebih modern dan terintegrasi."
          </blockquote>
          <div className="font-mono text-xs text-[#6B6862]">
            — Tim Pengembang Smart Maceration System (KILAB 2026)
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER BANNER & CREDITS ──────────────────────────────────────── */}
      <footer className="bg-[#F1F0EA] pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E2E0D7] pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#3A5F43] flex items-center justify-center text-[#F9F8F3]">
                  <Beaker className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                  Smart Maceration System
                </h3>
              </div>
              <p className="font-serif text-sm text-[#D97736] italic font-medium">
                Smarter Process. Better Monitoring.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-medium">
              <Link to={isAuthenticated ? "/dashboard" : "/login"} className="px-4 py-2 bg-[#3A5F43] text-[#F9F8F3] rounded-xs hover:bg-[#2F4E36] transition-colors">
                {isAuthenticated ? "Dashboard" : "Masuk Sistem"}
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#6B6862]">
            <div>
              <p className="font-semibold text-[#1A1A1A]">Developed by Universitas Syiah Kuala (USK)</p>
              <p>Supported by Karya Inovasi Laboran (KILAB) 2026</p>
            </div>

            <div className="text-right">
              <p>© 2026 Smart Maceration System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
