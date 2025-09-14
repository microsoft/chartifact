```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "interactiveValue",
      "value": 1000
    },
    {
      "name": "currentYear",
      "value": 2025
    },
    {
      "name": "calculatedWorth",
      "value": "1000",
      "update": "format(interactiveValue, ',')"
    },
    {
      "name": "formatCapabilities",
      "update": "data('formatCapabilities')"
    },
    {
      "name": "excelVsLiveData",
      "update": "data('excelVsLiveData')"
    }
  ],
  "data": [
    {
      "name": "documentFormats",
      "values": [
        {"format": "PDF", "capability": "Portable", "score": 95, "interactive": false},
        {"format": "PDF", "capability": "Human-editable", "score": 10, "interactive": false},
        {"format": "PDF", "capability": "Interactive", "score": 5, "interactive": false},
        {"format": "HTML", "capability": "Portable", "score": 40, "interactive": true},
        {"format": "HTML", "capability": "Human-editable", "score": 30, "interactive": true},
        {"format": "HTML", "capability": "Interactive", "score": 95, "interactive": true},
        {"format": "Markdown", "capability": "Portable", "score": 70, "interactive": false},
        {"format": "Markdown", "capability": "Human-editable", "score": 90, "interactive": false},
        {"format": "Markdown", "capability": "Interactive", "score": 20, "interactive": false},
        {"format": "Chartifact", "capability": "Portable", "score": 85, "interactive": true},
        {"format": "Chartifact", "capability": "Human-editable", "score": 85, "interactive": true},
        {"format": "Chartifact", "capability": "Interactive", "score": 90, "interactive": true}
      ]
    },
    {
      "name": "formatCapabilities",
      "source": "documentFormats",
      "transform": [
        {
          "type": "aggregate",
          "groupby": ["format"],
          "ops": ["mean"],
          "fields": ["score"],
          "as": ["avgScore"]
        }
      ]
    },
    {
      "name": "excelVsLiveData",
      "values": [
        {"approach": "Excel Screenshot", "update_frequency": "Manual", "interactivity": "None", "data_freshness": "Stale", "effort_to_update": "High"},
        {"approach": "Live Chart", "update_frequency": "Real-time", "interactivity": "Full", "data_freshness": "Current", "effort_to_update": "None"}
      ]
    }
  ]
}
```


```css
html, body { height: 100%; margin: 0; padding: 0; scroll-behavior: smooth; overflow-y: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
body { scroll-snap-type: y mandatory; }
.group { scroll-snap-align: start; min-height: 100vh; margin: 0; padding: 3em 2em; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; overflow: hidden; }
#slide1 { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; text-align: center; justify-content: center; }
#slide2 { background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%); color: white; }
#slide3 { background: linear-gradient(135deg, #2980b9 0%, #2c3e50 100%); color: white; }
#slide4 { background: linear-gradient(135deg, #27ae60 0%, #2980b9 100%); color: white; }
#slide5 { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; }
#slide6 { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; justify-content: center; min-width: 0; overflow: hidden; }
#slide7 { background: linear-gradient(135deg, #16a085 0%, #27ae60 100%); color: white; }
#slide8 { background: linear-gradient(135deg, #2c3e50 0%, #8e44ad 100%); color: white; text-align: center; justify-content: center; }
h1 { font-size: 2.5em; margin: 0.3em 0; font-weight: 300; line-height: 1.2; }
h2 { font-size: 2em; margin: 0.4em 0; font-weight: 300; line-height: 1.2; }
h3 { font-size: 1.6em; margin: 0.5em 0; font-weight: 400; line-height: 1.2; }
p, li { font-size: 1.2em; line-height: 1.5; margin: 0.5em 0; }
ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
li { margin: 0.3em 0; }
.tabulator { max-width: 100%; overflow: auto; margin: 20px 0; border-radius: 8px; }
.tabulator .tabulator-table { min-width: fit-content; }
.tabulator .tabulator-header { background: rgba(255,255,255,0.9); color: #333; }
.tabulator .tabulator-cell { background: rgba(255,255,255,0.8); color: #333; }
.vega-embed { margin: 20px auto; }
.vega-embed .vega-actions { display: none; }
@media (max-width: 768px) { .group { padding: 2em 1em; } h1 { font-size: 2em; } h2 { font-size: 1.6em; } h3 { font-size: 1.3em; } p, li { font-size: 1em; line-height: 1.4; } ul, ol { padding-left: 1em; } }
@media (max-width: 480px) { .group { padding: 1.5em 0.8em; } h1 { font-size: 1.8em; } h2 { font-size: 1.4em; } h3 { font-size: 1.2em; } p, li { font-size: 0.9em; line-height: 1.3; } ul, ol { padding-left: 0.8em; } li { margin: 0.2em 0; } }
```


