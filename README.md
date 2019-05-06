# schema

[![GooglePlay](https://ashatte.io/img/google-play-badge-300x89.png)](https://ashatte.io/) [![AppStore](https://ashatte.io/img/download-on-the-app-store.png)](https://ashatte.io)

schema is a cross-platform mobile application for deploying ecological momentary assessment and intervention studies.

It supports:

  - A diverse range of elements, including slider, text input, date/time, audio, video, image, and more, with support for branching logic.
  - Flexible module scheduling, to deliver surveys and/or interventions to participants at random or fixed intervals.
  - Participant randomisation into distinct conditions with different modules and scheduling.
  - Study registration via scanning a QR code or directly entering protocol URL.
  - Dynamic feedback charts to track participant progress on specific variables.
  - Distributed architecture, such that study protocols and data can be stored on your own server.

# Citation
If you use schema in your own research, please cite the following paper:
> Shatte, A., & Teague, S. (2019). schema: A distributed mobile platform for deploying ecological momentary assessments and interventions. https://doi.org/xxx

# Usage

## Dependencies

schema depends on the following frameworks:

* [Ionic](https://ionicframework.com/) - Cross-platform mobile app development
* [node.js](https://nodejs.org/en/) - Cross-platform JavaScript run-time environment
* [Chart.js](Chart.js) - Open source HTML5 charts

### Plugins

schema uses the following Ionic Native plugins to achieve native functionality:

| Plugin | Documentation |
| ------ | ------ |
| Barcode Scanner | [https://ionicframework.com/docs/native/barcode-scanner](https://ionicframework.com/docs/native/barcode-scanner) |
| LocalNotifications | [https://ionicframework.com/docs/native/local-notifications](https://ionicframework.com/docs/native/local-notifications) |

## Installation

Install the dependencies and platforms 

```sh
$ cd schema
$ ionic cordova prepare
```

## Deploying a study
To host your own study on the schema platform, the following steps are required:
* Create a study protocol and upload it to a web server
* Create a page on a server to receive post requests and save data

### Study protocol
A study protocol is defined in a JSON file. At the highest level, this file contains two objects: the *properties* object which stores the metadata about the study; and the *modules* object which stores the individual survey/intervention tasks that will be delivered to the participants.

    {
        "properties": {
            ...
        },
        "modules": [
            ...
        ]
    }

#### Properties
The properties object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```study_id``` | String | An identifier for the study which is sent to the server with response data. | ```"study_id":"ABC123"``` |
| ```study_name``` | String | The name of the current study. | ```"study_name": "Sleep Study"``` |
| ```created_by``` | String | The creator of the study, displayed in the app. | ```"created_by": "Psych College"``` |
| ```description``` | String | A brief description of the study that is displayed in the app. | ```"description": "This study will track your sleep."``` |
| ```support_email``` | String | An email address that participants can contact for support with the study. | ```"support_email": "support@getschema.app"``` |
| ```support_url``` | String | A web link to the study's homepage or support information that is linked to in the app. | ```"support_url": "https://getschema.app/"``` |
| ```empty_msg``` | String | A message displayed to the user when there are no tasks currently available to complete. | ```"empty_msg": "Relax, you're all up to date."``` |
| ```post_url``` | String | An endpoint to receive participant responses (POST data) from the app. | ```"post_url": "https://getschema.app/post.php"``` |
| ```conditions``` | Array | A list of conditions that participants can be randomised into. | ```"conditions": [ "Control", "Intervention" ] ```

License
----

MIT
