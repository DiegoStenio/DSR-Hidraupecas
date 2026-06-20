"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ana.silva@dsrhidraupecas.com.br");
  const [pass, setPass] = useState("••••••••••");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/"), 700);
  };

  return (
    <div
      className="min-h-screen w-full grid place-items-center px-4"
      style={{
        background:
          "radial-gradient(1100px 600px at 85% 10%, #14315c 0%, #0b1f3a 55%, #07101f 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#c9a227] text-[#0b1f3a] font-display text-lg font-bold">
              D
            </div>
            <span className="font-display text-2xl font-semibold text-white tracking-tight">
              DSR-Hidraupecas
            </span>
          </div>
          <p className="text-sm text-white/60">Painel interno · acesso restrito à equipe</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/30 dark:bg-[#131826]">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white">Entrar</h1>
            <p className="mt-1 text-sm text-[#5b6472] dark:text-white/60">
              Use suas credenciais corporativas.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-[#5b6472]">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e5e8ec] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 dark:bg-[#0b0f19] dark:border-[#212838] dark:text-white"
                placeholder="seu.email@dsrhidraupecas.com.br"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider text-[#5b6472]">
                  Senha
                </label>
                <a href="#" className="text-xs font-medium text-[#0b1f3a] hover:text-[#c9a227] transition-colors dark:text-white/80">
                  Esqueci minha senha
                </a>
              </div>
              <div className="mt-1.5 relative">
                <input
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e8ec] bg-white px-3.5 py-2.5 pr-11 text-sm text-[#0f172a] outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 dark:bg-[#0b0f19] dark:border-[#212838] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-md text-[#5b6472] hover:bg-[#f1f3f7]"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0b1f3a] text-white font-medium py-2.5 transition-colors hover:bg-[#14315c] disabled:opacity-70 relative overflow-hidden group"
            >
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#c9a227]" />
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          © 2026 DSR-Hidraupecas · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