::: group {#slide1}

# Why Chartifact?
### A Document Format for the LLM Age
## The industry lacks a shareable document format designed for AI-assisted knowledge work
:::
::: group {#slide2}

## 🤖 The LLM Revolution Changed Everything
### We're living in the age of AI-assisted knowledge work
- Large Language Models transform how we create and consume information
- Knowledge workers expect **interactive**, **dynamic** content
- **But we're still using document formats from the pre-AI era**
:::
::: group {#slide3}

## 📄 The Current Landscape
### PDF: Made for **paper**
- ✅ Single self-contained file
- ❌ Not human-editable
- ❌ Not interactive nor responsive
- ❌ Static

### HTML:
- ✅ Powerful & interactive
- ❌ Security nightmare
- ❌ Corporate systems block it

### Markdown: **Clear winner** so far
- ✅ Human-readable
- ✅ Version controllable
- ❌ Limited interactivity
:::
::: group {#slide4}

## ⚡ HTML: From Hero to Villain
### HTML was supposed to be the document format of the internet
- Started as a simple markup language for documents
- Became **too powerful** - now it's a full application shell
- Unlimited execution capabilities = security risk
- Corporate IT departments **block HTML files** by default
- What was meant to democratize publishing became a developer-only tool

### 🎭 *"You were the chosen one, Anakin!"*
:::
::: group {#slide5}

## 🔒 Proprietary Solutions Miss the Point
### Most LLMs build apps, not documents
- Force information workers to become developers 👩‍💻
- **All they wanted to do was remix a presentation!**
- Sometimes platform-locked in vendor ecosystem
- Require hosting and maintenance

### What we actually need:
**Open, portable, interactive documents that travel like PDFs but work like apps**
:::
::: group {#slide6}

## 📊 Stop Pasting Chart Images from Excel!
### Make them live charts from live data instead

### If a picture is worth 1,000 words...
# {{calculatedWorth}}
### Then an interactive is worth **{{calculatedWorth}}** words


```yaml slider
variableId: interactiveValue
value: 1000
label: Adjust the multiplier
min: 1000
max: 100000
step: 1000
```


### 📈 Document Format Capabilities


```json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": 300,
  "height": 300,
  "data": {
    "name": "formatCapabilities"
  },
  "mark": {
    "type": "arc",
    "innerRadius": 50,
    "stroke": "white",
    "strokeWidth": 3
  },
  "encoding": {
    "theta": {
      "field": "avgScore",
      "type": "quantitative",
      "title": "Capability Score"
    },
    "color": {
      "field": "format",
      "type": "nominal",
      "scale": {
        "range": ["#e74c3c", "#f39c12", "#27ae60", "#3498db"]
      },
      "legend": {
        "orient": "right",
        "title": "Document Format"
      }
    },
    "tooltip": [
      {"field": "format", "type": "nominal", "title": "Format"},
      {"field": "avgScore", "type": "quantitative", "title": "Average Score", "format": ".1f"}
    ]
  }
}
```


### 🆚 Excel Screenshots vs Live Data


```json tabulator
{
  "dataSourceName": "excelVsLiveData",
  "variableId": "excelComparisonTable",
  "editable": true,
  "tabulatorOptions": {
    "layout": "fitColumns",
    "maxHeight": "200px",
    "columns": [
      {
        "title": "Approach",
        "field": "approach",
        "editor": "input"
      },
      {
        "title": "Updates",
        "field": "update_frequency",
        "editor": "input"
      },
      {
        "title": "Interactive",
        "field": "interactivity",
        "editor": "input"
      },
      {
        "title": "Data Freshness",
        "field": "data_freshness",
        "editor": "input"
      },
      {
        "title": "Effort",
        "field": "effort_to_update",
        "editor": "input"
      }
    ]
  }
}
```


### ⚡ This slide proves the point - you just experienced it!
:::
::: group {#slide7}

## 🎯 What the Industry Actually Needs
### A new document format that is:
- **📱 Portable** - travels everywhere like PDF
- **🔓 Open Source** - not locked to any vendor
- **⚡ Interactive** - reactive and dynamic
- **🛡️ Safe** - secure by design, no arbitrary code execution
- **👥 Human-friendly** - editable by knowledge workers
- **🤖 AI-ready** - designed for LLM generation and editing

### 🚫 **No apps that rot. No hosting required.**
:::
::: group {#slide8}

# 🎯 Enter Chartifact
### The missing document format for the LLM age
## ✨ **Declarative, interactive data documents**
## 📄 **Travels like a document**
## 📱 **Works like a mini app**
## 🤖 **Designed for AI collaboration**

### Ready to reshape how we share knowledge in {{currentYear}}?
:::