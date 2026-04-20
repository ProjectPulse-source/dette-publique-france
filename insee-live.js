/**
 * insee-live.js — Module de chargement temps réel des données de dette publique
 * depuis l'API INSEE BDM (Banque de Données Macro-économiques).
 *
 * Auteur : Stéphane Lalut — projet « Dette Publique : Qui paie vraiment ? »
 * Licence : AGPL-3.0 (compatible avec le repo)
 *
 * Principe : une seule requête HTTP retourne 8 séries trimestrielles APU.
 * - Pas d'authentification (API publique INSEE).
 * - CORS validé pour https://projectpulse-source.github.io
 * - Cache localStorage 1 h pour ne pas marteler l'API.
 * - Fallback automatique sur Data/dette_data.json en cas d'échec.
 *
 * Usage :
 *   <script src="insee-live.js"></script>
 *   <script>
 *     INSEELive.fetchAll().then(data => {
 *       console.log(data.latest.detteAPU);       // ex. 3460.5
 *       console.log(data.latest.ratioPIB);       // ex. 115.6
 *       console.log(data.latest.period);         // ex. "2025-Q4"
 *       console.log(data.history.detteAPU);      // tableau {period, value}
 *     });
 *   </script>
 */

(function (global) {
  'use strict';

  // ─── Configuration des séries INSEE BDM (base 2020) ──────────────────────
  // Validées le 20 avril 2026 contre api.insee.fr/series/BDM/V1
  const SERIES = {
    '010777616': 'detteAPU',          // Dette APU brute Maastricht (Md€)
    '010777608': 'ratioPIB',          // Ratio dette/PIB (%)
    '010777610': 'contribEtat',       // Contribution État (Md€)
    '010777613': 'contribODAC',       // Contribution organismes div. admin. centrale
    '010777625': 'contribAPUL',       // Contribution administrations publiques locales
    '010777626': 'contribASSO',       // Contribution administrations sécurité sociale
    '010777611': 'detteNette',        // Dette APU nette (Md€)
    '010777622': 'passifsFMI',        // Passifs totaux au sens FMI (Md€)
  };

  // Source de données dérivées (population, intérêts) — mises à jour manuellement
  // depuis le PLF et les Informations rapides INSEE.
  const REFERENCE = {
    populationFrance: 68_606_000,     // INSEE — bilan démographique 1er janv. 2026
    interetsAnnuelsAPU: 66.0,         // PLF 2026 / Cour des comptes (Md€)
    interetsAnnuelsEtat: 55.0,        // dont État seul (Md€)
    soldePrimaire12mois: -130.5,      // approximation — à raffiner avec série dédiée
  };

  const API_BASE = 'https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/';
  const CACHE_KEY = 'insee_dette_apu_v1';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure
  const FALLBACK_URL = 'Data/dette_data.json';
  const N_OBSERVATIONS = 40;           // ~10 ans d'historique trimestriel

  // ─── Parsing SDMX 2.1 (StructureSpecificData) ────────────────────────────
  function parseSDMX(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    if (doc.querySelector('parsererror')) {
      throw new Error('SDMX : XML mal formé');
    }

    const result = {};
    const seriesNodes = doc.getElementsByTagName('Series');

    for (const node of seriesNodes) {
      const idbank = node.getAttribute('IDBANK');
      const key = SERIES[idbank];
      if (!key) continue;

      const observations = [];
      const obsNodes = node.getElementsByTagName('Obs');
      for (const obs of obsNodes) {
        const period = obs.getAttribute('TIME_PERIOD');
        const valueStr = obs.getAttribute('OBS_VALUE');
        const value = parseFloat(valueStr);
        if (period && !isNaN(value)) {
          observations.push({ period, value });
        }
      }
      // Tri ascendant (du plus ancien au plus récent)
      observations.sort((a, b) => a.period.localeCompare(b.period));
      result[key] = observations;
    }

    return result;
  }

  // ─── Construction du payload normalisé renvoyé au front ──────────────────
  function buildPayload(parsedSeries, source) {
    const latest = {};
    const history = {};

    for (const key of Object.values(SERIES)) {
      const obs = parsedSeries[key] || [];
      history[key] = obs;
      const last = obs[obs.length - 1];
      if (last) {
        latest[key] = last.value;
      }
    }

    // Période la plus récente (tous indicateurs alignés en théorie)
    const refSerie = parsedSeries[SERIES['010777616']] || [];
    const lastObs = refSerie[refSerie.length - 1];
    const period = lastObs ? lastObs.period : null;

    // Indicateurs dérivés
    const dettePct = latest.ratioPIB;
    const detteEur = (latest.detteAPU || 0) * 1e9; // conversion Md€ → €
    const detteParHabitant = detteEur / REFERENCE.populationFrance;

    return {
      source,                          // 'insee-live' | 'cache' | 'fallback-json'
      fetchedAt: new Date().toISOString(),
      period,                          // ex. "2025-Q4"
      latest: {
        ...latest,
        detteParHabitant: Math.round(detteParHabitant),
        interetsAnnuelsAPU: REFERENCE.interetsAnnuelsAPU,
        interetsAnnuelsEtat: REFERENCE.interetsAnnuelsEtat,
        soldePrimaire12mois: REFERENCE.soldePrimaire12mois,
        populationFrance: REFERENCE.populationFrance,
      },
      history,
    };
  }

  // ─── Cache localStorage ──────────────────────────────────────────────────
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      const age = Date.now() - cached.timestamp;
      if (age > CACHE_TTL_MS) return null;
      return cached.payload;
    } catch (e) {
      return null;
    }
  }

  function saveCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        payload,
      }));
    } catch (e) {
      // Quota dépassé ou mode privé : on ignore silencieusement
    }
  }

  // ─── Appel API INSEE ─────────────────────────────────────────────────────
  async function fetchFromINSEE() {
    const idbanks = Object.keys(SERIES).join('+');
    const url = `${API_BASE}${idbanks}?lastNObservations=${N_OBSERVATIONS}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/xml' },
      // Pas de credentials — l'API est publique
    });

    if (!response.ok) {
      throw new Error(`INSEE API : HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const parsed = parseSDMX(xmlText);

    if (Object.keys(parsed).length === 0) {
      throw new Error('INSEE API : aucune série exploitable');
    }

    return buildPayload(parsed, 'insee-live');
  }

  // ─── Fallback sur le JSON statique du repo ───────────────────────────────
  async function fetchFallback() {
    try {
      const response = await fetch(FALLBACK_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error('Fallback indisponible');
      const data = await response.json();
      // On laisse le format brut tel que défini dans le repo,
      // mais on l'enveloppe pour signaler l'origine.
      return {
        source: 'fallback-json',
        fetchedAt: new Date().toISOString(),
        period: data.period || data.last_period || null,
        latest: data.latest || data,
        history: data.history || {},
        fallbackRaw: data,
      };
    } catch (e) {
      console.warn('[INSEELive] Fallback JSON également indisponible :', e);
      return null;
    }
  }

  // ─── API publique ────────────────────────────────────────────────────────
  async function fetchAll(options = {}) {
    const { forceRefresh = false } = options;

    // 1. Cache d'abord (si non forcé)
    if (!forceRefresh) {
      const cached = loadCache();
      if (cached) {
        return { ...cached, source: 'cache' };
      }
    }

    // 2. INSEE en direct
    try {
      const live = await fetchFromINSEE();
      saveCache(live);
      return live;
    } catch (e) {
      console.warn('[INSEELive] Échec API INSEE, basculement fallback :', e.message);
    }

    // 3. Fallback JSON statique
    const fallback = await fetchFallback();
    if (fallback) return fallback;

    throw new Error('Aucune source de données disponible');
  }

  // Helper : formatte un nombre selon les conventions typographiques FR
  // (espace insécable comme séparateur de milliers, virgule décimale)
  function formatFR(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // Helper : formatte une période trimestrielle "2025-Q4" → "T4 2025"
  function formatPeriod(period) {
    if (!period) return '—';
    const m = period.match(/^(\d{4})-Q(\d)$/);
    if (m) return `T${m[2]} ${m[1]}`;
    return period;
  }

  // Exposition globale
  global.INSEELive = {
    fetchAll,
    formatFR,
    formatPeriod,
    SERIES,
    REFERENCE,
    _internals: { parseSDMX, buildPayload, loadCache, saveCache },
  };

})(typeof window !== 'undefined' ? window : globalThis);
