# 🌲 NovaStock • Intelligent Inventory Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)

**NovaStock** is a full-stack inventory management operating system engineered with **FastAPI**, **PostgreSQL**, and **React**. Designed with a sophisticated **bottle green and warm orange** glassmorphic aesthetic, it combines real-time stock orchestration, ACID database transactions, executive KPI telemetry, and full CRUD workflows.

---

## ✨ Features

- **⚡ Full CRUD Rest API**: Seamless Create, Read, Update, and Delete operations synchronized between React and PostgreSQL via FastAPI.
- **📊 Executive KPI Telemetry**: Real-time calculated metrics:
  - **Active SKUs**: Total unique catalog items.
  - **Inventory Valuation**: Total monetary portfolio value (`Price × Quantity`).
  - **Total Units**: Aggregate inventory across all products.
  - **Stock Alerts**: Live warnings for low stock ($\le 10$ units) and stockouts ($0$ units).
- **🎛️ Dual View Modes**:
  - **Data Table View**: Column-sortable inventory grid with status pills (`In Stock`, `Low Stock`, `Out of Stock`).
  - **Grid Cards View**: Visual card tiles with animated stock health progress bars.
- **🔄 Instant Stock Steppers**: Inline `−` and `+` steppers directly on table rows and cards that commit instant `PUT` updates to the database.
- **🔍 Smart Search & Categorization**:
  - Live filtering by SKU ID, name, or description (with `/` keyboard shortcut).
  - Dynamically generated category filter pills.
  - Stock health dropdown filter (`In Stock`, `Low Stock`, `Out of Stock`).
- **📝 Product Management Modals**:
  - **Add/Edit Modal**: Automatic next-SKU suggestion and live preview card before submitting.
  - **Delete Confirmation Modal**: Custom safety modal preventing accidental deletions.
- **📥 CSV Data Export**: 1-click export of the active inventory to downloadable `.csv`.
- **🎨 Bespoke Design System**:
  - Luxurious **bottle green and warm orange** palette.
  - Glassmorphic panels with backdrop blur and responsive mobile/desktop layouts.
  - Built-in Dark and Light mode toggle.

---

## 🛠️ Architecture & Tech Stack

```
NovaStock/
├── main.py                     # FastAPI application & REST route handlers
├── Database_configuration.py   # PostgreSQL engine & session setup
├── Database_modules.py         # SQLAlchemy Product table schema
├── modules.py                  # Pydantic validation models
├── requirements.txt            # Python dependencies
└── frontend/                   # React SPA
    ├── src/
    │   ├── App.js              # Application state, CRUD logic, modals & views
    │   ├── App.css             # Bottle green & orange design system
    │   ├── TaglineSection.js   # Live telemetry banner
    │   ├── TaglineSection.css  # Telemetry styling
    │   └── index.js            # React root mount
    └── public/
        └── index.html          # HTML entry point with Google Fonts
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance asynchronous Python API |
| **ORM** | [SQLAlchemy](https://www.sqlalchemy.org/) | Relational database mapping and queries |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | ACID-compliant relational data store |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) | Request/response schema enforcement |
| **Frontend** | [React 18](https://react.dev/) | Dynamic, responsive user interface |
| **HTTP Client** | [Axios](https://axios-http.com/) | REST API communication |
| **Styling** | Vanilla CSS3 | Custom variables, glassmorphism, responsive grid |

---

## 🔌 API Endpoints (CRUD)

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| **GET** | `/products` | Retrieve all products | None |
| **GET** | `/products/{id}` | Retrieve single product by ID | None |
| **POST** | `/products` | Create a new product | `{"id": int, "name": str, "description": str, "price": float, "quantity": int}` |
| **PUT** | `/products/{id}` | Update existing product details/stock | `{"id": int, "name": str, "description": str, "price": float, "quantity": int}` |
| **DELETE** | `/products/{id}` | Permanently delete a product | None |

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **PostgreSQL** running locally on port `5432`

### 1. Database Configuration
Ensure PostgreSQL is running and create the database:
```sql
CREATE DATABASE "Project01";
```
Update credentials in `Database_configuration.py` if needed:
```python
db_url = "postgresql://postgres:admin123@localhost:5432/Project01"
```

### 2. Backend Setup
From the project root:
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000
```
API will be live at: **http://localhost:8000**  
Interactive API Docs (Swagger): **http://localhost:8000/docs**

### 3. Frontend Setup
From the `frontend` directory:
```bash
cd frontend

# Install packages
npm install

# Start React development server
npm start
```
Frontend will be live at: **http://localhost:3000**

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
