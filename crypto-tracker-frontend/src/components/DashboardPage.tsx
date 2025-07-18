import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentCrypto, fetchHistoricalAverage, fetchCoinHistory } from '../lib/api';
import ErrorFallback from './ErrorFallback';
import * as Tabs from '@radix-ui/react-tabs';
import { DatePicker } from '../components/ui/date-picker';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { ChartData, ChartOptions } from 'chart.js';
import type { CurrentCrypto, HistoricalCrypto, AverageCrypto } from '../types/crypto';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  ChartTooltip,
  Legend,
  CategoryScale,
);

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol' },
  { key: 'price', label: 'Price (USD)' },
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'change24h', label: '24h Change (%)' },
];

// Explicitly type historyRanges
const historyRanges: { label: string; value: string }[] = [
  { label: '1 Day', value: '1d' },
  { label: '3 Days', value: '3d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
];

// Utility type guard for API data
function extractArray<T>(data: T[] | { data: T[] } | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ('data' in data && Array.isArray(data.data)) return data.data;
  return [];
}

function SelectedCoinDetails({
  selectedCoin,
  historyRange,
  setHistoryRange,
  refetchHistory,
  isLoadingHistory,
  isErrorHistory,
  errorHistory,
  coinHistory,
  chartData,
  chartOptions,
  historyRanges,
}: {
  selectedCoin: CurrentCrypto | HistoricalCrypto | AverageCrypto;
  historyRange: string;
  setHistoryRange: (v: string) => void;
  refetchHistory: () => void;
  isLoadingHistory: boolean;
  isErrorHistory: boolean;
  errorHistory: unknown;
  coinHistory: HistoricalCrypto[] | { data: HistoricalCrypto[] } | undefined;
  chartData: ChartData<'line'>;
  chartOptions: ChartOptions<'line'>;
  historyRanges: { label: string; value: string }[];
}) {
  const symbol =
    'symbol' in selectedCoin && selectedCoin.symbol
      ? selectedCoin.symbol
      : '_id' in selectedCoin && selectedCoin._id
      ? selectedCoin._id
      : '';
  const name = 'name' in selectedCoin ? selectedCoin.name : '';
  // Use local variable for Line key
  const chartKey = symbol + '-' + historyRange;
  return (
    <div className="flex-1 min-w-0 bg-background rounded-lg shadow p-4">
      <div className="flex items-center gap-3 mb-2">
        <CoinIcon symbol={symbol} />
        <span className="text-xl font-bold">
          {name} {symbol ? `(${symbol.toUpperCase()})` : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-4 text-lg mb-4">
        <div>
          Current Price:{' '}
          <span className="font-semibold">
            {'price' in selectedCoin && typeof selectedCoin.price === 'number'
              ? `$${selectedCoin.price.toLocaleString?.() ?? selectedCoin.price}`
              : ''}
          </span>
        </div>
        <div>
          Market Cap:{' '}
          <span className="font-semibold">
            {'marketCap' in selectedCoin && typeof selectedCoin.marketCap === 'number'
              ? `$${selectedCoin.marketCap.toLocaleString?.() ?? selectedCoin.marketCap}`
              : ''}
          </span>
        </div>
        <div>
          24h Change:{' '}
          <span
            className={
              'change24h' in selectedCoin && typeof selectedCoin.change24h === 'number'
                ? selectedCoin.change24h > 0
                  ? 'text-green-600'
                  : selectedCoin.change24h < 0
                  ? 'text-red-600'
                  : ''
                : ''
            }
          >
            {'change24h' in selectedCoin && typeof selectedCoin.change24h === 'number'
              ? `${selectedCoin.change24h.toFixed?.(2) ?? selectedCoin.change24h}%`
              : ''}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <span className="font-medium mb-1">History Range:</span>
        <div className="flex gap-2">
          {historyRanges.map((r) => (
            <button
              key={r.value}
              className={`px-3 py-1 rounded ${
                historyRange === r.value
                  ? 'bg-primary text-primary-foreground font-semibold shadow'
                  : 'bg-muted text-muted-foreground'
              } transition`}
              onClick={() => {
                setHistoryRange(String(r.value));
                refetchHistory();
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-background rounded-lg shadow p-2">
        {isLoadingHistory ? (
          <TableSkeleton />
        ) : isErrorHistory ? (
          <ErrorFallback error={errorHistory as Error} />
        ) : coinHistory && extractArray<HistoricalCrypto>(coinHistory).length > 0 ? (
          <Line
            key={chartKey}
            data={chartData as ChartData<'line'>}
            options={chartOptions as ChartOptions<'line'>}
          />
        ) : (
          <EmptyState message="No history data for this coin" />
        )}
      </div>
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const [tab, setTab] = useState<'current' | 'average'>('current');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dateRangeTouched, setDateRangeTouched] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<
    CurrentCrypto | HistoricalCrypto | AverageCrypto | null
  >(null);
  const [historyRange, setHistoryRange] = useState('7d');

  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
    error: errorCurrent,
  } = useQuery<{ data: CurrentCrypto[] } | CurrentCrypto[]>({
    queryKey: ['current-crypto'],
    queryFn: fetchCurrentCrypto,
    enabled: tab === 'current',
  });

  // Auto-select the first coin when data loads or tab changes
  useEffect(() => {
    if (tab === 'current' && currentData) {
      const arr = extractArray<CurrentCrypto>(currentData);
      if (arr.length > 0) setSelectedCoin(arr[0]);
    } else if (tab !== 'current') {
      setSelectedCoin(null);
    }
  }, [currentData, tab]);

  const {
    data: averageData,
    isLoading: isLoadingAverage,
    isError: isErrorAverage,
    error: errorAverage,
    refetch: refetchAverage,
  } = useQuery<{ data: AverageCrypto[] } | AverageCrypto[]>({
    queryKey: ['historical-average', start, end],
    queryFn: () => fetchHistoricalAverage(start, end),
    enabled: tab === 'average' && !!start && !!end,
  });

  const {
    data: coinHistory,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    error: errorHistory,
    refetch: refetchHistory,
  } = useQuery<{ data: HistoricalCrypto[] } | HistoricalCrypto[]>({
    queryKey: ['coin-history', selectedCoin?.symbol, historyRange],
    queryFn: () => fetchCoinHistory(selectedCoin?.symbol as string, historyRange),
    enabled: !!selectedCoin,
  });

  const chartData = {
    labels: extractArray<HistoricalCrypto>(coinHistory).map((d) => d.timestamp),
    datasets: [
      {
        label: selectedCoin && 'name' in selectedCoin ? selectedCoin.name + ' Price' : 'Price',
        data: extractArray<HistoricalCrypto>(coinHistory).map((d) => d.price),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4,
        pointRadius: 0,
        fill: true,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: { unit: 'day' as const, tooltipFormat: 'PPpp' },
        title: { display: true, text: 'Date' },
        ticks: { autoSkip: true, maxTicksLimit: 8 },
      },
      y: {
        title: { display: true, text: 'Price (USD)' },
        beginAtZero: false,
      },
    },
  };

  const handleTabChange = (value: string) => {
    setTab(value as 'current' | 'average');
    setSelectedCoin(null);
  };

  const handleDateChange = (which: 'start' | 'end', value: string) => {
    if (which === 'start') setStart(value);
    else setEnd(value);
    setDateRangeTouched(true);
  };

  const handleCoinClick = (coin: CurrentCrypto | HistoricalCrypto | AverageCrypto) => {
    setSelectedCoin(coin);
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center bg-background">
      <div className=" w-full mx-auto p-4 md:p-8 bg-card ">
        <Tabs.Root value={tab} onValueChange={handleTabChange} className="w-full">
          <Tabs.List className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
            <Tabs.Trigger
              value="current"
              className={
                tab === 'current'
                  ? 'bg-background text-foreground shadow-sm font-semibold flex-1 rounded-md px-4 py-2 transition'
                  : 'flex-1 rounded-md px-4 py-2 transition'
              }
            >
              Current
            </Tabs.Trigger>
            <Tabs.Trigger
              value="average"
              className={
                tab === 'average'
                  ? 'bg-background text-foreground shadow-sm font-semibold flex-1 rounded-md px-4 py-2 transition'
                  : 'flex-1 rounded-md px-4 py-2 transition'
              }
            >
              By Date Range
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="current" className="w-full">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">
              Top 10 Cryptocurrencies (Current)
            </h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 min-w-0">
                <div className="overflow-x-auto rounded-lg border bg-background">
                  {isLoadingCurrent ? (
                    <TableSkeleton />
                  ) : isErrorCurrent ? (
                    <ErrorFallback error={errorCurrent as Error} />
                  ) : (
                    <CryptoTable
                      data={extractArray<CurrentCrypto>(currentData)}
                      onCoinClick={handleCoinClick}
                      selectedCoin={selectedCoin ?? undefined}
                    />
                  )}
                </div>
              </div>
              {selectedCoin && (
                <SelectedCoinDetails
                  selectedCoin={selectedCoin}
                  historyRange={historyRange}
                  setHistoryRange={setHistoryRange}
                  refetchHistory={refetchHistory}
                  isLoadingHistory={isLoadingHistory}
                  isErrorHistory={isErrorHistory}
                  errorHistory={errorHistory}
                  coinHistory={coinHistory}
                  chartData={chartData}
                  chartOptions={chartOptions}
                  historyRanges={historyRanges}
                />
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content value="average" className="w-full">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Averages by Date Range</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
              <DatePicker
                label="Start"
                value={start}
                onChange={(v) => handleDateChange('start', v)}
              />
              <DatePicker label="End" value={end} onChange={(v) => handleDateChange('end', v)} />
              <button
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition disabled:opacity-50"
                disabled={!start || !end}
                onClick={() => refetchAverage()}
              >
                Get Average
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-background">
              {isLoadingAverage ? (
                <TableSkeleton />
              ) : isErrorAverage ? (
                <ErrorFallback error={errorAverage as Error} />
              ) : dateRangeTouched &&
                (!averageData || extractArray<AverageCrypto>(averageData).length === 0) ? (
                <EmptyState message="No data for selected range" />
              ) : (
                <CryptoTable data={extractArray<AverageCrypto>(averageData)} isAverage />
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

const CryptoTable: React.FC<{
  data: (CurrentCrypto | AverageCrypto | HistoricalCrypto)[];
  isAverage?: boolean;
  onCoinClick?: (coin: CurrentCrypto | AverageCrypto | HistoricalCrypto) => void;
  selectedCoin?: CurrentCrypto | AverageCrypto | HistoricalCrypto;
}> = ({ data, isAverage, onCoinClick, selectedCoin }) => (
  <table className="min-w-full text-sm md:text-base">
    <thead className="sticky top-0 bg-background/95 z-10">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            className="px-4 py-3 text-left font-semibold border-b whitespace-nowrap group relative"
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.isArray(data) && data.length > 0 ? (
        data.map((coin) => {
          // Type guards for each property
          const symbol =
            'symbol' in coin && coin.symbol
              ? coin.symbol
              : '_id' in coin && coin._id
              ? coin._id
              : 'name' in coin && coin.name
              ? coin.name
              : '';
          const price = isAverage
            ? (coin as AverageCrypto).avgPrice
            : 'price' in coin && typeof coin.price === 'number'
            ? coin.price
            : undefined;
          const marketCap = isAverage
            ? (coin as AverageCrypto).avgMarketCap
            : 'marketCap' in coin && typeof coin.marketCap === 'number'
            ? coin.marketCap
            : undefined;
          const change24h = isAverage
            ? (coin as AverageCrypto).avgChange24h
            : 'change24h' in coin && typeof coin.change24h === 'number'
            ? coin.change24h
            : undefined;
          // For row selection, use the same logic as before
          const isSelected =
            selectedCoin &&
            (('symbol' in selectedCoin &&
              'symbol' in coin &&
              selectedCoin.symbol &&
              coin.symbol &&
              selectedCoin.symbol === coin.symbol) ||
              ('_id' in selectedCoin &&
                '_id' in coin &&
                selectedCoin._id &&
                coin._id &&
                selectedCoin._id === coin._id));
          return (
            <tr
              key={symbol}
              className={`hover:bg-accent/40 transition border-b last:border-0 cursor-pointer ${
                isSelected ? 'bg-accent/60' : ''
              }`}
              onClick={onCoinClick ? () => onCoinClick(coin) : undefined}
            >
              {/* Name + Icon */}
              <td className="px-4 py-2 font-medium flex items-center gap-2">
                <CoinIcon symbol={symbol} />
                {'name' in coin ? coin.name : ''}
              </td>
              {/* Symbol */}
              <td className="px-4 py-2 uppercase">{symbol}</td>
              {/* Price */}
              <td className="px-4 py-2">
                ${price !== undefined && price !== null ? price.toLocaleString?.() ?? price : ''}
              </td>
              {/* Market Cap */}
              <td className="px-4 py-2">
                $
                {marketCap !== undefined && marketCap !== null
                  ? marketCap.toLocaleString?.() ?? marketCap
                  : ''}
              </td>
              {/* Change 24h */}
              <td
                className={
                  'px-4 py-2 ' +
                  (change24h !== undefined && change24h > 0
                    ? 'text-green-600'
                    : change24h !== undefined && change24h < 0
                    ? 'text-red-600'
                    : '')
                }
              >
                {change24h !== undefined && change24h !== null
                  ? change24h.toFixed?.(2) ?? change24h
                  : ''}
                %
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={columns.length} className="text-center py-6 text-muted-foreground">
            <EmptyState message="No data available" />
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

const CoinIcon: React.FC<{ symbol: string }> = ({ symbol }) => (
  <img
    src={`https://assets.coingecko.com/coins/images/1/large/bitcoin.png?symbol=${symbol?.toLowerCase?.()}`}
    alt={symbol}
    className="w-6 h-6 rounded-full bg-muted border mr-2"
    onError={(e) => {
      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24?text=?';
    }}
  />
);

const TableSkeleton = () => (
  <div className="animate-pulse p-6">
    <div className="h-6 bg-muted rounded w-1/3 mb-4" />
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-5 bg-muted rounded w-full" />
      ))}
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <svg
      width="64"
      height="64"
      fill="none"
      viewBox="0 0 24 24"
      className="mb-2 text-muted-foreground"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span className="text-muted-foreground text-lg font-medium">{message}</span>
  </div>
);

export default DashboardPage;
