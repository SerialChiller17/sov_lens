export function formatPortfolioCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPortfolioTapePrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatSignedPortfolioCurrency(value: number) {
  return `${value > 0 ? "+" : ""}${formatPortfolioCurrency(value)}`;
}

export function formatSignedPortfolioMove(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatSignedPortfolioPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
