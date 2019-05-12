import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { StudyTasksService } from '../services/study-tasks.service';
import { NavController, IonContent, ToastController } from '@ionic/angular';
import * as moment from 'moment';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.page.html',
  styleUrls: ['./survey.page.scss'],
})
export class SurveyPage implements OnInit {

  @ViewChild(IonContent) content: IonContent;

  // the text to display as submit button label
  private submit_text = "Submit";

  // variables to handle the sections
  private current_section = 1;
  private num_sections;
  private current_section_name;

  // study object
  private study;
  private survey;
  private questions;

  // task objects
  private tasks;
  private task_id;
  private task_index;

  constructor(private route : ActivatedRoute,
    private storage : Storage,
    private statusBar : StatusBar,
    private navController : NavController,
    private studyTasksService: StudyTasksService,
    private toastController : ToastController) { }

  /**
   * Triggered when the survey page is first opened
   * Initialises the survey and displays it on the screen
   */
  ngOnInit() {
    // set statusBar to visible on Android
    this.statusBar.styleLightContent();
    this.statusBar.backgroundColorByHexString('#0F2042');

    // the id of the task to be displayed
    this.task_id = this.route.snapshot.paramMap.get('task_id');

    // localForage used as workaround to db readiness issues
    // https://github.com/ionic-team/ionic-storage/issues/168
    this.storage.ready().then((localForage) => {
      localForage.ready(() => {
        this.storage.get('current-study').then((studyObject) => {

          let module_index;

          // get the task object for this task
          this.studyTasksService.getAllTasks().then(tasks => {
            this.tasks = tasks;
            for (let i = 0; i < this.tasks.length; i++) {
              if (this.task_id == this.tasks[i].task_id) {
                module_index = this.tasks[i].index;
                this.task_index = i;
                break;
              }
            }

            // extract the JSON from the study object
            this.study = JSON.parse(studyObject);

            // get the correct module
            this.survey = this.study.modules[module_index];
            
            // get the name of the current section
            this.num_sections = this.survey.sections.length;
            this.current_section_name = this.survey.sections[this.current_section-1].name;
  
            // initialise all of the questions to be displayed
            this.setupQuestionVariables();
  
            // set the submit text as appropriate
            if (this.current_section < this.num_sections) {
              this.submit_text = "Next";
            } else {
              this.submit_text = this.survey.submit_text;
            }
  
            // set the current section of questions
            this.questions = this.survey.sections[this.current_section-1].questions;

          });
        });
      });
    });

  }

