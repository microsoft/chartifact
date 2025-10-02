```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "editableActivityData",
      "update": "data('editableActivityData')"
    },
    {
      "name": "selectedDate",
      "value": "2024-01-15"
    },
    {
      "name": "moveTarget",
      "value": 1000
    },
    {
      "name": "exerciseTarget",
      "value": 120
    },
    {
      "name": "standTarget",
      "value": 24
    },
    {
      "name": "selectedDayData",
      "update": "data('selectedDayData')"
    },
    {
      "name": "currentMove",
      "value": 0,
      "update": "length(data('selectedDayData')) > 0 ? data('selectedDayData')[0].move : 0"
    },
    {
      "name": "currentExercise",
      "value": 0,
      "update": "length(data('selectedDayData')) > 0 ? data('selectedDayData')[0].exercise : 0"
    },
    {
      "name": "currentStand",
      "value": 0,
      "update": "length(data('selectedDayData')) > 0 ? data('selectedDayData')[0].stand : 0"
    },
    {
      "name": "ringData",
      "update": "data('ringData')"
    },
    {
      "name": "availableDates",
      "update": "data('availableDates')"
    },
    {
      "name": "barChartData",
      "update": "data('barChartData')"
    },
    {
      "name": "moveProgress",
      "value": 0,
      "update": "length(data('selectedDayData')) > 0 ? min(1, data('selectedDayData')[0].move / moveTarget) : 0"
    },
    {
      "name": "exerciseProgress",
      "value": 0,
      "update": "length(data('selectedDayData')) > 0 ? min(1, data('selectedDayData')[0].exercise / exerciseTarget) : 0"
    },
    {
      "name": "standProgress",
      "value": 0,
      "update": "length(data('selectedDayData')) > 0 ? min(1, data('selectedDayData')[0].stand / standTarget) : 0"
    }
  ],
  "data": [
    {
      "name": "editableActivityData",
      "values": []
    },
    {
      "name": "selectedDayData",
      "source": [
        "editableActivityData"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "datum.date === selectedDate"
        }
      ]
    },
    {
      "name": "ringData",
      "source": [
        "editableActivityData"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "selectedDate",
          "as": "currentSelected"
        },
        {
          "type": "filter",
          "expr": "datum.date === datum.currentSelected"
        },
        {
          "type": "fold",
          "fields": [
            "move",
            "exercise",
            "stand"
          ],
          "as": [
            "category",
            "value"
          ]
        },
        {
          "type": "formula",
          "expr": "moveTarget",
          "as": "moveTargetValue"
        },
        {
          "type": "formula",
          "expr": "exerciseTarget",
          "as": "exerciseTargetValue"
        },
        {
          "type": "formula",
          "expr": "standTarget",
          "as": "standTargetValue"
        },
        {
          "type": "formula",
          "expr": "datum.category == 'move' ? min(1, datum.value / datum.moveTargetValue) : datum.category == 'exercise' ? min(1, datum.value / datum.exerciseTargetValue) : min(1, datum.value / datum.standTargetValue)",
          "as": "progress"
        }
      ]
    },
    {
      "name": "availableDates",
      "source": [
        "editableActivityData"
      ],
      "transform": [
        {
          "type": "aggregate",
          "groupby": [
            "date"
          ],
          "ops": [
            "count"
          ],
          "fields": [
            "date"
          ],
          "as": [
            "count"
          ]
        }
      ]
    },
    {
      "name": "barChartData",
      "source": [
        "editableActivityData"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "selectedDate",
          "as": "currentSelected"
        },
        {
          "type": "formula",
          "expr": "datum.date === datum.currentSelected",
          "as": "isSelected"
        },
        {
          "type": "formula",
          "expr": "parseInt(split(datum.currentSelected, '-')[2])",
          "as": "selectedDay"
        },
        {
          "type": "formula",
          "expr": "parseInt(split(datum.date, '-')[2])",
          "as": "currentDay"
        },
        {
          "type": "formula",
          "expr": "datum.selectedDay <= 3 ? 1 : datum.selectedDay >= 28 ? 24 : datum.selectedDay - 3",
          "as": "windowStart"
        },
        {
          "type": "formula",
          "expr": "datum.selectedDay <= 3 ? 7 : datum.selectedDay >= 28 ? 30 : datum.selectedDay + 3",
          "as": "windowEnd"
        },
        {
          "type": "filter",
          "expr": "datum.currentDay >= datum.windowStart && datum.currentDay <= datum.windowEnd"
        }
      ]
    }
  ]
}
```


