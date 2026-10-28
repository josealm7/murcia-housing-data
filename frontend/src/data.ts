import type { HousingDataset } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

export function parseHousingDataset(value: unknown): HousingDataset {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('El archivo de datos no tiene una versión de esquema compatible.');
  }

  const source = value.source;
  if (
    !isRecord(source) ||
    typeof source.name !== 'string' ||
    typeof source.publisher !== 'string' ||
    typeof source.observationCount !== 'number' ||
    typeof source.latestPeriod !== 'string' ||
    typeof source.datasetUrl !== 'string' ||
    typeof source.rawCsvUrl !== 'string' ||
    typeof source.geography !== 'string' ||
    typeof source.regime !== 'string' ||
    typeof source.unit !== 'string' ||
    typeof source.frequency !== 'string'
  ) {
    throw new Error('Faltan metadatos obligatorios en el archivo de datos.');
  }

  if (
    !Array.isArray(value.observations) ||
    value.observations.length === 0 ||
    !Array.isArray(value.annualAverages) ||
    value.annualAverages.length === 0
  ) {
    throw new Error('El archivo no contiene las series de precios esperadas.');
  }

  const observationsValid = value.observations.every(
    (observation) =>
      isRecord(observation) &&
      typeof observation.date === 'string' &&
      isIsoDate(observation.date) &&
      Number.isFinite(observation.year) &&
      Number.isInteger(observation.year) &&
      [1, 2, 3, 4].includes(Number(observation.quarter)) &&
      Number.isFinite(observation.pricePerSqm) &&
      Number(observation.pricePerSqm) > 0,
  );
  const annualAveragesValid = value.annualAverages.every(
    (average) =>
      isRecord(average) &&
      Number.isInteger(average.year) &&
      Number.isFinite(average.averagePricePerSqm) &&
      Number(average.averagePricePerSqm) > 0 &&
      Number.isInteger(average.observedQuarters) &&
      Number(average.observedQuarters) >= 1 &&
      Number(average.observedQuarters) <= 4 &&
      typeof average.isPartial === 'boolean',
  );

  if (!observationsValid || !annualAveragesValid) {
    throw new Error('El archivo contiene observaciones o promedios con formato inválido.');
  }
  if (source.observationCount !== value.observations.length) {
    throw new Error('El recuento de observaciones no coincide con los metadatos.');
  }

  return value as unknown as HousingDataset;
}

export async function loadHousingDataset(signal?: AbortSignal): Promise<HousingDataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/housing.json`, { signal });
  if (!response.ok) {
    throw new Error(`No se pudo cargar el conjunto de datos (HTTP ${response.status}).`);
  }
  return parseHousingDataset(await response.json());
}
