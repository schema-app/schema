import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { StudyTasksService } from '../services/study-tasks.service';
import { SurveyDataService } from '../services/survey-data.service';
import { NavController, IonContent, ToastController } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import * as moment from 'moment';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.page.html',
  styleUrls: ['./survey.page.scss'],
})
export class SurveyPage implements OnInit {

  @ViewChild(IonContent, {static: false}) content: IonContent

  // the text to display as submit button label
  submit_text: string = "Submit"

  // variables to handle the sections
  current_section: number = 1
  num_sections: number
  current_section_name: string

  // study object
  study: any
  // survey template - load prior to data from storage
  survey: any = {
    sections: [{
      questions: [],
      name: "",
      shuffle: false
    }],
    shuffle: false,
    submit_text: ""
  };
  questions: any

  // task objects
  tasks: Array<any>
  task_id: string
  task_index: number
  module_index: number
  module_name: string

  constructor(private route: ActivatedRoute,
    private storage: Storage,
    private statusBar: StatusBar,
    private domSanitizer: DomSanitizer,
    private navController: NavController,
    private studyTasksService: StudyTasksService,
    private surveyDataService: SurveyDataService,
    private toastController: ToastController,
    private ngZone: NgZone,
    private iab: InAppBrowser) { }

  /**
   * Triggered when the survey page is first opened
   * Initialises the survey and displays it on the screen
   */
  ngOnInit() {
    // set statusBar to visible on Android
    this.statusBar.styleLightContent()
    this.statusBar.backgroundColorByHexString('#0F2042')

    // necessary to update height of external embedded content
    window.addEventListener('message', function(e) {
      if (e.data.hasOwnProperty("frameHeight")) {
        (<HTMLElement>document.querySelector('iframe[src^="'+e.data.url+'"]')).style.height = `${e.data.frameHeight + 10}px`;
        (<HTMLElement>document.querySelector('iframe[src^="'+e.data.url+'"]')).style.width = `99%`
      }
    })

    // the id of the task to be displayed
    this.task_id = this.route.snapshot.paramMap.get('task_id')

    Promise.all([this.storage.get("current-study"), this.storage.get("uuid")]).then(values => {

      const studyObject = values[0]
      const uuid = values [1]

      // get the task object for this task
      this.studyTasksService.getAllTasks().then(tasks => {
        this.tasks = tasks
        for (let i = 0; i < this.tasks.length; i++) {
          if (this.task_id == this.tasks[i].task_id) {
            this.module_name = this.tasks[i].name
            this.module_index = this.tasks[i].index
            this.task_index = i
            break
          }
        }

        // check if this task is valid
        const availableTasks = this.studyTasksService.getTaskDisplayList().then(tasks => {
          let taskAvailable = false;
          for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].task_id == this.task_id) {
              taskAvailable = true
              break
            }
          }
          if (!taskAvailable) {
            this.showToast("This task had a time limit and is no longer available.", "bottom")
            this.navController.navigateRoot('/')
          } 
        });

        // extract the JSON from the study object
        this.study = JSON.parse(studyObject)

        // get the correct module
        this.survey = this.study.modules[this.module_index]

        // shuffle modules if required
        if (this.survey.shuffle) {
          this.survey.sections = this.shuffle(this.survey.sections)
        }

        // shuffle questions if required
        for (let i = 0; i < this.survey.sections.length; i++) {
          if (this.survey.sections[i].shuffle) {
            this.survey.sections[i].questions = this.shuffle(this.survey.sections[i].questions)
          }
        }

        // get the name of the current section
        this.num_sections = this.survey.sections.length
        this.current_section_name = this.survey.sections[this.current_section - 1].name

        // get the user ID and then set up question variables
        // initialise all of the questions to be displayed
        this.setupQuestionVariables(uuid)

        // set the submit text as appropriate
        if (this.current_section < this.num_sections) {
          this.submit_text = "Next"
        } else {
          this.submit_text = this.survey.submit_text
        }

        // set the current section of questions
        this.questions = this.survey.sections[this.current_section - 1].questions

        // toggle rand_group questions
        // figure out which ones are grouped together, randomly show one and set its response value to 1
        const randomGroups = {}
        for (let i = 0; i < this.survey.sections.length; i++) {
          for (let j = 0; j < this.survey.sections[i].questions.length; j++) {
            let question = this.survey.sections[i].questions[j]
            if (question.rand_group !== undefined) {

              // set a flag to indicate that this question shouldn't reappear via branching logic
              question.noToggle = true

              // categorise questions by rand_group
              if (!(question.rand_group in randomGroups)) {
                randomGroups[question.rand_group] = []
                randomGroups[question.rand_group].push(question.id)
              } else {
                randomGroups[question.rand_group].push(question.id)
              }
            }
          }
        }

        // from each rand_group, select a random item to show
        const showThese = []
        for (let key in randomGroups) {
          if (randomGroups.hasOwnProperty(key)) {
            // select a random value from each array and add it to the "showThese array"
            showThese.push(randomGroups[key][Math.floor(Math.random() * randomGroups[key].length)])
          }
        }

        // iterate back through and show the ones that have been randomly calculated
        // while removing the branching attributes from those that are hidden
        for (let i = 0; i < this.survey.sections.length; i++) {
          for (let j = 0; j < this.survey.sections[i].questions.length; j++) {
            const question = this.survey.sections[i].questions[j]
            if (showThese.includes(question.id)) {
              question.noToggle = false
              question.response = 1
              // hide any questions from the rand_group that were not made visible
              // and remove any branching logic attributes
            } else if (question.noToggle) {
              question.hideSwitch = false
              delete question.hide_id
              delete question.hide_value
              delete question.hide_if
            }
          }
        }

        // toggle dynamic question setup 
        for (let i = 0; i < this.survey.sections.length; i++) {
          for (let j = 0; j < this.survey.sections[i].questions.length; j++) {
            this.toggleDynamicQuestions(this.survey.sections[i].questions[j])
          }
        }

        // log the user visiting this tab
        this.surveyDataService.logPageVisitToServer({
          timestamp: moment().format(),
          milliseconds: moment().valueOf(),
          page: 'survey',
          event: 'entry',
          module_index: this.module_index
        });
      });
    });
  }

  /**
   * Handles the back button behaviour
   */
  back() {
    if (this.current_section > 1) {
      this.ngZone.run(() => {
        this.current_section--
        this.current_section_name = this.survey.sections[this.current_section - 1].name
        this.questions = this.survey.sections[this.current_section - 1].questions
        this.submit_text = "Next"
      })
    } else {
      // save an exit log
      this.surveyDataService.logPageVisitToServer({
        timestamp: moment().format(),
        milliseconds: moment().valueOf(),
        page: 'survey',
        event: 'exit',
        module_index: this.module_index
      })
      // nav back to the home screen
      this.navController.navigateRoot('/')
    }
  }

  /**
   * Sets up any questions that need initialisation before display
   * e.g. sets date/time objects to current date/time, set default values for sliders, etc.
   */
  setupQuestionVariables(uuid) {
    // for all relevant questions add an empty response variable
    for (let i = 0; i < this.survey.sections.length; i++) {
      for (let j = 0; j < this.survey.sections[i].questions.length; j++) {

        const question = this.survey.sections[i].questions[j]

        // for all question types that can be responded to, set default values
        question.response = ""
        question.model = ""
        question.hideError = true
        question.hideSwitch = true

        // for datetime questions, default to the current date/time
        if (question.type === "datetime") {
          // placeholder for dates
          question.model = moment().format()

          // for audio/video questions, sanitize the URLs to make them safe/work in html5 tags
        } else if (question.type === "media" && (question.subtype === "audio" || question.subtype === "video")) {
          question.src = this.domSanitizer.bypassSecurityTrustResourceUrl(question.src)
          if (question.subtype === "video") question.thumb = this.domSanitizer.bypassSecurityTrustResourceUrl(question.thumb)
          
          // for external embedded content, sanitize the URLs to make them safe/work in html5 tags
        } else if (question.type === "external") {
          question.src = question.src + "?uuid=" + uuid
          question.src = this.domSanitizer.bypassSecurityTrustResourceUrl(question.src)
        
          // for slider questions, set the default value to be halfway between min and max
        } else if (question.type === "slider") {
          // get min and max
          const min = question.min
          const max = question.max

          // set the default value of the slider to the middle value
          const model = min + ((max - min) / 2)
          question.model = model

          // a starting value must also be set for the slider to work properly
          question.value = model

          // for checkbox items, the response is set to an empty array
        } else if (question.type === 'multi') {

          // set up checked tracking for checkbox questions types
          const tempOptions = []
          for (let i = 0; i < question.options.length; i++) {
            tempOptions.push({text: question.options[i], checked: false})
          }
          question.options = tempOptions

          // counterbalance the choices if necessary
          if (question.shuffle) 
            question.options = this.shuffle(question.options)

          // set the empty response to an array for checkbox questions
          if (question.radio === "false") 
            question.response = [];
        } 
      }
    }
  }

  /**
   * Saves the response to a question and triggers and branching
   * @param question The question that has been answered
   */
  setAnswer(question) {
    // save the response and hide error
    question.response = question.model
    question.hideError = true

    // trigger any branching tied to this question
    this.toggleDynamicQuestions(question)
    
  }

  /**
   * Fires every time a checkbox question is answered; converts the response(s) to a String
   * @param option The option selected in a checkbox group
   * @param question The question that has been answered
   */
  changeCheckStatus(option, question) {

    // get question responses and split
    let responses = []

    // split all of the responses up into individual strings
    if (question.response !== "") {
      responses = question.response.toString().split(";")
      responses.pop()
    }

    // if the checked item was unchecked then remove it
    // otherwise add it to the response array
    if (responses.indexOf(option.text) > -1) {
      // remove it
      let index = responses.indexOf(option.text)
      if (index !== -1) responses.splice(index, 1)
    } else {
      responses.push(option.text)
    }

    // write the array back to a single string
    let response_string = ""
    for (let i = 0; i < responses.length; i++) {
      response_string += responses[i] + ";"
    }

    // hide any non-response error
    question.hideError = true
    question.response = response_string
  }

  /**
   * Opens an external file in the in app browser
   * @param url The url of the PDF file to open
   */
  openExternalFile(url) {
    const browser = this.iab.create(url, "_system")
  }

  toggleDynamicQuestions(question) {
    // if a question was hidden by rand_group
    // don't do any branching
    if (question.noToggle !== undefined && question.noToggle)
      return

    const id = question.id
    // hide anything with the id as long as the value is equal
    for (let i = 0; i < this.survey.sections.length; i++) {
      for (let j = 0; j < this.survey.sections[i].questions.length; j++) {
        if (this.survey.sections[i].questions[j].hide_id === id) {
          const hideValue = this.survey.sections[i].questions[j].hide_value

          if (question.type === "multi" || question.type === "yesno" || question.type === "text") {

            // determine whether to hide/show the element
            const hideIf = this.survey.sections[i].questions[j].hide_if
            const valueEquals = (hideValue === question.response)
            if (valueEquals === hideIf) 
              this.survey.sections[i].questions[j].hideSwitch = false
            else 
              this.survey.sections[i].questions[j].hideSwitch = true
          }
          else if (question.type === "slider") {
            const direction = hideValue.substring(0, 1)
            const cutoff = parseInt(hideValue.substring(1, hideValue.length))
            let lesserThan = true
            if (direction === ">") lesserThan = false
            if (lesserThan) {
              if (question.response <= cutoff) {
                this.questions[i].hideSwitch = true
              } else {
                this.questions[i].hideSwitch = false
              }
            } else {
              if (question.response >= cutoff) {
                this.questions[i].hideSwitch = true
              } else {
                this.questions[i].hideSwitch = false
              }
            }
          }
        }
      }
    }
  }

  /**
   * Triggered whenever the submit button is called
   * Checks if all required questions have been answered and then moves to the next section/saves the response
   */
  submit() {
    let errorCount = 0
    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions[i]
      if (question.required === true
        && (question.response === "" || question.response === undefined)
        && question.hideSwitch === true) {
        question.hideError = false
        errorCount++
      } else {
        question.hideError = true
      }
    }

    if (errorCount == 0) {

      // if user on last page and there are no errors, fine to submit
      if (this.current_section === this.num_sections) {

        // add the alert time to the response
        this.tasks[this.task_index].alert_time = moment(this.tasks[this.task_index].time).format()

        // get a timestmap of submission time in both readable and ms format
        const response_time = moment().format()
        this.tasks[this.task_index].response_time = response_time

        const response_time_ms = moment().valueOf()
        this.tasks[this.task_index].response_time_ms = response_time_ms

        // indicate that the current task is completed
        this.tasks[this.task_index].completed = true

        // add all of the responses to an object in the task to be sent to server
        const responses = {}
        for (let i = 0; i < this.survey.sections.length; i++) {
          for (let j = 0; j < this.survey.sections[i].questions.length; j++) {
            const question = this.survey.sections[i].questions[j]
            responses[question.id] = question.response
          }
        }
        this.tasks[this.task_index].responses = responses
        
        // attempt to post surveyResponse to server
        this.surveyDataService.sendSurveyDataToServer({
          module_index: this.module_index,
          module_name: this.module_name,
          responses: responses,
          response_time: response_time,
          response_time_in_ms: response_time_ms,
          alert_time: this.tasks[this.task_index].alert_time
        })

        // write tasks back to storage
        this.storage.set("study-tasks", this.tasks).then(() => {
          // save an exit log
          this.surveyDataService.logPageVisitToServer({
            timestamp: moment().format(),
            milliseconds: moment().valueOf(),
            page: 'survey',
            event: 'submit',
            module_index: this.module_index
          })
          this.navController.navigateRoot('/')
        })

      } else {
        this.ngZone.run(() => {
          this.current_section++
          this.questions = this.survey.sections[this.current_section - 1].questions
          this.current_section_name = this.survey.sections[this.current_section - 1].name
  
          if (this.current_section === this.num_sections)
            this.submit_text = this.survey.submit_text

          this.content.scrollToTop(0)
        })
      }
    } else {
      this.content.scrollToTop(500)
      this.showToast("You must answer all required (*) questions", "bottom")
    }
  }

  /**
   * Creates a Toast object to display a message to the user
   * @param message A message to display in the toast
   * @param position The position on the screen to display the toast
   */
  async showToast(message, position) {
    const toast = await this.toastController.create({
      message: message,
      position: position,
      keyboardClose: true,
      color: "danger",
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel',
          handler: () => {
          }
        }
      ]
    })

    toast.present()
  }

  /**
 * Randomly shuffle an array
 * https://stackoverflow.com/a/2450976/1293256
 * @param  {Array} array The array to shuffle
 * @return {String}      The first item in the shuffled array
 */
  shuffle(array) {

    let currentIndex = array.length
    let temporaryValue, randomIndex

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
  }
}
