export async function GET() {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily";

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch BTC data");
    }

    const data = await response.json();

    // CoinGecko 回傳的 prices 格式：
    // [ [timestamp, price], [timestamp, price], ... ]
    const prices = data.prices || [];

    const formatted = prices.map((item) => {
      const [timestamp, price] = item;

      const date = new Date(timestamp).toISOString().split("T")[0];

      return {
        date,
        btc_price: price,
      };
    });

    return Response.json({
      success: true,
      data: formatted,
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