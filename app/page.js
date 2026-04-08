import MnavChart from "@/components/MnavChart";
import AISummaryCard from "@/components/AISummaryCard";

async function getMnavData() {
  const res = await fetch("http://localhost:3000/api/mnav", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch mNAV data");
  }

  return res.json();
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMnavStatus(mnav) {
  if (mnav > 1) return "Trading above BTC NAV";
  if (mnav < 1) return "Trading below BTC NAV";
  return "Near BTC NAV";
}

export default async function Home() {
  const result = await getMnavData();
  const data = result.data || [];
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];

  const change =
    latest && previous ? Number((latest.mnav - previous.mnav).toFixed(4)) : null;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <section className="mb-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-3xl p-8 shadow-lg">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300 mb-3">
              DAT.co Indicator Dashboard
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              MSTR mNAV Dashboard
            </h1>
            <p className="text-slate-200 text-base md:text-lg max-w-3xl">
              Monitor the daily mNAV of Strategy (MSTR), based on BTC holdings,
              BTC price, stock price, and estimated market capitalization.
            </p>
          </div>
        </section>

        {latest && (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Latest mNAV
                </p>
                <div className="flex items-end gap-3 mb-3">
                  <h2 className="text-5xl font-bold text-slate-900">
                    {latest.mnav}
                  </h2>
                  {change !== null && (
                    <span
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        change >= 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {change >= 0 ? "+" : ""}
                      {change}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  {getMnavStatus(latest.mnav)}
                </p>

                <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latest Date</span>
                    <span className="font-medium text-slate-800">
                      {latest.date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">BTC NAV</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(latest.btc_nav)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    BTC Price
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(latest.btc_price)}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Daily BTC market price
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    BTC Holdings
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatNumber(latest.btc_holdings)}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Strategy treasury balance
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Estimated Market Cap
                  </p>
                  <p className="text-3xl font-bold text-slate-900 break-words">
                    {formatCurrency(latest.market_cap)}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Estimated from market data
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <MnavChart data={data} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-1">
                <AISummaryCard data={data} />
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Interpretation
                </h2>
                <p className="text-slate-600 leading-7">
                  mNAV compares Strategy’s estimated market capitalization with
                  the USD value of its Bitcoin holdings. A value above 1 implies
                  the equity market is pricing the company above the value of
                  its BTC treasury alone, while a value below 1 suggests the
                  stock is trading closer to or below its BTC-backed value.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Data Method
                </h2>
                <p className="text-slate-600 leading-7">
                  BTC holdings and BTC prices are collected from CoinGecko.
                  MSTR stock prices are collected from Twelve Data. Daily market
                  capitalization is estimated using the latest market
                  capitalization from Finnhub and the daily stock price ratio.
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}