export function saferLookupUrl(mcNumber: string): string {
  const cleaned = mcNumber.replace(/\D/g, "");
  return `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${cleaned}`;
}