  /**
   * Sets up any questions that need initialisation before display
   * e.g. sets date/time objects to current date/time, set default values for sliders, etc.
   */
  setupQuestionVariables() {
    // for all relevant questions add an empty response variable
    for (let i = 0; i < this.survey.sections.length; i++) {
      for (let j = 0; j < this.survey.sections[i].questions.length; j++) {

        let question = this.survey.sections[i].questions[j];

        // for all question types that can be responded to, set default values
        if (question.type !== "media"
          || question.type !== "instruction") {
            question.response = "";
            question.model = "";
            question.hideError = true;
            question.hideSwitch = true;
        }

        // for datetime questions, default to the current date/time
        if (question.type === "datetime") {
          // placeholder for dates
          question.model = moment().format();

        // for slider questions, set the default value to be halfway between min and max
        } else if (question.type === "slider") {
          // get min and max
          let min = question.min;
          let max = question.max;

          // set the default value of the slider to the middle value
          let model = min + ((max - min) / 2);
          question.model = model;

          // a starting value must also be set for the slider to work properly
          question.value = model;

        // for checkbox items, the response is set to an empty array
        } else if (question.type === 'multi') {
          if (question.radio === "false") {
            question.response = [];
          }
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
    question.response = question.model;
    question.hideError = true;

    // trigger any branching tied to this question
    this.toggleDynamicQuestions(question);
  }

  /**
   * Fires every time a checkbox question is answered; converts the response(s) to a String
   * @param option The option selected in a checkbox group
   * @param question The question that has been answered
   */
  changeCheckStatus(option, question) {

    // get question responses and split
    let responses = [];

    // split all of the responses up into individual strings
    if (question.response !== "") {
      responses = question.response.toString().split(";");
      responses.pop();
    }

    // if the checked item was unchecked then remove it
    // otherwise add it to the response array
    if (responses.indexOf(option) > -1) {
      // remove it
      let index = responses.indexOf(option);
      if (index !== -1) responses.splice(index, 1);
    } else {
      responses.push(option);
    }

    // write the array back to a single string
    let response_string = "";
    for (let i = 0; i < responses.length; i++) {
      response_string += responses[i] + ";";
    }
    
    // hide any non-response error
    question.hideError = true;
    question.response = response_string;
  }

  /**
   * Shows/hides other questions that have branching based on the response to the provided question
   * @param question The question that has been answered
   */
  toggleDynamicQuestions(question) {
    let id = question.id;

    if (question.type === "multi" || question.type === "yesno" || question.type === "text") {
      // hide anything with the id as long as the value is equal
      for (let i = 0; i < this.questions.length; i++) {
        if (this.questions[i].hide_id === question.id) {
          let hideValue = this.questions[i].hide_value;
          if (question.response !== hideValue) {
            this.questions[i].hideSwitch = false;
          } else {
            this.questions[i].hideSwitch = true;
          }
        } 
      }
    // hide anything that is < or > the cutoff value
    } else if (question.type === "slider") {
      for (let i = 0; i < this.questions.length; i++) {
        if (this.questions[i].hide_id === question.id) {
          let hideValue = this.questions[i].hide_value;
          let direction = hideValue.substring(0,1);
          let cutoff = parseInt(hideValue.substring(1, hideValue.length));
          let lesserThan = true;
          if (direction === ">") lesserThan = false;
          if (lesserThan) {
            if (question.response <= cutoff) {
              this.questions[i].hideSwitch = true;
            } else {
              this.questions[i].hideSwitch = false;
            }
          } else {
            if (question.response >= cutoff) {
              this.questions[i].hideSwitch = true;
            } else {
              this.questions[i].hideSwitch = false;
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
    let errorCount = 0;
    for (let i = 0; i < this.questions.length; i++) {
      let question = this.questions[i];
      if (question.required === true
          && question.response === ""
          && question.hideSwitch === true) {
            question.hideError = false;
            errorCount++;
      } else {
        question.hideError = true;
      }
    }

    if (errorCount == 0) {

      // if we are on last page and there are no errors, fine to submit
      if (this.current_section === this.num_sections) {

        // get a timestamp of submission time
        //let options = { weekday: 'short', day: '2-digit', month: '2-digit', hour: 'numeric', minute: 'numeric' };
        //let response_time = new Date().toLocaleString("en-US", options);
        let response_time = moment().format();
        this.tasks[this.task_index].response_time = response_time;

        // indicate that the current task is completed
        this.tasks[this.task_index].completed = true;

        // reset the uploaded flag to false to ensure sticky data is sent to the server
        this.tasks[this.task_index].uploaded = false;

        let responses = {};

        // add all of the responses to an object in the task to be sent to server
        for (let i = 0; i < this.survey.sections.length; i++) {
          for (let j = 0; j < this.survey.sections[i].questions.length; j++) {
            let question = this.survey.sections[i].questions[j];
            responses[question.id] = question.response;
          }
        }
        this.tasks[this.task_index].responses = responses;

        // write tasks back to storage
        this.storage.set("study-tasks", this.tasks).then(() => {
          // navigate to the home tab
          this.navController.navigateRoot('/');
        });

      } else {
        this.current_section++;
        this.questions = this.survey.sections[this.current_section-1].questions;
        this.current_section_name = this.survey.sections[this.current_section-1].name;

        if (this.current_section === this.num_sections) {
          this.submit_text = this.survey.submit_text;
        }

        this.content.scrollToTop(0);
        //this.changeRef.detectChanges();
      }
    } else {
      this.content.scrollToTop(500);
      this.showToast("You must answer all required (*) questions", "bottom");
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
      color: "danger",
      position: position,
      showCloseButton: true,
      keyboardClose: true,
      closeButtonText: "Dismiss"
    });
  
    toast.present();
  }

}
