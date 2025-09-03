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
body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: white; line-height: 1.6; color: #333; }
.group { max-width: 800px; margin: 0 auto; }
h1 { text-align: center; font-size: 2.5em; margin-bottom: 0.5em; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 20px; }
h2 { font-size: 1.8em; margin: 40px 0 20px 0; color: #2c3e50; border-bottom: 1px solid #bdc3c7; padding-bottom: 10px; }
h3 { font-size: 1.3em; margin: 30px 0 15px 0; color: #34495e; }
blockquote { background: #ecf0f1; padding: 20px; border-left: 5px solid #3498db; margin: 30px 0; font-style: normal; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
td { padding: 10px 20px; border-bottom: 1px solid #ecf0f1; }
td:first-child { font-weight: bold; color: #2c3e50; }
.chart-container { margin: 30px 0; padding: 20px; background: #fafafa; border: 1px solid #ecf0f1; border-radius: 5px; }
p { margin: 15px 0; text-align: justify; }
```


::: group {#main}

# Sales Performance Report
**Reporting Period:** August 1-6, 2025  
**Prepared by:** Sales Analytics Team  
**Date:** August 24, 2025

## Executive Summary

> This report analyzes sales performance for the first week of August 2025. Our analysis reveals total revenue of **{{totalRevenueFormatted}}** across **{{totalOrders}} transactions**, with an average order value of **{{averageOrderValue}}**. The data shows strong performance in the Electronics category, which represents the majority of our revenue during this period.

## Key Performance Metrics

The following table summarizes our core performance indicators for the reporting period:

| Metric | Value |
|--------|-------|
| Total Revenue | {{totalRevenueFormatted}} |
| Number of Orders | {{totalOrders}} |
| Average Order Value | {{averageOrderValue}} |
| Active Sales Regions | 4 regions |
| Product Categories | 2 categories |

## Revenue Analysis by Product Category

Our product portfolio performed differently across categories during this period. The chart below illustrates the revenue distribution:


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "name": "categoryRevenue"
  },
  "mark": "bar",
  "width": 400,
  "height": 250,
  "encoding": {
    "x": {
      "field": "category",
      "type": "nominal",
      "title": "Product Category"
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
          "#3498db",
          "#2c3e50"
        ]
      }
    }
  }
}
```


The Electronics category generated the majority of revenue, driven primarily by strong sales of Bluetooth Headphones and Wireless Mouse products. The Furniture category, while smaller in volume, contributed significant value through high-ticket items such as the Office Chair.

## Sales Trend Analysis

Daily sales performance shows variability throughout the reporting period, with notable patterns emerging:


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
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
    "strokeWidth": 2
  },
  "width": 500,
  "height": 250,
  "encoding": {
    "x": {
      "field": "timestamp",
      "type": "temporal",
      "title": "Date"
    },
    "y": {
      "field": "revenue",
      "type": "quantitative",
      "title": "Daily Revenue ($)"
    },
    "color": {
      "value": "#3498db"
    }
  }
}
```


The trend analysis reveals that August 6th recorded the highest single-day revenue of $319.96, primarily due to the sale of 4 units of Bluetooth Headphones. August 2nd also showed strong performance with $199.99 in revenue from the Office Chair sale.

## Detailed Transaction Data

The complete transaction dataset for the reporting period is presented below for reference and further analysis:


```json tabulator
{
  "dataSourceName": "salesData"
}
```


## Conclusions and Recommendations

Based on this analysis, we recommend:

1. **Focus on Electronics expansion** - Given the strong performance of electronics products, consider expanding this category's inventory and marketing focus.

2. **Leverage high-value furniture sales** - While furniture has lower transaction volume, the high average order values suggest opportunity for targeted premium product strategies.

3. **Regional performance review** - Jane Smith's performance in the West region generated strong results and could serve as a model for other regions.

4. **Inventory planning** - The Bluetooth Headphones' strong performance suggests increasing stock levels for similar high-margin electronics.

*This report was generated using interactive data analysis. All figures are calculated dynamically from the underlying transaction data.*
:::