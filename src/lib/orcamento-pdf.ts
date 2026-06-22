import type { SupabaseClient } from "@supabase/supabase-js";

export async function gerarOrcamentoPdfBlob(element: HTMLElement): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;
  return html2pdf()
    .from(element)
    .set({
      margin: 0,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .outputPdf("blob");
}

export async function uploadOrcamentoPdf(
  supabase: SupabaseClient,
  numero: string,
  blob: Blob,
): Promise<string> {
  const path = `orcamentos-pdf/${numero}.pdf`;
  const { error } = await supabase.storage
    .from("company-assets")
    .upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("company-assets").getPublicUrl(path);
  return data.publicUrl;
}

export function abrirWhatsapp(telefone: string, mensagem: string) {
  const numero = telefone.replace(/\D/g, "");
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
}
