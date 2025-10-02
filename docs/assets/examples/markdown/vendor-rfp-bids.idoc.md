```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "selectedVendors",
      "value": [
        "TechSolutions Inc",
        "InnovateCorp",
        "GlobalTech Partners"
      ]
    },
    {
      "name": "minCostFilter",
      "value": 200000
    },
    {
      "name": "maxCostFilter",
      "value": 350000
    },
    {
      "name": "minTechnicalScore",
      "value": 70
    },
    {
      "name": "filteredVendors",
      "update": "data('filteredVendors')"
    },
    {
      "name": "comparisonData",
      "update": "data('comparisonData')"
    },
    {
      "name": "scoringData",
      "update": "data('scoringData')"
    },
    {
      "name": "radarData",
      "update": "data('radarData')"
    },
    {
      "name": "avgCost",
      "value": 0,
      "update": "data('vendorBids')[0] ? data('vendorBids')[0].avg_cost : 0"
    },
    {
      "name": "vendorCount",
      "value": 0,
      "update": "length(data('vendorBids'))"
    },
    {
      "name": "topVendor",
      "value": "",
      "update": "scoringData && length(scoringData) > 0 ? scoringData[0].vendor_name : 'No data'"
    },
    {
      "name": "vendorBids",
      "update": "data('vendorBids')"
    }
  ],
  "data": [
    {
      "name": "vendorBids",
      "values": [
        {
          "vendor_id": "VENDOR_001",
          "vendor_name": "TechSolutions Inc",
          "total_cost": 285000,
          "implementation_time": 6,
          "technical_score": 85,
          "experience_score": 95,
          "cost_competitiveness": 75,
          "support_score": 88,
          "innovation_score": 82,
          "compliance_score": 95,
          "proposal_date": "2024-01-15",
          "contact_person": "Sarah Johnson",
          "company_size": "Large",
          "industry_focus": "Healthcare, Finance",
          "certifications": "ISO 9001, SOC 2",
          "reference_count": 12,
          "geographic_coverage": "Global",
          "user_rating": 4
        },
        {
          "vendor_id": "VENDOR_002",
          "vendor_name": "InnovateCorp",
          "total_cost": 320000,
          "implementation_time": 4,
          "technical_score": 92,
          "experience_score": 80,
          "cost_competitiveness": 65,
          "support_score": 90,
          "innovation_score": 95,
          "compliance_score": 88,
          "proposal_date": "2024-01-18",
          "contact_person": "Michael Chen",
          "company_size": "Medium",
          "industry_focus": "Technology, Manufacturing",
          "certifications": "ISO 27001, PCI DSS",
          "reference_count": 8,
          "geographic_coverage": "North America",
          "user_rating": 5
        },
        {
          "vendor_id": "VENDOR_003",
          "vendor_name": "GlobalTech Partners",
          "total_cost": 245000,
          "implementation_time": 8,
          "technical_score": 78,
          "experience_score": 98,
          "cost_competitiveness": 88,
          "support_score": 85,
          "innovation_score": 75,
          "compliance_score": 92,
          "proposal_date": "2024-01-12",
          "contact_person": "Emily Rodriguez",
          "company_size": "Large",
          "industry_focus": "Government, Education",
          "certifications": "FedRAMP, ISO 9001",
          "reference_count": 15,
          "geographic_coverage": "Global",
          "user_rating": 3
        },
        {
          "vendor_id": "VENDOR_004",
          "vendor_name": "AgileWorks Ltd",
          "total_cost": 295000,
          "implementation_time": 5,
          "technical_score": 88,
          "experience_score": 78,
          "cost_competitiveness": 72,
          "support_score": 92,
          "innovation_score": 88,
          "compliance_score": 90,
          "proposal_date": "2024-01-20",
          "contact_person": "David Thompson",
          "company_size": "Medium",
          "industry_focus": "Retail, E-commerce",
          "certifications": "ISO 27001, SOC 2",
          "reference_count": 10,
          "geographic_coverage": "Europe, North America",
          "user_rating": 4
        },
        {
          "vendor_id": "VENDOR_005",
          "vendor_name": "NextGen Systems",
          "total_cost": 275000,
          "implementation_time": 7,
          "technical_score": 80,
          "experience_score": 65,
          "cost_competitiveness": 78,
          "support_score": 85,
          "innovation_score": 90,
          "compliance_score": 85,
          "proposal_date": "2024-01-10",
          "contact_person": "Lisa Wang",
          "company_size": "Small",
          "industry_focus": "Startups, SMB",
          "certifications": "ISO 9001",
          "reference_count": 6,
          "geographic_coverage": "North America",
          "user_rating": 3
        }
      ]
    },
    {
      "name": "filteredVendors",
      "source": [
        "vendorBids"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "datum.total_cost >= minCostFilter && datum.total_cost <= maxCostFilter && datum.technical_score >= minTechnicalScore"
        }
      ]
    },
    {
      "name": "comparisonData",
      "source": [
        "vendorBids"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "indexof(selectedVendors, datum.vendor_name) >= 0 && datum.total_cost >= minCostFilter && datum.total_cost <= maxCostFilter && datum.technical_score >= minTechnicalScore"
        }
      ]
    },
    {
      "name": "scoringData",
      "source": [
        "vendorBids"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "(datum.technical_score * 0.25) + (datum.experience_score * 0.20) + (datum.cost_competitiveness * 0.15) + (datum.support_score * 0.15) + (datum.innovation_score * 0.15) + (datum.compliance_score * 0.10)",
          "as": "weighted_score"
        },
        {
          "type": "window",
          "sort": [
            {
              "field": "weighted_score",
              "order": "descending"
            }
          ],
          "ops": [
            "rank"
          ],
          "as": [
            "rank"
          ]
        }
      ]
    },
    {
      "name": "radarData",
      "source": [
        "vendorBids"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "indexof(selectedVendors, datum.vendor_name) >= 0 && datum.total_cost >= minCostFilter && datum.total_cost <= maxCostFilter && datum.technical_score >= minTechnicalScore"
        },
        {
          "type": "fold",
          "fields": [
            "technical_score",
            "experience_score",
            "cost_competitiveness",
            "support_score",
            "innovation_score",
            "compliance_score"
          ],
          "as": [
            "criteria",
            "score"
          ]
        }
      ]
    }
  ]
}
```