```css
body { font-family: 'SF Pro Display', 'Helvetica Neue', 'Arial', sans-serif; margin: 0; padding: 20px; background: #000; color: #fff; }
body { display: grid; grid-template-areas: 'header' 'controls' 'rings' 'table' 'bars'; grid-template-columns: 1fr; gap: 30px; max-width: 800px; margin: 0 auto; }
.group { background: #1c1c1e; padding: 25px; border-radius: 20px; border: 1px solid #38383a; }
#header { grid-area: header; text-align: center; background: none; border: none; padding: 0; }
#controls { grid-area: controls; }
#rings { grid-area: rings; min-width: 0; display: flex; justify-content: center; align-items: center; }
#table { grid-area: table; min-width: 0; overflow: hidden; }
#bars { grid-area: bars; min-width: 0; display: grid; grid-template-columns: 1fr; gap: 20px; }
h1 { margin: 0 0 30px 0; font-size: 2.5em; font-weight: 700; }
h2 { margin: 0 0 20px 0; font-size: 1.8em; color: #fff; font-weight: 600; }
h3 { margin: 0 0 15px 0; font-size: 1.1em; color: #8e8e93; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; }
.slider-container { display: grid; grid-template-columns: 100px 1fr 60px; align-items: center; gap: 15px; margin-bottom: 15px; }
.slider-container label { font-weight: 600; font-size: 1.1em; }
.slider-container span { font-size: 1.1em; text-align: right; color: #8e8e93; }
input[type=range] { -webkit-appearance: none; background: transparent; width: 100%; }
input[type=range]::-webkit-slider-runnable-track { height: 8px; border-radius: 4px; background: #38383a; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; margin-top: -6px; width: 20px; height: 20px; border-radius: 50%; background: #fff; cursor: pointer; }
input[type=range].move::-webkit-slider-runnable-track { background: #FF2D55; }
input[type=range].exercise::-webkit-slider-runnable-track { background: #A7F070; }
input[type=range].stand::-webkit-slider-runnable-track { background: #00E5E5; }
.tabulator { max-width: 100%; overflow: auto; }
.tabulator .tabulator-table { min-width: fit-content; }
@media (max-width: 768px) { #bars { grid-template-columns: 1fr; } }
```


