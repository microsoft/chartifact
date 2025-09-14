```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "monthlyIncome",
      "value": 5500
    },
    {
      "name": "housingBudget",
      "value": 2000
    },
    {
      "name": "foodBudget",
      "value": 600
    },
    {
      "name": "transportationBudget",
      "value": 400
    },
    {
      "name": "entertainmentBudget",
      "value": 300
    },
    {
      "name": "savingsBudget",
      "value": 800
    },
    {
      "name": "healthcareBudget",
      "value": 250
    },
    {
      "name": "utilitiesBudget",
      "value": 200
    },
    {
      "name": "clothingBudget",
      "value": 150
    },
    {
      "name": "personalCareBudget",
      "value": 100
    },
    {
      "name": "housingActual",
      "value": 1950
    },
    {
      "name": "foodActual",
      "value": 650
    },
    {
      "name": "transportationActual",
      "value": 380
    },
    {
      "name": "entertainmentActual",
      "value": 280
    },
    {
      "name": "savingsActual",
      "value": 800
    },
    {
      "name": "healthcareActual",
      "value": 200
    },
    {
      "name": "utilitiesActual",
      "value": 180
    },
    {
      "name": "clothingActual",
      "value": 120
    },
    {
      "name": "personalCareActual",
      "value": 90
    },
    {
      "name": "adjustedBudgetData",
      "update": "data('adjustedBudgetData')"
    },
    {
      "name": "monthlyTrendsLong",
      "update": "data('monthlyTrendsLong')"
    },
    {
      "name": "budgetVarianceData",
      "update": "data('budgetVarianceData')"
    },
    {
      "name": "savingsRate",
      "value": "0%",
      "update": "format((savingsBudget / monthlyIncome) * 100, '.1f') + '%'"
    },
    {
      "name": "totalBudgeted",
      "value": 0,
      "update": "toNumber(housingBudget) + toNumber(foodBudget) + toNumber(transportationBudget) + toNumber(entertainmentBudget) + toNumber(savingsBudget) + toNumber(healthcareBudget) + toNumber(utilitiesBudget) + toNumber(clothingBudget) + toNumber(personalCareBudget)"
    },
    {
      "name": "totalSpent",
      "value": 0,
      "update": "toNumber(housingActual) + toNumber(foodActual) + toNumber(transportationActual) + toNumber(entertainmentActual) + toNumber(savingsActual) + toNumber(healthcareActual) + toNumber(utilitiesActual) + toNumber(clothingActual) + toNumber(personalCareActual)"
    },
    {
      "name": "totalRemaining",
      "value": 0,
      "update": "toNumber(totalBudgeted) - toNumber(totalSpent)"
    },
    {
      "name": "budgetCategories",
      "update": "data('budgetCategories')"
    },
    {
      "name": "monthlyTrends",
      "update": "data('monthlyTrends')"
    }
  ],
  "data": [
    {
      "name": "monthlyTrends",
      "values": []
    },
    {
      "name": "budgetCategories",
      "values": []
    },
    {
      "name": "adjustedBudgetData",
      "source": [
        "budgetCategories"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "datum.category === 'Housing' ? housingBudget : (datum.category === 'Food' ? foodBudget : (datum.category === 'Transportation' ? transportationBudget : (datum.category === 'Entertainment' ? entertainmentBudget : (datum.category === 'Savings' ? savingsBudget : (datum.category === 'Healthcare' ? healthcareBudget : (datum.category === 'Utilities' ? utilitiesBudget : (datum.category === 'Clothing' ? clothingBudget : (datum.category === 'Personal Care' ? personalCareBudget : datum.budgeted))))))))",
          "as": "adjustedBudget"
        },
        {
          "type": "formula",
          "expr": "datum.adjustedBudget - datum.spent",
          "as": "remaining"
        },
        {
          "type": "formula",
          "expr": "(datum.spent - datum.adjustedBudget) / datum.adjustedBudget",
          "as": "spentPercentage"
        }
      ]
    },
    {
      "name": "monthlyTrendsLong",
      "source": [
        "monthlyTrends"
      ],
      "transform": [
        {
          "type": "fold",
          "fields": [
            "Housing",
            "Food",
            "Transportation",
            "Entertainment",
            "Healthcare",
            "Savings",
            "Utilities",
            "Clothing",
            "Personal Care"
          ],
          "as": [
            "category",
            "amount"
          ]
        }
      ]
    },
    {
      "name": "budgetVarianceData",
      "source": [
        "budgetCategories"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "datum.category === 'Housing' || datum.category === 'Food' || datum.category === 'Transportation' || datum.category === 'Entertainment' || datum.category === 'Healthcare' || datum.category === 'Savings' || datum.category === 'Utilities' || datum.category === 'Clothing' || datum.category === 'Personal Care'"
        },
        {
          "type": "formula",
          "expr": "datum.category === 'Housing' ? housingBudget : (datum.category === 'Food' ? foodBudget : (datum.category === 'Transportation' ? transportationBudget : (datum.category === 'Entertainment' ? entertainmentBudget : (datum.category === 'Healthcare' ? healthcareBudget : (datum.category === 'Savings' ? savingsBudget : (datum.category === 'Utilities' ? utilitiesBudget : (datum.category === 'Clothing' ? clothingBudget : (datum.category === 'Personal Care' ? personalCareBudget : datum.budgeted))))))))",
          "as": "budgeted"
        },
        {
          "type": "formula",
          "expr": "datum.category === 'Housing' ? housingActual : (datum.category === 'Food' ? foodActual : (datum.category === 'Transportation' ? transportationActual : (datum.category === 'Entertainment' ? entertainmentActual : (datum.category === 'Healthcare' ? healthcareActual : (datum.category === 'Savings' ? savingsActual : (datum.category === 'Utilities' ? utilitiesActual : (datum.category === 'Clothing' ? clothingActual : (datum.category === 'Personal Care' ? personalCareActual : datum.spent))))))))",
          "as": "spent"
        },
        {
          "type": "formula",
          "expr": "datum.spent - datum.budgeted",
          "as": "variance"
        }
      ]
    }
  ]
}
```


