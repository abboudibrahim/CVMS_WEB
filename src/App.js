import React, { useState, useMemo } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppProvider, useApp } from "./contexts/AppContext";
import Login from "./components/Login";
import VoucherForm from "./components/VoucherForm";
import VoucherTable from "./components/VoucherTable";
import Filters from "./components/Filters";
import GeneralSettings from "./components/GeneralSettings";
import AdminSettings from "./components/AdminSettings";
import AgingReport from "./components/AgingReport";
import { TABS } from "./constants";
import { downloadCSV, formatCurrency } from "./utils";

// Main App Content Component
function AppContent() {
  const { currentUser, userRole, logout } = useAuth();
  const { vouchers, tpsPct, tvqPct } = useApp();
  const [activeTab, setActiveTab] = useState(TABS.VOUCHERS);
  
  // Filter states
  const [qAirline, setQAirline] = useState("");
  const [qRestaurant, setQRestaurant] = useState("");
  const [qReceipt, setQReceipt] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Filter vouchers based on search criteria
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchesAirline = qAirline
        ? v.airline.toLowerCase().includes(qAirline.toLowerCase())
        : true;
      const matchesRestaurant = qRestaurant ? v.restaurant === qRestaurant : true;
      const matchesReceipt = qReceipt ? v.receipt.includes(qReceipt) : true;
      const matchesDate =
        dateRange.from || dateRange.to
          ? v.date >= dateRange.from && v.date <= dateRange.to
          : true;
      return matchesAirline && matchesRestaurant && matchesReceipt && matchesDate;
    });
  }, [vouchers, qAirline, qRestaurant, qReceipt, dateRange]);

  const handleGenerateInvoice = (selectedVoucherIds) => {
    const selectedData = vouchers.filter((v) =>
      selectedVoucherIds.includes(v.id)
    );
    
    if (selectedData.length === 0) return;

    const invoiceNumber = selectedData[0].invoiceNumber;
    const subtotal = selectedData.reduce(
      (acc, v) => acc + parseFloat(v.subtotal || 0),
      0
    );
    const tps = +(subtotal * (tpsPct / 100)).toFixed(2);
    const tvq = +(subtotal * (tvqPct / 100)).toFixed(2);
    const total = +(subtotal + tps + tvq).toFixed(2);
    
    const invoiceCSV = [
      ["Invoice #", invoiceNumber],
      ["Restaurant", selectedData[0].restaurant],
      ["Airline", selectedData[0].airline],
      [],
      [
        "POS Receipt Date",
        "Receipt #",
        "Subtotal",
        "TPS",
        "TVQ",
        "Total",
        "Status",
      ],
    ];
    
    selectedData.forEach((v) =>
      invoiceCSV.push([
        v.date,
        v.receipt,
        formatCurrency(v.subtotal),
        formatCurrency(v.tps),
        formatCurrency(v.tvq),
        formatCurrency(v.total),
        v.status,
      ])
    );
    
    invoiceCSV.push(
      [],
      [
        "Totals",
        "",
        formatCurrency(subtotal),
        formatCurrency(tps),
        formatCurrency(tvq),
        formatCurrency(total),
      ]
    );
    
    downloadCSV(invoiceCSV, `Invoice_${invoiceNumber}.csv`);
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h2>Voucher Management System</h2>
        <div className="user-info">
          <span className="username">{currentUser.email}</span>
          <span className="user-role">({userRole})</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <nav className="tabs-nav">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "tab active" : "tab"}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* VOUCHERS TAB */}
      {activeTab === TABS.VOUCHERS && (
        <div className="vouchers-tab">
          <VoucherForm />
          
          <Filters
            qAirline={qAirline}
            setQAirline={setQAirline}
            qRestaurant={qRestaurant}
            setQRestaurant={setQRestaurant}
            qReceipt={qReceipt}
            setQReceipt={setQReceipt}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />

          <VoucherTable
            vouchers={filteredVouchers}
            onGenerateInvoice={handleGenerateInvoice}
          />
        </div>
      )}

      {/* GENERAL SETTINGS TAB */}
      {activeTab === TABS.GENERAL_SETTINGS && <GeneralSettings />}

      {/* SETTINGS TAB */}
      {activeTab === TABS.SETTINGS && <AdminSettings />}

      {/* AGING REPORT TAB */}
      {activeTab === TABS.AGING_REPORT && <AgingReport />}
    </div>
  );
}

// Main App Component with Providers
export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}