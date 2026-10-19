import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking"); // 'connected' | 'error' | 'checking'
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("novastock_theme") || "dark";
  });

  // Filters & Sorting & View
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState("all"); // 'all' | 'in_stock' | 'low' | 'out'
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [productToDelete, setProductToDelete] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const searchInputRef = useRef(null);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("novastock_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Keyboard shortcut: Press / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current && !isModalOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Fetch products from backend
  const fetchProducts = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      let res;
      try {
        res = await api.get("/products");
      } catch (e) {
        res = await api.get("/products/");
      }
      if (Array.isArray(res.data)) {
        setProducts(res.data);
        setBackendStatus("connected");
      } else {
        setProducts([]);
        setBackendStatus("connected");
      }
    } catch (err) {
      console.error(err);
      setBackendStatus("error");
      showToast("Could not sync with FastAPI server on :8000", "error");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Compute categories dynamically
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.description) {
        const words = p.description.split(/[\s,]+/);
        words.forEach((w) => {
          if (w.trim()) set.add(w.trim().toLowerCase());
        });
      }
    });
    return Array.from(set);
  }, [products]);

  // Metrics summary
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const totalUnits = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const totalValuation = products.reduce(
      (acc, p) => acc + (Number(p.price) || 0) * (Number(p.quantity) || 0),
      0
    );
    const lowStockCount = products.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 10).length;
    const outOfStockCount = products.filter((p) => Number(p.quantity) <= 0).length;

    return {
      totalCount,
      totalUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          String(p.id).includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      result = result.filter(
        (p) => p.description && p.description.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Stock status filter
    if (stockStatusFilter === "in_stock") {
      result = result.filter((p) => Number(p.quantity) > 10);
    } else if (stockStatusFilter === "low") {
      result = result.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 10);
    } else if (stockStatusFilter === "out") {
      result = result.filter((p) => Number(p.quantity) <= 0);
    }

    // Sorting
    return result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "id" || sortField === "price" || sortField === "quantity") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, search, selectedCategory, stockStatusFilter, sortField, sortDirection]);

  // Calculate Next ID automatically for "Add Product"
  const getNextAvailableId = () => {
    if (!products.length) return 1;
    const maxId = Math.max(...products.map((p) => Number(p.id) || 0));
    return maxId + 1;
  };

  // Open modal for Add
  const openAddModal = () => {
    setModalMode("add");
    setForm({
      id: String(getNextAvailableId()),
      name: "",
      description: "",
      price: "",
      quantity: "1",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const openEditModal = (product) => {
    setModalMode("edit");
    setForm({
      id: String(product.id),
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      quantity: String(product.quantity ?? ""),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Quick Stock Step (+ or -)
  const adjustStock = async (product, delta) => {
    const currentQty = Number(product.quantity) || 0;
    const newQty = Math.max(0, currentQty + delta);
    if (newQty === currentQty) return;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, quantity: newQty } : p))
    );

    try {
      const payload = {
        id: Number(product.id),
        name: product.name,
        description: product.description,
        price: Number(product.price),
        quantity: newQty,
      };
      await api.put(`/products/${product.id}`, payload);
      showToast(`Updated "${product.name}" stock to ${newQty}`, "success");
    } catch (err) {
      // Revert if error
      fetchProducts(true);
      showToast(`Failed to update stock: ${err.message}`, "error");
    }
  };

  // Form submit (Add or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.id || isNaN(Number(form.id))) errors.id = "Valid numeric ID required";
    if (!form.name.trim()) errors.name = "Product name required";
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) {
      errors.price = "Valid non-negative price required";
    }
    if (form.quantity === "" || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
      errors.quantity = "Valid non-negative quantity required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: Number(form.id),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Math.floor(Number(form.quantity)),
      };

      if (modalMode === "edit") {
        await api.put(`/products/${payload.id}`, payload);
        showToast(`Product "${payload.name}" updated successfully`, "success");
      } else {
        await api.post("/products", payload);
        showToast(`Product "${payload.name}" created successfully`, "success");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Failed to save product";
      showToast(`Error: ${detail}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const triggerDelete = (product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      showToast(`Deleted "${productToDelete.name}"`, "info");
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredProducts.length) {
      showToast("No products to export", "info");
      return;
    }
    const headers = ["ID", "Name", "Description", "Price ($)", "Quantity", "Total Value ($)"];
    const rows = filteredProducts.map((p) => [
      p.id,
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`,
      p.price,
      p.quantity,
      (Number(p.price || 0) * Number(p.quantity || 0)).toFixed(2),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `novastock_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported catalog to CSV", "success");
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStockBadge = (qty) => {
    const q = Number(qty) || 0;
    if (q === 0) {
      return <span className="status-badge status-out">Out of Stock</span>;
    }
    if (q <= 10) {
      return <span className="status-badge status-low">Low Stock ({q})</span>;
    }
    return <span className="status-badge status-ok">In Stock ({q})</span>;
  };

  return (
    <div className="novastock-app">
      {/* Top Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="brand-group">
            <div className="logo-gem">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gem-grad1)" />
                <path d="M2 17L12 22L22 17" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="gem-grad1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ea580c" />
                    <stop offset="1" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-titles">
              <div className="brand-row">
                <h1 className="brand-title">NovaStock</h1>
                <span className="version-pill">v2.5 Pro</span>
              </div>
              <span className="brand-subtitle">Product Intelligence &amp; Inventory OS</span>
            </div>
          </div>

          <div className="nav-actions">
            {/* Backend connection status pill */}
            <div className={`status-pill ${backendStatus}`}>
              <span className="pulse-circle"></span>
              <span className="status-label">
                {backendStatus === "connected" && "FastAPI :8000 Connected"}
                {backendStatus === "checking" && "Connecting..."}
                {backendStatus === "error" && "API Offline"}
              </span>
            </div>

            {/* Theme Toggle */}
            <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}>
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {/* Sync / Refresh */}
            <button className="btn btn-ghost" onClick={() => fetchProducts()} disabled={loading} title="Synchronize catalog with backend">
              <svg className={loading ? "spin" : ""} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Sync</span>
            </button>

            {/* Export CSV */}
            <button className="btn btn-secondary" onClick={exportToCSV} title="Export current products as CSV">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Export CSV</span>
            </button>

            {/* Quick Add Product */}
            <button className="btn btn-primary" onClick={openAddModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>New Product</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="main-content">
        {/* KPI Metrics Strip */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-box green-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Active SKUs</span>
              <div className="metric-val-row">
                <span className="metric-value">{metrics.totalCount}</span>
                <span className="metric-trend ok">Catalog items</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box orange-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Inventory Valuation</span>
              <div className="metric-val-row">
                <span className="metric-value">${formatCurrency(metrics.totalValuation)}</span>
                <span className="metric-trend ok">Asset Value</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box forest-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Units</span>
              <div className="metric-val-row">
                <span className="metric-value">{metrics.totalUnits.toLocaleString()}</span>
                <span className="metric-trend ok">In Stock</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className={`metric-icon-box ${metrics.lowStockCount > 0 ? "amber-box" : "green-box"}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Stock Alerts</span>
              <div className="metric-val-row">
                <span className="metric-value">{metrics.lowStockCount + metrics.outOfStockCount}</span>
                <span className={`metric-trend ${metrics.lowStockCount > 0 ? "warn" : "ok"}`}>
                  {metrics.lowStockCount} low • {metrics.outOfStockCount} out
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Telemetry and Feature Banner */}
        <div className="telemetry-wrapper">
          <TaglineSection totalProducts={metrics.totalCount} inventoryValue={metrics.totalValuation} />
        </div>

        {/* Controls Bar: Search, Category Filters, View Switcher */}
        <section className="catalog-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search products by SKU, name, description... (Press /)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")} title="Clear search">
                  ✕
                </button>
              )}
              <kbd className="search-shortcut">/</kbd>
            </div>

            {/* Category Filter Pills */}
            <div className="filter-chips">
              <button
                className={`filter-chip ${selectedCategory === "ALL" ? "active" : ""}`}
                onClick={() => setSelectedCategory("ALL")}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-chip ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-right">
            {/* Stock status filter */}
            <select
              className="select-filter"
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt;10)</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock (0)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Content View: Table or Grid */}
        <section className="catalog-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Synchronizing with NovaStock database...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-graphic">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <h3>No matching products found</h3>
              <p>Try adjusting your search query, clearing filters, or adding a new inventory item.</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                + Add Product
              </button>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="table-card">
              <div className="table-responsive">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th className="th-sortable" onClick={() => handleSort("id")}>
                        SKU / ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="th-sortable" onClick={() => handleSort("name")}>
                        Product Details {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="th-sortable" onClick={() => handleSort("price")}>
                        Unit Price {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="th-sortable" onClick={() => handleSort("quantity")}>
                        Stock Level {sortField === "quantity" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th>Inventory Status</th>
                      <th>Total Value</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const totalVal = (Number(p.price || 0) * Number(p.quantity || 0)).toFixed(2);
                      return (
                        <tr key={p.id} className="inventory-row">
                          <td className="cell-sku">
                            <span className="sku-badge">#{p.id}</span>
                          </td>
                          <td className="cell-details">
                            <div className="product-title-row">
                              <span className="product-name">{p.name}</span>
                              {p.description && (
                                <span className="category-pill">{p.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="cell-price">
                            <span className="currency-symbol">$</span>
                            {formatCurrency(p.price)}
                          </td>
                          <td className="cell-quantity">
                            <div className="stock-stepper">
                              <button
                                className="stepper-btn"
                                onClick={() => adjustStock(p, -1)}
                                disabled={Number(p.quantity) <= 0}
                                title="Decrease stock by 1"
                              >
                                −
                              </button>
                              <span className="stepper-val">{p.quantity}</span>
                              <button
                                className="stepper-btn"
                                onClick={() => adjustStock(p, 1)}
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="cell-status">{getStockBadge(p.quantity)}</td>
                          <td className="cell-valuation">${formatCurrency(totalVal)}</td>
                          <td className="cell-actions">
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => openEditModal(p)}
                                title="Edit product"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => triggerDelete(p)}
                                title="Delete product"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid Cards View */
            <div className="product-cards-grid">
              {filteredProducts.map((p) => {
                const totalVal = (Number(p.price || 0) * Number(p.quantity || 0)).toFixed(2);
                const q = Number(p.quantity) || 0;
                const stockPercent = Math.min(100, (q / 30) * 100);

                return (
                  <div key={p.id} className="product-card">
                    <div className="card-top">
                      <span className="sku-badge">#{p.id}</span>
                      {p.description && <span className="category-pill">{p.description}</span>}
                    </div>

                    <h3 className="card-product-title">{p.name}</h3>

                    <div className="card-price-row">
                      <div className="price-tag">
                        <span className="currency-symbol">$</span>
                        <span className="price-number">{formatCurrency(p.price)}</span>
                      </div>
                      <span className="card-total-val">Val: ${formatCurrency(totalVal)}</span>
                    </div>

                    <div className="card-stock-section">
                      <div className="stock-label-row">
                        <span className="stock-units">{q} units in stock</span>
                        {getStockBadge(q)}
                      </div>
                      <div className="stock-progress-track">
                        <div
                          className={`stock-progress-bar ${q === 0 ? "out" : q <= 10 ? "low" : "ok"}`}
                          style={{ width: `${Math.max(5, stockPercent)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="card-footer-actions">
                      <div className="stock-stepper">
                        <button
                          className="stepper-btn"
                          onClick={() => adjustStock(p, -1)}
                          disabled={q <= 0}
                          title="Reduce stock"
                        >
                          −
                        </button>
                        <span className="stepper-val">{q}</span>
                        <button
                          className="stepper-btn"
                          onClick={() => adjustStock(p, 1)}
                          title="Add stock"
                        >
                          +
                        </button>
                      </div>

                      <div className="action-buttons">
                        <button className="icon-action-btn edit" onClick={() => openEditModal(p)} title="Edit">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="icon-action-btn delete" onClick={() => triggerDelete(p)} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-tag">{modalMode === "add" ? "CREATE NEW SKU" : "EDIT SKU"}</span>
                <h2>{modalMode === "add" ? "Register Product" : `Update SKU #${form.id}`}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-fields-grid">
                <div className="form-group">
                  <label>SKU / ID</label>
                  <input
                    type="number"
                    name="id"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    disabled={modalMode === "edit"}
                    placeholder="e.g. 101"
                    className={formErrors.id ? "input-err" : ""}
                  />
                  {formErrors.id && <span className="err-hint">{formErrors.id}</span>}
                </div>

                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mechanical Gaming Keyboard"
                    className={formErrors.name ? "input-err" : ""}
                    autoFocus
                  />
                  {formErrors.name && <span className="err-hint">{formErrors.name}</span>}
                </div>

                <div className="form-group full-width">
                  <label>Category / Description</label>
                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Gaming, Ergonomic RGB backlit"
                  />
                  <div className="quick-tags">
                    <span className="tag-hint">Presets:</span>
                    {["Gaming", "Budget", "Electronics", "Accessories", "Peripherals"].map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className="preset-tag"
                        onClick={() => setForm({ ...form, description: tag })}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 49.99"
                    className={formErrors.price ? "input-err" : ""}
                  />
                  {formErrors.price && <span className="err-hint">{formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="e.g. 25"
                    className={formErrors.quantity ? "input-err" : ""}
                  />
                  {formErrors.quantity && <span className="err-hint">{formErrors.quantity}</span>}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="preview-box">
                <span className="preview-label">Live Preview:</span>
                <div className="preview-content">
                  <span className="sku-badge">#{form.id || "?"}</span>
                  <span className="preview-name">{form.name || "Untitled Product"}</span>
                  <span className="category-pill">{form.description || "General"}</span>
                  <span className="preview-price">${formatCurrency(form.price)}</span>
                  <span className="preview-stock">{form.quantity || 0} in stock</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : modalMode === "add" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="modal-backdrop" onClick={() => setProductToDelete(null)}>
          <div className="modal-card delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3>Delete Product?</h3>
            <p>
              Are you sure you want to permanently remove <strong>{productToDelete.name}</strong> (SKU #{productToDelete.id}) from the catalog? This operation cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setProductToDelete(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Alert */}
      {toast.show && (
        <div className={`toast-alert toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {toast.type === "error" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            )}
            {toast.type === "info" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            )}
          </div>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* Modern Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-brand">NovaStock OS</span>
            <span className="footer-dot">•</span>
            <span className="footer-note">FastAPI REST Backend + SQLAlchemy + React Engine</span>
          </div>
          <div className="footer-right">
            <span>Production Grade Inventory Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