```css
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
body { display: grid; grid-template-areas: 'header header' 'overview overview' 'allocation variance' 'controls categories' 'trends trends'; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1400px; margin: 0 auto; }
.group { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
#header { grid-area: header; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
#overview { grid-area: overview; text-align: center; }
#allocation { grid-area: allocation; min-width: 0; overflow: hidden; }
#variance { grid-area: variance; min-width: 0; overflow: hidden; }
#controls { grid-area: controls; min-width: 0; overflow: hidden; }
#categories { grid-area: categories; min-width: 0; overflow: hidden; }
#trends { grid-area: trends; min-width: 0; overflow: hidden; }
h1 { margin: 0; padding: 20px 0; font-size: 2em; font-weight: 600; }
h2 { margin: 10px 0; font-size: 2em; color: #2d3748; font-weight: 600; }
h3 { margin: 0 0 15px 0; font-size: 1.2em; color: #4a5568; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.tabulator { max-width: 100%; overflow: auto; }
.tabulator .tabulator-table { min-width: fit-content; }
.slider-container { margin: 15px 0; }
.slider-label { font-weight: 500; color: #2d3748; margin-bottom: 8px; display: block; }
@media (max-width: 768px) { body { grid-template-columns: 1fr; grid-template-areas: 'header' 'overview' 'allocation' 'variance' 'controls' 'categories' 'trends'; } }
```


