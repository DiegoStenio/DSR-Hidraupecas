export type PontoRota = { id: string; lat: number; lng: number };

function distanciaKm(a: PontoRota, b: PontoRota) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Ordena os pontos por vizinho-mais-próximo, testando cada ponto como
 * partida e ficando com a rota de menor distância total. Custo O(n^3),
 * aceitável só porque isso roda pra no máximo ~10-15 paradas por vez.
 */
export function ordenarRota(pontos: PontoRota[]): PontoRota[] {
  if (pontos.length <= 2) return pontos;

  let melhorOrdem = pontos;
  let melhorDistancia = Infinity;

  for (let inicio = 0; inicio < pontos.length; inicio++) {
    const restantes = pontos.filter((_, i) => i !== inicio);
    const ordem = [pontos[inicio]];
    let atual = pontos[inicio];
    let total = 0;

    while (restantes.length > 0) {
      let idxMaisProximo = 0;
      let distMin = Infinity;
      restantes.forEach((p, i) => {
        const d = distanciaKm(atual, p);
        if (d < distMin) { distMin = d; idxMaisProximo = i; }
      });
      total += distMin;
      atual = restantes[idxMaisProximo];
      ordem.push(atual);
      restantes.splice(idxMaisProximo, 1);
    }

    if (total < melhorDistancia) {
      melhorDistancia = total;
      melhorOrdem = ordem;
    }
  }

  return melhorOrdem;
}

export function gerarUrlGoogleMaps(pontos: PontoRota[]): string {
  const coords = pontos.map((p) => `${p.lat},${p.lng}`);
  const params = new URLSearchParams({
    api: "1",
    origin: coords[0],
    destination: coords[coords.length - 1],
    travelmode: "driving",
  });
  const waypoints = coords.slice(1, -1);
  if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
