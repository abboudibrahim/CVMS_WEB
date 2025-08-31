import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { db } from "./firebase"; // Make sure your firebase.js is set up
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

// --- Constants ---
const INITIAL_RESTAURANTS = ["Subway", "Paramount", "Pretzels", "LFD Bagel"];
const INITIAL_AIRLINES = {
  "Air Canada": "ACD",
  "Air France": "AFR",
  "British Airways": "BAW",
};
const TABS = {
  VOUCHERS: "Vouchers",
  GENERAL_SETTINGS: "General Settings",
  SETTINGS: "Settings",
  AGING_REPORT: "Aging Report",
};

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

// --- Main App ---
export default function VoucherApp() {
  const [restaurants, setRestaurants] = useState(INITIAL_RESTAURANTS);
  const [airlines, setAirlines] = useState(INITIAL_AIRLINES);
  const [vouchers, setVouchers] = useState([]);
  const [archivedVouchers, setArchivedVouchers] = useState([]);
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.VOUCHERS);
  const [isInitializing, setIsInitializing] = useState(true);

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

  const [users, setUsers] = useState([
    { username: "admin", password: "Admin123", role: "admin" },
  ]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Initial load from Firestore with seeding when empty
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // USERS
        const usersSnap = await getDocs(collection(db, "users"));
        let usersList = [];
        if (usersSnap.empty) {
          const defaultAdmin = { username: "admin", password: "Admin123", role: "admin" };
          await addDoc(collection(db, "users"), defaultAdmin);
          usersList = [defaultAdmin];
        } else {
          usersList = usersSnap.docs.map((d) => d.data());
        }
        if (isMounted) setUsers(usersList);

        // RESTAURANTS
        const restSnap = await getDocs(collection(db, "restaurants"));
        let restList = [];
        if (restSnap.empty) {
          for (const r of INITIAL_RESTAURANTS) {
            await addDoc(collection(db, "restaurants"), { name: r });
          }
          restList = INITIAL_RESTAURANTS;
        } else {
          restList = restSnap.docs.map((d) => d.data().name).filter(Boolean);
          if (!restList.length) restList = INITIAL_RESTAURANTS;
        }
        if (isMounted) setRestaurants(restList);

        // AIRLINES
        const airSnap = await getDocs(collection(db, "airlines"));
        let airMap = {};
        if (airSnap.empty) {
          for (const [name, code] of Object.entries(INITIAL_AIRLINES)) {
            await addDoc(collection(db, "airlines"), { name, code });
          }
          airMap = INITIAL_AIRLINES;
        } else {
          const pairs = airSnap.docs.map((d) => d.data()).filter((x) => x && x.name && x.code);
          airMap = pairs.reduce((acc, { name, code }) => {
            acc[name] = code;
            return acc;
          }, {});
          if (!Object.keys(airMap).length) airMap = INITIAL_AIRLINES;
        }
        if (isMounted) setAirlines(airMap);

        // TAX
        const taxSnap = await getDocs(collection(db, "tax"));
        if (!taxSnap.empty && isMounted) {
          const tax = taxSnap.docs[0].data();
          if (typeof tax.tpsPct === "number") setTpsPct(tax.tpsPct);
          if (typeof tax.tvqPct === "number") setTvqPct(tax.tvqPct);
        }

        // VOUCHERS
        const vouchersSnap = await getDocs(collection(db, "vouchers"));
        const loadedVouchers = vouchersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (isMounted) {
          setVouchers(loadedVouchers.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
          // Align form defaults with freshly loaded lists
          setForm((f) => ({
            ...f,
            restaurant: restList && restList.length ? restList[0] : INITIAL_RESTAURANTS[0],
            airline: (() => {
              const names = Object.keys(airMap);
              return names && names.length ? names[0] : Object.keys(INITIAL_AIRLINES)[0];
            })(),
          }));
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
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

  async function addVoucher() {
    if (!form.date || !form.receipt || !form.airline || !form.subtotal) {
      alert("Please fill required fields.");
      return;
    }
    const newRow = {
      ...form,
      invoiceNumber: invoicePreview,
      tps: computedTPS,
      tvq: computedTVQ,
      total: computedTotal,
    };
    const docRef = await addDoc(collection(db, "vouchers"), newRow);
    const rowWithId = { id: docRef.id, ...newRow };
    setVouchers((arr) => [rowWithId, ...arr]);
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

  // --- Render ---
  if (isInitializing) {
    return (
      <div className="loading-container">
        <h2>Loading data…</h2>
        <p>Initializing cloud data, please wait.</p>
      </div>
    );
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
      {/* VOUCHERS TAB */}
      {activeTab === TABS.VOUCHERS && (
        <div className="vouchers-tab">
          <h3>Vouchers</h3>

          {/* Voucher Entry Form */}
          <div className="voucher-form">
            <label>
              Date:
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </label>
            <label>
              Receipt #:
              <input
                value={form.receipt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receipt: e.target.value }))
                }
              />
            </label>
            <label>
              Restaurant:
              <select
                value={form.restaurant}
                onChange={(e) =>
                  setForm((f) => ({ ...f, restaurant: e.target.value }))
                }
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
                value={form.airline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, airline: e.target.value }))
                }
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
                value={form.subtotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subtotal: e.target.value }))
                }
              />
            </label>
            <div className="invoice-preview">
              Invoice #: <strong>{invoicePreview}</strong>
            </div>
            <button onClick={addVoucher}>Add Voucher</button>
            <button onClick={resetForm}>Reset Form</button>
          </div>

          {/* Filter Section */}
          <div className="voucher-filters">
            <h4>Filters</h4>
            <input
              placeholder="Airline"
              value={qAirline}
              onChange={(e) => setQAirline(e.target.value)}
            />
            <input
              placeholder="Restaurant"
              value={qRestaurant}
              onChange={(e) => setQRestaurant(e.target.value)}
            />
            <input
              placeholder="Receipt #"
              value={qReceipt}
              onChange={(e) => setQReceipt(e.target.value)}
            />
            <label>
              From:
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, from: e.target.value }))
                }
              />
            </label>
            <label>
              To:
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, to: e.target.value }))
                }
              />
            </label>
            <button
              onClick={() =>
                setQAirline("") && setQRestaurant("") && setQReceipt("")
              }
            >
              Clear Filters
            </button>
          </div>

          {/* Voucher Table */}
          <table className="voucher-table">
            <thead>
              <tr>
                <th>Select</th>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", color: "#777" }}>
                    No vouchers found. Add a voucher or adjust filters.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
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
                    <td>
                      <button onClick={() => removeVoucher(v.id)}>Archive</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Invoice Generation */}
          <button
            onClick={generateInvoice}
            disabled={selectedVouchers.length === 0}
          >
            Generate Invoice for Selected
          </button>
        </div>
      )}

      {/* GENERAL SETTINGS TAB */}
      {activeTab === TABS.GENERAL_SETTINGS && (
        <div className="settings-tab">
          <h3>General Settings</h3>
          <div className="tax-settings">
            <label>
              TPS %:
              <input
                type="number"
                value={tpsPct}
                onChange={(e) => setTpsPct(parseFloat(e.target.value))}
              />
            </label>
            <label>
              TVQ %:
              <input
                type="number"
                value={tvqPct}
                onChange={(e) => setTvqPct(parseFloat(e.target.value))}
              />
            </label>
            <button
              onClick={async () => {
                const taxRef = collection(db, "tax");
                const snapshot = await getDocs(taxRef);
                if (!snapshot.empty) {
                  await updateDoc(doc(db, "tax", snapshot.docs[0].id), {
                    tpsPct,
                    tvqPct,
                  });
                } else {
                  await addDoc(taxRef, { tpsPct, tvqPct });
                }
                alert("Tax settings saved!");
              }}
            >
              Save Tax Settings
            </button>
          </div>

          <div className="restaurant-settings">
            <h4>Restaurants</h4>
            <ul>
              {restaurants.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <input
              placeholder="New Restaurant"
              value={newRestaurant}
              onChange={(e) => setNewRestaurant(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!newRestaurant) return;
                await addDoc(collection(db, "restaurants"), {
                  name: newRestaurant,
                });
                setRestaurants((prev) => [...prev, newRestaurant]);
                setNewRestaurant("");
              }}
            >
              Add Restaurant
            </button>
          </div>

          <div className="airline-settings">
            <h4>Airlines</h4>
            <ul>
              {Object.entries(airlines).map(([name, code]) => (
                <li key={name}>
                  {name} - {code}
                </li>
              ))}
            </ul>
            <input
              placeholder="New Airline"
              value={newAirline}
              onChange={(e) => setNewAirline(e.target.value)}
            />
            <input
              placeholder="Code"
              value={newAirlineCode}
              onChange={(e) => setNewAirlineCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={async () => {
                if (!newAirline || !newAirlineCode) return;
                await addDoc(collection(db, "airlines"), {
                  name: newAirline,
                  code: newAirlineCode,
                });
                setAirlines((prev) => ({
                  ...prev,
                  [newAirline]: newAirlineCode,
                }));
                setNewAirline("");
                setNewAirlineCode("");
              }}
            >
              Add Airline
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS / ADMIN TAB */}
      {activeTab === TABS.SETTINGS && currentUser.role === "admin" && (
        <div className="admin-tab">
          <h3>User Management</h3>
          <ul>
            {users.map((u, i) => (
              <li key={i}>
                {u.username} ({u.role})
              </li>
            ))}
          </ul>
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
            onClick={async () => {
              if (!newUsername || !newUserPassword) return;
              if (!checkPasswordStrength(newUserPassword)) {
                alert(
                  "Password must be 8+ chars, with uppercase, lowercase, and number"
                );
                return;
              }
              const newUser = {
                username: newUsername,
                password: newUserPassword,
                role: newUserRole,
              };
              await addDoc(collection(db, "users"), newUser);
              setUsers((prev) => [...prev, newUser]);
              setNewUsername("");
              setNewUserPassword("");
            }}
          >
            Add User
          </button>

          <h3>Change Your Password</h3>
          <input
            placeholder="Old Password"
            type="password"
            value={changePasswordForm.oldPassword}
            onChange={(e) =>
              setChangePasswordForm((f) => ({
                ...f,
                oldPassword: e.target.value,
              }))
            }
          />
          <input
            placeholder="New Password"
            type="password"
            value={changePasswordForm.newPassword}
            onChange={(e) =>
              setChangePasswordForm((f) => ({
                ...f,
                newPassword: e.target.value,
              }))
            }
          />
          <input
            placeholder="Confirm New"
            type="password"
            value={changePasswordForm.confirmNew}
            onChange={(e) =>
              setChangePasswordForm((f) => ({
                ...f,
                confirmNew: e.target.value,
              }))
            }
          />
          <button
            onClick={async () => {
              const { oldPassword, newPassword, confirmNew } =
                changePasswordForm;
              if (oldPassword !== currentUser.password) {
                alert("Old password incorrect");
                return;
              }
              if (newPassword !== confirmNew) {
                alert("New passwords do not match");
                return;
              }
              if (!checkPasswordStrength(newPassword)) {
                alert(
                  "Password must be 8+ chars, with uppercase, lowercase, and number"
                );
                return;
              }
              const userSnap = await getDocs(collection(db, "users"));
              const userDoc = userSnap.docs.find(
                (d) => d.data().username === currentUser.username
              );
              if (userDoc) {
                await updateDoc(doc(db, "users", userDoc.id), {
                  password: newPassword,
                });
                setCurrentUser((u) => ({ ...u, password: newPassword }));
                alert("Password changed!");
                setChangePasswordForm({
                  oldPassword: "",
                  newPassword: "",
                  confirmNew: "",
                });
              }
            }}
          >
            Change Password
          </button>
        </div>
      )}

      {/* AGING REPORT TAB */}
      {activeTab === TABS.AGING_REPORT && (
        <div className="aging-tab">
          <h3>Aging Report</h3>
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
                <td>{formatCurrency(agingBuckets["0-30"])}</td>
                <td>{formatCurrency(agingBuckets["31-60"])}</td>
                <td>{formatCurrency(agingBuckets["61-90"])}</td>
                <td>{formatCurrency(agingBuckets["90+"])}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
