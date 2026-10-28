import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { loadHousingDataset } from './data';
import type { AnnualAverage, HousingDataset, HousingObservation } from './types';

const REPOSITORY_URL = 'https://github.com/josealm7/murcia-housing-data';

const euroFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const axisFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 0,
});

function formatEuro(value: number): string {
  return `${euroFormatter.format(value)} €`;
}

function formatQuarter(year: number, quarter: number): string {
  return `${year} · T${quarter}`;
}

function formatGeography(value: string): string {
  return value === 'Murcia, Region de' ? 'Región de Murcia' : value;
}

function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M8 30V10l12 13L32 10v20" />
        <circle cx="8" cy="30" r="2" />
        <circle cx="32" cy="30" r="2" />
      </svg>
    </span>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Murcia Housing Data, inicio">
        <BrandMark />
        <span className="brand-name">
          <strong>Murcia</strong> Housing Data
        </span>
      </a>
      <nav className="header-nav" aria-label="Navegación principal">
        <a href="#evolucion">Evolución</a>
        <a href="#metodologia">Metodología</a>
      </nav>
      <a className="header-repo" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
        <span>Ver repositorio</span>
        <ArrowUpRight />
      </a>
    </header>
  );
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 12 12 4M5 4h7v7" />
    </svg>
  );
}

function Hero({ dataset }: { dataset: HousingDataset }) {
  const latest = dataset.observations[dataset.observations.length - 1];
  const first = dataset.observations[0];

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow-row">
          <span className="eyebrow-dot" />
          <span>Datos oficiales · Región de Murcia</span>
        </div>
        <h1 id="hero-title">
          La vivienda,
          <br />
          <em>en perspectiva.</em>
        </h1>
        <p className="hero-description">
          Una serie trimestral del valor tasado de la vivienda libre en Murcia.
          Más de tres décadas de datos para explorar, comparar y entender.
        </p>
        <div className="hero-actions">
          <a className="button button-dark" href="#evolucion">
            Explorar los datos <ArrowDown />
          </a>
          <a
            className="text-link"
            href={dataset.source.datasetUrl}
            target="_blank"
            rel="noreferrer"
          >
            Fuente oficial <ArrowUpRight />
          </a>
        </div>
        <div className="dataset-range">
          <span>{dataset.source.observationCount} observaciones</span>
          <span className="range-separator" />
          <span>
            {first.year} — {latest.year}
          </span>
          <span className="range-separator" />
          <span>Frecuencia trimestral</span>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-grid" />
        <div className="hero-visual-top">
          <span className="hero-card-label">ÚLTIMO VALOR TASADO</span>
          <span className="live-dot" aria-label="Última observación disponible" />
        </div>
        <div className="hero-price-wrap">
          <span className="hero-price">{euroFormatter.format(latest.pricePerSqm)}</span>
          <span className="hero-unit">€/m²</span>
        </div>
        <div className="hero-period">
          <span className="period-marker" />
          <span>{formatQuarter(latest.year, latest.quarter)}</span>
          <span className="period-date">{formatDate(latest.date)}</span>
        </div>
        <div className="hero-visual-bottom">
          <span>Vivienda libre</span>
          <span>{formatGeography(dataset.source.geography)}</span>
        </div>
        <span className="hero-index">01 / 01</span>
      </div>
      <div className="hero-side-note" aria-hidden="true">
        <span>DATOS · CONTEXTO · TERRITORIO</span>
      </div>
    </section>
  );
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" />
    </svg>
  );
}

function SectionHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <div className="section-label">
        <span>{number}</span>
        <span className="section-rule" />
        <span>{eyebrow}</span>
      </div>
      <div className="section-title-row">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function QuarterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HousingObservation }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="tooltip-label">{formatQuarter(point.year, point.quarter)}</span>
      <strong>{formatEuro(point.pricePerSqm)}<small> / m²</small></strong>
    </div>
  );
}

function AnnualTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: AnnualAverage }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <span className="tooltip-label">
        {point.year} · {point.isPartial ? 'Año parcial' : 'Año completo'}
      </span>
      <strong>{formatEuro(point.averagePricePerSqm)}<small> / m²</small></strong>
      <span className="tooltip-detail">
        {point.observedQuarters} de 4 trimestres observados
      </span>
    </div>
  );
}

