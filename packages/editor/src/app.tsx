/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { InteractiveDocument } from '@microsoft/chartifact-schema';
import { Editor } from './editor.js';
import { Sandbox } from '@microsoft/chartifact-sandbox';
import { EditorPageMessage, EditorReadyMessage, SpecReview, SandboxedPreHydrateMessage } from "common";

export interface AppProps {
  sandbox?: typeof Sandbox;
  onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
}

export function App(props: AppProps) {
  const { sandbox } = props;

  const [history, setHistory] = React.useState<InteractiveDocument[]>([initialPage]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState<InteractiveDocument>(initialPage);

  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = React.useState(false);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const page = history[newIndex];
      setCurrentPage(page);
      sendPageToEditor(page);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const page = history[newIndex];
      setCurrentPage(page);
      sendPageToEditor(page);
    }
  };

  const sendPageToEditor = (page: InteractiveDocument, skipReadyCheck = false) => {
    // Only send page if editor is ready (unless we're skipping the check)
    if (!skipReadyCheck && !isEditorReady) {
      return;
    }

    // Post message to the editor within the same window
    const pageMessage: EditorPageMessage = {
      type: 'editorPage',
      page: page,
      sender: 'app',
    };
    window.postMessage(pageMessage, '*');
  };

  React.useEffect(() => {
    // Listen for messages from the editor
    const handleMessage = (event: MessageEvent<EditorPageMessage | EditorReadyMessage>) => {
      // Only process messages from editor, ignore our own messages
      if (event.data && event.data.sender === 'editor') {
        if (event.data.type === 'editorReady') {
          setIsEditorReady(true);
          // Send initial page when editor is ready
          sendPageToEditor(currentPage);
        } else if (event.data.type === 'editorPage' && event.data.page) {
          const pageMessage = event.data as EditorPageMessage;
          // Use functional updates to avoid closure issues
          setHistoryIndex(prevIndex => {
            setHistory(prevHistory => {
              // Truncate history after current index and add new page
              const newHistory = prevHistory.slice(0, prevIndex + 1);
              newHistory.push(pageMessage.page);
              return newHistory;
            });

            setCurrentPage(pageMessage.page);
            // Send the updated page back to the editor (skip ready check since editor just sent us a message)
            sendPageToEditor(pageMessage.page, true);
            return prevIndex + 1; // New index will be the last item
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Remove the dependencies that were causing stale closures

  React.useEffect(() => {
    // This effect runs when isEditorReady changes
    // If editor becomes ready, send current page
    if (isEditorReady) {
      sendPageToEditor(currentPage);
    }
  }, [isEditorReady]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Control Panel */}
      <div style={{
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>Document Editor</h2>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            style={{
              padding: '5px 10px',
              backgroundColor: historyIndex <= 0 ? '#ccc' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            style={{
              padding: '5px 10px',
              backgroundColor: historyIndex >= history.length - 1 ? '#ccc' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ↷ Redo
          </button>
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            History: {historyIndex + 1} / {history.length}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div ref={editorContainerRef} style={{ flex: 1 }}>
        <Editor
          sandbox={sandbox}
          onApprove={props.onApprove}
        />
      </div>
    </div>
  );
}

const initialPage: InteractiveDocument = {
  "title": "Seattle Weather",
  "dataLoaders": [
    {
      "type": "url",
      "url": "https://vega.github.io/editor/data/seattle-weather.csv",
      "dataSourceName": "seattle_weather",
      "format": "csv",
      "dataFrameTransformations": []
    }
  ],
  "groups": [
    {
      "groupId": "main",
      "elements": [
        "# Seattle Weather\n\nData table:",
        {
          "type": "tabulator",
          "dataSourceName": "seattle_weather"
        },
        "Here is a stacked bar chart of Seattle weather:\nEach bar represents the count of weather types for each month.\nThe colors distinguish between different weather conditions such as sun, fog, drizzle, rain, and snow.",
        {
          "type": "chart",
          "chartKey": "1"
        },
        "This section introduces a heatmap visualization for the Seattle weather dataset.\nThe heatmap is designed to display the distribution and intensity of weather-related variables,\nsuch as temperature, precipitation, or frequency of weather events, across different time periods or categories.\nIt provides an intuitive way to identify patterns, trends, and anomalies in the dataset.",
        {
          "type": "chart",
          "chartKey": "2"
        }
      ]
    }
  ],
  "resources": {
    "charts": {
      "1": {
        "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
        "data": {
          "name": "seattle_weather"
        },
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
              "domain": [
                "sun",
                "fog",
                "drizzle",
                "rain",
                "snow"
              ],
              "range": [
                "#e7ba52",
                "#c7c7c7",
                "#aec7e8",
                "#1f77b4",
                "#9467bd"
              ]
            },
            "title": "Weather type"
          }
        }
      },
      "2": {
        "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
        "data": {
          "name": "seattle_weather"
        },
        "title": "Daily Max Temperatures (C) in Seattle, WA",
        "config": {
          "view": {
            "strokeWidth": 0,
            "step": 13
          },
          "axis": {
            "domain": false
          }
        },
        "mark": "rect",
        "encoding": {
          "x": {
            "field": "date",
            "timeUnit": "date",
            "type": "ordinal",
            "title": "Day",
            "axis": {
              "labelAngle": 0,
              "format": "%e"
            }
          },
          "y": {
            "field": "date",
            "timeUnit": "month",
            "type": "ordinal",
            "title": "Month"
          },
          "color": {
            "field": "temp_max",
            "aggregate": "max",
            "type": "quantitative",
            "legend": {
              "title": null
            }
          }
        }
      }
    }
  }
};
