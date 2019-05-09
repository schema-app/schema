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
| SQLite | [https://ionicframework.com/docs/native/sqlite](https://ionicframework.com/docs/native/sqlite) |

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
| ```banner_url``` | String | The URL to an image that will be displayed on the home page of your study. It will be displayed at 100% width and maintain the aspect ratio of the original image. | ```"banner_url": "https://getschema.app/banner.png"``` |
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
| ```condition``` | String | The condition that this module belongs to. It must match one of the values from the ```conditions``` array from the study properties, or have the value ```*``` to be scheduled for all participants. | ```"condition":"Control"``` |
| ```alerts``` | Object | Contains information about the scheduling of this module. Used to control access to the task and set notifications. | See *alerts*. |
| ```graph``` | Object | Contains information about the graph relating to this module (if any). Used to render the graph in the Feedback tab. | See *graph*. | 
| ```sections``` | Array | An array of section objects that contain the questions/elements for this module. | See *sections*. |

##### Alerts
The alerts object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```startOffset``` | Integer | Indicates when the module should first be displayed to the user, where zero is the day that the participant enrolled.  | ```"startOffset": 1``` |
| ```duration``` | Integer | Indicates the number of consecutive days that the module should be scheduled to display.  | ```"duration": 3``` |
| ```times``` | Array | The times that this module should be scheduled for each day. ```hours``` indicates the hours (24-hour time) and ```minutes``` indicates the minutes (so should be between 0 and 59).  | ```"times": [ { "hours": 8, "minutes": 30 } ]``` |
| ```random``` | Boolean | Indicates whether the alert times should be randomised. If true, each value from ```times``` will be set using the value of ```randomInterval```. | ```"random": true``` |
| ```randomInterval``` | Integer | The number of minutes before and after that an alert time should be randomised. For example, if the alert is scheduled for 8.30am and the ```randomInterval``` is 30, the alert will be scheduled randomly between 8 and 9am. | ```"randomInterval": 30``` |
| ```sticky``` | boolean | Indicates whether the module should remain available in the Tasks list upon response, allowing the user to access this module repeatedly. | ```"sticky": true``` |
| ```timeout``` | | CHECK THIS ONE | |

##### Graph
The graphs object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```display``` | Boolean | Indicates whether this module displays a feedback graph in the Feedback tab. If the value is ```false```, the remaining variables are ignored. | ```"display": true``` |
| ```variable``` | String | The ```id``` of a question object to graph. It must match one of the module's question ids. | ```"variable": "q4"``` |
| ```title``` | String | The title of the graph to be displayed in the Feedback tab. | ```"title": "Daily sleep"``` |
| ```blurb``` | String | A brief description of the graph to be displayed below it in the feedback tab. | ```"blurb": "Your daily sleep in hours"``` |
| ```type``` | String | The type of graph. Currently ```bar``` and ```line``` are supported. | ```"type": "line"``` | 
| ```max_points``` | Integer | The maximum number of data points to display in the graph, e.g. ```10``` will only show the ten most recent responses. | ```"max_points": 10``` | 

##### Sections
The sections array contains one or many section objects, which have this high level structure:

    {
        "name": "Demographics",
        "questions": [
            /* question objects */
        ]
    }

The properties are defined as follows:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```name``` | String | The title of this section, which is displayed at the top of the screen. | ```"name": "Demographics"``` | 
| ```questions``` | Array | An array containing all of the questions for this section of the module. | See *questions*. |

#### Questions
There are several types of question object that can be added to a section, including:

* Instruction
* Text Input
* Date/Time
* Yes/No (boolean)
* Slider
* Multiple Choice
* Media

All question objects must include the following properties:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```id``` | String | A unique id to identify this question. This id is sent to the server along with any response value. | ```"id": "q1"``` |
| ```type``` | String | The primary type of this question. Accepted values are ```instruction```, ```datetime```, ```multi```, ```text```, ```slider```, ```video```, ```audio```, and ```yesno```. | ```"type": "slider"``` |
| ```text``` | String | The label displayed alongside the question. | ```"text": "How do you feel?"``` |
| ```required``` | Boolean | Denotes whether this question is required to be answered. The app will force the participant to answer all required questions that are not hidden by branching. | ```"required": true``` | 

Many question types have additional properties that they must include, which are outlined in the following sections.

##### Text Input
Text Input questions must have the following additional property:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```subtype``` | String | The specific type of text input for this field. Accepted values are ```short```, ```long```, and ```numeric```. | ```"subtype": "long"``` |

##### Date/Time
Date/Time questions must have the following additional property:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```subtype``` | String | The specific type of date/time input for this field. Accepted values are ```date```, ```time```, and ```datetime```. | ```"subtype": "time"``` |  

##### Yes/No
Yes/No questions must have the following additional properties:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```yes_text``` | String | The label for a true/yes response. | ```"yes_text": "Agree"``` | 
| ```no_text``` | String | The label for a false/no response. | ```"no_text": "Disagree"``` |

##### Slider
Slider questions must have the following additional properties:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```min``` | Integer | The minimum value for the slider range. | ```"min": 0``` |
| ```max``` | Integer | The maximum value for the slider range. | ```"max": 100``` |
| ```hint_left``` | String | A label displayed to the left of the slider. | ```"hint_left": "less"``` |
| ```hint_right``` | String | A label displayed to the right of the slider. | ```"hint_right": "more"``` |

##### Multiple Choice
Multiple choice questions must have the following additional properties:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```radio``` | Boolean | Denotes whether the multiple choice should be radio buttons (one selection only) or checkboxes (multiple selections allowed). | ```"radio": true``` |
| ```options``` | Array | The list of choices to display. | ```"options": [ "Dog", "Cat", "Fish" ]``` |

##### Media
Media questions must have the following additional properties:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```subtype``` | String | The type of media. Accepted values are ```video```, ```audio```, and ```image```. | ```"subtype": "video"``` | 
| ```src``` | String | A direct URL to the media source. | ```"src": "https://getschema.app/video.mp4"``` |

#### Branching
To use branching, you need to add two additional properties to the question object that is to be dynamically shown/hidden.

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```hide_id``` | String | The ```id``` of the question that will trigger this question to dynamically show/hide. | ```"hide_id": "q5"``` |
| ```hide_value``` | String/Boolean | The value that needs to be selected in the question denoted by ```hide_id``` which will make this question appear. When using sliders, the value should be prefixed with a direction and is inclusive, e.g. ```>50``` or ```<50```. | ```"hide_value": "10"``` |
                     
Currently, branching is supported by the ```multi```, ```yesno```, and ```slider``` question types. 

### Collecting data
The ```post_url``` defined in the study protocol's properties object should point to an endpoint that can receive POST requests. schema posts the following variables to the server whenever a task is completed:

| POST id | Type | Description |
| ------ | ------ | ------ | 
| ```study_id``` | String | The identifier of the study taken from the ```study_id``` property of the study protocol. |
| ```user_id``` | String | The unique id of the user. |
| ```platform``` | String | The platform the user responded on. Value will be ```ios``` or ```android```. |
| ```module_index``` | Integer | The index of the module in the ```modules``` array (zero-based).  | 
| ```module_name``` | String | The name of the module. | 
| ```responses``` | Array (verify this) | The questions responses for this task, provided as a collection of key-value pairs. The key is the ```id``` of the question, for example ```{ "q1": 56 }, { "q2": "No" }```. |
| ```response_time``` | Timestamp | The timestamp when the module was completed, in the user's local time, e.g. ```2019-05-08T23:16:21+10:00```. |


License
----

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
