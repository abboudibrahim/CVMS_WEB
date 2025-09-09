// --- Utility Functions ---
export function formatCurrency(n) {
  return Number.isNaN(+n) || n === "" ? "" : (+n).toFixed(2);
}

export function downloadCSV(rows, filename = "file.csv") {
  const csv = rows
    .map((r) =>
      r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function checkPasswordStrength(pwd) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
}

export function generateInvoiceNumber(date, restaurant, airline, airlines) {
  if (!date || !restaurant || !airline) return "";
  const restCode = restaurant.substring(0, 3).toUpperCase();
  const airlineCode = airlines[airline] || airline.substring(0, 3).toUpperCase();
  const [year, month] = date.split("-");
  return `${restCode}${airlineCode}${month}${year.slice(-2)}`;
}

export function calculateTaxes(subtotal, tpsPct, tvqPct) {
  const numericSubtotal = parseFloat(subtotal || 0);
  const tps = +(numericSubtotal * (tpsPct / 100)).toFixed(2);
  const tvq = +(numericSubtotal * (tvqPct / 100)).toFixed(2);
  const total = +(numericSubtotal + tps + tvq).toFixed(2);
  
  return { tps, tvq, total };
}

export function calculateAgingBuckets(vouchers) {
  const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  
  vouchers.forEach((v) => {
    if (v.status === "Unbilled") {
      const days = Math.floor(
        (new Date() - new Date(v.date)) / (1000 * 60 * 60 * 24)
      );
      const amount = parseFloat(v.total || 0);
      
      if (days <= 30) buckets["0-30"] += amount;
      else if (days <= 60) buckets["31-60"] += amount;
      else if (days <= 90) buckets["61-90"] += amount;
      else buckets["90+"] += amount;
    }
  });
  
  return buckets;
}
