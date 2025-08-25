```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "revenueCalculation",
      "update": "data('revenueCalculation')"
    },
    {
      "name": "totalRevenueFormatted",
      "value": "$0",
      "update": "'$' + format(data('revenueCalculation')[0] ? data('revenueCalculation')[0].total : 0, ',.2f')"
    },
    {
      "name": "totalOrders",
      "value": 0,
      "update": "length(data('salesData'))"
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
          "timestamp": "2025-08-01",
          "order_id": "ORD-1001",
          "product": "Wireless Mouse",
          "category": "Electronics",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 3,
          "unit_price": 25
        },
        {
          "timestamp": "2025-08-02",
          "order_id": "ORD-1002",
          "product": "Office Chair",
          "category": "Furniture",
          "region": "East",
          "salesperson": "Bob Johnson",
          "units": 1,
          "unit_price": 199.99
        },
        {
          "timestamp": "2025-08-03",
          "order_id": "ORD-1003",
          "product": "Laptop Stand",
          "category": "Electronics",
          "region": "North",
          "salesperson": "Alice Chen",
          "units": 2,
          "unit_price": 45.5
        },
        {
          "timestamp": "2025-08-05",
          "order_id": "ORD-1004",
          "product": "Desk Lamp",
          "category": "Furniture",
          "region": "South",
          "salesperson": "Charlie Brown",
          "units": 1,
          "unit_price": 89
        },
        {
          "timestamp": "2025-08-06",
          "order_id": "ORD-1005",
          "product": "Bluetooth Headphones",
          "category": "Electronics",
          "region": "West",
          "salesperson": "Jane Smith",
          "units": 4,
          "unit_price": 79.99
        }
      ]
    },
    {
      "name": "revenueCalculation",
      "source": [
        "salesData"
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
        "salesData"
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
          "#764ba2"
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
    "name": "salesData"
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
  "dataSourceName": "salesData"
}
```


:::