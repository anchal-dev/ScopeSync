# Engineering Trade-offs & Scope Constraints

This document details what was intentionally **not** built during the development of the ScopeSync ESG prototype. In software engineering, building a focused, reliable prototype requires disciplined scoping. Every feature excluded below represents a conscious trade-off to prioritize core ESG data ingestion and audit workflows over infrastructure complexity.

## 1. No Live SAP API Integration
**Trade-off:** We excluded a direct, live integration with SAP ERP (via BAPI or OData).  
**Reasoning:** Enterprise ERP integrations are notoriously complex, requiring extensive middleware configuration and deep knowledge of highly customized client schemas. We opted to focus the prototype on handling realistic, flat CSV exports instead. This allowed us to prioritize robust ingestion modeling and normalization logic rather than getting bogged down in infrastructure complexity and authentication overhead.

## 2. No PDF Utility Bill Parsing
**Trade-off:** We chose not to build an OCR (Optical Character Recognition) engine to extract data directly from PDF utility bills.  
**Reasoning:** While OCR sounds impressive, extracting structured data from unstructured, highly variable PDF invoice layouts is unreliable and fragile. Facilities teams commonly export structured CSV reports from modern utility portals. We prioritized ingestion reliability and deterministic data mapping—using CSV files—over spending the majority of our development time tuning an OCR engine.

## 3. No Authentication or RBAC System
**Trade-off:** The system currently lacks a formal login portal and Role-Based Access Control (RBAC).  
**Reasoning:** Authentication is a solved problem in modern frameworks, but implementing a rigorous RBAC system (e.g., differentiating between a 'Data Entry Clerk', 'Analyst', and 'Compliance Auditor') is time-consuming. We deliberately excluded this to maximize our development bandwidth for the core assignment: the ESG ingestion architecture and immutable audit workflows.

## 4. No Asynchronous Background Processing
**Trade-off:** Data ingestion and normalization currently happen synchronously during the HTTP request lifecycle, rather than being offloaded to a background task queue (e.g., Celery/Redis).  
**Reasoning:** Introducing a message queue drastically increases deployment complexity and operational overhead. Because ingestion volumes in this prototype stage are highly manageable, synchronous processing provides immediate user feedback without the penalty of a complex distributed infrastructure. Background processing would become necessary in production, but was over-engineering for the current scope.

## 5. No Real Emission Factor Calculation Engine
**Trade-off:** We rely on simplified, hardcoded multiplication factors rather than integrating a live greenhouse gas calculation engine based on dynamic regional standards (e.g., EPA, DEFRA).  
**Reasoning:** A true emission calculation engine requires managing massive, frequently updated regulatory datasets. Our primary goal was demonstrating the data pipeline—ingestion, normalization, anomaly detection, and review. The simplified math acts as a placeholder to prove the workflow without needing to maintain complex compliance matrices.

## 6. No Real Third-Party Integrations
**Trade-off:** The platform uses mock data connectors and avoids live calls to external APIs.  
**Reasoning:** Relying on live third-party APIs during prototyping introduces dependency instability, API rate-limiting, and networking bottlenecks. By mocking these boundaries, we maintained complete control over the application state, ensuring we could focus strictly on realistic internal data modeling and resilient error handling.

## 7. No Advanced Analytics or Forecasting
**Trade-off:** The analytics dashboard is lightweight, providing core aggregations rather than predictive machine learning forecasts or multi-year comparative regressions.  
**Reasoning:** The priority for this iteration was creating a rock-solid foundation for ingestion and audit workflows. In the ESG space, transparency and data provenance are vastly more important than complex forecasting. We kept the analytics layer simple and interpretable to avoid masking underlying data quality issues.

## 8. No Dark Mode or Heavy UI Customization
**Trade-off:** The user interface adheres strictly to a clean, minimal, light-themed aesthetic without visual bloat or extensive personalization options.  
**Reasoning:** We prioritized enterprise readability over stylistic trends. ESG analysts often review hundreds of rows of tabular data sequentially. A clean, high-contrast, predictable UI minimizes visual fatigue and aligns perfectly with the utilitarian requirements of enterprise compliance tools.

---

## Conclusion: Prioritization Strategy
The overarching strategy for ScopeSync was ruthless prioritization of **reliability and workflow clarity** over an inflated feature count. 

In enterprise software—especially within compliance and auditing verticals—a platform that performs three tasks flawlessly is exponentially more valuable than a platform that attempts ten tasks unreliably. By actively choosing *not* to build complex integrations, background task queues, and OCR parsers, we successfully redirected our engineering focus. The result is a highly stable, deterministic data pipeline that demonstrably solves the core problem of ESG data ingestion and normalization.
