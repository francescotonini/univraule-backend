# UniVR Orari - Backend
Questa respository contiene il codice sorgente del backend di [UniVR Orari](https://github.com/francescotonini/univrorari-app)

## Documentazione endpoint
A seguire una breve documentazione sugli endpoint disponibili
 
### Lista corsi
`GET /courses`

```json
[
	{
		"name": "Nome corso",
		"academicYearId": "{academicYearId}",
		"courseId": "{courseId}", 
		"years": [
			{
				"name": "1 anno",
				"year": "{courseYearId}"
			}
		]
	}
]
```

### Lista lezioni
`GET /academicyear/{academicYearId}/course/{courseId}/year/{courseYearId}/lessons?[year={year}&month={month}]`

```json
[
	{
		"name": "Nome lezione",
		"teacher": "Docente",
		"room": "Aula",
		"startTimestamp": 1509697617,
		"endTimpestamp": 1509697618
	}
]
```

### Lista sedi
`GET /offices`

```json
[
	{
		"name": "Nome sede",
		"id": "{officeId}"
	}
]
```

### Lista aule
`GET /offices/{officeId}/rooms`

```json
[
	{
		"name": "Nome aula",
		"events": [
			{
				"name": "Nome evento",
				"startTimestamp": 1509697617,
				"endTimestamp": 1509697618
			}
		]
	}
]
```

### Lista materie
`GET /academicyear/{academicYearId}/course/{courseId}/year/{courseYearId}/teachings`

```json
[
	{
		"id": "id materia",
		"name": "Nome materia",
	}
]
```
