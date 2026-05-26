# Data Architecture & Modeling

## Overview

ScopeSync's backend architecture is built on Django REST Framework, utilizing a relational SQL database. The system is designed to handle multi-tenant ESG (Environmental, Social, and Governance) data ingestion, rigorous normalization, analyst review workflows, and immutable audit logging.

By default, the platform uses SQLite for local development efficiency, but is fully configured and optimized for PostgreSQL in production environments to ensure scalability, robust concurrency, and enterprise-grade data integrity.

## Why SQL for ESG Data?

ESG data management is fundamentally an accounting problem. We selected a relational SQL architecture over NoSQL for several critical engineering reasons:

* **Transactional Consistency (ACID):** Normalization, anomaly detection, and audit logging must occur within atomic transactions. If a record fails validation, the entire ingestion batch and its associated audit trail must roll back cleanly without leaving partial or orphaned records.
* **Relational Integrity:** ESG reporting requires strict lineage linking an `EmissionRecord` to its `DataSource` and `Company`, and an `AuditLog` to its `EmissionRecord`. SQL foreign keys natively guarantee this referential integrity.
* **Complex Aggregation:** Analytics dashboards require summing normalized values and computing CO2e footprints grouped by Scope, Category, and Financial Year. SQL databases are highly optimized for these complex grouping and aggregation patterns.

### SQLite vs. PostgreSQL
* **Local (SQLite):** Used for rapid local development and testing. It requires zero configuration, stores data in a single file (`db.sqlite3`), and allows engineers to spin up the full stack instantly without container overhead.
* **Production (PostgreSQL):** The production target. It provides concurrent writes, advanced indexing, and enterprise-grade reliability necessary for processing high-volume batch CSV uploads simultaneously across multiple tenants.

---

## Core Data Models

### 1. Company
**Purpose:** Supports multi-tenancy and strict tenant isolation.

In a SaaS ESG platform, data privacy is paramount. Every single entity in the system—from data sources to emission records—is explicitly scoped to a `Company`. This foundational model guarantees that queries and API endpoints can systematically enforce tenant isolation, preventing cross-tenant data leakage via strict row-level filtering.

### 2. DataSource
**Purpose:** Tracks ingestion origin, uploaded files, timestamps, and source-of-truth lineage.

When raw CSV files (e.g., from SAP, Utility providers, or Corporate Travel systems) are uploaded, they are first registered as a `DataSource`.
* **Lineage Tracking:** It acts as the immutable parent for a batch of `EmissionRecord`s, ensuring every normalized data point can be traced back to the exact file and timestamp of its origin.
* **Batch Operations:** Allows the system to associate ingestion metrics (records created, suspicious flags detected) to a specific upload event.

### 3. EmissionRecord
**Purpose:** Stores and normalizes raw ESG activity records into standardized formats.

This is the core operational model of the platform. It bridges the gap between messy, unstructured external data and clean, reportable metrics.
* **Raw vs. Normalized Values:** The system explicitly preserves the exact `raw_value` and `raw_unit` extracted from the source CSV for auditability. It then computes a `normalized_value` and `normalized_unit` (e.g., converting gallons or MWh into standardized Liters or kWh).
* **Scope Categorization:** Records are automatically classified into GHG Protocol Scopes (Scope 1, Scope 2, Scope 3) based on the ingestion source and activity type.
* **Suspicious Flags:** An anomaly detection engine evaluates records during ingestion. Malformed dates, negative quantities, or statistically impossible values flip the `is_suspicious` boolean to `True`, proactively alerting analysts for manual review.
* **Review Lifecycle:** Records transition through a strict state machine (`Pending` $\rightarrow$ `Approved` / `Rejected`). Only `Approved` records are aggregated into official compliance reports.

### 4. AuditLog
**Purpose:** Provides an immutable audit trail for compliance and analyst accountability.

Financial and ESG auditors require mathematical certainty about how a final CO2e number was derived and who altered it.
* **Append-Only Philosophy:** Audit logs are never updated or deleted. Every state change creates a new, permanent log entry.
* **Approval Tracking & Edit Traceability:** When an analyst approves a record, rejects it, or edits a malformed normalized value, the `AuditLog` captures the `old_value`, `new_value`, the timestamp, and the user who executed the action.
* **Auditability:** Guarantees that any manual intervention in the automated normalization pipeline is completely transparent and justifiable to external compliance auditors.

---

## Data Workflows

### Ingestion Flow
1. A user uploads a CSV batch payload via the frontend.
2. The system instantiates a new `DataSource` to track the batch.
3. The file is pre-processed (handling outer-quoted lines, auto-detecting delimiters).
4. Raw rows are parsed, mapped to expected columns, and passed to the normalization engine.

### Normalization Flow
1. **Validation:** Checks for data integrity (e.g., stripping commas, preventing silent fallbacks to 0.0 on malformed strings).
2. **Standardization:** Converts diverse input units into standardized base units.
3. **Anomaly Detection:** Flags impossible or negative values as `suspicious`.
4. The system attempts a bulk insertion of `EmissionRecord` objects and their corresponding `AuditLog` creation events wrapped in a single database transaction.

### Approval Lifecycle & Source Tracking
1. All newly ingested records default to a `Pending` status.
2. Analysts use the review dashboard to filter for `Pending` or `Flagged` (suspicious) records.
3. Analysts review the raw lineage (via the `DataSource` relation), investigate anomalies, and issue `Approved`, `Rejected`, or `Edited` actions.
4. Each action simultaneously commits the state change to the `EmissionRecord` and appends an immutable `AuditLog`, completing the compliance loop.