::: group {#header}

# Fitness Rings
:::
::: group {#controls}

## Your Daily Progress
**Date**


```yaml dropdown
variableId: selectedDate
value: '2024-01-15'
dynamicOptions:
  dataSourceName: availableDates
  fieldName: date
```


:::
::: group {#rings}


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 300,
  "height": 300,
  "background": "transparent",
  "data": {
    "name": "selectedDayData"
  },
  "transform": [
    {
      "calculate": "min(1, datum.move / 1000)",
      "as": "moveProgress"
    },
    {
      "calculate": "min(1, datum.exercise / 120)",
      "as": "exerciseProgress"
    },
    {
      "calculate": "min(1, datum.stand / 24)",
      "as": "standProgress"
    }
  ],
  "layer": [
    {
      "data": {
        "values": [
          {
            "value": 1
          }
        ]
      },
      "mark": {
        "type": "arc",
        "innerRadius": 100,
        "outerRadius": 120,
        "color": "#38383a",
        "stroke": null
      },
      "encoding": {
        "theta": {
          "field": "value",
          "type": "quantitative",
          "scale": {
            "domain": [
              0,
              1
            ],
            "range": [
              0,
              6.283
            ]
          }
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "value": 1
          }
        ]
      },
      "mark": {
        "type": "arc",
        "innerRadius": 75,
        "outerRadius": 95,
        "color": "#38383a",
        "stroke": null
      },
      "encoding": {
        "theta": {
          "field": "value",
          "type": "quantitative",
          "scale": {
            "domain": [
              0,
              1
            ],
            "range": [
              0,
              6.283
            ]
          }
        }
      }
    },
    {
      "data": {
        "values": [
          {
            "value": 1
          }
        ]
      },
      "mark": {
        "type": "arc",
        "innerRadius": 50,
        "outerRadius": 70,
        "color": "#38383a",
        "stroke": null
      },
      "encoding": {
        "theta": {
          "field": "value",
          "type": "quantitative",
          "scale": {
            "domain": [
              0,
              1
            ],
            "range": [
              0,
              6.283
            ]
          }
        }
      }
    },
    {
      "mark": {
        "type": "arc",
        "innerRadius": 100,
        "outerRadius": 120,
        "cornerRadius": 10,
        "color": "#FF2D55",
        "stroke": null
      },
      "encoding": {
        "theta": {
          "field": "moveProgress",
          "type": "quantitative",
          "scale": {
            "domain": [
              0,
              1
            ],
            "range": [
              0,
              6.283
            ]
          }
        }
      }
    },
    {
      "mark": {
        "type": "arc",
        "innerRadius": 75,
        "outerRadius": 95,
        "cornerRadius": 10,
        "color": "#A7F070",
        "stroke": null
      },
      "encoding": {
        "theta": {
          "field": "exerciseProgress",
          "type": "quantitative",
          "scale": {
            "domain": [
              0,
              1
            ],
            "range": [
              0,
              6.283
            ]
          }
        }
      }
    },
    {
      "mark": {
        "type": "arc",
        "innerRadius": 50,
        "outerRadius": 70,
        "cornerRadius": 10,
        "color": "#00E5E5",
        "stroke": null
      },
      "encoding": {
        "theta": {
          "field": "standProgress",
          "type": "quantitative",
          "scale": {
            "domain": [
              0,
              1
            ],
            "range": [
              0,
              6.283
            ]
          }
        }
      }
    }
  ]
}
```


:::
::: group {#table}

### 📊 Activity Data
**Edit your daily activity data below**


```json tabulator
{
  "dataSourceName": "activityData",
  "tabulatorOptions": {
    "layout": "fitColumns",
    "maxHeight": "300px",
    "columns": [
      {
        "title": "Date",
        "field": "date",
        "sorter": "date",
        "editor": "date"
      },
      {
        "title": "Move (Cal)",
        "field": "move",
        "editor": "number",
        "editorParams": {
          "min": 0,
          "max": 1000,
          "step": 10
        }
      },
      {
        "title": "Exercise (min)",
        "field": "exercise",
        "editor": "number",
        "editorParams": {
          "min": 0,
          "max": 1440,
          "step": 1
        }
      },
      {
        "title": "Stand (hr)",
        "field": "stand",
        "editor": "number",
        "editorParams": {
          "min": 0,
          "max": 24,
          "step": 1
        }
      }
    ],
    "addRowPos": "top"
  },
  "editable": true,
  "variableId": "editableActivityData"
}
```


:::
::: group {#bars}


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 100,
  "background": "transparent",
  "data": {
    "name": "barChartData"
  },
  "mark": {
    "type": "bar",
    "cornerRadius": 5,
    "width": {
      "band": 0.7
    }
  },
  "encoding": {
    "y": {
      "field": "move",
      "type": "quantitative",
      "scale": {
        "domain": [
          0,
          1000
        ]
      },
      "axis": {
        "title": "Move (Cal)",
        "labelColor": "#fff",
        "titleColor": "#fff"
      }
    },
    "x": {
      "field": "date",
      "type": "temporal",
      "axis": {
        "title": "Move - 7 Day Window",
        "labelColor": "#fff",
        "titleColor": "#fff"
      }
    },
    "color": {
      "condition": {
        "test": "datum.isSelected",
        "value": "#FF2D55"
      },
      "value": "#FF2D5580"
    }
  }
}
```


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 100,
  "background": "transparent",
  "data": {
    "name": "barChartData"
  },
  "mark": {
    "type": "bar",
    "cornerRadius": 5,
    "width": {
      "band": 0.7
    }
  },
  "encoding": {
    "y": {
      "field": "exercise",
      "type": "quantitative",
      "scale": {
        "domain": [
          0,
          200
        ]
      },
      "axis": {
        "title": "Exercise (min)",
        "labelColor": "#fff",
        "titleColor": "#fff"
      }
    },
    "x": {
      "field": "date",
      "type": "temporal",
      "axis": {
        "title": "Exercise - 7 Day Window",
        "labelColor": "#fff",
        "titleColor": "#fff"
      }
    },
    "color": {
      "condition": {
        "test": "datum.isSelected",
        "value": "#A7F070"
      },
      "value": "#A7F07080"
    }
  }
}
```


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "height": 100,
  "background": "transparent",
  "data": {
    "name": "barChartData"
  },
  "mark": {
    "type": "bar",
    "cornerRadius": 5,
    "width": {
      "band": 0.7
    }
  },
  "encoding": {
    "y": {
      "field": "stand",
      "type": "quantitative",
      "scale": {
        "domain": [
          0,
          24
        ]
      },
      "axis": {
        "title": "Stand (hr)",
        "labelColor": "#fff",
        "titleColor": "#fff"
      }
    },
    "x": {
      "field": "date",
      "type": "temporal",
      "axis": {
        "title": "Stand - 7 Day Window",
        "labelColor": "#fff",
        "titleColor": "#fff"
      }
    },
    "color": {
      "condition": {
        "test": "datum.isSelected",
        "value": "#00E5E5"
      },
      "value": "#00E5E580"
    }
  }
}
```


:::


```csv activityData
date,move,exercise,stand
2024-01-01,850,85,18
2024-01-02,720,95,16
2024-01-03,950,140,20
2024-01-04,680,45,14
2024-01-05,780,110,17
2024-01-06,890,75,19
2024-01-07,620,30,13
2024-01-08,760,125,16
2024-01-09,840,155,18
2024-01-10,710,60,15
2024-01-11,920,180,21
2024-01-12,650,40,14
2024-01-13,800,115,17
2024-01-14,870,135,19
2024-01-15,590,25,12
2024-01-16,740,90,16
2024-01-17,810,165,18
2024-01-18,690,55,15
2024-01-19,880,145,20
2024-01-20,640,35,13
2024-01-21,770,105,17
2024-01-22,860,150,19
2024-01-23,610,50,14
2024-01-24,750,100,16
2024-01-25,820,130,18
2024-01-26,700,65,15
2024-01-27,890,170,20
2024-01-28,660,45,14
2024-01-29,780,120,17
2024-01-30,850,140,19
```