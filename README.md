[![schema](https://ashatte.io/img/schema.png)](https://ashatte.io/schema/)

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
A study protocol is defined in a JSON file. At the highest level, this file contains two attributes: the *properties* object which stores the metadata about the study; and the *modules* array which stores the individual survey/intervention tasks that will be delivered to the participants.

```
{
  "properties": {
    /* property attributes */
  },
  "modules": [
    /* module objects */
  ]
}
```

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

#### Modules
The modules array contains one or many module objects, which encapsulate the surveys and/or interventions that will be delivered to the participants of your study. A module object has this high-level structure:

```
{
  "type": "...",
  "name": "...",
  "submit_txt": "...",
  "condition": "...",
  "alerts": {
      /* alert properties */
  },
  "graph": {
      /* graph properties */
  }, 
  "sections": [
      /* section objects with questions */
  ]
 }
```
The properties of a module object are defined as follows:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```type``` | String | The type of the module. Accepted values are ```survey```, ```info```, ```video```, and ```audio```. | ```"type": "survey"``` |
| ```name``` | String | The name of the module. | ```"name": "Daily Checklist"``` |
| ```submit_txt``` | String | The label of the submit button for this module. Note: this value appears only on the final section of a module. | ```"submit_txt": "Finish"``` |
| ```condition``` | String | The condition that this module belongs to. It must match one of the values from the ```conditions``` array from the study properties. | ```"condition":"Control"``` |
| ```alerts``` | Object | Contains information about the scheduling of this module. Used to control access to the task and set notifications. | See *alerts* docs. |
| ```graph``` | Object | Contains information about the graph relating to this module (if any). Used to render the graph in the Feedback tab. | See *graph* docs. | 
| ```sections``` | Array | An array of section objects that contain the questions/elements for this module. | See *sections* docs. |

##### Alerts
The alerts object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```startOffset``` | Integer | Indicates when the module should first be displayed to the user, where zero is the day that the participant enrolled.  | ```"startOffset": 1``` |
| ```duration``` | Integer | Indicates the number of consecutive days that the module should be scheduled to display.  | ```"duration": 3``` |
| ```times``` | Array | The times that this module should be scheduled for each day. ```hours``` indicates the hours (24-hour time) and ```minutes``` indicates the minutes (so should be between 0 and 59).  | ```"times": [ { "hours": 8, "minutes": 30 } ]``` |
| ```random``` | Boolean | Indicates whether the alert times should be randomised. If true, each value from ```times``` will be set using the value of ```randomInterval```. | ```"random": true``` |
| ```randomInterval``` | Integer | The number of minutes before and after that an alert time should be randomised. For example, if the alert is scheduled for 8.30am and the ```randomInterval``` is 30, the alert will be scheduled randomly between 8 and 9am. | ```"randomInterval": 30``` |
| ```sticky``` | boolean | CHECK THIS ONE | |
| ```timeout``` | | CHECK THIS ONE | |

##### Graph
The graphs object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```display``` | Boolean | | ```"display": true``` |
| ```variable``` | String | | ```"variable": "q4"``` |
| ```title``` | String | | ```"title": "Daily sleep"``` |
| ```blurb``` | String | | ```"blurb": "Your daily sleep in hours"``` |
| ```type``` | String | | ```"type": "line"``` | 
| ```max_points``` | Integer | | ```"max_points": 10``` | 

##### Sections
The sections array contains one or many section objects, which have this high level structure:

    "sections": [
        {
            "name": "Demographics",
            "questions": [
                /* question objects */
            ]
        }
    ]
License
----

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
