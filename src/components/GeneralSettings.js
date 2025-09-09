import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

export default function GeneralSettings() {
  const { tpsPct, tvqPct, setTpsPct, setTvqPct, saveTaxSettings } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveTaxSettings = async () => {
    try {
      setLoading(true);
      setMessage('');
      await saveTaxSettings();
      setMessage('Tax settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save tax settings. Please try again.');
      console.error('Error saving tax settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-tab">
      <h3>General Settings</h3>
      
      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="tax-settings">
        <h4>Tax Configuration</h4>
        <div className="tax-inputs">
          <label>
            TPS %:
            <input
              type="number"
              step="0.001"
              value={tpsPct}
              onChange={(e) => setTpsPct(parseFloat(e.target.value) || 0)}
            />
          </label>
          <label>
            TVQ %:
            <input
              type="number"
              step="0.001"
              value={tvqPct}
              onChange={(e) => setTvqPct(parseFloat(e.target.value) || 0)}
            />
          </label>
        </div>
        <button
          className="add-btn"
          onClick={handleSaveTaxSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Tax Settings'}
        </button>
      </div>
    </div>
  );
}
