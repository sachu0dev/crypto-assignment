import type React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
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

// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { AverageCrypto, CurrentCrypto, HistoricalCrypto } from '@/types/crypto';
import ErrorFallback from './ErrorFallback';
import { fetchCoinHistory, fetchCurrentCrypto, fetchHistoricalAverage } from '@/lib/api';
import { DatePicker } from './ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper components
const CoinIcon: React.FC<{ symbol: string }> = ({ symbol }) => (
  <img
    src={`https://assets.coingecko.com/coins/images/1/large/bitcoin.png?symbol=${symbol?.toLowerCase?.()}`}
    alt={symbol}
    className="w-8 h-8 rounded-full bg-muted border mr-3"
    onError={(e) => {
      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?';
    }}
  />
);

const TableSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-1/3" />
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
    <span className="text-muted-foreground text-lg font-medium">{message}</span>
  </div>
);

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
  const chartKey = symbol + '-' + historyRange;

  const price =
    'price' in selectedCoin && typeof selectedCoin.price === 'number' ? selectedCoin.price : null;
  const marketCap =
    'marketCap' in selectedCoin && typeof selectedCoin.marketCap === 'number'
      ? selectedCoin.marketCap
      : null;
  const change24h =
    'change24h' in selectedCoin && typeof selectedCoin.change24h === 'number'
      ? selectedCoin.change24h
      : null;

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <CoinIcon symbol={symbol} />
          <div>
            <div className="text-2xl font-bold">
              {name} {symbol ? `(${symbol.toUpperCase()})` : ''}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-col h-28 justify-between p-4">
              <div className="text-sm font-medium text-muted-foreground text-left">
                Current Price
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {price ? `$${price.toLocaleString?.() ?? price}` : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col h-28 justify-between p-4">
              <div className="text-sm font-medium text-muted-foreground text-left">Market Cap</div>
              <div className="flex-1 flex items-center justify-center min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-2xl font-bold truncate overflow-hidden whitespace-nowrap cursor-pointer">
                        {marketCap ? `$${marketCap.toLocaleString?.() ?? marketCap}` : 'N/A'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {marketCap ? `$${marketCap.toLocaleString?.() ?? marketCap}` : 'N/A'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col h-28 justify-between p-4">
              <div className="text-sm font-medium text-muted-foreground text-left">24h Change</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {change24h !== null && (
                    <>
                      {change24h > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : change24h < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                      <Badge
                        variant={
                          change24h > 0 ? 'default' : change24h < 0 ? 'destructive' : 'secondary'
                        }
                        className={
                          change24h > 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                        }
                      >
                        {`${change24h.toFixed?.(2) ?? change24h}%`}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">History Range</label>
            <div className="flex flex-wrap gap-2">
              {historyRanges.map((r) => (
                <Button
                  key={r.value}
                  variant={historyRange === r.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setHistoryRange(String(r.value));
                    refetchHistory();
                  }}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {isLoadingHistory ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-64 w-full" />
                </div>
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
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
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

  // Search, sort, and filter state
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterChange, setFilterChange] = useState<'all' | 'positive' | 'negative'>('all');

  const {
    data: currentData,
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
    error: errorCurrent,
  } = useQuery<{ data: CurrentCrypto[] } | CurrentCrypto[]>({
    queryKey: ['current-crypto', search, sortKey, sortDir, filterChange],
    queryFn: () => fetchCurrentCrypto({ search, sortKey, sortDir, filterChange }),
    enabled: tab === 'current',
    refetchInterval: 1800000,
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
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Cryptocurrency Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Track and analyze cryptocurrency market data
          </p>
        </div>

        <Tabs.Root value={tab} onValueChange={handleTabChange} className="w-full">
          <Tabs.List className="grid w-full grid-cols-2 bg-muted rounded-lg p-1 max-w-md mx-auto">
            <Tabs.Trigger
              value="current"
              className={`rounded-md px-6 py-3 text-sm font-medium transition-all ${
                tab === 'current'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Current Market
            </Tabs.Trigger>
            <Tabs.Trigger
              value="average"
              className={`rounded-md px-6 py-3 text-sm font-medium transition-all ${
                tab === 'average'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Historical Average
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="current" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Cryptocurrencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter Controls */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or symbol..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={filterChange}
                    onValueChange={(value: 'all' | 'positive' | 'negative') =>
                      setFilterChange(value)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Coins</SelectItem>
                      <SelectItem value="positive">Gainers</SelectItem>
                      <SelectItem value="negative">Losers</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortKey} onValueChange={setSortKey}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="symbol">Symbol</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="marketCap">Market Cap</SelectItem>
                      <SelectItem value="change24h">24h Change</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortDir}
                    onValueChange={(value: 'asc' | 'desc') => setSortDir(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col xl:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <Card>
                      <CardContent className="p-0">
                        {isLoadingCurrent ? (
                          <TableSkeleton />
                        ) : isErrorCurrent ? (
                          <div className="p-6">
                            <ErrorFallback error={errorCurrent as Error} />
                          </div>
                        ) : (
                          <CryptoTable
                            data={extractArray<CurrentCrypto>(currentData)}
                            onCoinClick={handleCoinClick}
                            selectedCoin={selectedCoin ?? undefined}
                          />
                        )}
                      </CardContent>
                    </Card>
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
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="average" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Historical Averages by Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-2">
                    <DatePicker
                      label="Start Date"
                      value={start}
                      onChange={(v) => handleDateChange('start', v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <DatePicker
                      label="End Date"
                      value={end}
                      onChange={(v) => handleDateChange('end', v)}
                    />
                  </div>
                  <Button
                    disabled={!start || !end}
                    onClick={() => refetchAverage()}
                    className="px-8"
                  >
                    Get Average Data
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {isLoadingAverage ? (
                      <TableSkeleton />
                    ) : isErrorAverage ? (
                      <div className="p-6">
                        <ErrorFallback error={errorAverage as Error} />
                      </div>
                    ) : dateRangeTouched &&
                      (!averageData || extractArray<AverageCrypto>(averageData).length === 0) ? (
                      <div className="p-6">
                        <EmptyState message="No data available for the selected date range" />
                      </div>
                    ) : (
                      <CryptoTable data={extractArray<AverageCrypto>(averageData)} isAverage />
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
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
}> = ({ data, isAverage, onCoinClick, selectedCoin }) => {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="font-semibold">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((coin) => {
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
                <TableRow
                  key={symbol}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                  onClick={onCoinClick ? () => onCoinClick(coin) : undefined}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <CoinIcon symbol={symbol} />
                      <span>{'name' in coin ? coin.name : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {symbol.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    $
                    {price !== undefined && price !== null
                      ? price.toLocaleString?.() ?? price
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono">
                    $
                    {marketCap !== undefined && marketCap !== null
                      ? marketCap.toLocaleString?.() ?? marketCap
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {change24h !== undefined && change24h !== null ? (
                      <div className="flex items-center gap-2">
                        {change24h > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : change24h < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : null}
                        <Badge
                          variant={
                            change24h > 0 ? 'default' : change24h < 0 ? 'destructive' : 'secondary'
                          }
                          className={
                            change24h > 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                          }
                        >
                          {change24h.toFixed?.(2) ?? change24h}%
                        </Badge>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <EmptyState message="No data available" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DashboardPage;
