export interface PnlInputs {
  revenue: number;
  loadedMiles: number;
  deadheadMiles: number;
  costPerMile: number;
  fixedCostWeekly: number;
  feePercent: number;
  weeksInRange: number;
}

export interface PnlResult {
  revenue: number;
  totalMiles: number;
  variableCost: number;
  fixedCost: number;
  dispatchFee: number;
  net: number;
  deadheadPercent: number;
  avgRatePerMile: number;
}

export function computePnl(inputs: PnlInputs): PnlResult {
  const totalMiles = inputs.loadedMiles + inputs.deadheadMiles;
  const variableCost = inputs.costPerMile * totalMiles;
  const fixedCost = inputs.fixedCostWeekly * inputs.weeksInRange;
  const dispatchFee = inputs.revenue * (inputs.feePercent / 100);
  const net = inputs.revenue - variableCost - fixedCost - dispatchFee;
  const deadheadPercent =
    totalMiles > 0 ? inputs.deadheadMiles / totalMiles : 0;
  const avgRatePerMile =
    inputs.loadedMiles > 0 ? inputs.revenue / inputs.loadedMiles : 0;

  return {
    revenue: inputs.revenue,
    totalMiles,
    variableCost,
    fixedCost,
    dispatchFee,
    net,
    deadheadPercent,
    avgRatePerMile,
  };
}

export function weeksBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
  return Math.max(diffDays, 1) / 7;
}

export function defaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const toISODate = (d: Date) => d.toISOString().split("T")[0];
  return { start: toISODate(start), end: toISODate(now) };
}
