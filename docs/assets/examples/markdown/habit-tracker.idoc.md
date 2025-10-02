```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "habitsDataTable",
      "update": "data('habitsDataTable')"
    },
    {
      "name": "habitDataTable",
      "update": "data('habitDataTable')"
    },
    {
      "name": "selectedMonth",
      "value": "2024-01"
    },
    {
      "name": "enrichedHabitData",
      "update": "data('enrichedHabitData')"
    },
    {
      "name": "dailyCompletionData",
      "update": "data('dailyCompletionData')"
    },
    {
      "name": "filteredEnrichedData",
      "update": "data('filteredEnrichedData')"
    },
    {
      "name": "monthOptions",
      "update": "data('monthOptions')"
    },
    {
      "name": "habitsData",
      "update": "data('habitsData')"
    },
    {
      "name": "habitData",
      "update": "data('habitData')"
    }
  ],
  "data": [
    {
      "name": "habitData_raw"
    },
    {
      "name": "habitData",
      "source": "habitData_raw",
      "transform": [
        {
          "type": "formula",
          "expr": "datum.completed === 'true' || datum.completed === true",
          "as": "completed"
        }
      ]
    },
    {
      "name": "habitsData",
      "values": [
        {
          "habit_name": "Exercise",
          "category": "Health",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Water Intake",
          "category": "Health",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Sleep 8 Hours",
          "category": "Health",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Read",
          "category": "Learning",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Language Learning",
          "category": "Learning",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Online Course",
          "category": "Learning",
          "target_frequency": "3x/week"
        },
        {
          "habit_name": "Call Family",
          "category": "Social",
          "target_frequency": "2x/week"
        },
        {
          "habit_name": "Social Activity",
          "category": "Social",
          "target_frequency": "Weekly"
        },
        {
          "habit_name": "Meditation",
          "category": "Wellness",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Gratitude Journal",
          "category": "Wellness",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Deep Work Session",
          "category": "Work",
          "target_frequency": "Daily"
        },
        {
          "habit_name": "Planning",
          "category": "Work",
          "target_frequency": "Daily"
        }
      ]
    },
    {
      "name": "monthOptions",
      "values": [
        {
          "value": "2024-01",
          "label": "January 2024"
        },
        {
          "value": "2024-02",
          "label": "February 2024"
        },
        {
          "value": "2024-03",
          "label": "March 2024"
        },
        {
          "value": "2024-04",
          "label": "April 2024"
        }
      ]
    },
    {
      "name": "habitDataTable",
      "values": []
    },
    {
      "name": "habitsDataTable",
      "values": []
    },
    {
      "name": "enrichedHabitData",
      "source": [
        "habitDataTable"
      ],
      "transform": [
        {
          "type": "lookup",
          "from": "habitsDataTable",
          "key": "habit_name",
          "fields": [
            "habit"
          ],
          "values": [
            "category",
            "target_frequency"
          ]
        },
        {
          "type": "formula",
          "expr": "datum.category || 'Unknown'",
          "as": "category"
        }
      ]
    },
    {
      "name": "dailyCompletionData",
      "source": [
        "habitDataTable"
      ],
      "transform": [
        {
          "type": "formula",
          "expr": "parseInt(slice(datum.date, 8, 10))",
          "as": "day_of_month"
        },
        {
          "type": "formula",
          "expr": "parseInt(slice(datum.date, 5, 7))",
          "as": "month_number"
        },
        {
          "type": "formula",
          "expr": "datum.completed ? 1 : 0",
          "as": "completed_numeric"
        },
        {
          "type": "aggregate",
          "groupby": [
            "date",
            "day_of_month",
            "month_number"
          ],
          "ops": [
            "sum",
            "count"
          ],
          "fields": [
            "completed_numeric",
            "completed_numeric"
          ],
          "as": [
            "completed_count",
            "total_habits"
          ]
        },
        {
          "type": "formula",
          "expr": "datum.completed_count / datum.total_habits",
          "as": "completion_rate"
        }
      ]
    },
    {
      "name": "filteredEnrichedData",
      "source": [
        "enrichedHabitData"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "slice(datum.date, 0, 7) === selectedMonth"
        }
      ]
    }
  ]
}
```


