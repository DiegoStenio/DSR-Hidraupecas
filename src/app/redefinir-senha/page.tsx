"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [checando, setChecando] = useState(true);
  const [linkValido, setLinkValido] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkValido(true);
        setChecando(false);
      }
    });

    // Se o evento PASSWORD_RECOVERY já disparou antes deste efeito montar,
    // uma sessão válida na URL ainda assim aparece aqui.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setLinkValido(true); }
      setChecando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("Senha muito curta", { description: "Use pelo menos 6 caracteres." });
      return;
    }
    if (senha !== confirmar) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível redefinir a senha", { description: error.message });
      return;
    }
    toast.success("Senha redefinida com sucesso");
    router.push("/");
    router.refresh();
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
            {checando ? (
              <p className="text-sm text-center text-[#5b6472] dark:text-white/60">Verificando link…</p>
            ) : !linkValido ? (
              <div className="text-center space-y-2">
                <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white">Link inválido ou expirado</h1>
                <p className="text-sm text-[#5b6472] dark:text-white/60">
                  Solicite um novo link em &quot;Esqueci minha senha&quot; na tela de login.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white">Definir nova senha</h1>
                  <p className="mt-1 text-sm text-[#5b6472] dark:text-white/60">
                    Escolha uma senha nova para sua conta.
                  </p>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[#5b6472]">
                      Nova senha
                    </label>
                    <div className="mt-1.5 relative">
                      <input
                        type={show ? "text" : "password"}
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
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
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-[#5b6472]">
                      Confirmar senha
                    </label>
                    <input
                      type={show ? "text" : "password"}
                      required
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#e5e8ec] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20 dark:bg-[#0b0f19] dark:border-[#212838] dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#0b1f3a] text-white font-medium py-2.5 transition-colors hover:bg-[#14315c] disabled:opacity-70 relative overflow-hidden"
                  >
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#c9a227]" />
                    {loading ? "Salvando…" : "Salvar nova senha"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
