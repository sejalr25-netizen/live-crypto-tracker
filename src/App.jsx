
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "./App.css";

const coins = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", emoji: "₿" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", emoji: "Ξ" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", emoji: "Ð" },
];

async function fetchPrices() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin&vs_currencies=usd"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch crypto prices");
  }

  return response.json();
}

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function App() {
  const queryClient = useQueryClient();

  const { data: prices, isPending } = useQuery({
    queryKey: ["cryptoPrices"],
    queryFn: fetchPrices,
    refetchInterval: 10000,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    initialData: getFavorites,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (coinId) => {
      const currentFavorites = getFavorites();

      const updatedFavorites = currentFavorites.includes(coinId)
        ? currentFavorites.filter((id) => id !== coinId)
        : [...currentFavorites, coinId];

      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      return updatedFavorites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return (
    <main className="container">
      <header className="header">
        <div>
          <p className="eyebrow">MARKET OVERVIEW</p>
          <h1>₿ Crypto Tracker</h1>
          <p className="subtitle">Live prices. Your favorite coins.</p>
        </div>
        <span className="live-badge">● LIVE · 10s</span>
      </header>

      <section className="price-section">
        <h2>Cryptocurrency Prices</h2>

        {isPending && <p className="message">Loading crypto prices...</p>}

        {prices && (
          <div className="coin-grid">
            {coins.map((coin) => {
              const isFavorite = favorites.includes(coin.id);

              return (
                <article className="coin-card" key={coin.id}>
                  <div className="coin-top">
                    <span className="coin-icon">{coin.emoji}</span>
                    <button
                      className={`favorite-button ${isFavorite ? "active" : ""}`}
                      onClick={() => favoriteMutation.mutate(coin.id)}
                      disabled={favoriteMutation.isPending}
                      aria-label={`Toggle ${coin.name} favorite`}
                    >
                      {isFavorite ? "★" : "☆"}
                    </button>
                  </div>

                  <p className="coin-symbol">{coin.symbol}</p>
                  <h3>{coin.name}</h3>
                  <p className="coin-price">
                    ${prices[coin.id]?.usd?.toLocaleString("en-US") ?? "N/A"}
                  </p>

                  <button
                    className="save-button"
                    onClick={() => favoriteMutation.mutate(coin.id)}
                    disabled={favoriteMutation.isPending}
                  >
                    {isFavorite ? "Remove Favorite" : "Add to Favorites"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="favorites-section">
        <h2>★ My Favorites</h2>

        {favorites.length === 0 ? (
          <p className="message">No favorites yet. Add a coin above!</p>
        ) : (
          <div className="favorite-list">
            {coins
              .filter((coin) => favorites.includes(coin.id))
              .map((coin) => (
                <div className="favorite-item" key={coin.id}>
                  <span>
                    {coin.emoji} {coin.name} ({coin.symbol})
                  </span>
                  <strong>
                    {prices
                      ? `$${prices[coin.id]?.usd?.toLocaleString("en-US") ?? "N/A"}`
                      : "Loading..."}
                  </strong>
                </div>
              ))}
          </div>
        )}
      </section>

      <footer>
        Prices provided by CoinGecko · Updates every 10 seconds
      </footer>
    </main>
  );
}

export default App;
