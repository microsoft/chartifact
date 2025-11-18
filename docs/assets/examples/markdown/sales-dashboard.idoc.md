```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v6.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "selectedMonth",
      "value": "August"
    },
    {
      "name": "filteredSalesData",
      "update": "data('filteredSalesData')"
    },
    {
      "name": "totalRevenueFormatted",
      "value": "$0",
      "update": "'$' + format(data('revenueCalculation')[0] ? data('revenueCalculation')[0].total : 0, ',.2f')"
    },
    {
      "name": "totalOrders",
      "value": 0,
      "update": "length(data('filteredSalesData'))"
    },
    {
      "name": "revenueCalculation",
      "update": "data('revenueCalculation')"
    },
    {
      "name": "categoryRevenue",
      "update": "data('categoryRevenue')"
    },
    {
      "name": "averageOrderValue",
      "value": "$0.00",
      "update": "'$' + format((data('revenueCalculation')[0] ? data('revenueCalculation')[0].total : 0) / (totalOrders > 0 ? totalOrders : 1), ',.2f')"
    },
    {
      "name": "salesData",
      "update": "data('salesData')"
    }
  ],
  "data": [
    {
      "name": "salesData",
      "values": [
        {
          "timestamp": "2025-07-15",
          "order_id": "ORD-0901",
          "product": "Executive Desk",
          "category": "Furniture",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 1,
          "unit_price": 599.99
        },
        {
          "timestamp": "2025-07-18",
          "order_id": "ORD-0902",
          "product": "Office Chair Premium",
          "category": "Furniture",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 2,
          "unit_price": 299.99
        },
        {
          "timestamp": "2025-07-22",
          "order_id": "ORD-0903",
          "product": "Wireless Mouse",
          "category": "Electronics",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 3,
          "unit_price": 35.99
        },
        {
          "timestamp": "2025-07-25",
          "order_id": "ORD-0904",
          "product": "File Cabinet",
          "category": "Furniture",
          "region": "South",
          "salesperson": "Charlie Brown",
          "units": 1,
          "unit_price": 189
        },
        {
          "timestamp": "2025-07-28",
          "order_id": "ORD-0905",
          "product": "Printer Paper Pack",
          "category": "Office Supplies",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 5,
          "unit_price": 24.99
        },
        {
          "timestamp": "2025-08-01",
          "order_id": "ORD-1001",
          "product": "Software License Pro",
          "category": "Office Supplies",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 3,
          "unit_price": 199.99
        },
        {
          "timestamp": "2025-08-02",
          "order_id": "ORD-1002",
          "product": "Notebook Set",
          "category": "Office Supplies",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 10,
          "unit_price": 15.99
        },
        {
          "timestamp": "2025-08-03",
          "order_id": "ORD-1003",
          "product": "Presentation Supplies",
          "category": "Office Supplies",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 2,
          "unit_price": 89.5
        },
        {
          "timestamp": "2025-08-05",
          "order_id": "ORD-1004",
          "product": "Stationery Bundle",
          "category": "Office Supplies",
          "region": "South",
          "salesperson": "Charlie Brown",
          "units": 4,
          "unit_price": 45
        },
        {
          "timestamp": "2025-08-06",
          "order_id": "ORD-1005",
          "product": "USB Hub",
          "category": "Electronics",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 2,
          "unit_price": 29.99
        },
        {
          "timestamp": "2025-08-08",
          "order_id": "ORD-1006",
          "product": "Tablet Pro",
          "category": "Electronics",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 1,
          "unit_price": 449.99
        },
        {
          "timestamp": "2025-08-10",
          "order_id": "ORD-1007",
          "product": "Conference Table",
          "category": "Furniture",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 1,
          "unit_price": 799.99
        },
        {
          "timestamp": "2025-08-12",
          "order_id": "ORD-1008",
          "product": "Ergonomic Chair",
          "category": "Furniture",
          "region": "South",
          "salesperson": "Charlie Brown",
          "units": 1,
          "unit_price": 349.99
        },
        {
          "timestamp": "2025-08-14",
          "order_id": "ORD-1009",
          "product": "Wireless Keyboard",
          "category": "Electronics",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 2,
          "unit_price": 89.99
        },
        {
          "timestamp": "2025-09-03",
          "order_id": "ORD-1101",
          "product": "Laptop Pro",
          "category": "Electronics",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 1,
          "unit_price": 1299.99
        },
        {
          "timestamp": "2025-09-07",
          "order_id": "ORD-1102",
          "product": "Monitor 4K",
          "category": "Electronics",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 2,
          "unit_price": 399.99
        },
        {
          "timestamp": "2025-09-12",
          "order_id": "ORD-1103",
          "product": "Wireless Headset",
          "category": "Electronics",
          "region": "South",
          "salesperson": "Charlie Brown",
          "units": 3,
          "unit_price": 149.99
        },
        {
          "timestamp": "2025-09-15",
          "order_id": "ORD-1104",
          "product": "Smartphone Pro",
          "category": "Electronics",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 1,
          "unit_price": 899.99
        },
        {
          "timestamp": "2025-09-20",
          "order_id": "ORD-1105",
          "product": "Desk Organizer",
          "category": "Office Supplies",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 4,
          "unit_price": 39.99
        },
        {
          "timestamp": "2025-09-05",
          "order_id": "ORD-1106",
          "product": "Standing Desk",
          "category": "Furniture",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 1,
          "unit_price": 699.99
        },
        {
          "timestamp": "2025-09-08",
          "order_id": "ORD-1107",
          "product": "Bookshelf Unit",
          "category": "Furniture",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 1,
          "unit_price": 299.99
        },
        {
          "timestamp": "2025-09-18",
          "order_id": "ORD-1108",
          "product": "Calculator Pro",
          "category": "Office Supplies",
          "region": "South",
          "salesperson": "Charlie Brown",
          "units": 3,
          "unit_price": 79.99
        },
        {
          "timestamp": "2025-09-22",
          "order_id": "ORD-1109",
          "product": "Whiteboard Large",
          "category": "Office Supplies",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 1,
          "unit_price": 199.99
        }
      ]
    },
    {
      "name": "filteredSalesData",
      "source": [
        "salesData"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "selectedMonth === 'July' ? (year(datum.timestamp) === 2025 && month(datum.timestamp) === 6) : selectedMonth === 'August' ? (year(datum.timestamp) === 2025 && month(datum.timestamp) === 7) : selectedMonth === 'September' ? (year(datum.timestamp) === 2025 && month(datum.timestamp) === 8) : false",
          "as": "monthMatch"
        },
        {
          "type": "filter",
          "expr": "datum.monthMatch"
        }
      ]
    },
    {
      "name": "revenueCalculation",
      "source": [
        "filteredSalesData"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "datum.units * datum.unit_price",
          "as": "revenue"
        },
        {
          "type": "aggregate",
          "ops": [
            "sum"
          ],
          "fields": [
            "revenue"
          ],
          "as": [
            "total"
          ]
        }
      ]
    },
    {
      "name": "categoryRevenue",
      "source": [
        "filteredSalesData"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "datum.units * datum.unit_price",
          "as": "revenue"
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
            "revenue"
          ],
          "as": [
            "total_revenue"
          ]
        }
      ]
    }
  ]
}
```


