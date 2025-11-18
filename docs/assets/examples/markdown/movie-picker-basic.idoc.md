```json vega
{
  "$schema": "https://vega.github.io/schema/vega/v6.json",
  "description": "This is the central brain of the page",
  "signals": [
    {
      "name": "selectedGenre",
      "value": ""
    },
    {
      "name": "filteredByGenre",
      "update": "data('filteredByGenre')"
    },
    {
      "name": "selectedCreativeType",
      "value": ""
    },
    {
      "name": "selectedMpaaRating",
      "value": ""
    },
    {
      "name": "selected_Major_Genre",
      "value": "All Movies",
      "update": "selectedGenre && selectedGenre !== 'null' && selectedGenre !== '' ? selectedGenre + ' Movies' : 'All Movies'"
    },
    {
      "name": "filteredByCreativeType",
      "update": "data('filteredByCreativeType')"
    },
    {
      "name": "selected_Creative_Type",
      "value": "All Creative Types",
      "update": "selectedCreativeType && selectedCreativeType !== 'null' && selectedCreativeType !== '' ? selectedCreativeType + ' Movies' : 'All Creative Types'"
    },
    {
      "name": "selected_MPAA_Rating",
      "value": "All Ratings",
      "update": "selectedMpaaRating && selectedMpaaRating !== 'null' && selectedMpaaRating !== '' ? selectedMpaaRating + ' Movies' : 'All Ratings'"
    },
    {
      "name": "filteredByMpaaRating",
      "update": "data('filteredByMpaaRating')"
    },
    {
      "name": "moviesData",
      "update": "data('moviesData')"
    }
  ],
  "data": [
    {
      "name": "moviesData",
      "url": "https://vega.github.io/editor/data/movies.json",
      "format": {
        "type": "json"
      }
    },
    {
      "name": "filteredByGenre",
      "source": [
        "moviesData"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "!selectedGenre || selectedGenre === '' || selectedGenre === 'null' || datum['Major Genre'] === selectedGenre"
        }
      ]
    },
    {
      "name": "filteredByCreativeType",
      "source": [
        "filteredByGenre"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "!selectedCreativeType || selectedCreativeType === '' || selectedCreativeType === 'null' || datum['Creative Type'] === selectedCreativeType"
        }
      ]
    },
    {
      "name": "filteredByMpaaRating",
      "source": [
        "filteredByCreativeType"
      ],
      "transform": [
        {
          "type": "filter",
          "expr": "!selectedMpaaRating || selectedMpaaRating === '' || selectedMpaaRating === 'null' || datum['MPAA Rating'] === selectedMpaaRating"
        }
      ]
    }
  ]
}
```


# Movies Database Explorer

## Step 1: Filter by Genre

**Select Genre:**


```yaml dropdown
variableId: selectedGenre
value: ''
dynamicOptions:
  dataSourceName: moviesData
  fieldName: Major Genre
```


## {{selected_Major_Genre}}


```json tabulator
{
  "dataSourceName": "filteredByGenre",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "minHeight": "400px",
    "maxHeight": "400px",
    "pagination": "local",
    "paginationSize": 15
  }
}
```


## Step 2: Filter by Creative Type

**Select Creative Type:**


```yaml dropdown
variableId: selectedCreativeType
value: ''
dynamicOptions:
  dataSourceName: filteredByGenre
  fieldName: Creative Type
```


## {{selected_Creative_Type}}


```json tabulator
{
  "dataSourceName": "filteredByCreativeType",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "minHeight": "400px",
    "maxHeight": "400px",
    "pagination": "local",
    "paginationSize": 15,
    "columns": [
      {
        "title": "Title",
        "field": "Title"
      },
      {
        "title": "Director",
        "field": "Director"
      },
      {
        "title": "Creative Type",
        "field": "Creative Type",
        "visible": false
      },
      {
        "title": "Release Date",
        "field": "Release Date"
      },
      {
        "title": "MPAA Rating",
        "field": "MPAA Rating"
      },
      {
        "title": "Running Time",
        "field": "Running Time min"
      },
      {
        "title": "IMDB Rating",
        "field": "IMDB Rating"
      },
      {
        "title": "US Gross",
        "field": "US Gross",
        "formatter": "money"
      },
      {
        "title": "Worldwide Gross",
        "field": "Worldwide Gross",
        "formatter": "money"
      }
    ]
  }
}
```


## Step 3: Filter by MPAA Rating

**Select MPAA Rating:**


```yaml dropdown
variableId: selectedMpaaRating
value: ''
dynamicOptions:
  dataSourceName: filteredByCreativeType
  fieldName: MPAA Rating
```


## {{selected_MPAA_Rating}}


```json tabulator
{
  "dataSourceName": "filteredByMpaaRating",
  "tabulatorOptions": {
    "autoColumns": true,
    "layout": "fitColumns",
    "minHeight": "400px",
    "maxHeight": "400px",
    "pagination": "local",
    "paginationSize": 15,
    "columns": [
      {
        "title": "Title",
        "field": "Title"
      },
      {
        "title": "Director",
        "field": "Director"
      },
      {
        "title": "Creative Type",
        "field": "Creative Type",
        "visible": false
      },
      {
        "title": "Release Date",
        "field": "Release Date"
      },
      {
        "title": "MPAA Rating",
        "field": "MPAA Rating",
        "visible": false
      },
      {
        "title": "Running Time",
        "field": "Running Time min"
      },
      {
        "title": "IMDB Rating",
        "field": "IMDB Rating"
      },
      {
        "title": "US Gross",
        "field": "US Gross",
        "formatter": "money"
      },
      {
        "title": "Worldwide Gross",
        "field": "Worldwide Gross",
        "formatter": "money"
      }
    ]
  }
}
```