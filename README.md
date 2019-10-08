# UniVR Aule - Backend

This repository contains the backend source code of [UniVR Aule](https://github.com/francescotonini/univraule), 
[the Telegram bot](https://t.me/univraulebot) and the Alexa Skill UniVR Aule

If you want to use Timber, sets both `TIMBER_API_KEY` and `TIMBER_SOURCE_ID` as env vars.

## Endpoint documentation
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
