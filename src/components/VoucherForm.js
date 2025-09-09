import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { generateInvoiceNumber, calculateTaxes } from '../utils';

export default function VoucherForm({ onAddVoucher }) {
  const { restaurants, airlines, tpsPct, tvqPct, addVoucher } = useApp();
  
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    receipt: '',
    restaurant: restaurants[0] || '',
    airline: Object.keys(airlines)[0] || '',
    subtotal: '',
    status: 'Unbilled',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const invoicePreview = useMemo(() => {
    return generateInvoiceNumber(form.date, form.restaurant, form.airline, airlines);
  }, [form.date, form.restaurant, form.airline, airlines]);

  const { tps, tvq, total } = useMemo(() => {
    return calculateTaxes(form.subtotal, tpsPct, tvqPct);
  }, [form.subtotal, tpsPct, tvqPct]);

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.date || !form.receipt || !form.airline || !form.subtotal) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const voucherData = {
        ...form,
        invoiceNumber: invoicePreview,
        tps,
        tvq,
        total,
      };
      
      await addVoucher(voucherData);
      resetForm();
      if (onAddVoucher) onAddVoucher();
    } catch (error) {
      setError('Failed to add voucher. Please try again.');
      console.error('Error adding voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      receipt: '',
      restaurant: restaurants[0] || '',
      airline: Object.keys(airlines)[0] || '',
      subtotal: '',
      status: 'Unbilled',
    });
  };

  return (
    <div className="voucher-form">
      <h3>Add New Voucher</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Receipt #:
          <input
            name="receipt"
            value={form.receipt}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Restaurant:
          <select
            name="restaurant"
            value={form.restaurant}
            onChange={handleChange}
            required
          >
            {restaurants.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        
        <label>
          Airline:
          <select
            name="airline"
            value={form.airline}
            onChange={handleChange}
            required
          >
            {Object.keys(airlines).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        
        <label>
          Subtotal:
          <input
            type="number"
            step="0.01"
            name="subtotal"
            value={form.subtotal}
            onChange={handleChange}
            required
          />
        </label>
        
        <div className="invoice-preview">
          Invoice #: <strong>{invoicePreview}</strong>
        </div>
        
        <div className="tax-preview">
          <div>TPS: ${tps.toFixed(2)}</div>
          <div>TVQ: ${tvq.toFixed(2)}</div>
          <div><strong>Total: ${total.toFixed(2)}</strong></div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="add-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Voucher'}
          </button>
          <button type="button" className="secondary-btn" onClick={resetForm}>
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}
