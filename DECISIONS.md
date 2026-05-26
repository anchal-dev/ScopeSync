# Architectural & Product Decisions

This document outlines the major architectural, technical, and product decisions made during the development of the ScopeSync ESG platform. The goal is to provide transparency into our engineering judgment, realistic trade-offs, and the constraints of the current prototype.

## 1. Why CSV Ingestion Was Chosen
In enterprise environments, integrating directly with legacy systems is notoriously slow and politically complex. However, nearly all enterprise systems (ERP, Travel, Utilities) support scheduled or manual exports to flat files (CSV). We chose CSV ingestion because it aligns with realistic, immediate onboarding workflows. It allows analysts to start ingesting operational data on day one without requiring a 6-month IT integration project, keeping the prototype scope manageable and immediately valuable.

## 2. Why Simplified SAP Ingestion Was Used
Real SAP ERP integrations require complex middleware (e.g., SAP PI/PO, BAPI calls) and navigate heavily customized client schemas. For this prototype, building a live SAP connector would introduce unnecessary integration complexity that distracts from the core ESG normalization logic. Instead, we focused on processing realistic exported operational data, assuming the client can provide a simplified extract of fuel and procurement data.

## 3. Why Utility Ingestion Used CSV Instead of PDF Parsing
While utility bills are frequently delivered as PDFs, OCR (Optical Character Recognition) parsing introduces significant unreliability, latency, and maintenance overhead due to wildly varying invoice layouts. We chose to rely on CSV reports—commonly available from modern utility portals or smart meter APIs—to prioritize ingestion reliability and deterministic data mapping over OCR sophistication.

## 4. Why SQL Database Architecture Was Selected
ESG data management is fundamentally an accounting and compliance problem. We selected a relational SQL architecture over NoSQL to guarantee:
* **Transactional Consistency:** Anomalies must roll back entire ingestion batches cleanly.
* **Audit Trail Integrity:** Strict foreign key relationships between `EmissionRecord` and `AuditLog` are non-negotiable for compliance.
* **Relational Modeling Benefits:** SQL is highly optimized for the complex aggregations and cross-filtering required for ESG reporting.

## 5. Why SQLite Locally and PostgreSQL in Production
To minimize friction during local development, we used SQLite. It requires zero configuration and stores the database in a single file, allowing engineers to spin up the full stack instantly. For production, the platform is configured to seamlessly switch to PostgreSQL to handle concurrent writes, high-volume batch processing, and enterprise-grade scalability. This provides the best of both worlds: local developer simplicity and deployment flexibility.

## 6. Why Suspicious Anomaly Detection Was Implemented
Automated ingestion is dangerous without validation. Because ESG reports are heavily audited, we implemented an anomaly detection engine (flagging negative values, impossible quantities, or missing units). This creates a necessary "human-in-the-loop" analyst review workflow. It ensures bad data is intercepted before it contaminates the final compliance report, drastically simplifying audit preparation.

## 7. Why React + Django REST Was Chosen
We decoupled the frontend and backend to ensure scalability and maintainability. Django REST Framework provides rapid scaffolding for complex relational APIs and robust built-in authentication mechanisms. React (via Vite) enables a highly dynamic, state-driven user interface required for an interactive dashboard and data review table. This separation of concerns allows both stacks to scale independently.

## 8. Why the UI Design Was Kept Minimal and Enterprise-Focused
The UI intentionally avoids overly complex visual flair in favor of readability and information density. We drew inspiration from modern enterprise SaaS tools to ensure analyst usability. The focus is on clear typography, prominent status badges, and intuitive table filtering so analysts can process thousands of records efficiently without visual fatigue.

## 9. Assumptions Made During Prototyping
To ship the prototype efficiently, we made several conscious simplifications:
* **Simplified Emission Factors:** Hardcoded, simplified conversion rates were used instead of integrating a live emission factor database (e.g., DEFRA or EPA).
* **Simplified Scope Mapping:** Automated categorization was based on broad source types rather than granular activity-level decision trees.
* **Reduced ERP Complexity:** We assumed flat, normalized CSV structures rather than the complex relational hierarchy typical of raw ERP exports.
* **Mock Integrations:** We treated CSV uploads as proxies for what would eventually be automated API/SFTP pipelines.

## 10. Open Questions for Product Management in Production
Before moving this system to a true production environment, several critical requirements must be clarified with the Product Manager:
* **Retention Policies:** How long must raw CSVs and audit logs be retained for legal compliance? 
* **User Roles:** What are the exact RBAC (Role-Based Access Control) definitions for Data Entry vs. Analyst vs. Auditor?
* **Compliance Requirements:** Which specific regulatory frameworks (e.g., CSRD, SEC, ISSB) dictate our reporting outputs and audit stringency?
* **Ingestion Frequency:** Will clients upload data monthly, quarterly, or annually, and how does that impact our database sizing?
* **Approval Workflows:** Do we need multi-step approvals (e.g., Maker-Checker) for high-impact emission edits?
