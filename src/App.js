import React, { useState, useEffect, useMemo } from "react";
import "./App.css"; // Make sure to create this CSS file

// --- Constants ---
const INITIAL_RESTAURANTS = ["Subway", "Paramount", "Pretzels", "LFD Bagel"];
const INITIAL_AIRLINES = {
  "Air Canada": "ACD",
  "Air France": "AFR",
  "British Airways": "BAW",
};
const STORAGE_KEY = "vouchers_mvp_complete";
const TAX_KEY = "voucher_tax_settings_complete";
const USERS_KEY = "voucher_app_users";

// --- Utility Functions ---
function formatCurrency(n) {
  return Number.isNaN(+n) || n === "" ? "" : (+n).toFixed(2);
}
function downloadCSV(rows, filename = "file.csv") {
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
function checkPasswordStrength(pwd) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
}

// --- Tabs ---
const TABS = {
  VOUCHERS: "Vouchers",
  GENERAL_SETTINGS: "General Settings",
  SETTINGS: "Settings",
  AGING_REPORT: "Aging Report",
};

// --- Main App ---
export default function VoucherApp() {
  const [restaurants, setRestaurants] = useState(INITIAL_RESTAURANTS);
  const [airlines, setAirlines] = useState(INITIAL_AIRLINES);
  const [vouchers, setVouchers] = useState([]);
  const [archivedVouchers, setArchivedVouchers] = useState([]);
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.VOUCHERS);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    receipt: "",
    restaurant: restaurants[0],
    airline: Object.keys(airlines)[0],
    subtotal: "",
    invoiceNumber: "",
    status: "Unbilled",
  });

  const [tpsPct, setTpsPct] = useState(5.0);
  const [tvqPct, setTvqPct] = useState(9.975);

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(USERS_KEY);
    if (saved) return JSON.parse(saved);
    const defaultAdmin = [
      { username: "admin", password: "Admin123", role: "admin" },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultAdmin));
    return defaultAdmin;
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [changePasswordForm, setChangePasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNew: "",
  });

  const [newRestaurant, setNewRestaurant] = useState("");
  const [newAirline, setNewAirline] = useState("");
  const [newAirlineCode, setNewAirlineCode] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");

  const [qAirline, setQAirline] = useState("");
  const [qRestaurant, setQRestaurant] = useState("");
  const [qReceipt, setQReceipt] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const numericSubtotal = parseFloat(form.subtotal || 0);
  const computedTPS = useMemo(
    () => +(numericSubtotal * (tpsPct / 100)).toFixed(2),
    [numericSubtotal, tpsPct]
  );
  const computedTVQ = useMemo(
    () => +(numericSubtotal * (tvqPct / 100)).toFixed(2),
    [numericSubtotal, tvqPct]
  );
  const computedTotal = useMemo(
    () => +(numericSubtotal + computedTPS + computedTVQ).toFixed(2),
    [numericSubtotal, computedTPS, computedTVQ]
  );

  const invoicePreview = useMemo(() => {
    if (!form.date || !form.restaurant || !form.airline) return "";
    const restCode = form.restaurant.substring(0, 3).toUpperCase();
    const airlineCode =
      airlines[form.airline] || form.airline.substring(0, 3).toUpperCase();
    const [year, month] = form.date.split("-");
    return `${restCode}${airlineCode}${month}${year.slice(-2)}`;
  }, [form, airlines]);

  const filtered = vouchers.filter((v) => {
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

  const agingBuckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  vouchers.forEach((v) => {
    if (v.status === "Unbilled") {
      const days = Math.floor(
        (new Date() - new Date(v.date)) / (1000 * 60 * 60 * 24)
      );
      if (days <= 30) agingBuckets["0-30"] += parseFloat(v.total || 0);
      else if (days <= 60) agingBuckets["31-60"] += parseFloat(v.total || 0);
      else if (days <= 90) agingBuckets["61-90"] += parseFloat(v.total || 0);
      else agingBuckets["90+"] += parseFloat(v.total || 0);
    }
  });

  useEffect(() => {
    try {
      setVouchers(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {}
    try {
      setArchivedVouchers(
        JSON.parse(localStorage.getItem("archived_vouchers") || "[]")
      );
    } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem(TAX_KEY) || null);
      if (saved) {
        setTpsPct(saved.tpsPct);
        setTvqPct(saved.tvqPct);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
  }, [vouchers]);
  useEffect(() => {
    localStorage.setItem("archived_vouchers", JSON.stringify(archivedVouchers));
  }, [archivedVouchers]);
  useEffect(() => {
    localStorage.setItem(TAX_KEY, JSON.stringify({ tpsPct, tvqPct }));
  }, [tpsPct, tvqPct]);
  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  // --- Voucher Functions ---
  function resetForm() {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      receipt: "",
      restaurant: restaurants[0],
      airline: Object.keys(airlines)[0],
      subtotal: "",
      invoiceNumber: "",
      status: "Unbilled",
    });
  }

  function addVoucher() {
    if (!form.date || !form.receipt || !form.airline || !form.subtotal) {
      alert("Please fill required fields.");
      return;
    }
    const dup = vouchers.find(
      (v) => v.receipt === form.receipt && v.restaurant === form.restaurant
    );
    if (dup && !confirm("Duplicate receipt exists. Add anyway?")) return;
    const newRow = {
      ...form,
      invoiceNumber: invoicePreview,
      tps: computedTPS,
      tvq: computedTVQ,
      total: computedTotal,
      id: crypto.randomUUID(),
    };
    setVouchers((arr) => [newRow, ...arr]);
    resetForm();
  }

  function toggleSelectVoucher(id) {
    setSelectedVouchers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function removeVoucher(id) {
    setArchivedVouchers((prev) => [...prev, vouchers.find((v) => v.id === id)]);
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  }

  function generateInvoice() {
    if (selectedVouchers.length === 0) {
      alert("Select at least one voucher.");
      return;
    }
    const selectedData = vouchers.filter((v) =>
      selectedVouchers.includes(v.id)
    );
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
    setVouchers((prev) =>
      prev.map((v) =>
        selectedVouchers.includes(v.id) ? { ...v, status: "Invoiced" } : v
      )
    );
    setSelectedVouchers([]);
  }

  function exportVouchersCSV() {
    const rows = [
      [
        "Date",
        "Receipt",
        "Restaurant",
        "Airline",
        "Subtotal",
        "TPS",
        "TVQ",
        "Total",
        "Status",
      ],
    ];
    vouchers.forEach((v) =>
      rows.push([
        v.date,
        v.receipt,
        v.restaurant,
        v.airline,
        formatCurrency(v.subtotal),
        formatCurrency(v.tps),
        formatCurrency(v.tvq),
        formatCurrency(v.total),
        v.status,
      ])
    );
    downloadCSV(rows, "AllVouchers.csv");
  }

  function importVouchersCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const lines = event.target.result.split("\n").map((l) => l.split(","));
      lines.slice(1).forEach((cols) => {
        const [date, receipt, restaurant, airline, subtotal] = cols.map((c) =>
          c.trim()
        );
        if (date && receipt && restaurant && airline && subtotal) {
          if (
            vouchers.find(
              (v) => v.receipt === receipt && v.restaurant === restaurant
            )
          )
            return;
          const numericSubtotal = parseFloat(subtotal);
          const restCode = restaurant.substring(0, 3).toUpperCase();
          const airlineCode =
            airlines[airline] || airline.substring(0, 3).toUpperCase();
          const month = date.split("-")[1];
          const year = date.split("-")[0];
          const invoiceNumber = `${restCode}${airlineCode}${month}${year.slice(
            -2
          )}`;
          const newRow = {
            date,
            receipt,
            restaurant,
            airline,
            subtotal: numericSubtotal,
            tps: +(numericSubtotal * (tpsPct / 100)).toFixed(2),
            tvq: +(numericSubtotal * (tvqPct / 100)).toFixed(2),
            total: +(
              numericSubtotal *
              (1 + tpsPct / 100 + tvqPct / 100)
            ).toFixed(2),
            invoiceNumber,
            status: "Unbilled",
            id: crypto.randomUUID(),
          };
          setVouchers((prev) => [newRow, ...prev]);
        }
      });
    };
    reader.readAsText(file);
  }

  // --- Login & User Management ---
  function handleLogin() {
    const username = loginForm.username.trim();
    const password = loginForm.password.trim();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      alert("Invalid username or password.");
      return;
    }
    setCurrentUser(user);
    setLoginForm({ username: "", password: "" });
  }

  function handleLogout() {
    setCurrentUser(null);
  }

  if (!currentUser) {
    return (
      <div className="login-container">
        <h2>Voucher App Login</h2>
        <input
          placeholder="Username"
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm((f) => ({ ...f, username: e.target.value }))
          }
        />
        <input
          placeholder="Password"
          type="password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm((f) => ({ ...f, password: e.target.value }))
          }
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h2>Voucher App</h2>
        <div>
          <span>{currentUser.username}</span>
          <button onClick={handleLogout} className="logout-btn">
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

      {/* ------------------ Vouchers Tab ------------------ */}
      {activeTab === TABS.VOUCHERS && (
        <div className="vouchers-tab">
          <h3>Add Voucher</h3>
          <div className="voucher-form">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <input
              placeholder="Receipt #"
              value={form.receipt}
              onChange={(e) =>
                setForm((f) => ({ ...f, receipt: e.target.value }))
              }
            />
            <select
              value={form.restaurant}
              onChange={(e) =>
                setForm((f) => ({ ...f, restaurant: e.target.value }))
              }
            >
              {restaurants.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select
              value={form.airline}
              onChange={(e) =>
                setForm((f) => ({ ...f, airline: e.target.value }))
              }
            >
              {Object.keys(airlines).map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <input
              placeholder="Subtotal"
              value={form.subtotal}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtotal: e.target.value }))
              }
            />
            <div className="invoice-preview">Invoice #: {invoicePreview}</div>
            <button onClick={addVoucher} className="add-btn">
              Add Voucher
            </button>
          </div>

          <h3>Voucher List</h3>
          <table className="voucher-table">
            <thead>
              <tr>
                <th></th>
                <th>Date</th>
                <th>Receipt</th>
                <th>Restaurant</th>
                <th>Airline</th>
                <th>Subtotal</th>
                <th>TPS</th>
                <th>TVQ</th>
                <th>Total</th>
                <th>Status</th>
                <th>Invoice #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
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
                  <td>{v.status}</td>
                  <td>{v.invoiceNumber}</td>
                  <td>
                    <button
                      onClick={() => removeVoucher(v.id)}
                      className="archive-btn"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="voucher-actions">
            <button onClick={generateInvoice}>Generate Invoice</button>
            <button onClick={exportVouchersCSV}>Export CSV</button>
            <input type="file" accept=".csv" onChange={importVouchersCSV} />
          </div>
        </div>
      )}

      {/* ------------------ General Settings Tab ------------------ */}
      {activeTab === TABS.GENERAL_SETTINGS && (
        <div className="general-settings-tab">
          <h3>Tax Settings</h3>
          <div>
            <label>
              TPS %:{" "}
              <input
                type="number"
                value={tpsPct}
                onChange={(e) => setTpsPct(parseFloat(e.target.value))}
              />
            </label>
          </div>
          <div>
            <label>
              TVQ %:{" "}
              <input
                type="number"
                value={tvqPct}
                onChange={(e) => setTvqPct(parseFloat(e.target.value))}
              />
            </label>
          </div>

          <h3 style={{ marginTop: 20 }}>Add Restaurant</h3>
          <input
            placeholder="New Restaurant"
            value={newRestaurant}
            onChange={(e) => setNewRestaurant(e.target.value)}
          />
          <button
            onClick={() => {
              if (newRestaurant && !restaurants.includes(newRestaurant)) {
                setRestaurants([...restaurants, newRestaurant]);
                setNewRestaurant("");
              }
            }}
          >
            Add
          </button>

          <h3 style={{ marginTop: 20 }}>Add Airline</h3>
          <input
            placeholder="Airline Name"
            value={newAirline}
            onChange={(e) => setNewAirline(e.target.value)}
          />
          <input
            placeholder="Airline Code"
            value={newAirlineCode}
            onChange={(e) => setNewAirlineCode(e.target.value)}
          />
          <button
            onClick={() => {
              if (newAirline && newAirlineCode) {
                setAirlines({
                  ...airlines,
                  [newAirline]: newAirlineCode.toUpperCase(),
                });
                setNewAirline("");
                setNewAirlineCode("");
              }
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* ------------------ Settings Tab (Admin Only) ------------------ */}
      {activeTab === TABS.SETTINGS && currentUser.role === "admin" && (
        <div className="settings-tab">
          <h3>User Management</h3>
          <input
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
          />
          <select
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => {
              if (newUsername && checkPasswordStrength(newUserPassword)) {
                setUsers([
                  ...users,
                  {
                    username: newUsername,
                    password: newUserPassword,
                    role: newUserRole,
                  },
                ]);
                setNewUsername("");
                setNewUserPassword("");
                setNewUserRole("user");
              } else {
                alert(
                  "Invalid username or password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)."
                );
              }
            }}
          >
            Add User
          </button>

          <h4>Existing Users</h4>
          <ul>
            {users.map((u) => (
              <li key={u.username}>
                {u.username} ({u.role}){" "}
                {u.username !== currentUser.username && (
                  <button
                    onClick={() =>
                      setUsers(users.filter((x) => x.username !== u.username))
                    }
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>

          <h3 style={{ marginTop: 20 }}>Change Password</h3>
          <input
            placeholder="Old Password"
            type="password"
            value={changePasswordForm.oldPassword}
            onChange={(e) =>
              setChangePasswordForm({
                ...changePasswordForm,
                oldPassword: e.target.value,
              })
            }
          />
          <input
            placeholder="New Password"
            type="password"
            value={changePasswordForm.newPassword}
            onChange={(e) =>
              setChangePasswordForm({
                ...changePasswordForm,
                newPassword: e.target.value,
              })
            }
          />
          <input
            placeholder="Confirm New"
            type="password"
            value={changePasswordForm.confirmNew}
            onChange={(e) =>
              setChangePasswordForm({
                ...changePasswordForm,
                confirmNew: e.target.value,
              })
            }
          />
          <button
            onClick={() => {
              if (changePasswordForm.oldPassword !== currentUser.password) {
                alert("Old password incorrect");
                return;
              }
              if (
                changePasswordForm.newPassword !== changePasswordForm.confirmNew
              ) {
                alert("New passwords do not match");
                return;
              }
              if (!checkPasswordStrength(changePasswordForm.newPassword)) {
                alert("Password too weak");
                return;
              }
              const updatedUsers = users.map((u) =>
                u.username === currentUser.username
                  ? { ...u, password: changePasswordForm.newPassword }
                  : u
              );
              setUsers(updatedUsers);
              setCurrentUser({
                ...currentUser,
                password: changePasswordForm.newPassword,
              });
              setChangePasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmNew: "",
              });
              alert("Password updated");
            }}
          >
            Change Password
          </button>
        </div>
      )}

      {/* ------------------ Aging Report Tab ------------------ */}
      {activeTab === TABS.AGING_REPORT && (
        <div className="aging-report-tab">
          <h3>Aging Report (Unbilled Vouchers)</h3>
          <ul>
            {Object.entries(agingBuckets).map(([bucket, total]) => (
              <li key={bucket}>
                {bucket} days: ${total.toFixed(2)}
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              const rows = [["Aging Bucket", "Total"]];
              Object.entries(agingBuckets).forEach(([bucket, total]) =>
                rows.push([bucket, total])
              );
              downloadCSV(rows, "AgingReport.csv");
            }}
          >
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
