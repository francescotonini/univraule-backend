# UniVR Orari - Backend
This repository contains the backend source code of [UniVR Orari](https://github.com/francescotonini/univrorari-app) and [UniVR Aule](https://github.com/francescotonini/univraule)

## Endpoint documentation
### Get all courses
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

### Get lessons
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

### Get offices
`GET /offices`

```json
[
	{
		"name": "Nome sede",
		"id": "{officeId}"
	}
]
```

### Get rooms
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

### Get teachings
`GET /academicyear/{academicYearId}/course/{courseId}/teachings`

```json
[
    {
        "id": "999|1",
        "teachings": [
			{
				"id": "EC111111",
				"name": "Analisi matematica I"
			}
		]
	}
]
```
