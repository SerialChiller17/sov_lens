export function formatPortfolioCurrency(value: number) {
  return `$${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatPortfolioTapePrice(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
