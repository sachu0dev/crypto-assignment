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

const historyRanges = [
  { label: '1 Day', value: '1d' },
  { label: '3 Days', value: '3d' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
];

const DashboardPage: React.FC = () => {
  const [tab, setTab] = useState<'current' | 'average'>('current');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dateRangeTouched, setDateRangeTouched] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<any | null>(null);
  const [historyRange, setHistoryRange] = useState('7d');

  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
    error: errorCurrent,
  } = useQuery({
    queryKey: ['current-crypto'],
    queryFn: fetchCurrentCrypto,
    enabled: tab === 'current',
  });

  // Auto-select the first coin when data loads or tab changes
  useEffect(() => {
    if (tab === 'current' && currentData && Array.isArray(currentData) && currentData.length > 0) {
      setSelectedCoin(currentData[0]);
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
  } = useQuery({
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
  } = useQuery({
    queryKey: ['coin-history', selectedCoin?.symbol, historyRange],
    queryFn: () => fetchCoinHistory(selectedCoin?.symbol, historyRange),
    enabled: !!selectedCoin,
  });

  // Prepare Chart.js data and options for the selected coin's history
  const chartData = {
    labels: coinHistory?.map((d: any) => d.timestamp),
    datasets: [
      {
        label: selectedCoin?.name + ' Price',
        data: coinHistory?.map((d: any) => d.price),
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
        type: 'timeseries' as const,
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

  const handleCoinClick = (coin: any) => {
    setSelectedCoin(coin);
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center bg-background">
      <div className="max-w-6xl w-full mx-auto p-4 md:p-8 bg-card rounded-2xl shadow-lg">
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
                      data={currentData}
                      onCoinClick={handleCoinClick}
                      selectedCoin={selectedCoin}
                    />
                  )}
                </div>
              </div>
              {selectedCoin && (
                <div className="flex-1 min-w-0 bg-background rounded-lg shadow p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CoinIcon symbol={selectedCoin.symbol} />
                    <span className="text-xl font-bold">
                      {selectedCoin.name} ({selectedCoin.symbol?.toUpperCase()})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-lg mb-4">
                    <div>
                      Current Price:{' '}
                      <span className="font-semibold">
                        ${selectedCoin.price?.toLocaleString?.() ?? selectedCoin.price}
                      </span>
                    </div>
                    <div>
                      Market Cap:{' '}
                      <span className="font-semibold">
                        ${selectedCoin.marketCap?.toLocaleString?.() ?? selectedCoin.marketCap}
                      </span>
                    </div>
                    <div>
                      24h Change:{' '}
                      <span
                        className={
                          selectedCoin.change24h > 0
                            ? 'text-green-600'
                            : selectedCoin.change24h < 0
                            ? 'text-red-600'
                            : ''
                        }
                      >
                        {selectedCoin.change24h?.toFixed?.(2) ?? selectedCoin.change24h}%
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
                            setHistoryRange(r.value);
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
                    ) : coinHistory && coinHistory.length > 0 ? (
                      <Line
                        key={(selectedCoin?.symbol || '') + '-' + historyRange}
                        data={chartData}
                        options={chartOptions}
                      />
                    ) : (
                      <EmptyState message="No history data for this coin" />
                    )}
                  </div>
                </div>
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
              ) : dateRangeTouched && (!averageData || averageData.length === 0) ? (
                <EmptyState message="No data for selected range" />
              ) : (
                <CryptoTable data={averageData} isAverage />
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

const CryptoTable: React.FC<{
  data: any[];
  isAverage?: boolean;
  onCoinClick?: (coin: any) => void;
  selectedCoin?: any;
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
        data.map((coin: any) => (
          <tr
            key={coin._id || coin.symbol || coin.id}
            className={`hover:bg-accent/40 transition border-b last:border-0 cursor-pointer ${
              selectedCoin && (selectedCoin._id === coin._id || selectedCoin.symbol === coin.symbol)
                ? 'bg-accent/60'
                : ''
            }`}
            onClick={onCoinClick ? () => onCoinClick(coin) : undefined}
          >
            <td className="px-4 py-2 font-medium flex items-center gap-2">
              <CoinIcon symbol={coin.symbol || coin._id} />
              {coin.name}
            </td>
            <td className="px-4 py-2 uppercase">{coin.symbol || coin._id}</td>
            <td className="px-4 py-2">
              $
              {(isAverage ? coin.avgPrice : coin.price)?.toLocaleString?.() ??
                (isAverage ? coin.avgPrice : coin.price)}
            </td>
            <td className="px-4 py-2">
              $
              {(isAverage ? coin.avgMarketCap : coin.marketCap)?.toLocaleString?.() ??
                (isAverage ? coin.avgMarketCap : coin.marketCap)}
            </td>
            <td
              className={
                'px-4 py-2 ' +
                ((isAverage ? coin.avgChange24h : coin.change24h) > 0
                  ? 'text-green-600'
                  : (isAverage ? coin.avgChange24h : coin.change24h) < 0
                  ? 'text-red-600'
                  : '')
              }
            >
              {(isAverage ? coin.avgChange24h : coin.change24h)?.toFixed?.(2) ??
                (isAverage ? coin.avgChange24h : coin.change24h)}
              %
            </td>
          </tr>
        ))
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
