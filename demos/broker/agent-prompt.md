I have a folder structure where each folder is named after a client. Inside each client folder are CSV files containing their investment data. Each client invests differently—some in crypto, others in real estate, and some in stocks.

Please generate a Chartifact report for each client based on the CSV files and profile.md in their respective folders. The report should include:

1. A header that says Alex Quantum Capital on our brand color #44a08d in the background
2. Visualizations tailored to the type of investment (e.g., crypto trends, real estate ROI, stock performance).
3. A summary of key metrics and insights.
4. An editable tabulator that allows the client to simulate different investment scenarios.

## Examples
This is MANDATORY - read and understand each of our standard documents:
- docs/assets/examples/json/bank-statement.idoc.json
- docs/assets/examples/json/personal-budget.idoc.json
- docs/assets/examples/json/sales-report.idoc.json

## Output
The output should be one Chartifact report per client, organized and labeled clearly in a output folder.

## Schema
Ensure your document json adheres to the TypeScript declarations: docs/schema/idoc_v1.d.ts

## Validation
Check each json file for validation errors
example:
```sh
#from the root
node packages/compiler/test/validate.mjs docs/assets/examples/json/movie-picker.idoc.json
```