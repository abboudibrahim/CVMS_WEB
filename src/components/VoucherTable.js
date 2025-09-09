import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../utils';

export default function VoucherTable({ vouchers, onGenerateInvoice }) {
  const { archiveVoucher } = useApp();
  const [selectedVouchers, setSelectedVouchers] = useState([]);

  const toggleSelectVoucher = (id) => {
    setSelectedVouchers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleArchive = (id) => {
    if (window.confirm('Are you sure you want to archive this voucher?')) {
      archiveVoucher(id);
    }
  };

  const handleGenerateInvoice = () => {
    if (selectedVouchers.length === 0) {
      alert('Please select at least one voucher');
      return;
    }
    onGenerateInvoice(selectedVouchers);
    setSelectedVouchers([]);
  };

  const selectAll = () => {
    if (selectedVouchers.length === vouchers.length) {
      setSelectedVouchers([]);
    } else {
      setSelectedVouchers(vouchers.map(v => v.id));
    }
  };

  return (
    <div className="voucher-table-container">
      <div className="table-actions">
        <button
          className="secondary-btn"
          onClick={selectAll}
        >
          {selectedVouchers.length === vouchers.length ? 'Deselect All' : 'Select All'}
        </button>
        <button
          className="add-btn"
          onClick={handleGenerateInvoice}
          disabled={selectedVouchers.length === 0}
        >
          Generate Invoice ({selectedVouchers.length} selected)
        </button>
      </div>

      <table className="voucher-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedVouchers.length === vouchers.length && vouchers.length > 0}
                onChange={selectAll}
              />
            </th>
            <th>Date</th>
            <th>Receipt #</th>
            <th>Restaurant</th>
            <th>Airline</th>
            <th>Subtotal</th>
            <th>TPS</th>
            <th>TVQ</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.length === 0 ? (
            <tr>
              <td colSpan="11" style={{ textAlign: "center", color: "#777" }}>
                No vouchers found. Add a voucher or adjust filters.
              </td>
            </tr>
          ) : (
            vouchers.map((v) => (
              <tr key={v.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedVouchers.includes(v.id)}
                    onChange={() => toggleSelectVoucher(v.id)}
                  />
                </td>
                <td>{v.date}</td>
                <td>{v.receipt}</td>
                <td>{v.restaurant}</td>
                <td>{v.airline}</td>
                <td>{formatCurrency(v.subtotal)}</td>
                <td>{formatCurrency(v.tps)}</td>
                <td>{formatCurrency(v.tvq)}</td>
                <td>{formatCurrency(v.total)}</td>
                <td>
                  <span className={`status-badge status-${v.status.toLowerCase()}`}>
                    {v.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="archive-btn" 
                    onClick={() => handleArchive(v.id)}
                    title="Archive voucher"
                  >
                    Archive
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