```css
body { font-family: sans-serif; margin: 0; padding: 20px; background: #f8fafc; max-width: 1200px; margin: 0 auto; }
#header, #habits, #table, #monthly, #annual { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
#header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white; text-align: center; }
h1 { margin: 0; padding: 20px 0; font-size: 2em; font-weight: 600; }
h2 { margin: 0 0 15px 0; font-size: 1.4em; color: #2d3748; font-weight: 600; }
.tabulator { max-width: 100%; overflow: auto; }
.tabulator .tabulator-table { min-width: fit-content; }
#heatmap .vega-embed .vega-actions { display: none; }
body { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; grid-template-areas: 'header header' 'habits table' 'monthly monthly' 'annual annual'; }
#header { grid-area: header; }
#habits { grid-area: habits; min-width: 0; }
#table { grid-area: table; min-width: 0; }
#monthly { grid-area: monthly; min-width: 0; overflow: hidden; }
#annual { grid-area: annual; min-width: 0; overflow: hidden; }
@media (max-width: 768px) { body { grid-template-columns: 1fr; grid-template-areas: 'header' 'habits' 'table' 'monthly' 'annual'; } }
```


::: group {#header}

# 🎯 Habit Tracker
A minimal habit tracker with editable data and heatmap visualization.
:::
::: group {#habits}

## 🎯 Habits Configuration


```json tabulator
{
  "dataSourceName": "habitsData",
  "tabulatorOptions": {
    "maxHeight": "180px",
    "autoColumns": true,
    "layout": "fitColumns"
  },
  "editable": true,
  "variableId": "habitsDataTable"
}
```


:::
::: group {#table}

## 📋 Daily Progress


```json tabulator
{
  "dataSourceName": "habitData",
  "tabulatorOptions": {
    "maxHeight": "210px",
    "autoColumns": true,
    "layout": "fitColumns"
  },
  "editable": true,
  "variableId": "habitDataTable"
}
```


:::
::: group {#monthly}

## 📊 Monthly Heatmap by Category


```yaml dropdown
variableId: selectedMonth
value: 2024-01
label: 'Select Month:'
dynamicOptions:
  dataSourceName: monthOptions
  fieldName: value
```


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "name": "filteredEnrichedData"
  },
  "title": "Monthly progress by category",
  "config": {
    "view": {
      "strokeWidth": 0,
      "step": 13,
      "fill": "transparent"
    },
    "axis": {
      "domain": false
    },
    "background": "transparent"
  },
  "transform": [
    {
      "calculate": "parseInt(slice(datum.date, 8, 10))",
      "as": "day_of_month"
    },
    {
      "calculate": "datum.completed ? 1 : 0",
      "as": "completed_numeric"
    }
  ],
  "mark": "rect",
  "encoding": {
    "x": {
      "field": "day_of_month",
      "type": "ordinal",
      "title": "Day of Month",
      "scale": {
        "domain": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31
        ]
      }
    },
    "y": {
      "field": "category",
      "type": "nominal",
      "title": "Category",
      "scale": {
        "domain": [
          "Health",
          "Learning",
          "Social",
          "Wellness",
          "Work"
        ]
      }
    },
    "color": {
      "aggregate": "mean",
      "field": "completed_numeric",
      "type": "quantitative",
      "scale": {
        "scheme": "blues",
        "domain": [
          0,
          1
        ]
      },
      "legend": {
        "title": "% complete",
        "format": ".0%"
      }
    },
    "tooltip": [
      {
        "field": "category",
        "type": "nominal",
        "title": "Category"
      },
      {
        "field": "day_of_month",
        "type": "ordinal",
        "title": "Day"
      },
      {
        "aggregate": "mean",
        "field": "completed_numeric",
        "type": "quantitative",
        "title": "Completion Rate",
        "format": ".1%"
      }
    ]
  },
  "width": "container",
  "height": 120
}
```


:::
::: group {#annual}

## 🗓️ Annual Calendar View


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "name": "dailyCompletionData"
  },
  "title": "Annual progress",
  "config": {
    "view": {
      "strokeWidth": 0,
      "step": 13,
      "fill": "transparent"
    },
    "axis": {
      "domain": false
    },
    "background": "transparent"
  },
  "mark": "rect",
  "encoding": {
    "x": {
      "field": "day_of_month",
      "type": "ordinal",
      "title": "Day",
      "scale": {
        "domain": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31
        ]
      }
    },
    "y": {
      "field": "month_number",
      "type": "ordinal",
      "title": "Month",
      "scale": {
        "domain": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12
        ]
      },
      "axis": {
        "labelExpr": "['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][datum.value]"
      }
    },
    "color": {
      "field": "completion_rate",
      "type": "quantitative",
      "scale": {
        "scheme": "greens",
        "domain": [
          0,
          1
        ]
      },
      "legend": {
        "title": "% complete",
        "format": ".0%"
      }
    },
    "tooltip": [
      {
        "field": "date",
        "type": "temporal",
        "title": "Date"
      },
      {
        "field": "completed_count",
        "type": "quantitative",
        "title": "Completed Habits"
      },
      {
        "field": "total_habits",
        "type": "quantitative",
        "title": "Total Habits"
      },
      {
        "field": "completion_rate",
        "type": "quantitative",
        "title": "Completion Rate",
        "format": ".1%"
      }
    ]
  },
  "width": "container",
  "height": 150
}
```


:::


```csv habitData_raw
date,habit,completed
2024-01-01,Exercise,true
2024-01-01,Water Intake,true
2024-01-01,Sleep 8 Hours,false
2024-01-01,Read,true
2024-01-01,Meditation,true
2024-01-01,Deep Work Session,true
2024-01-02,Exercise,true
2024-01-02,Water Intake,true
2024-01-02,Sleep 8 Hours,true
2024-01-02,Read,true
2024-01-02,Meditation,true
2024-01-02,Deep Work Session,true
2024-01-03,Exercise,true
2024-01-03,Water Intake,true
2024-01-03,Sleep 8 Hours,true
2024-01-03,Read,true
2024-01-03,Meditation,false
2024-01-03,Online Course,true
2024-01-03,Call Family,true
2024-01-04,Exercise,true
2024-01-04,Water Intake,true
2024-01-04,Sleep 8 Hours,true
2024-01-04,Read,false
2024-01-04,Meditation,true
2024-01-04,Deep Work Session,true
2024-01-05,Exercise,true
2024-01-05,Water Intake,true
2024-01-05,Sleep 8 Hours,false
2024-01-05,Read,true
2024-01-05,Language Learning,true
2024-01-05,Online Course,true
2024-01-05,Gratitude Journal,true
2024-01-06,Exercise,true
2024-01-06,Water Intake,true
2024-01-06,Sleep 8 Hours,true
2024-01-06,Read,true
2024-01-06,Meditation,true
2024-01-06,Social Activity,true
2024-01-07,Exercise,true
2024-01-07,Water Intake,true
2024-01-07,Sleep 8 Hours,true
2024-01-07,Read,false
2024-01-07,Meditation,true
2024-01-07,Planning,true
2024-01-08,Exercise,false
2024-01-08,Water Intake,true
2024-01-08,Sleep 8 Hours,true
2024-01-08,Read,true
2024-01-08,Language Learning,true
2024-01-10,Exercise,true
2024-01-10,Water Intake,true
2024-01-10,Read,true
2024-01-10,Call Family,true
2024-01-10,Deep Work Session,true
2024-01-12,Water Intake,true
2024-01-12,Sleep 8 Hours,true
2024-01-12,Read,true
2024-01-12,Online Course,true
2024-01-12,Gratitude Journal,true
2024-01-15,Exercise,true
2024-01-15,Water Intake,true
2024-01-15,Sleep 8 Hours,true
2024-01-15,Read,true
2024-01-15,Language Learning,true
2024-01-15,Meditation,true
2024-01-20,Water Intake,true
2024-01-20,Read,false
2024-01-20,Deep Work Session,true
2024-01-20,Planning,true
2024-01-25,Exercise,true
2024-01-25,Water Intake,true
2024-01-25,Sleep 8 Hours,false
2024-01-25,Read,true
2024-01-25,Social Activity,true
2024-02-01,Exercise,false
2024-02-01,Water Intake,true
2024-02-01,Sleep 8 Hours,true
2024-02-01,Read,true
2024-02-01,Meditation,true
2024-02-01,Deep Work Session,true
2024-02-02,Water Intake,true
2024-02-02,Read,true
2024-02-02,Meditation,true
2024-02-02,Language Learning,true
2024-02-03,Exercise,true
2024-02-03,Water Intake,true
2024-02-03,Read,true
2024-02-03,Meditation,true
2024-02-03,Call Family,true
2024-02-04,Water Intake,true
2024-02-04,Sleep 8 Hours,true
2024-02-04,Read,false
2024-02-04,Meditation,true
2024-02-04,Online Course,true
2024-02-05,Exercise,true
2024-02-05,Water Intake,true
2024-02-05,Sleep 8 Hours,true
2024-02-05,Read,true
2024-02-05,Meditation,true
2024-02-05,Gratitude Journal,true
2024-02-06,Water Intake,true
2024-02-06,Sleep 8 Hours,true
2024-02-06,Read,true
2024-02-06,Meditation,true
2024-02-06,Deep Work Session,true
2024-02-07,Exercise,true
2024-02-07,Water Intake,true
2024-02-07,Read,true
2024-02-07,Meditation,true
2024-02-07,Language Learning,true
2024-02-08,Water Intake,true
2024-02-08,Sleep 8 Hours,false
2024-02-08,Read,true
2024-02-08,Meditation,true
2024-02-08,Online Course,true
2024-02-09,Exercise,true
2024-02-09,Water Intake,true
2024-02-09,Sleep 8 Hours,true
2024-02-09,Read,false
2024-02-09,Meditation,true
2024-02-09,Planning,true
2024-02-10,Water Intake,true
2024-02-10,Read,true
2024-02-10,Meditation,true
2024-02-10,Social Activity,true
2024-02-14,Exercise,true
2024-02-14,Water Intake,true
2024-02-14,Sleep 8 Hours,true
2024-02-14,Read,false
2024-02-14,Call Family,true
2024-02-14,Deep Work Session,true
2024-02-20,Water Intake,true
2024-02-20,Sleep 8 Hours,true
2024-02-20,Read,true
2024-02-20,Language Learning,true
2024-02-20,Gratitude Journal,true
2024-02-25,Exercise,true
2024-02-25,Water Intake,true
2024-02-25,Read,true
2024-02-25,Online Course,true
2024-02-25,Planning,true
2024-02-29,Exercise,true
2024-02-29,Water Intake,true
2024-02-29,Sleep 8 Hours,true
2024-02-29,Read,true
2024-02-29,Meditation,false
2024-03-01,Exercise,true
2024-03-01,Water Intake,true
2024-03-01,Sleep 8 Hours,true
2024-03-01,Read,true
2024-03-01,Deep Work Session,true
2024-03-02,Water Intake,true
2024-03-02,Sleep 8 Hours,true
2024-03-02,Read,true
2024-03-02,Language Learning,true
2024-03-02,Call Family,true
2024-03-03,Exercise,true
2024-03-03,Water Intake,true
2024-03-03,Read,true
2024-03-03,Meditation,true
2024-03-03,Online Course,true
2024-03-04,Water Intake,true
2024-03-04,Sleep 8 Hours,false
2024-03-04,Read,true
2024-03-04,Gratitude Journal,true
2024-03-05,Exercise,false
2024-03-05,Water Intake,true
2024-03-05,Sleep 8 Hours,true
2024-03-05,Read,true
2024-03-05,Planning,true
2024-03-10,Water Intake,true
2024-03-10,Read,false
2024-03-10,Language Learning,true
2024-03-10,Social Activity,true
2024-03-15,Exercise,true
2024-03-15,Water Intake,true
2024-03-15,Sleep 8 Hours,true
2024-03-15,Read,true
2024-03-15,Deep Work Session,true
2024-03-17,Water Intake,true
2024-03-17,Read,false
2024-03-17,Call Family,true
2024-03-17,Meditation,true
2024-03-20,Exercise,true
2024-03-20,Water Intake,true
2024-03-20,Sleep 8 Hours,true
2024-03-20,Read,true
2024-03-20,Online Course,true
2024-03-25,Water Intake,true
2024-03-25,Read,true
2024-03-25,Language Learning,true
2024-03-25,Gratitude Journal,true
2024-03-31,Exercise,false
2024-03-31,Water Intake,true
2024-03-31,Sleep 8 Hours,true
2024-03-31,Read,true
2024-03-31,Planning,true
2024-04-01,Exercise,true
2024-04-01,Water Intake,true
2024-04-01,Sleep 8 Hours,true
2024-04-01,Read,true
2024-04-01,Deep Work Session,true
2024-04-02,Water Intake,true
2024-04-02,Read,true
2024-04-02,Language Learning,true
2024-04-02,Meditation,true
2024-04-05,Exercise,true
2024-04-05,Water Intake,true
2024-04-05,Sleep 8 Hours,false
2024-04-05,Read,true
2024-04-05,Call Family,true
2024-04-10,Water Intake,true
2024-04-10,Sleep 8 Hours,true
2024-04-10,Read,true
2024-04-10,Online Course,true
2024-04-10,Gratitude Journal,true
2024-04-15,Exercise,true
2024-04-15,Water Intake,true
2024-04-15,Sleep 8 Hours,true
2024-04-15,Read,true
2024-04-15,Language Learning,true
2024-04-15,Social Activity,true
2024-04-20,Water Intake,true
2024-04-20,Read,false
2024-04-20,Deep Work Session,true
2024-04-20,Planning,true
2024-04-25,Exercise,true
2024-04-25,Water Intake,true
2024-04-25,Sleep 8 Hours,true
2024-04-25,Read,true
2024-04-25,Meditation,true
2024-04-30,Exercise,true
2024-04-30,Water Intake,true
2024-04-30,Sleep 8 Hours,true
2024-04-30,Read,false
2024-04-30,Call Family,true
```