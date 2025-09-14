```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "categorySummaryTable",
      "update": "data('categorySummaryTable')"
    },
    {
      "name": "editableTransactions",
      "update": "data('editableTransactions')"
    },
    {
      "name": "totalIncome",
      "update": "data('totalIncome')"
    },
    {
      "name": "totalExpenses",
      "update": "data('totalExpenses')"
    },
    {
      "name": "currentBalance",
      "update": "data('currentBalance')"
    },
    {
      "name": "expensesByCategory",
      "update": "data('expensesByCategory')"
    },
    {
      "name": "formattedIncome",
      "value": "$0.00",
      "update": "'$' + format(length(data('totalIncome')) > 0 ? data('totalIncome')[0].total : 0, ',.2f')"
    },
    {
      "name": "formattedExpenses",
      "value": "$0.00",
      "update": "'$' + format(abs(length(data('totalExpenses')) > 0 ? data('totalExpenses')[0].total : 0), ',.2f')"
    },
    {
      "name": "formattedBalance",
      "value": "$0.00",
      "update": "'$' + format(length(data('currentBalance')) > 0 ? data('currentBalance')[0].total : 0, ',.2f')"
    },
    {
      "name": "transactions",
      "update": "data('transactions')"
    }
  ],
  "data": [
    {
      "name": "transactions",
      "values": []
    },
    {
      "name": "editableTransactions",
      "values": []
    },
    {
      "name": "categorySummaryTable",
      "values": []
    },
    {
      "name": "totalIncome",
      "source": [
        "editableTransactions"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "datum.type === 'income'"
        },
        {
          "type": "aggregate",
          "ops": [
            "sum"
          ],
          "fields": [
            "amount"
          ],
          "as": [
            "total"
          ]
        }
      ]
    },
    {
      "name": "totalExpenses",
      "source": [
        "editableTransactions"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "datum.type === 'expense'"
        },
        {
          "type": "aggregate",
          "ops": [
            "sum"
          ],
          "fields": [
            "amount"
          ],
          "as": [
            "total"
          ]
        }
      ]
    },
    {
      "name": "currentBalance",
      "source": [
        "editableTransactions"
      ],
      "transform": [
        {
          "type": "aggregate",
          "ops": [
            "sum"
          ],
          "fields": [
            "amount"
          ],
          "as": [
            "total"
          ]
        }
      ]
    },
    {
      "name": "expensesByCategory",
      "source": [
        "editableTransactions"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "datum.type === 'expense'"
        },
        {
          "type": "formula",
          "expr": "abs(datum.amount)",
          "as": "absAmount"
        },
        {
          "type": "aggregate",
          "groupby": [
            "category"
          ],
          "ops": [
            "sum"
          ],
          "fields": [
            "absAmount"
          ],
          "as": [
            "totalAmount"
          ]
        }
      ]
    }
  ]
}
```


```css
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
body { display: grid; grid-template-areas: 'header header' 'chart summary' 'transactions transactions'; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1400px; margin: 0 auto; }
.group { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
#header { grid-area: header; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-align: center; }
#summary { grid-area: summary; text-align: center; min-width: 0; }
#chart { grid-area: chart; min-width: 0; }
#transactions { grid-area: transactions; min-width: 0; }
h1 { margin: 0; padding: 20px 0; font-size: 2em; font-weight: 600; }
h2 { margin: 10px 0; font-size: 2em; color: #2d3748; font-weight: 600; }
h3 { margin: 0 0 15px 0; font-size: 1.2em; color: #4a5568; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.tabulator { max-width: 100%; overflow: auto; }
.tabulator .tabulator-table { min-width: fit-content; }
.compact-table { font-size: 0.85em; }
.compact-table .tabulator-header { height: 30px; }
.compact-table .tabulator-row { height: 28px; }
@media (max-width: 768px) { body { grid-template-columns: 1fr; grid-template-areas: 'header' 'summary' 'chart' 'transactions'; } }
```


