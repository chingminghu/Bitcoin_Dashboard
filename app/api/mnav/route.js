function toDateString(input) {
  return new Date(input).toISOString().split("T")[0];
}

function normalizeTreasuryRows(raw) {
  return raw
    .map((item) => {
      const timestamp =
        item.timestamp ?? item.date ?? item.time ?? item[0];

      const holdings =
        item.total_holdings ?? item.holdings ?? item.balance ?? item[1];

      if (!timestamp || holdings == null) return null;

      return {
        date: toDateString(timestamp),
        btc_holdings: Number(holdings),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildStockMapFromTwelve(values) {
  return new Map(
    (values || []).map((item) => [
      item.datetime,
      Number(item.close),
    ])
  );
}

export async function GET() {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    const twelveKey = process.env.TWELVE_DATA_API_KEY;

    if (!finnhubKey) {
      throw new Error("Missing FINNHUB_API_KEY in .env.local");
    }

    if (!twelveKey) {
      throw new Error("Missing TWELVE_DATA_API_KEY in .env.local");
    }

    // 1) CoinGecko: Strategy BTC holdings history
    const treasuryUrl =
      "https://api.coingecko.com/api/v3/public_treasury/strategy/bitcoin/holding_chart?days=30&include_empty_intervals=true";

    const treasuryRes = await fetch(treasuryUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!treasuryRes.ok) {
      const msg = await treasuryRes.text();
      throw new Error(`CoinGecko treasury fetch failed: ${msg}`);
    }

    const treasuryJson = await treasuryRes.json();
    const treasuryRaw = Array.isArray(treasuryJson)
      ? treasuryJson
      : treasuryJson.data || treasuryJson.holdings || [];

    const treasuryRows = normalizeTreasuryRows(treasuryRaw);

    if (!treasuryRows.length) {
      throw new Error("No treasury holding data returned from CoinGecko");
    }

    // 2) CoinGecko: BTC daily prices
    const btcUrl =
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily";

    const btcRes = await fetch(btcUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!btcRes.ok) {
      const msg = await btcRes.text();
      throw new Error(`CoinGecko BTC price fetch failed: ${msg}`);
    }

    const btcJson = await btcRes.json();
    const btcPriceRows = (btcJson.prices || []).map(([timestamp, price]) => ({
      date: toDateString(timestamp),
      btc_price: Number(price),
    }));

    const btcPriceMap = new Map(
      btcPriceRows.map((row) => [row.date, row.btc_price])
    );

    // 3) Finnhub: latest market cap
    const finnhubUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=MSTR&token=${finnhubKey}`;

    const finnhubRes = await fetch(finnhubUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!finnhubRes.ok) {
      const msg = await finnhubRes.text();
      throw new Error(`Finnhub profile fetch failed: ${msg}`);
    }

    const finnhubJson = await finnhubRes.json();

    const latestMarketCap = Number(finnhubJson.marketCapitalization) * 1_000_000;
    if (!latestMarketCap) {
      throw new Error("Finnhub did not return marketCapitalization");
    }

    // 4) Twelve Data: MSTR daily stock prices
    const twelveUrl =
      `https://api.twelvedata.com/time_series?symbol=MSTR&interval=1day&outputsize=60&apikey=${twelveKey}`;

    const twelveRes = await fetch(twelveUrl, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!twelveRes.ok) {
      const msg = await twelveRes.text();
      throw new Error(`Twelve Data time_series fetch failed: ${msg}`);
    }

    const twelveJson = await twelveRes.json();

    if (twelveJson.status === "error") {
      throw new Error(twelveJson.message || "Twelve Data API error");
    }

    const stockValues = twelveJson.values || [];
    if (!stockValues.length) {
      throw new Error("No stock price data returned from Twelve Data");
    }

    // Twelve Data values 通常是新到舊，這裡轉成日期->close
    const stockPriceMap = buildStockMapFromTwelve(stockValues);

    // 找最新股價
    const latestStockEntry = stockValues[0];
    const latestStockPrice = Number(latestStockEntry.close);

    if (!latestStockPrice) {
      throw new Error("Unable to determine latest stock price from Twelve Data");
    }

    // 5) Merge and estimate daily market cap
    const merged = treasuryRows
      .map((row) => {
        const btcPrice = btcPriceMap.get(row.date) ?? null;
        const stockClose = stockPriceMap.get(row.date) ?? null;

        if (btcPrice == null || stockClose == null) return null;

        const estimatedMarketCap =
          latestMarketCap * (stockClose / latestStockPrice);

        const btcNav = row.btc_holdings * btcPrice;
        const mnav = estimatedMarketCap / btcNav;

        return {
          date: row.date,
          btc_price: Number(btcPrice.toFixed(2)),
          btc_holdings: Number(row.btc_holdings),
          stock_close: Number(stockClose.toFixed(2)),
          market_cap: Number(estimatedMarketCap.toFixed(2)),
          btc_nav: Number(btcNav.toFixed(2)),
          mnav: Number(mnav.toFixed(4)),
        };
      })
      .filter(Boolean);

    if (!merged.length) {
      throw new Error("No merged rows available after joining datasets");
    }

    return Response.json({
      success: true,
      company: "MSTR",
      indicator: "mNAV",
      market_cap_method:
        "Estimated from Finnhub latest market capitalization and Twelve Data daily stock prices",
      source: {
        treasury: "CoinGecko public_treasury holding_chart",
        btc_price: "CoinGecko market_chart",
        latest_market_cap: "Finnhub company profile 2",
        stock_price: "Twelve Data time_series",
      },
      data: merged,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}