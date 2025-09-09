import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { calculateAgingBuckets, formatCurrency } from '../utils';

export default function AgingReport() {
  const { vouchers } = useApp();

  const agingBuckets = useMemo(() => {
    return calculateAgingBuckets(vouchers);
  }, [vouchers]);

  const totalUnbilled = useMemo(() => {
    return Object.values(agingBuckets).reduce((sum, amount) => sum + amount, 0);
  }, [agingBuckets]);

  return (
    <div className="aging-tab">
      <h3>Aging Report</h3>
      <p className="report-description">
        Outstanding amounts by age for unbilled vouchers
      </p>
      
      <div className="aging-summary">
        <div className="total-unbilled">
          <strong>Total Unbilled: {formatCurrency(totalUnbilled)}</strong>
        </div>
      </div>

      <table className="aging-table">
        <thead>
          <tr>
            <th>0-30 Days</th>
            <th>31-60 Days</th>
            <th>61-90 Days</th>
            <th>90+ Days</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={agingBuckets["0-30"] > 0 ? "amount-due" : ""}>
              {formatCurrency(agingBuckets["0-30"])}
            </td>
            <td className={agingBuckets["31-60"] > 0 ? "amount-due" : ""}>
              {formatCurrency(agingBuckets["31-60"])}
            </td>
            <td className={agingBuckets["61-90"] > 0 ? "amount-due" : ""}>
              {formatCurrency(agingBuckets["61-90"])}
            </td>
            <td className={agingBuckets["90+"] > 0 ? "amount-overdue" : ""}>
              {formatCurrency(agingBuckets["90+"])}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="aging-legend">
        <div className="legend-item">
          <span className="legend-color amount-due"></span>
          <span>Amount Due</span>
        </div>
        <div className="legend-item">
          <span className="legend-color amount-overdue"></span>
          <span>Overdue</span>
        </div>
      </div>
    </div>
  );
}
