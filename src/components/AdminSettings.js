import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { checkPasswordStrength } from '../utils';

export default function AdminSettings() {
  const { restaurants, airlines, addRestaurant, addAirline } = useApp();
  const { currentUser } = useAuth();
  
  const [newRestaurant, setNewRestaurant] = useState('');
  const [newAirline, setNewAirline] = useState('');
  const [newAirlineCode, setNewAirlineCode] = useState('');
  const [message, setMessage] = useState('');

  const handleAddRestaurant = async () => {
    if (!newRestaurant.trim()) {
      setMessage('Please enter a restaurant name');
      return;
    }

    try {
      await addRestaurant(newRestaurant.trim());
      setNewRestaurant('');
      setMessage('Restaurant added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to add restaurant. Please try again.');
      console.error('Error adding restaurant:', error);
    }
  };

  const handleAddAirline = async () => {
    if (!newAirline.trim() || !newAirlineCode.trim()) {
      setMessage('Please enter both airline name and code');
      return;
    }

    try {
      await addAirline(newAirline.trim(), newAirlineCode.trim().toUpperCase());
      setNewAirline('');
      setNewAirlineCode('');
      setMessage('Airline added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to add airline. Please try again.');
      console.error('Error adding airline:', error);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="settings-tab">
        <h3>Access Denied</h3>
        <p>You need admin privileges to access this section.</p>
      </div>
    );
  }

  return (
    <div className="admin-tab">
      <h3>Admin Settings</h3>
      
      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="restaurant-settings">
        <h4>Restaurants</h4>
        <div className="list-container">
          <ul>
            {restaurants.map((r, index) => (
              <li key={index}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="add-form">
          <input
            placeholder="New Restaurant Name"
            value={newRestaurant}
            onChange={(e) => setNewRestaurant(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddRestaurant}>
            Add Restaurant
          </button>
        </div>
      </div>

      <div className="airline-settings">
        <h4>Airlines</h4>
        <div className="list-container">
          <ul>
            {Object.entries(airlines).map(([name, code]) => (
              <li key={name}>
                {name} - {code}
              </li>
            ))}
          </ul>
        </div>
        <div className="add-form">
          <input
            placeholder="Airline Name"
            value={newAirline}
            onChange={(e) => setNewAirline(e.target.value)}
          />
          <input
            placeholder="Airline Code"
            value={newAirlineCode}
            onChange={(e) => setNewAirlineCode(e.target.value.toUpperCase())}
            maxLength="3"
          />
          <button className="add-btn" onClick={handleAddAirline}>
            Add Airline
          </button>
        </div>
      </div>
    </div>
  );
}