::: group {#header}

# 💰 Personal Budget Planner
**Interactive budget planning tool for financial wellness**
:::
::: group {#overview}

### 📊 Budget Overview


```yaml slider
variableId: monthlyIncome
value: 5500
label: Monthly Income
min: 3000
max: 10000
step: 250
```


**Total Budgeted:** ${{totalBudgeted}}
**Total Spent:** ${{totalSpent}}
**Remaining Budget:** ${{totalRemaining}}
**Savings Rate:** {{savingsRate}}
:::
::: group {#allocation}

### 🥧 Budget Allocation


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 300,
  "data": {
    "name": "adjustedBudgetData"
  },
  "mark": {
    "type": "arc",
    "innerRadius": 50,
    "stroke": "white",
    "strokeWidth": 2
  },
  "encoding": {
    "theta": {
      "field": "adjustedBudget",
      "type": "quantitative",
      "title": "Budget Amount"
    },
    "color": {
      "field": "category",
      "type": "nominal",
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
        "title": "Categories"
      }
    },
    "tooltip": [
      {
        "field": "category",
        "type": "nominal",
        "title": "Category"
      },
      {
        "field": "adjustedBudget",
        "type": "quantitative",
        "title": "Budgeted",
        "format": "$,.0f"
      },
      {
        "field": "spent",
        "type": "quantitative",
        "title": "Spent",
        "format": "$,.0f"
      },
      {
        "field": "remaining",
        "type": "quantitative",
        "title": "Remaining",
        "format": "$,.0f"
      }
    ]
  }
}
```


:::
::: group {#variance}

### 📊 Budget vs Actual


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "Budget variance bar chart with negative values. Shows budget vs actual spending differences.",
  "width": "container",
  "height": 300,
  "data": {
    "name": "budgetVarianceData"
  },
  "encoding": {
    "y": {
      "field": "category",
      "type": "nominal",
      "axis": {
        "domain": false,
        "ticks": false,
        "labelAngle": 0,
        "labelPadding": 4
      },
      "title": "Category"
    },
    "x": {
      "field": "variance",
      "type": "quantitative",
      "scale": {
        "padding": 20
      },
      "axis": {
        "gridColor": {
          "condition": {
            "test": "datum.value === 0",
            "value": "black"
          },
          "value": "#ddd"
        }
      },
      "title": "Variance (Actual - Budget)"
    }
  },
  "layer": [
    {
      "mark": "bar",
      "encoding": {
        "color": {
          "condition": {
            "test": "datum.variance < 0",
            "value": "#22c55e"
          },
          "value": "#ef4444"
        }
      }
    },
    {
      "mark": {
        "type": "text",
        "align": {
          "expr": "datum.variance < 0 ? 'right' : 'left'"
        },
        "dx": {
          "expr": "datum.variance < 0 ? -2 : 2"
        }
      },
      "encoding": {
        "text": {
          "field": "variance",
          "type": "quantitative",
          "format": "$,.0f"
        }
      }
    }
  ]
}
```


:::
::: group {#controls}

### 🏠 Budget Category Adjustments


```yaml slider
variableId: housingBudget
value: 2000
label: Housing
min: 800
max: 4000
step: 50
```


```yaml slider
variableId: foodBudget
value: 600
label: Food
min: 200
max: 1200
step: 25
```


```yaml slider
variableId: transportationBudget
value: 400
label: Transportation
min: 100
max: 800
step: 25
```


```yaml slider
variableId: entertainmentBudget
value: 300
label: Entertainment
min: 50
max: 600
step: 25
```


```yaml slider
variableId: savingsBudget
value: 800
label: Savings
min: 200
max: 2000
step: 50
```


```yaml slider
variableId: healthcareBudget
value: 250
label: Healthcare
min: 100
max: 500
step: 25
```


```yaml slider
variableId: utilitiesBudget
value: 200
label: Utilities
min: 100
max: 400
step: 25
```


```yaml slider
variableId: clothingBudget
value: 150
label: Clothing
min: 50
max: 300
step: 25
```


```yaml slider
variableId: personalCareBudget
value: 100
label: Personal Care
min: 25
max: 200
step: 25
```


:::
::: group {#categories}

### 📋 Track This Month's Spending


```yaml number
variableId: housingActual
value: 1950
label: Housing Actual
```


```yaml number
variableId: foodActual
value: 650
label: Food Actual
```


```yaml number
variableId: transportationActual
value: 380
label: Transportation Actual
```


```yaml number
variableId: entertainmentActual
value: 280
label: Entertainment Actual
```


```yaml number
variableId: healthcareActual
value: 200
label: Healthcare Actual
```


```yaml number
variableId: savingsActual
value: 800
label: Savings Actual
```


```yaml number
variableId: utilitiesActual
value: 180
label: Utilities Actual
```


```yaml number
variableId: clothingActual
value: 120
label: Clothing Actual
```


```yaml number
variableId: personalCareActual
value: 90
label: Personal Care Actual
```


:::
::: group {#trends}

### 📈 Spending Trends


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 300,
  "data": {
    "name": "monthlyTrendsLong"
  },
  "mark": {
    "type": "line",
    "point": true,
    "strokeWidth": 2
  },
  "encoding": {
    "x": {
      "field": "month",
      "type": "temporal",
      "title": "Month",
      "axis": {
        "format": "%b %Y"
      }
    },
    "y": {
      "field": "amount",
      "type": "quantitative",
      "title": "Amount Spent ($)"
    },
    "color": {
      "field": "category",
      "type": "nominal",
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
        "title": "Category"
      }
    },
    "tooltip": [
      {
        "field": "month",
        "type": "temporal",
        "title": "Month",
        "format": "%B %Y"
      },
      {
        "field": "category",
        "type": "nominal",
        "title": "Category"
      },
      {
        "field": "amount",
        "type": "quantitative",
        "title": "Amount",
        "format": "$,.0f"
      }
    ]
  }
}
```


:::


```csv budgetCategories
category,budgeted,spent,color
Housing,2000,1950,#667eea
Food,600,650,#764ba2
Transportation,400,380,#f093fb
Entertainment,300,280,#4ecdc4
Healthcare,250,200,#45b7d1
Savings,800,800,#96ceb4
Utilities,200,180,#feca57
Clothing,150,120,#ff9ff3
Personal Care,100,90,#54a0ff
```


```csv monthlyTrends
month,Housing,Food,Transportation,Entertainment,Healthcare,Savings,Utilities,Clothing,Personal Care
2024-01,1980,620,390,250,180,800,190,100,80
2024-02,1950,580,370,320,220,800,175,150,95
2024-03,1950,640,400,280,160,800,185,80,85
2024-04,1950,610,420,300,240,800,170,200,110
2024-05,1950,650,380,280,200,800,180,120,90
2024-06,1950,680,350,350,190,800,160,180,100
```