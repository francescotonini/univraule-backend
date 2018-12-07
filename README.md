# UniVR Aule - Backend
This repository contains the backend source code of [UniVR Aule](https://github.com/francescotonini/univraule-app-android), [UniVR Aule Bot](https://github.com/francescotonini/univraule-bot) and the Alexa Skill

## Endpoint documentation
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
