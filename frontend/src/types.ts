export interface HousingObservation {
  date: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  pricePerSqm: number;
}

export interface AnnualAverage {
  year: number;
  averagePricePerSqm: number;
  observedQuarters: number;
  isPartial: boolean;
}

export interface HousingSource {
  name: string;
  publisher: string;
  datasetUrl: string;
  rawCsvUrl: string;
  geography: string;
  regime: string;
  unit: string;
  frequency: string;
  observationCount: number;
  latestPeriod: string;
}

export interface HousingDataset {
  schemaVersion: 1;
  source: HousingSource;
  observations: HousingObservation[];
  annualAverages: AnnualAverage[];
}
