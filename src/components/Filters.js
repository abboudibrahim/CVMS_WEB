import React from 'react';

export default function Filters({ 
  qAirline, 
  setQAirline, 
  qRestaurant, 
  setQRestaurant, 
  qReceipt, 
  setQReceipt, 
  dateRange, 
  setDateRange 
}) {
  const clearFilters = () => {
    setQAirline('');
    setQRestaurant('');
    setQReceipt('');
    setDateRange({ from: '', to: '' });
  };

  return (
    <div className="voucher-filters">
      <h4>Filters</h4>
      <input
        placeholder="Search by airline"
        value={qAirline}
        onChange={(e) => setQAirline(e.target.value)}
      />
      <input
        placeholder="Search by restaurant"
        value={qRestaurant}
        onChange={(e) => setQRestaurant(e.target.value)}
      />
      <input
        placeholder="Search by receipt #"
        value={qReceipt}
        onChange={(e) => setQReceipt(e.target.value)}
      />
      <label>
        From:
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) =>
            setDateRange(prev => ({ ...prev, from: e.target.value }))
          }
        />
      </label>
      <label>
        To:
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) =>
            setDateRange(prev => ({ ...prev, to: e.target.value }))
          }
        />
      </label>
      <button
        className="secondary-btn"
        onClick={clearFilters}
      >
        Clear Filters
      </button>
    </div>
  );
}
