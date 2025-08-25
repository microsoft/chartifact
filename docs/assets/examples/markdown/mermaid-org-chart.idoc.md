```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "orgChartDataTable",
      "update": "data('orgChartDataTable')"
    },
    {
      "name": "direction",
      "value": "TD"
    },
    {
      "name": "orgChartOutput",
      "value": ""
    },
    {
      "name": "orgChartData",
      "update": "data('orgChartData')"
    }
  ],
  "data": [
    {
      "name": "orgChartData",
      "values": [
        {
          "lineTemplate": "person",
          "id": "CEO",
          "label": "CEO<br/>Alice Smith"
        },
        {
          "lineTemplate": "person",
          "id": "CTO",
          "label": "CTO<br/>Bob Lee"
        },
        {
          "lineTemplate": "person",
          "id": "CFO",
          "label": "CFO<br/>Carol Jones"
        },
        {
          "lineTemplate": "person",
          "id": "COO",
          "label": "COO<br/>David Kim"
        },
        {
          "lineTemplate": "person",
          "id": "ENG1",
          "label": "Lead Engineer<br/>Eve Tran"
        },
        {
          "lineTemplate": "person",
          "id": "ENG2",
          "label": "Engineer<br/>Frank Wu"
        },
        {
          "lineTemplate": "person",
          "id": "ENG3",
          "label": "Engineer<br/>Grace Lin"
        },
        {
          "lineTemplate": "person",
          "id": "ACC1",
          "label": "Accountant<br/>Henry Patel"
        },
        {
          "lineTemplate": "person",
          "id": "ACC2",
          "label": "Accountant<br/>Ivy Chen"
        },
        {
          "lineTemplate": "person",
          "id": "OPS1",
          "label": "Operations Mgr<br/>Jack Brown"
        },
        {
          "lineTemplate": "person",
          "id": "OPS2",
          "label": "Ops Specialist<br/>Kim Lee"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CEO",
          "to": "CTO"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CEO",
          "to": "CFO"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CEO",
          "to": "COO"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CTO",
          "to": "ENG1"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CTO",
          "to": "ENG2"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CTO",
          "to": "ENG3"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CFO",
          "to": "ACC1"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "CFO",
          "to": "ACC2"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "COO",
          "to": "OPS1"
        },
        {
          "lineTemplate": "orgEdge",
          "from": "COO",
          "to": "OPS2"
        }
      ]
    },
    {
      "name": "orgChartDataTable",
      "values": []
    }
  ]
}
```


# Mermaid Plugin Example - Org Chart
Template-based org chart generation:


```yaml mermaid
template:
  dataSourceName: orgChartDataTable
  header: graph {{direction}}
  lineTemplates:
    person: '{{id}}[{{label}}]'
    orgEdge: '{{from}} --> {{to}}'
variableId: orgChartOutput
```


```yaml dropdown
variableId: direction
value: TD
options:
  - TD
  - LR
```


## JSON Data
Load data from a static JSON array.


```json tabulator
{
  "dataSourceName": "orgChartData",
  "tabulatorOptions": {
    "columns": [
      {
        "title": "LineTemplate",
        "field": "lineTemplate",
        "editor": "input"
      },
      {
        "title": "ID",
        "field": "id",
        "editor": "input"
      },
      {
        "title": "Label",
        "field": "label",
        "editor": "input"
      },
      {
        "title": "From",
        "field": "from",
        "editor": "input"
      },
      {
        "title": "To",
        "field": "to",
        "editor": "input"
      }
    ],
    "layout": "fitColumns",
    "maxHeight": "300px"
  },
  "editable": true,
  "variableId": "orgChartDataTable"
}
```