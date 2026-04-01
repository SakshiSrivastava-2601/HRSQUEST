export function formatINR(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
}


export function formatRupeesLabel(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}