function EvolutionChart({ observations }: { observations: HousingObservation[] }) {
  const chartData = useMemo(
    () =>
      observations.map((observation) => ({
        ...observation,
        timestamp: Date.parse(`${observation.date}T00:00:00Z`),
      })),
    [observations],
  );

  return (
    <div className="chart-card evolution-card">
      <div className="chart-card-header">
        <div>
          <h3>El precio a través del tiempo</h3>
          <p>Valor tasado por trimestre · €/m²</p>
        </div>
        <div className="chart-legend">
          <span className="legend-line" />
          <span>Vivienda libre</span>
        </div>
      </div>
      <div className="chart-wrap evolution-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4d7f6a" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#4d7f6a" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e8e7e1" strokeDasharray="3 5" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickCount={7}
              tickFormatter={(value: number) => String(new Date(value).getUTCFullYear())}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#777a73', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
              dy={10}
              minTickGap={28}
            />
            <YAxis
              width={64}
              tickFormatter={(value: number) => axisFormatter.format(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#777a73', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
              dx={-4}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<QuarterTooltip />} cursor={{ stroke: '#8caa99', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="pricePerSqm"
              stroke="#356b54"
              strokeWidth={2.5}
              fill="url(#priceFill)"
              activeDot={{ r: 5, stroke: '#f5f4f0', strokeWidth: 3, fill: '#356b54' }}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-card-foot">
        <span>{observations[0].year} · T{observations[0].quarter}</span>
        <span>Fuente: {observations.length} observaciones trimestrales</span>
        <span>
          {observations[observations.length - 1].year} · T
          {observations[observations.length - 1].quarter}
        </span>
      </div>
    </div>
  );
}

function AnnualChart({ averages }: { averages: AnnualAverage[] }) {
  const partialYears = averages.filter((average) => average.isPartial);

  return (
    <div className="chart-card annual-card">
      <div className="chart-card-header annual-header">
        <div>
          <h3>Promedio anual</h3>
          <p>Media de los trimestres observados · €/m²</p>
        </div>
        <span className="annual-key">
          <i /> Año parcial
        </span>
      </div>
      <div className="chart-wrap annual-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={averages} margin={{ top: 12, right: 10, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8e7e1" strokeDasharray="3 5" />
            <XAxis
              dataKey="year"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickCount={8}
              interval="preserveStartEnd"
              tickFormatter={(value: number) => String(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#777a73', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              dy={9}
              minTickGap={20}
            />
            <YAxis
              width={66}
              tickFormatter={(value: number) => axisFormatter.format(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#777a73', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<AnnualTooltip />} cursor={{ fill: '#e7e9e1', opacity: 0.55 }} />
            {partialYears.map((year) => (
              <ReferenceLine
                key={year.year}
                x={year.year}
                stroke="#b46a4c"
                strokeDasharray="3 4"
                ifOverflow="extendDomain"
              />
            ))}
            <Bar
              dataKey="averagePricePerSqm"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            >
              {averages.map((average) => (
                <Cell
                  key={average.year}
                  fill={average.isPartial ? '#bd7658' : '#6e947e'}
                  stroke={average.isPartial ? '#8f523a' : 'none'}
                  strokeWidth={average.isPartial ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="annual-notes">
        {partialYears.length ? (
          partialYears.map((year) => (
            <span className="partial-note" key={year.year}>
              <i />
              {year.year} parcial · {year.observedQuarters} de 4 trimestres observados
            </span>
          ))
        ) : (
          <span className="quiet-note">Todos los años del conjunto están completos.</span>
        )}
      </div>
    </div>
  );
}

function HistoricalTable({ observations }: { observations: HousingObservation[] }) {
  const pageSize = 12;
  const [page, setPage] = useState(0);
  const descending = useMemo(() => [...observations].reverse(), [observations]);
  const pageCount = Math.ceil(descending.length / pageSize);
  const pageRows = descending.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    setPage(0);
  }, [observations]);

  return (
    <section className="history-section" id="datos" aria-labelledby="history-title">
      <div className="section-heading compact-heading">
        <div className="section-label">
          <span>03</span>
          <span className="section-rule" />
          <span>La serie completa</span>
        </div>
        <div className="section-title-row">
          <h2 id="history-title">Cada trimestre, a la vista.</h2>
          <p>Consulta los valores publicados, del más reciente al más antiguo.</p>
        </div>
      </div>
      <div className="table-card">
        <div className="table-topline">
          <div>
            <span className="table-count">{observations.length}</span>
            <span className="table-count-label">registros trimestrales</span>
          </div>
          <span className="table-unit">PRECIOS EN €/M²</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col">Fecha de referencia</th>
                <th scope="col" className="numeric-cell">Precio tasado</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((observation) => (
                <tr key={`${observation.year}-Q${observation.quarter}`}>
                  <td>
                    <span className="period-cell">
                      <span className="period-year">{observation.year}</span>
                      <span className="period-quarter">T{observation.quarter}</span>
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(observation.date)}</td>
                  <td className="numeric-cell price-cell">
                    {formatEuro(observation.pricePerSqm)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-pagination">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, descending.length)} de{' '}
            {descending.length}
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
              aria-label="Página anterior"
            >
              <ArrowLeft />
            </button>
            <span className="page-indicator">{page + 1} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Página siguiente"
            >
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 8H3m0 0 4.5-4.5M3 8l4.5 4.5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" />
    </svg>
  );
}

function Methodology({ dataset }: { dataset: HousingDataset }) {
  const technologies = ['Python', 'Pandas', 'PostgreSQL', 'SQL', 'React', 'Vite'];

  return (
    <section className="methodology-section" id="metodologia" aria-labelledby="method-title">
      <SectionHeading
        number="04"
        eyebrow="Método y procedencia"
        title="De una fuente pública a una serie explorable."
        description="El proyecto recorre el ciclo de vida del dato y publica esta visualización como una capa estática, rápida y transparente."
      />

      <div className="method-layout">
        <div className="pipeline-card">
          <div className="pipeline-heading">
            <span className="pipeline-kicker">ARQUITECTURA DEL PROYECTO</span>
            <span className="pipeline-status"><i /> Flujo de datos</span>
          </div>
          <div className="pipeline-flow">
            <PipelineStep number="01" title="Fuente oficial" detail="MIVAU · CSV trimestral" tone="source" />
            <PipelineConnector />
            <PipelineStep number="02" title="Preparación" detail="Python · Pandas" tone="transform" />
            <PipelineConnector />
            <PipelineStep number="03" title="Almacenamiento" detail="PostgreSQL · SQL" tone="database" />
            <PipelineConnector />
            <PipelineStep number="04" title="Exportación" detail="JSON · React" tone="analysis" />
          </div>
          <div className="web-output">
            <span className="web-output-branch" aria-hidden="true" />
            <div className="web-output-copy">
              <span className="pipeline-kicker">ESTA WEB · SIN CONEXIÓN A BASE DE DATOS</span>
              <p>CSV limpio <b>→</b> exportador Python <b>→</b> JSON estático <b>→</b> React</p>
            </div>
            <span className="static-badge">ARCHIVO ESTÁTICO</span>
          </div>
        </div>

        <aside className="method-notes">
          <div className="method-note-block">
            <span className="note-number">A</span>
            <div>
              <h3>Una fuente, una geografía.</h3>
              <p>
                {dataset.source.name}, publicado por {dataset.source.publisher}. La selección
                corresponde a vivienda {dataset.source.regime.toLowerCase()} en{' '}
                {formatGeography(dataset.source.geography)}.
              </p>
            </div>
          </div>
          <div className="method-note-block">
            <span className="note-number">B</span>
            <div>
              <h3>Sin métricas opacas.</h3>
              <p>
                Los precios proceden del CSV limpio. Los promedios anuales se sirven desde el
                JSON; no se recalculan en el navegador. No se muestran variaciones ni categorías
                cuyos cálculos no están verificados.
              </p>
            </div>
          </div>
          <div className="technology-list" aria-label="Tecnologías del proyecto">
            {technologies.map((technology) => <span key={technology}>{technology}</span>)}
          </div>
        </aside>
      </div>
    </section>
  );
}

function PipelineStep({
  number,
  title,
  detail,
  tone,
}: {
  number: string;
  title: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="pipeline-step">
      <span className={`pipeline-icon pipeline-icon-${tone}`}>
        {tone === 'source' ? <SourceIcon /> : tone === 'transform' ? <CodeIcon /> : tone === 'database' ? <DatabaseIcon /> : <ChartIcon />}
      </span>
      <span className="pipeline-number">{number}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  );
}

function PipelineConnector() {
  return <span className="pipeline-connector" aria-hidden="true"><i /><i /><i /></span>;
}

function SourceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-10-4 12" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6M4.5 11.5v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 19.5h16M6.5 16V10m5 6V5m5 11v-8" />
    </svg>
  );
}

function SourceNote({ dataset }: { dataset: HousingDataset }) {
  return (
    <div className="source-note">
      <span className="source-note-icon"><SourceIcon /></span>
      <p>
        Datos oficiales de <strong>{dataset.source.publisher}</strong> · conjunto{' '}
        <a href={dataset.source.datasetUrl} target="_blank" rel="noreferrer">
          {dataset.source.name}<ArrowUpRight />
        </a>
      </p>
      <span className="source-note-unit">Unidad: {dataset.source.unit}</span>
    </div>
  );
}

function Footer({ dataset }: { dataset: HousingDataset }) {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="#top">
        <BrandMark />
        <span className="brand-name"><strong>Murcia</strong> Housing Data</span>
      </a>
      <p>Una lectura abierta del mercado de vivienda regional.</p>
      <div className="footer-links">
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">Repositorio <ArrowUpRight /></a>
        <a href={dataset.source.datasetUrl} target="_blank" rel="noreferrer">Fuente oficial <ArrowUpRight /></a>
      </div>
      <span className="footer-credit">Datos: MIVAU · {dataset.source.unit}</span>
    </footer>
  );
}

function LoadingState() {
  return (
    <main className="state-page" aria-live="polite" aria-busy="true">
      <span className="state-spinner" />
      <p>Cargando la serie trimestral…</p>
    </main>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="state-page error-state" role="alert">
      <span className="error-mark">!</span>
      <span className="state-overline">DATOS NO DISPONIBLES</span>
      <h1>No se pudo cargar la serie.</h1>
      <p>{message}</p>
      <button className="button button-dark" type="button" onClick={onRetry}>
        Volver a intentarlo <ArrowRight />
      </button>
    </main>
  );
}

function Dashboard({ dataset }: { dataset: HousingDataset }) {
  return (
    <>
      <main>
        <Hero dataset={dataset} />
        <section className="data-section" id="evolucion" aria-labelledby="evolution-title">
          <SectionHeading
            number="01"
            eyebrow="Evolución del precio"
            title="Un mercado en movimiento."
            description="El valor tasado de cada trimestre permite observar los cambios de largo plazo, sin perder el detalle de cada publicación."
          />
          <div className="chart-section-title" id="evolution-title">
            <span className="chart-section-caption">SERIE TRIMESTRAL</span>
            <span className="chart-section-period">
              {dataset.observations[0].year} — {dataset.source.latestPeriod.replace('-Q', ' · T')}
            </span>
          </div>
          <EvolutionChart observations={dataset.observations} />
          <div className="annual-block">
            <div className="annual-intro">
              <div className="section-label section-label-small">
                <span>02</span><span className="section-rule" /><span>Vista agregada</span>
              </div>
              <h2>El ritmo de cada año.</h2>
              <p>Promedio anual calculado a partir de los trimestres disponibles.</p>
            </div>
            <AnnualChart averages={dataset.annualAverages} />
          </div>
          <SourceNote dataset={dataset} />
        </section>
        <div className="section-divider" />
        <HistoricalTable observations={dataset.observations} />
        <div className="methodology-wrap">
          <Methodology dataset={dataset} />
        </div>
      </main>
      <Footer dataset={dataset} />
    </>
  );
}

export default function App() {
  const [dataset, setDataset] = useState<HousingDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setDataset(null);
    setError(null);
    setIsLoading(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    loadHousingDataset(controller.signal)
      .then((loaded) => {
        setDataset(loaded);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Error inesperado al leer el JSON.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="site-shell">
      <Header />
      {isLoading ? <LoadingState /> : error || !dataset ? (
        <ErrorState message={error ?? 'El archivo de datos está vacío.'} onRetry={retry} />
      ) : (
        <Dashboard dataset={dataset} />
      )}
    </div>
  );
}
