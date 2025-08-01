---
uuid: 765bbba9-37be-493b-aea3-59ef4341d013
tags:
  - panel/query
title: Personal Ontology View
order: "7"
---

# Class info

## Direct instances of this class

```osg
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?concept
WHERE {
	  ?concept a __THIS__ . 
}
GROUP BY ?concept ?class
LIMIT 300
```

## Broader transitive

```osg
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT (?superClass as ?concept) 
WHERE {
  __THIS__ rdfs:subClassOf+ ?superClass .
  OPTIONAL {
    __THIS__ rdfs:subClassOf+ ?mid .
    ?mid rdfs:subClassOf+ ?superClass .
    FILTER (?mid != ?superClass)
  }
}
GROUP BY ?superClass
ORDER BY (COUNT(?mid))
```

## Narrower transitive

```osg
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT (?subClass as ?concept) 
WHERE {
  ?subClass rdfs:subClassOf+ __THIS__ .
  OPTIONAL {
    ?subClass rdfs:subClassOf+ ?mid .
    ?mid rdfs:subClassOf+ __THIS__ .
    FILTER (?mid != ?subClass)
  }
}
GROUP BY ?subClass
ORDER BY (COUNT(?mid))
```

## Direct Domain

```osg
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?domainOf
WHERE {
	?domainOf rdfs:domain __THIS__ .
}
```

## Direct Range

```osg
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?rangeOf
WHERE {
	?rangeOf rdfs:range __THIS__ .
}
```
