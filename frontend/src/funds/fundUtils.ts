import type { Fund, NavPoint } from "./types";

const DEFAULT_INVESTMENT_BASE = 10000;
const ROLLING_WINDOW_MONTHS = 36;

export function formatIndianCurrency(value: number, maximumFractionDigits = 2) {
  return `\u20b9${value.toLocaleString("en-IN", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
  })}`;
}

export function formatIndianCrores(value: number) {
  return `\u20b9${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

export function formatIndianCroresCompact(value: number) {
  if (value >= 1000) {
    return `\u20b9${(value / 1000).toLocaleString("en-IN", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    })}K Cr`;
  }

  return formatIndianCrores(value);
}

export function formatPercent(value: number, maximumFractionDigits = 2) {
  return `${value.toLocaleString("en-IN", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  })}%`;
}

export function formatSignedPercent(value: number, maximumFractionDigits = 2) {
  return `${value >= 0 ? "+" : ""}${formatPercent(value, maximumFractionDigits)}`;
}

function niceStep(rawStep: number) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;

  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);
  let niceFraction = 10;

  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 2.5) niceFraction = 2.5;
  else if (fraction <= 5) niceFraction = 5;

  return niceFraction * Math.pow(10, exponent);
}

export function niceRoundTicks(min: number, max: number, targetCount = 5, minimumStep = 0) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min];

  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const step = Math.max(niceStep((high - low) / Math.max(targetCount - 1, 1)), minimumStep);
  const start = Math.floor(low / step) * step;
  const end = Math.ceil(high / step) * step;
  const ticks: number[] = [];

  for (let value = start; value <= end + step * 0.5; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }

  return ticks;
}

export type NormalizedNavPoint = NavPoint & {
  value: number;
  changePercent: number;
};

export type RollingCagrPoint = NavPoint & {
  value: number | null;
};

function inDateRange(point: NavPoint, startDate: string, endDate: string) {
  return point.date >= startDate && point.date <= endDate;
}

export function normalizeToInvestment(
  navHistory: NavPoint[],
  startDate: string,
  endDate: string,
  investmentAmount = DEFAULT_INVESTMENT_BASE,
): NormalizedNavPoint[] {
  const points = navHistory.filter((point) => inDateRange(point, startDate, endDate));
  const firstNav = points[0]?.nav ?? 0;
  const baseAmount = Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : DEFAULT_INVESTMENT_BASE;

  if (!firstNav) return [];

  return points.map((point) => {
    const value = (point.nav / firstNav) * baseAmount;
    return {
      ...point,
      value,
      changePercent: ((value - baseAmount) / baseAmount) * 100,
    };
  });
}

export function computeRollingCAGR(navHistory: NavPoint[], startDate: string, endDate: string, windowMonths = ROLLING_WINDOW_MONTHS): RollingCagrPoint[] {
  const points = navHistory.filter((point) => point.date <= endDate);

  return points
    .map((point, index) => {
      if (index < windowMonths) {
        return { ...point, value: null };
      }

      const startPoint = points[index - windowMonths];
      const years = windowMonths / 12;
      const cagr = (Math.pow(point.nav / startPoint.nav, 1 / years) - 1) * 100;
      return { ...point, value: cagr };
    })
    .filter((point) => inDateRange(point, startDate, endDate));
}

export function computeTotalReturn(navHistory: NavPoint[], startDate: string, endDate: string) {
  const points = navHistory.filter((point) => inDateRange(point, startDate, endDate));
  const start = points[0];
  const end = points[points.length - 1];

  if (!start || !end || start.nav === 0) return 0;
  return ((end.nav - start.nav) / start.nav) * 100;
}

export function computeCAGR(navHistory: NavPoint[], startDate: string, endDate: string) {
  const points = navHistory.filter((point) => inDateRange(point, startDate, endDate));
  const start = points[0];
  const end = points[points.length - 1];

  if (!start || !end || start.nav === 0) return 0;

  const elapsedMs = new Date(end.date).getTime() - new Date(start.date).getTime();
  const years = Math.max(elapsedMs / (365.25 * 24 * 60 * 60 * 1000), 1 / 12);
  return (Math.pow(end.nav / start.nav, 1 / years) - 1) * 100;
}

export function computeAlphaVsBenchmark(fundCagr: number, benchmarkCagr: number) {
  return fundCagr - benchmarkCagr;
}

type CommentaryContext = {
  rangeReturn?: number;
  rangeCagr?: number;
  categoryAverage?: number;
  variant?: number;
};

function sentenceByVariant(options: string[], variant = 0) {
  return options[Math.abs(variant) % options.length];
}

export function generateAICommentary(fund: Fund, context: CommentaryContext = {}) {
  const drawdown = Math.abs(fund.drawdown.max);
  const stdDev = fund.volatility.stdDev;
  const fiveYear = fund.trailingReturns[5];
  const oneYear = fund.trailingReturns[1];
  const recovery = fund.drawdown.recoveryMonths;
  const categoryAverage = context.categoryAverage ?? fiveYear;
  const rangeCagr = context.rangeCagr ?? fiveYear;
  const rangeReturn = context.rangeReturn ?? oneYear;
  const variant = context.variant ?? fund.id.length;

  if (fund.category === "Debt") {
    return sentenceByVariant(
      [
        `This is the ballast in the comparison; its worst drawdown was only ${drawdown.toFixed(1)}%, so you are buying steadiness more than upside.`,
        `The curve stays intentionally quiet, with ${stdDev.toFixed(1)}% volatility doing the useful work of keeping the ride controlled.`,
      ],
      variant,
    );
  }

  if (fund.category === "Gold") {
    return sentenceByVariant(
      [
        `Gold behaves like portfolio insurance here; the ${drawdown.toFixed(1)}% drawdown is modest, and its better bursts arrive when equity lines wobble.`,
        `This is your uncorrelated sleeve, not a compounding engine; the line earns its place by moving differently from the equity funds.`,
      ],
      variant,
    );
  }

  if (fund.category === "Foreign ETF") {
    return sentenceByVariant(
      [
        `Foreign tilt makes this a rupee-weakness hedge, but the ${drawdown.toFixed(1)}% drawdown shows the hedge still behaves like risk capital.`,
        `You get global growth exposure here; the 2022 setback was visible, but the long line recovered because the underlying trend stayed intact.`,
      ],
      variant,
    );
  }

  if (drawdown > 35 && fiveYear > 24) {
    return sentenceByVariant(
      [
        `Volatile by design; the ${drawdown.toFixed(1)}% drawdown hurt, but the ${fiveYear.toFixed(1)}% 5Y CAGR paid patient holders for staying in.`,
        `This line asks for nerve, with a deep 2020 break followed by the kind of rebound that rewards a full-cycle holder.`,
      ],
      variant,
    );
  }

  if (drawdown > 30 && rangeCagr > categoryAverage + 2) {
    return sentenceByVariant(
      [
        `The recent compounding is strong, but you can see the cost of admission in the ${drawdown.toFixed(1)}% historical drawdown.`,
        `It is ahead of its category pace in this window, though the path reminds you that upside arrived with real equity volatility.`,
      ],
      variant,
    );
  }

  if (oneYear > categoryAverage + 5 && Math.abs(fiveYear - categoryAverage) < 3) {
    return sentenceByVariant(
      [
        `Recent strength is doing a lot of the talking, so you should check whether the last year is trend or just a catch-up burst.`,
        `The short-term run-up flatters the line; useful momentum, but not yet proof that the long-term engine changed.`,
      ],
      variant,
    );
  }

  if (drawdown < 15 && stdDev < 12) {
    return sentenceByVariant(
      [
        `A steady compounder; its drawdown stayed contained and the lower volatility makes the line easier to hold through noise.`,
        `This is the smoother ride in the set, with muted drawdowns doing more for behavior than for headline bragging rights.`,
      ],
      variant,
    );
  }

  if (recovery <= 6 && drawdown < 28) {
    return sentenceByVariant(
      [
        `A steady compounder; its 2020 drawdown was sharp enough to notice, but recovery came inside ${recovery} months.`,
        `You can see resilience in the recovery speed here, with the line repairing the COVID break in under ${recovery + 1} months.`,
      ],
      variant,
    );
  }

  if (fund.category === "Sector ETF") {
    return sentenceByVariant(
      [
        `This is concentrated exposure; the line can lead when banks work, but the ${drawdown.toFixed(1)}% drawdown says timing risk is real.`,
        `Useful as a sector call, not a core holding; the history shows sharper swings than a diversified equity fund.`,
      ],
      variant,
    );
  }

  if (fund.category === "Hybrid") {
    return sentenceByVariant(
      [
        `The debt sleeve softens the equity path, so you get a less dramatic line while still participating in recoveries.`,
        `This earns its keep by reducing the shock size; the ${drawdown.toFixed(1)}% drawdown is lower than pure equity peers.`,
      ],
      variant,
    );
  }

  if (rangeReturn < 0) {
    return `This window was unkind to the fund, so the useful question is whether the drawdown is temporary or structural.`;
  }

  return sentenceByVariant(
    [
      `The line compounds respectably without being the loudest in the room, which suits you if consistency matters more than peak returns.`,
      `A balanced equity profile; it did not avoid drawdowns, but the recovery pattern keeps the long-term case intact.`,
    ],
    variant,
  );
}