```css
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
body { display: grid; grid-template-areas: 'header header header' 'filters comparison comparison' 'details details details' 'scoring scoring scoring'; grid-template-columns: minmax(250px, 1fr) 2fr 2fr; gap: 20px; max-width: 1600px; margin: 0 auto; }
.group { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
#header { grid-area: header; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; text-align: center; padding: 15px 20px; }
#filters { grid-area: filters; min-width: 0; overflow: hidden; }
#comparison { grid-area: comparison; min-width: 0; overflow: hidden; }
#details { grid-area: details; min-width: 0; overflow: hidden; }
#scoring { grid-area: scoring; min-width: 0; overflow: hidden; }
h1 { margin: 0 0 10px 0; padding: 0; font-size: 2em; font-weight: 600; }
h2 { margin: 5px 0; font-size: 1.2em; color: #e2e8f0; font-weight: 400; }
h3 { margin: 0 0 15px 0; font-size: 1.1em; color: #475569; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.tabulator { max-width: 100%; overflow: auto; }
.tabulator .tabulator-table { min-width: fit-content; }
.metric-card { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4f46e5; }
.metric-value { font-size: 1.8em; font-weight: 600; color: #1e293b; }
.metric-label { font-size: 0.9em; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.filter-section { margin: 15px 0; }
.filter-label { font-weight: 500; color: #374151; margin-bottom: 8px; display: block; }
@media (max-width: 1024px) { body { grid-template-columns: 1fr; grid-template-areas: 'header' 'overview' 'filters' 'comparison' 'details' 'scoring'; } }
```


