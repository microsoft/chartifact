/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
const iframe = document.getElementById('host') as HTMLIFrameElement;

window.addEventListener('message', (event) => {
  const hostStatusMessage = event.data as Chartifact.common.HostStatusMessage;
  if (hostStatusMessage.type === 'hostStatus' && hostStatusMessage.hostStatus === 'ready') {
    // First, send the render request
    const renderMessage: Chartifact.common.HostRenderRequestMessage = {
      type: 'hostRenderRequest',
      title: 'sample',
      markdown: `# Auto-loaded Content

This markdown was automatically sent when the iframe became ready.

## Current Time
${new Date().toLocaleString()}

## Random Number
${Math.floor(Math.random() * 1000)}

# Seattle Weather

Here is a stacked bar chart of Seattle weather:
Each bar represents the count of weather types for each month.
The colors distinguish between different weather conditions such as sun, fog, drizzle, rain, and snow.

\`\`\`json vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "data": {"url": "https://vega.github.io/editor/data/seattle-weather.csv"},
  "mark": "bar",
  "encoding": {
    "x": {
      "timeUnit": "month",
      "field": "date",
      "type": "ordinal",
      "title": "Month of the year"
    },
    "y": {
      "aggregate": "count",
      "type": "quantitative"
    },
    "color": {
      "field": "weather",
      "type": "nominal",
      "scale": {
        "domain": ["sun", "fog", "drizzle", "rain", "snow"],
        "range": ["#e7ba52", "#c7c7c7", "#aec7e8", "#1f77b4", "#9467bd"]
      },
      "title": "Weather type"
    }
  }
}
\`\`\`
`};
    iframe.contentWindow.postMessage(renderMessage, '*');

    // After a short delay, demonstrate toolbar control
    setTimeout(() => {
      const toolbarControlMessage: Chartifact.common.HostToolbarControlMessage = {
        type: 'hostToolbarControl',
        showSource: true,  // Show the source textarea
        setFilename: 'seattle-weather-demo',  // Set a custom filename
        showOrHideButtons: {  // Control button visibility
          tweak: true,
          download: true,
          restart: false
        }
      };
      iframe.contentWindow.postMessage(toolbarControlMessage, '*');
    }, 1000);

    // After another delay, demonstrate showing the download dialog
    setTimeout(() => {
      const showDownloadMessage: Chartifact.common.HostToolbarControlMessage = {
        type: 'hostToolbarControl',
        showDownloadDialog: true  // Show the download popup dialog
      };
      iframe.contentWindow.postMessage(showDownloadMessage, '*');
    }, 2500);
  }
});