::: group {#header}

# 🏦 Personal Bank Statement
**Track your transactions and spending patterns**
:::
::: group {#summary}

### 📊 Account Summary
**Total Income:** {{formattedIncome}}
**Total Expenses:** {{formattedExpenses}}
**Current Balance:** {{formattedBalance}}

#### Category Summary


```json tabulator
{
  "dataSourceName": "expensesByCategory",
  "tabulatorOptions": {
    "layout": "fitColumns",
    "headerSort": false,
    "initialSort": [
      {
        "column": "totalAmount",
        "dir": "desc"
      }
    ],
    "columns": [
      {
        "title": "Category",
        "field": "category",
        "sorter": "string"
      },
      {
        "title": "Total",
        "field": "totalAmount",
        "formatter": "money",
        "formatterParams": {
          "symbol": "$",
          "precision": 2
        },
        "sorter": "number"
      }
    ]
  },
  "editable": false,
  "variableId": "categorySummaryTable"
}
```


:::
::: group {#chart}

### 🥧 Expense Distribution Chart


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 300,
  "data": {
    "name": "expensesByCategory"
  },
  "transform": [
    {
      "window": [
        {
          "op": "rank",
          "as": "rank"
        }
      ],
      "sort": [
        {
          "field": "totalAmount",
          "order": "descending"
        }
      ]
    }
  ],
  "mark": {
    "type": "arc",
    "innerRadius": 50,
    "stroke": "white",
    "strokeWidth": 2
  },
  "encoding": {
    "theta": {
      "field": "totalAmount",
      "type": "quantitative",
      "title": "Amount Spent"
    },
    "color": {
      "field": "category",
      "type": "nominal",
      "sort": {
        "field": "totalAmount",
        "order": "descending"
      },
      "scale": {
        "range": [
          "#667eea",
          "#764ba2",
          "#f093fb",
          "#4ecdc4",
          "#45b7d1",
          "#96ceb4",
          "#feca57",
          "#ff9ff3",
          "#54a0ff"
        ]
      },
      "legend": {
        "orient": "right",
        "title": "Category"
      }
    },
    "tooltip": [
      {
        "field": "category",
        "type": "nominal",
        "title": "Category"
      },
      {
        "field": "totalAmount",
        "type": "quantitative",
        "title": "Amount",
        "format": "$,.2f"
      }
    ]
  }
}
```


:::
::: group {#transactions}

### 📋 Transaction History
**Edit transactions below to update your statement**


```json tabulator
{
  "dataSourceName": "transactions",
  "tabulatorOptions": {
    "layout": "fitColumns",
    "maxHeight": "400px",
    "columns": [
      {
        "title": "Date",
        "field": "date",
        "sorter": "date",
        "editor": "date"
      },
      {
        "title": "Description",
        "field": "description",
        "editor": "input"
      },
      {
        "title": "Category",
        "field": "category",
        "editor": "list",
        "editorParams": {
          "values": [
            "Income",
            "Housing",
            "Food",
            "Transportation",
            "Utilities",
            "Entertainment",
            "Healthcare",
            "Shopping",
            "Health",
            "Savings"
          ]
        }
      },
      {
        "title": "Amount",
        "field": "amount",
        "formatter": "money",
        "formatterParams": {
          "symbol": "$",
          "precision": 2
        },
        "editor": "number",
        "editorParams": {
          "step": 0.01
        }
      },
      {
        "title": "Type",
        "field": "type",
        "editor": "list",
        "editorParams": {
          "values": [
            "income",
            "expense",
            "transfer"
          ]
        }
      }
    ],
    "addRowPos": "top"
  },
  "editable": true,
  "variableId": "editableTransactions"
}
```


:::


```csv transactions
date,description,category,amount,type
2024-01-02,Salary Deposit,Income,3500.00,income
2024-01-03,Rent Payment,Housing,-1200.00,expense
2024-01-04,Grocery Store,Food,-85.50,expense
2024-01-05,Gas Station,Transportation,-45.00,expense
2024-01-06,Coffee Shop,Food,-12.75,expense
2024-01-08,Electric Bill,Utilities,-89.99,expense
2024-01-10,Movie Tickets,Entertainment,-28.00,expense
2024-01-12,Pharmacy,Healthcare,-25.99,expense
2024-01-14,Online Shopping,Shopping,-67.89,expense
2024-01-15,Freelance Project,Income,850.00,income
2024-01-16,Restaurant,Food,-42.50,expense
2024-01-18,Internet Bill,Utilities,-59.99,expense
2024-01-20,Gym Membership,Health,-29.99,expense
2024-01-22,Grocery Store,Food,-92.34,expense
2024-01-24,Car Insurance,Transportation,-125.00,expense
2024-01-25,Clothing Store,Shopping,-89.99,expense
2024-01-26,Savings Transfer,Savings,-500.00,transfer
2024-01-28,Gas Station,Transportation,-38.75,expense
2024-01-30,Phone Bill,Utilities,-45.00,expense
```