## Chart
Use charts for data visualizations with Vega-Lite specifications.


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {
    "name": "chartData"
  },
  "mark": "bar",
  "encoding": {
    "x": {
      "field": "category",
      "type": "nominal",
      "title": "Category"
    },
    "y": {
      "field": "value",
      "type": "quantitative",
      "title": "Value"
    },
    "color": {
      "field": "category",
      "type": "nominal"
    }
  }
}
```


```csv chartData
category,value
A,20
B,34
C,55
D,40
E,67
```