# UniVR Orari e Aule - Backend
This repository contains the backend source code of [UniVR Orari e Aule](https://github.com/francescotonini/univrorari-app), [UniVR Aule](https://github.com/francescotonini/univraule) and 
[the Telegram bot for UniVR Aule](https://t.me/univraulebot)

## Endpoint documentation
### Get all courses
`GET /courses`

```json
[
	{
		"name": "{courseName}",
		"academicYearId": "{academicYearId}",
		"courseId": "{courseId}", 
		"years": [
			{
				"name": "{yearName}",
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
		"name": "{lessonName}",
		"teacher": "{teacher}",
		"room": "{room}",
		"startTimestamp": "1509697617000",
		"endTimpestamp": "1509697618000"
	}
]
```

### Get offices
`GET /offices`

```json
[
	{
		"name": "{officeName}",
		"id": "{officeId}"
	}
]
```

### Get rooms
`GET /offices/{officeId}/rooms`

```json
[
	{
		"name": "{roomName}",
		"events": [
			{
				"name": "{eventName}",
				"startTimestamp": "1509697617000",
				"endTimestamp": "1509697618000"
			}
		],
		"isFree": "{true | false}",
		"until": "1509697617000"
	}
]
```

### Get teachings
`GET /academicyear/{academicYearId}/course/{courseId}/teachings`

```json
[
    {
        "id": "{teachingId}",
        "name": "{teachingName}",
        "yearId": "{yearId}"
    }
]
```