::: group {#header}

# 🏢 Vendor RFP Bid Comparison Dashboard
**Compare and evaluate vendor proposals across multiple dimensions**

## 📊 **Total Vendors:** {{vendorCount}} | **Average Cost:** ${{avgCost | number:,.0f}} | **Top Ranked:** {{topVendor}}
:::
::: group {#filters}

### 🔍 Filters & Selection
**Cost Range Filter**


```yaml slider
variableId: minCostFilter
value: 200000
label: Minimum Cost ($)
min: 200000
max: 350000
step: 10000
```


```yaml slider
variableId: maxCostFilter
value: 350000
label: Maximum Cost ($)
min: 200000
max: 350000
step: 10000
```


**Technical Score Threshold**


```yaml slider
variableId: minTechnicalScore
value: 70
label: Minimum Technical Score
min: 60
max: 100
step: 5
```


**Select Vendors for Comparison**


```yaml dropdown
variableId: selectedVendors
value:
  - TechSolutions Inc
  - InnovateCorp
  - GlobalTech Partners
label: Compare Vendors
dynamicOptions:
  dataSourceName: vendorBids
  fieldName: vendor_name
multiple: true
size: 10
```


:::
::: group {#comparison}

### 📈 Vendor Comparison Charts


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 300,
  "title": "Cost vs Technical Score",
  "data": {
    "name": "comparisonData"
  },
  "mark": {
    "type": "circle",
    "stroke": "white",
    "strokeWidth": 2
  },
  "encoding": {
    "x": {
      "field": "total_cost",
      "type": "quantitative",
      "title": "Total Cost ($)",
      "scale": {
        "domain": [
          200000,
          350000
        ],
        "nice": true
      },
      "axis": {
        "format": "$,.0f"
      }
    },
    "y": {
      "field": "technical_score",
      "type": "quantitative",
      "title": "Technical Score",
      "scale": {
        "domain": [
          60,
          100
        ]
      }
    },
    "color": {
      "field": "vendor_name",
      "type": "nominal",
      "scale": {
        "range": [
          "#4f46e5",
          "#7c3aed",
          "#ec4899",
          "#f59e0b",
          "#10b981"
        ]
      },
      "legend": {
        "title": "Vendor"
      }
    },
    "size": {
      "field": "experience_score",
      "type": "quantitative",
      "scale": {
        "range": [
          100,
          400
        ]
      },
      "legend": {
        "title": "Experience Score"
      }
    },
    "tooltip": [
      {
        "field": "vendor_name",
        "type": "nominal",
        "title": "Vendor"
      },
      {
        "field": "total_cost",
        "type": "quantitative",
        "title": "Cost",
        "format": "$,.0f"
      },
      {
        "field": "technical_score",
        "type": "quantitative",
        "title": "Technical Score"
      },
      {
        "field": "experience_score",
        "type": "quantitative",
        "title": "Experience Score"
      },
      {
        "field": "implementation_time",
        "type": "quantitative",
        "title": "Implementation (months)"
      }
    ]
  }
}
```


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 250,
  "title": "Experience Scores by Vendor",
  "data": {
    "name": "comparisonData"
  },
  "mark": {
    "type": "bar",
    "cornerRadiusEnd": 4
  },
  "encoding": {
    "x": {
      "field": "experience_score",
      "type": "quantitative",
      "title": "Experience Score",
      "scale": {
        "domain": [
          0,
          100
        ]
      }
    },
    "y": {
      "field": "vendor_name",
      "type": "nominal",
      "title": "Vendor",
      "sort": {
        "field": "experience_score",
        "order": "descending"
      }
    },
    "tooltip": [
      {
        "field": "vendor_name",
        "type": "nominal",
        "title": "Vendor"
      },
      {
        "field": "experience_score",
        "type": "quantitative",
        "title": "Experience Score"
      },
      {
        "field": "reference_count",
        "type": "quantitative",
        "title": "References"
      },
      {
        "field": "company_size",
        "type": "nominal",
        "title": "Company Size"
      }
    ]
  }
}
```


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 350,
  "title": "Multi-Criteria Comparison",
  "data": {
    "name": "radarData"
  },
  "mark": {
    "type": "bar",
    "cornerRadiusEnd": 2
  },
  "encoding": {
    "x": {
      "field": "criteria",
      "type": "nominal",
      "title": "Evaluation Criteria",
      "axis": {
        "labelAngle": -45
      }
    },
    "y": {
      "field": "score",
      "type": "quantitative",
      "title": "Score",
      "scale": {
        "domain": [
          0,
          100
        ]
      }
    },
    "color": {
      "field": "vendor_name",
      "type": "nominal",
      "scale": {
        "range": [
          "#4f46e5",
          "#7c3aed",
          "#ec4899",
          "#f59e0b",
          "#10b981"
        ]
      },
      "legend": {
        "title": "Vendor"
      }
    },
    "xOffset": {
      "field": "vendor_name",
      "type": "nominal"
    },
    "tooltip": [
      {
        "field": "vendor_name",
        "type": "nominal",
        "title": "Vendor"
      },
      {
        "field": "criteria",
        "type": "nominal",
        "title": "Criteria"
      },
      {
        "field": "score",
        "type": "quantitative",
        "title": "Score"
      }
    ]
  }
}
```


:::
::: group {#details}

### 📋 Detailed Vendor Information
**Filtered Vendors** (based on your criteria above)


```json tabulator
{
  "dataSourceName": "filteredVendors",
  "tabulatorOptions": {
    "layout": "fitColumns",
    "maxHeight": "400px",
    "pagination": "local",
    "paginationSize": 10,
    "columns": [
      {
        "title": "Vendor",
        "field": "vendor_name",
        "sorter": "string",
        "width": 150
      },
      {
        "title": "Total Cost",
        "field": "total_cost",
        "formatter": "money",
        "formatterParams": {
          "symbol": "$",
          "precision": 0
        },
        "sorter": "number"
      },
      {
        "title": "Time (months)",
        "field": "implementation_time",
        "sorter": "number",
        "width": 120
      },
      {
        "title": "Technical",
        "field": "technical_score",
        "sorter": "number",
        "width": 100
      },
      {
        "title": "Experience",
        "field": "experience_score",
        "sorter": "number",
        "width": 100
      },
      {
        "title": "Support",
        "field": "support_score",
        "sorter": "number",
        "width": 100
      },
      {
        "title": "Innovation",
        "field": "innovation_score",
        "sorter": "number",
        "width": 100
      },
      {
        "title": "Rating",
        "field": "user_rating",
        "formatter": "star",
        "formatterParams": {
          "stars": 5
        },
        "editor": "star",
        "editorParams": {
          "elementAttributes": {
            "style": "color: #f59e0b;"
          }
        },
        "sorter": "number",
        "width": 120
      },
      {
        "title": "Contact",
        "field": "contact_person",
        "sorter": "string",
        "width": 120
      },
      {
        "title": "Size",
        "field": "company_size",
        "sorter": "string",
        "width": 80
      }
    ]
  }
}
```


:::
::: group {#scoring}

### 🏆 Vendor Scoring & Ranking
**Weighted scoring based on: Technical (25%), Experience (20%), Cost (15%), Support (15%), Innovation (15%), Compliance (10%)**


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 300,
  "title": "Vendor Weighted Scores",
  "data": {
    "name": "scoringData"
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
          "field": "weighted_score",
          "order": "descending"
        }
      ]
    }
  ],
  "mark": {
    "type": "bar",
    "cornerRadiusEnd": 4
  },
  "encoding": {
    "x": {
      "field": "weighted_score",
      "type": "quantitative",
      "title": "Weighted Score"
    },
    "y": {
      "field": "vendor_name",
      "type": "nominal",
      "title": "Vendor",
      "sort": {
        "field": "weighted_score",
        "order": "descending"
      }
    },
    "color": {
      "field": "weighted_score",
      "type": "quantitative",
      "scale": {
        "scheme": "viridis"
      },
      "legend": {
        "title": "Score"
      }
    },
    "tooltip": [
      {
        "field": "vendor_name",
        "type": "nominal",
        "title": "Vendor"
      },
      {
        "field": "weighted_score",
        "type": "quantitative",
        "title": "Weighted Score",
        "format": ".1f"
      },
      {
        "field": "rank",
        "type": "ordinal",
        "title": "Rank"
      },
      {
        "field": "total_cost",
        "type": "quantitative",
        "title": "Cost",
        "format": "$,.0f"
      }
    ]
  }
}
```


```json tabulator
{
  "dataSourceName": "scoringData",
  "tabulatorOptions": {
    "layout": "fitColumns",
    "maxHeight": "300px",
    "initialSort": [
      {
        "column": "weighted_score",
        "dir": "desc"
      }
    ],
    "columns": [
      {
        "title": "Rank",
        "field": "rank",
        "sorter": "number",
        "width": 60
      },
      {
        "title": "Vendor",
        "field": "vendor_name",
        "sorter": "string"
      },
      {
        "title": "Weighted Score",
        "field": "weighted_score",
        "formatter": "progress",
        "formatterParams": {
          "min": 0,
          "max": 100,
          "color": [
            "#ef4444",
            "#f59e0b",
            "#10b981"
          ],
          "legend": true
        },
        "sorter": "number",
        "width": 150
      },
      {
        "title": "Total Cost",
        "field": "total_cost",
        "formatter": "money",
        "formatterParams": {
          "symbol": "$",
          "precision": 0
        },
        "sorter": "number"
      },
      {
        "title": "Implementation Time",
        "field": "implementation_time",
        "sorter": "number",
        "width": 140
      }
    ]
  }
}
```


:::