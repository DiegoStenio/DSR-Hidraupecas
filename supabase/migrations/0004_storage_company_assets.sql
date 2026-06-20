-- Bucket "company-assets" (criado via Storage API, nao via SQL) guarda logo,
-- imagem de fundo e QR code Pix configurados em Configuracoes > Empresa/Pagamento.
-- Policies de acesso ao bucket:

create policy "authenticated upload company-assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'company-assets');

create policy "authenticated update company-assets" on storage.objects
  for update to authenticated using (bucket_id = 'company-assets');

create policy "public read company-assets" on storage.objects
  for select to public using (bucket_id = 'company-assets');
