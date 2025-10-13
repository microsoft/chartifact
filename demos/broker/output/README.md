# Broker Client Investment Reports

This directory contains Chartifact investment reports generated for Alex Quantum Capital's clients based on their individual portfolios and investment profiles.

## Generated Reports

All reports have been successfully generated and are ready for viewing!

### 1. Kenji Tanaka - Tech Stocks & Cryptocurrency
**Profile:** 35-year-old software engineer with high-risk tolerance, focused on emerging technologies.

**Portfolio:**
- Cryptocurrency holdings (BTC, ETH, SOL)
- Tech stocks (NVDA, AMD, TSMC, PLTR)

**Preview Link:** [View Report](https://microsoft.github.io/chartifact/view/?load=https://raw.githubusercontent.com/microsoft/chartifact/6f53852/demos/broker/output/kenji-tanaka.idoc.json)

---

### 2. Priya Sharma - Real Estate & Mutual Funds
**Profile:** 45-year-old doctor with moderate risk tolerance, focused on long-term growth.

**Portfolio:**
- Real estate properties in CA, IL, and NY
- Mutual funds (VTSAX, VTIAX, VBTLX)

**Preview Link:** [View Report](https://microsoft.github.io/chartifact/view/?load=https://raw.githubusercontent.com/microsoft/chartifact/6f53852/demos/broker/output/priya-sharma.idoc.json)

---

### 3. Marcus Rodriguez - Bonds & Dividend Stocks
**Profile:** 58-year-old nearing retirement, low-risk tolerance, focused on income generation.

**Portfolio:**
- Government, corporate, and municipal bonds
- High-dividend stocks (JNJ, KO, PG)

**Preview Link:** [View Report](https://microsoft.github.io/chartifact/view/?load=https://raw.githubusercontent.com/microsoft/chartifact/6f53852/demos/broker/output/marcus-rodriguez.idoc.json)

---

### 4. Fatima Al-Fassi - Angel Investments & Commodities
**Profile:** 42-year-old venture capitalist, aggressive portfolio with high-risk/high-reward focus.

**Portfolio:**
- Angel investments in startups (InnovateAI, BioGenTech, QuantumLeap)
- Commodities (Gold, Silver, Crude Oil)

**Preview Link:** [View Report](https://microsoft.github.io/chartifact/view/?load=https://raw.githubusercontent.com/microsoft/chartifact/6f53852/demos/broker/output/fatima-al-fassi.idoc.json)

---

## Features

Each report includes:

1. **Client Profile** - Name, email, and investment philosophy
2. **Portfolio Summary** - Total value and key metrics
3. **Interactive Visualizations** - Charts tailored to investment types
4. **Editable Scenario Simulator** - Tabulator tables allowing real-time "what-if" analysis
5. **Brand Styling** - Professional design with Alex Quantum Capital branding (#44a08d)

## Technical Details

- **Format:** JSON (.idoc.json)
- **Schema Compliance:** All reports follow the Chartifact schema at https://microsoft.github.io/chartifact/schema/idoc_v1.json
- **Data Sources:** CSV data from client folders converted to inline data loaders
- **Interactivity:** Editable tabulators with reactive calculations

## How to Use

1. Click any preview link above to view the report in your browser
2. Edit values in the scenario simulator tables to see real-time portfolio adjustments
3. Download as standalone HTML for sharing with clients

## Validation

All JSON files have been validated for syntax correctness. For schema validation, run:

```bash
node packages/compiler/test/validate.mjs demos/broker/output/<client-name>.idoc.json
```
