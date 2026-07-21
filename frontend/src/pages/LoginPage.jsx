import React from "react";

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto my-12 lab-card p-6 shadow-sm">
      <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">Masuk Akun</h2>
      <p className="text-xs text-[#6B6862] mb-6">
        Masukkkan kredensial Anda untuk mengakses dashboard Maceration Controller.
      </p>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
            Alamat Email
          </label>
          <input
            type="email"
            placeholder="admin@example.com"
            className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
            Kata Sandi
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full text-xs px-3 py-2 bg-[#F9F8F3] border border-[#E2E0D7] rounded focus:outline-none focus:border-[#3A5F43]"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-[#3A5F43] text-[#F9F8F3] text-xs font-semibold rounded hover:bg-[#2F4E36] transition-colors"
        >
          Masuk ke Dashboard
        </button>
      </form>
    </div>
  );
}