```css
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
body { display: grid; grid-template-areas: 'header header header' 'revenue orders avg' 'category trend trend' 'data data data'; grid-template-columns: 1fr 1fr 1fr; gap: 20px; max-width: 1400px; margin: 0 auto; }
.group { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
#header { grid-area: header; background: #667eea; color: white; text-align: center; }
#revenue { grid-area: revenue; text-align: center; }
#orders { grid-area: orders; text-align: center; }
#avg { grid-area: avg; text-align: center; }
#category { grid-area: category; }
#trend { grid-area: trend; }
#data { grid-area: data; }
h1 { margin: 0; padding: 10px 0; font-size: 1.5em; font-weight: 400; }
h2 { margin: 10px 0; font-size: 2em; color: #333; }
h3 { margin: 0 0 10px 0; font-size: 1em; color: #666; text-transform: uppercase; }
```


::: group {#header}

# Sales Performance Dashboard


```yaml dropdown
variableId: selectedMonth
value: August
label: 'Select Month:'
options:
  - July
  - August
  - September
```


:::
::: group {#revenue}

### Total Revenue
## {{totalRevenueFormatted}}
:::
::: group {#orders}

### Total Orders
## {{totalOrders}}
:::
::: group {#avg}

### Average Order Value
## {{averageOrderValue}}
:::
::: group {#category}

### Sales by Category


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "data": {
    "name": "categoryRevenue"
  },
  "mark": "bar",
  "encoding": {
    "x": {
      "field": "category",
      "type": "nominal",
      "title": "Category"
    },
    "y": {
      "field": "total_revenue",
      "type": "quantitative",
      "title": "Revenue ($)"
    },
    "color": {
      "field": "category",
      "type": "nominal",
      "scale": {
        "range": [
          "#667eea",
          "#764ba2",
          "#f093fb"
        ]
      }
    }
  }
}
```


:::
::: group {#trend}

### Sales Trend


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "data": {
    "name": "filteredSalesData"
  },
  "transform": [
    {
      "calculate": "datum.units * datum.unit_price",
      "as": "revenue"
    }
  ],
  "mark": {
    "type": "line",
    "point": true,
    "strokeWidth": 3
  },
  "encoding": {
    "x": {
      "field": "timestamp",
      "type": "temporal",
      "title": "Date"
    },
    "y": {
      "field": "revenue",
      "type": "quantitative",
      "title": "Revenue ($)"
    },
    "color": {
      "value": "#667eea"
    }
  }
}
```


:::
::: group {#data}

### Sales Data


```json tabulator
{
  "dataSourceName": "filteredSalesData"
}
```


:::