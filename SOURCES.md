# ESG Data Sources & Research Strategy

This document outlines the real-world ESG (Environmental, Social, and Governance) data formats and workflows researched during the development of ScopeSync. It details the assumptions made to construct the prototype's ingestion pipeline and acknowledges the limitations compared to enterprise-complete data realities.

## 1. SAP Fuel & Procurement Data

**Research & Context:**  
Enterprise clients tracking Scope 1 emissions (direct fuel combustion) rely heavily on ERP systems like SAP. Integrating directly via BAPI or OData is incredibly complex, so most ESG implementations begin by consuming flat-file (CSV) operational exports generated via scheduled SAP background jobs.

*   **Typical Fields:** Plant ID, Material Description (Fuel Type), Quantity, Unit of Measure (UoM), and Posting Date.
*   **Real-world Realities:** SAP exports are notorious for inconsistent date formats (e.g., `YYYY-MM-DD` vs `DD.MM.YYYY`), unpredictable text wrapping/quoting, and highly localized units (e.g., mixing metric Liters with imperial Gallons). 
*   **Assumptions & Limitations:** In the prototype, we assume the client can provide a flattened, single-header CSV without the complex parent-child material hierarchy typically found in native SAP extracts. 

## 2. Utility Electricity Data

**Research & Context:**  
Scope 2 emissions (purchased electricity) require data from utility providers. While smaller companies might manually OCR PDF utility bills, large enterprises rely on CSV exports from centralized utility web portals or smart meter data lakes.

*   **Typical Fields:** Facility ID, Provider, Billing Period Start/End, Consumption (kWh or MWh), Tariff/Rate Structure, and Total Cost.
*   **Real-world Realities:** Billing periods rarely align perfectly with calendar months. Meter reads can be estimated by the utility and then adjusted retrospectively months later.
*   **Assumptions & Limitations:** We bypassed OCR complexity entirely by assuming the ingestion of structured CSVs. The prototype assumes clean, pre-calculated total kWh usage per billing period and ignores complex multi-tier tariff structures or estimated-to-actual meter read adjustments.

## 3. Corporate Travel Data

**Research & Context:**  
Scope 3 Category 6 (business travel) is a massive data ingestion challenge. Travel management companies (TMCs) like Concur or Navan provide expense and booking exports containing hundreds of columns.

*   **Typical Fields:** Employee ID, Booking Date, Travel Type (Flight, Hotel, Rail, Car), Origin Airport, Destination Airport, Flight Distance, and Class (Economy vs. Business).
*   **Real-world Realities:** Flights require complex distance calculations (Short-haul vs. Long-haul) because emissions per kilometer vary drastically based on altitude. Hotel emissions vary heavily by country due to local grid carbon intensity.
*   **Assumptions & Limitations:** The prototype uses simplified travel categories (e.g., "Air Travel", "Hotel Stay"). We abstract away the need for live airport-code distance routing or passenger-class emission multipliers, relying instead on simplified proxy values.

## 4. ESG Scope Categorization

**Research & Context:**  
The Greenhouse Gas (GHG) Protocol defines three Scopes of emissions, which our platform must automatically categorize upon ingestion:
*   **Scope 1:** Direct emissions from owned or controlled sources (e.g., onsite diesel combustion, company fleet).
*   **Scope 2:** Indirect emissions from the generation of purchased electricity, steam, heating, and cooling.
*   **Scope 3:** All other indirect emissions that occur in a company's value chain (e.g., business travel, supply chain procurement).

*   **Assumptions & Limitations:** Real-world categorization requires complex decision trees (e.g., is a leased vehicle Scope 1 or Scope 3 depending on the operational vs. financial lease type?). The prototype employs simplified, deterministic mapping: `SAP Fuel` maps to Scope 1, `Utility Electricity` to Scope 2, and `Travel Data` to Scope 3.

## 5. Data Quality Challenges

**Research & Context:**  
Ingestion pipelines are useless if they cannot handle dirty data. In enterprise environments, ESG analysts spend up to 70% of their time cleaning data before reporting is possible.
*   **Inconsistent Units:** A single factory might report diesel in Liters, Gallons, and Tonnes within the same year.
*   **Malformed Data:** Missing quantity values, negative quantities (often used in ERPs for reversals/refunds), and comma-separated thousands in numeric strings.
*   **Prototype Solution:** We built an anomaly detection engine that flags suspicious records (e.g., negative values or statistically impossible quantities) rather than silently dropping them. This enforces a mandatory "human-in-the-loop" review workflow, providing transparency.

## 6. Prototype Limitations

**Research & Context:**  
To ship a functional, reliable prototype, strict boundaries were drawn around compliance complexity.
*   **Simplified Normalization:** We implemented a basic unit conversion dictionary. In reality, converting volume (Gallons of diesel) to energy to CO2e requires fluid density and caloric value factors.
*   **Simplified Emissions Assumptions:** We used static, hardcoded emission conversion factors. Enterprise tools require live integrations with databases like EPA eGRID or DEFRA, which issue updated factors annually.
*   **Reduced Compliance Complexity:** We focused strictly on carbon equivalents (CO2e) and bypassed tracking individual greenhouse gases (CH4, N2O, refrigerants) required for full IPCC compliance.
