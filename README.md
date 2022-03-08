[![schema](https://getschema.app/img/schema_banner.jpg)](https://getschema.app/)

# schema

[![GooglePlay](https://ashatte.io/img/google-play-badge-300x89.png)](https://play.google.com/store/apps/details?id=app.getschema) [![AppStore](https://ashatte.io/img/download-on-the-app-store.png)](https://apps.apple.com/au/app/schema/id1463316309)

schema is a cross-platform mobile application for deploying mHealth monitoring and intervention studies.

It supports:

  - A diverse range of elements, including slider, text input, date/time, audio, video, image, and more, with support for branching logic.
  - Flexible module scheduling, to deliver surveys and/or interventions to participants at random or fixed intervals.
  - Participant randomisation into distinct conditions with different modules and scheduling.
  - Study registration via scanning a QR code or directly entering protocol URL.
  - Dynamic feedback charts to track participant progress on specific variables.
  - Distributed architecture, such that study protocols and data can be stored on your own server.

# Citation
If you use schema in your own research, please cite the following:
> Shatte, A. B. R., & Teague, S. J. (2020). schema: An open-source, distributed mobile platform for deploying mHealth research tools and interventions. BMC Medical Research Methodology, 20(1), 1-12. Retrieved from [https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/s12874-020-00973-5](https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/s12874-020-00973-5)

> Shatte, A. B. R., & Teague, S. J. (2019, June 12). schema (Version 1.0). Zenodo. http://doi.org/10.5281/zenodo.3243918

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.3243918.svg)](https://doi.org/10.5281/zenodo.3243918)

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
| FileTransfer | [https://ionicframework.com/docs/native/file-transfer](https://ionicframework.com/docs/native/file-transfer) |
| File | [https://ionicframework.com/docs/native/file](https://ionicframework.com/docs/native/file)

## Installation

Install the dependencies and platforms 

```sh
$ cd schema
$ ionic cordova prepare
```
The [Ionic Docs](https://ionicframework.com/docs/installation/cli) contain detailed instructions on the next steps.

## Localisation
schema uses the [ngx-translate](https://github.com/ngx-translate/core) library for translation. If you wish to contribute a localised version of the app's strings in another language, the file ```src/assets/i18n/en.json``` should be used as a template. 

## Deploying a study
To host your own study on the schema platform, the following steps are required:
* Create a study protocol and upload it to a web server (follow the instructions below)
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
We recommend using a GUI service like [JSON Editor Online](https://jsoneditoronline.org/) to build your study protocol.

#### Properties
The properties object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```study_id``` | String | An identifier for the study which is sent to the server with response data. | ```"study_id":"ABC123"``` |
| ```study_name``` | String | The name of the current study. | ```"study_name": "Sleep Study"``` |
| ```instructions``` | String | Brief description/instructions for the study that is displayed in the app. Basic HTML supported. | ```"instructions": "This study will track your sleep."``` |
| ```banner_url``` | String | The URL to an image that will be displayed on the home page of your study. It will be displayed at 100% width and maintain the aspect ratio of the original image. | ```"banner_url": "https://getschema.app/banner.png"``` |
| ```support_email``` | String | An email address that participants can contact for support with the study. | ```"support_email": "support@getschema.app"``` |
| ```support_url``` | String | A web link to the study's homepage or support information that is linked to in the app. | ```"support_url": "https://getschema.app/"``` |
| ```ethics``` | String | An ethics statement for the study. | ```"ethics": "This study was approved by ethics committee with approval number 0093423"``` |
| ```pls``` | String | A web URL to a PDF file containing the study's Plain Language Statement. | ```"pls": "https://getschema.app/pls.pdf"``` |
| ```empty_msg``` | String | A message displayed to the user when there are no tasks currently available to complete. | ```"empty_msg": "Relax, you're all up to date."``` |
| ```post_url``` | String | An endpoint to receive participant responses (POST data) from the app. | ```"post_url": "https://getschema.app/post.php"``` |
| ```conditions``` | Array | A list of conditions that participants can be randomised into. | ```"conditions": [ "Control", "Intervention" ] ``` |
| ```cache``` | Boolean | Indicates whether media elements will be cached for offline mode during study enrollment. Note: media should be optimised to reduce download times. | ```"cache": true ``` |

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
| ```name``` | String | The name of the module. Basic HTML supported. | ```"name": "Daily Checklist"``` |
| ```submit_txt``` | String | The label of the submit button for this module. Note: this value appears only on the final section of a module. | ```"submit_txt": "Finish"``` |
| ```condition``` | String | The condition that this module belongs to. It must match one of the values from the ```conditions``` array from the study properties, or have the value ```*``` to be scheduled for all participants. | ```"condition":"Control"``` |
| ```alerts``` | Object | Contains information about the scheduling of this module. Used to control access to the task and set notifications. | See *alerts*. |
| ```graph``` | Object | Contains information about the graph relating to this module (if any). Used to render the graph in the Feedback tab. | See *graph*. | 
| ```sections``` | Array | An array of section objects that contain the questions/elements for this module. | See *sections*. |
| ```uuid``` | String | A unique identifier for this module. | ```"uuid": "5f8c6ec7-463d-4e51-9ea3-480115bd9f53" ``` |
| ```unlock_after``` | Array | A list of UUIDs of modules that must be completed before this module will appear on the task list. | ```"unlock_after": [ "b79bc562-1dd2-4c3f-a1ed-6bb359cbfaaa" ] ``` |
| ```shuffle``` | Boolean | Used for counterbalancing. If ```true```, the order of the sections will be randomised every time the module is accessed. | ```"shuffle": true``` | 

##### Alerts
The alerts object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```title``` | String | The title that is displayed in the notification (main text). | ```"title": "Time to check in!``` |
| ```message``` | String | The message that is displayed in the notification (secondary text). | ```"message": "Tap here to open the app."``` |
| ```start_offset``` | Integer | Indicates when the module should first be displayed to the user, where zero is the day that the participant enrolled.  | ```"start_offset": 1``` |
| ```duration``` | Integer | Indicates the number of consecutive days that the module should be scheduled to display.  | ```"duration": 3``` |
| ```times``` | Array | The times that this module should be scheduled for each day. ```hours``` indicates the hours (24-hour time) and ```minutes``` indicates the minutes (so should be between 0 and 59).  | ```"times": [ { "hours": 8, "minutes": 30 } ]``` |
| ```random``` | Boolean | Indicates whether the alert times should be randomised. If true, each value from ```times``` will be set using the value of ```random_interval```. | ```"random": true``` |
| ```random_interval``` | Integer | The number of minutes before and after that an alert time should be randomised. For example, if the alert is scheduled for 8.30am and the ```random_interval``` is 30, the alert will be scheduled randomly between 8 and 9am. | ```"random_interval": 30``` |
| ```sticky``` | boolean | Indicates whether the module should remain available in the Tasks list upon response, allowing the user to access this module repeatedly. | ```"sticky": true``` |
| ```sticky_label``` | String | A title that appears above a sticky module on the home screen. Multiple sticky modules that are set to appear in succession will be grouped under this title. | ```"sticky_label": "Warm up videos"``` |
| ```timeout``` | Boolean | If ```timeout``` is true, the task will disappear from the list after the number of milliseconds specified in ```timeout_after``` have elapsed (if the module is not completed before this time). | ```"timeout": true``` |
| ```timeout_after``` | Integer | The number of milliseconds after a task is displayed that it will disappear from the list. ```timeout``` must be ```true``` for this to have any effect. | ```"timeout_after": 300000``` |

##### Graph
The graphs object must define the following attributes:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```display``` | Boolean | Indicates whether this module displays a feedback graph in the Feedback tab. If the value is ```false```, the remaining variables are ignored. | ```"display": true``` |
| ```variable``` | String | The ```id``` of a question object to graph. It must match one of the module's question ids. | ```"variable": "q4"``` |
| ```title``` | String | The title of the graph to be displayed in the Feedback tab. | ```"title": "Daily sleep"``` |
| ```blurb``` | String | A brief description of the graph to be displayed below it in the feedback tab. Basic HTML supported. | ```"blurb": "Your daily sleep in hours"``` |
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
| ```shuffle``` | Boolean | Used for counterbalancing. If ```true```, the order of the questions in this section will be randomised. | ```"shuffle": true``` |

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
| ```id``` | String | A unique id to identify this question. This id is sent to the server along with any response value. Note: Every element in the entire study protocol must have a unique ```id``` for some features to function correctly.  | ```"id": "q1"``` |
| ```type``` | String | The primary type of this question. Accepted values are ```instruction```, ```datetime```, ```multi```, ```text```, ```slider```, ```video```, ```audio```, and ```yesno```. | ```"type": "slider"``` |
| ```text``` | String | The label displayed alongside the question. Basic HTML supported. | ```"text": "How do you feel?"``` |
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
| ```subtype``` | String | The specific type of date/time input for this field. Accepted values are ```date``` (datepicker only), ```time``` (timepicker only), and ```datetime``` (both). | ```"subtype": "time"``` |  

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
| ```modal``` | Boolean | Denotes whether the selections should appear in a modal popup (good for longer lists) | ```"modal": false``` |
| ```options``` | Array | The list of choices to display. | ```"options": [ "Dog", "Cat", "Fish" ]``` |
| ```shuffle``` | Boolean | If ```true```, the order of the choices will be randomly shuffled. | ```"shuffle": true``` |

##### Media
Media questions must have the following additional properties:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```subtype``` | String | The type of media. Accepted values are ```video```, ```audio```, and ```image```. | ```"subtype": "video"``` | 
| ```src``` | String | A direct URL to the media source. | ```"src": "https://getschema.app/video.mp4"``` |
| ```thumb``` | String | Required for ```video``` elements. A direct URL to the placeholder image that is displayed in the video player while loading. | ```"thumb": "https://getschema.app/thumbnail.png"``` |

#### Branching
To use branching, you need to add two additional properties to the question object that is to be dynamically shown/hidden.

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```hide_id``` | String | The ```id``` of the question that will trigger this question to dynamically show/hide. | ```"hide_id": "q5"``` |
| ```hide_value``` | String/Boolean | The value that needs to be selected in the question denoted by ```hide_id``` which will make this question appear. When using sliders, the value should be prefixed with a direction and is inclusive, e.g. ```>50``` or ```<50```. | ```"hide_value": "10"``` |
| ```hide_if``` | Boolean | Indicates the branching behaviour. If ```true```, the element will disappear if the value of the question equals ```hide_value```. If false, the element will appear appear instead. | ```"hide_if": false``` |
                     
Currently, branching is supported by the ```multi```, ```yesno```, and ```slider``` question types. 

#### Randomisation of elements
Elements can also be grouped for randomisation, such that every time a module is accessed only one of the random elements will be displayed. An example use case would be to display a random image from a set of images. To achieve this, add the following property to each group of elements:

| Property | Type | Description | Example |
| ------ | ------ | ------ | ------ |
| ```rand_group``` | String | An identifier that groups a set of elements together so that only one will randomly appear every time a module is accessed. Note: To identify which element was visible, it will be given a response value of ```1```. If the element can record a response this value will be replaced with that response. All hidden elements will record no response. | ```"rand_group": "sad_images"``` |

### Collecting data
The ```post_url``` defined in the study protocol's properties object should point to an endpoint that can receive POST requests. The endpoint should return the boolean value ```true``` if data has been successfully saved - schema will continue submitting each data point to the server until it receives this acknowledgement. 

schema posts the following variables to the server whenever a task is completed:

| POST id | Type | Description |
| ------ | ------ | ------ | 
| ```data_type``` | String | Describes whether ```log``` or ```survey_response``` data is being submitted. | 
| ```study_id``` | String | The identifier of the study taken from the ```study_id``` property of the study protocol. |
| ```user_id``` | String | The unique id of the user. |
| ```module_index``` | Integer | The index of the module in the ```modules``` array (zero-based).  | 
| ```platform``` | String | The platform the user responded on. Value will be ```iphone```, ```ipad``` or ```android```. |

For ```survey_response``` data, these additional variables are included:

| POST id | Type | Description |
| ------ | ------ | ------ | 
| ```module_name``` | String | The name of the module. | 
| ```responses``` | String | The questions responses for this task, provided as a stringified JSON object. The key is the ```id``` of the question, for example ```{ "q1": 56 , "q2": "No", "q3": "" }```. |
| ```response_time``` | Timestamp | The timestamp when the module was completed, in the user's local time, e.g. ```2019-05-08T23:16:21+10:00```. |
| ```alert_time``` | Timestamp | The timestamp when the module was first scheduled to appear, e.g. ```2019-05-08T23:00:21+10:00```. |

For ```log``` data, these additional variables are included:

| POST id | Type | Description |
| ------ | ------ | ------ | 
| ```page``` | String | The page the user visited in the app. Value can be ```home```, ```my-progress```, ```settings```, or ```survey```. If ```survey```, the ```module_index``` variable will differentiate which module was accessed. | 
| ```timestamp``` | Timestamp | The timestamp when the user visited the page, e.g. ```2019-10-29T16:08:58+11:00```. |

### Distribution
Participants can sign up to your study by scanning a QR code or entering a URL. Upload your JSON study protocol to a web server and distribute the link. We recommend using a service like [QRCode Monkey](https://www.qrcode-monkey.com/) to generate a QR code that points to your study protocol link. The URL can be shortened for distribution using [Bitly](https://bitly.com/).

# Testing your program
The variability in devices that support mHealth apps and the diversity of possible research designs within schema may result in unintended bugs. Therefore it is important that you conduct thorough testing of any program you deploy to schema before sharing it with participants. 

## Feedback
Please post any bugs, issues or suggested features in the Issues tab.

# Localisation
schema uses the [ngx-translate](https://github.com/ngx-translate/core) library for translation. If you wish to contribute a localised version of the app's strings in another language, the file ```src/assets/i18n/en.json``` should be used as a template. Follow the documentation from ngx-translate to determine the correct name for your language file. 

License
----

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
