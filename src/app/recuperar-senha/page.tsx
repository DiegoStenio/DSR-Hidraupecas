"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail", { description: error.message });
      return;
    }
    setEnviado(true);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <picture>
        <source media="(min-width: 768px)" srcSet="/login-bg-desktop.jpg" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-bg-mobile.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      </picture>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 600px at 85% 10%, rgba(20,49,92,0.88) 0%, rgba(11,31,58,0.92) 55%, rgba(7,16,31,0.96) 100%)",
        }}
      />

      <div className="relative z-10 grid min-h-screen w-full place-items-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dsr-dark.png" alt="DSR-Hidraupeças" className="h-10 w-10 object-contain" />
              <span className="font-display text-2xl font-semibold text-white tracking-tight">
                DSR-Hidraupecas
              </span>
            </div>
            <p className="text-sm text-white/60">Painel interno · acesso restrito à equipe</p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/30 dark:bg-[#131826]">
            {enviado ? (
              <div className="text-center space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10">
                  <MailCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white">E-mail enviado</h1>
                <p className="text-sm text-[#5b6472] dark:text-white/60">
                  Se houver uma conta com o e-mail <strong>{email}</strong>, enviamos um link pra redefinir a senha. Confira sua caixa de entrada (e o spam).
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white">Recuperar senha</h1>
                  <p className="mt-1 text-sm text-[#5b6472] dark:text-white/60">
                    Informe seu e-mail corporativo e enviaremos um link pra você redefinir a senha.
                  </p>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[#5b6472]">
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#e5e8ec] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 dark:bg-[#0b0f19] dark:border-[#212838] dark:text-white"
                      placeholder="seu.email@dsrhidraupecas.com.br"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#0b1f3a] text-white font-medium py-2.5 transition-colors hover:bg-[#14315c] disabled:opacity-70 relative overflow-hidden"
                  >
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#c9a227]" />
                    {loading ? "Enviando…" : "Enviar link de recuperação"}
                  </button>
                </form>
              </>
            )}

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-[#0b1f3a] hover:text-[#c9a227] transition-colors dark:text-white/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
