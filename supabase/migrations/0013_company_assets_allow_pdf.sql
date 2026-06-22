-- O bucket "company-assets" so aceitava imagens (logo, qrcode pix, avatar).
-- Agora tambem guarda o PDF do orcamento gerado para envio por WhatsApp
-- (pasta orcamentos-pdf/), entao precisa aceitar application/pdf.

update storage.buckets
set
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf'],
  file_size_limit = 10485760
where id = 'company-assets';
