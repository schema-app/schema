import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Chart } from 'chart.js';
import { ChartsModule } from 'ng2-charts';
import * as moment from 'moment';
import { SurveyDataService } from '../services/survey-data.service';
import { StudyTasksService } from '../services/study-tasks.service';
import { TranslateConfigService } from '../translate-config.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  // array to store the graphs
  graphs = [];

  // array to store the history
  history = [];

  // flag for study enrolment
  enrolledInStudy = false;

  // study object JSON
  studyJSON;

  // current study day
  studyDay;

  // the current language of the device
  selectedLanguage;

  // graph options
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      xAxes: [{
        ticks: {
          fontSize: 6,
        },
        barThickness: 20
      }],
      yAxes: [{
        ticks: {
          fontSize: 8,
          beginAtZero: true
        }
      }]
    }
  };

  // graph colours
  chartColors: Array<any> = [
    { 
      backgroundColor: 'rgba(4,153,139,0.6)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { 
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(77,83,96,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    { 
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];

  constructor(private storage: Storage,
    private studyTasksService: StudyTasksService,
    private surveyDataService: SurveyDataService,
    private translateConfigService: TranslateConfigService) { 
      // get the default language of the device
      this.selectedLanguage = this.translateConfigService.getDefaultLanguage();
    }

  ionViewWillEnter() {

    this.graphs = [];
    this.history = [];
    this.enrolledInStudy = false;

    // localForage used as workaround to db readiness issues
    // https://github.com/ionic-team/ionic-storage/issues/168
    this.storage.ready().then((localForage) => {
      localForage.ready(() => {
        Promise.all([this.storage.get("current-study"), this.storage.get("enrolment-date")]).then(values => {
          let studyObject = values[0];
          let enrolmentDate = values[1];

          if (studyObject !== null) {

            this.studyJSON = JSON.parse(studyObject);
            this.enrolledInStudy = true;

            // calculate the study day
            this.studyDay = this.diffDays(new Date(enrolmentDate), new Date());

            // log the user visiting this tab
            let logEvent = {
              timestamp: moment().format(),
              milliseconds: moment().valueOf(),
              page: 'my-progress',
              event: 'entry',
              module_index: -1
            };
            this.surveyDataService.logPageVisitToServer(logEvent);

            // check if any graphs are available and add history items
            this.studyTasksService.getAllTasks().then(tasks => {
              // get all entries for history
              for (let i = 0; i < tasks.length; i++) {
                if (tasks[i].completed) {
                  let historyItem = {
                    task_name: tasks[i].name.replace(/<\/?[^>]+(>|$)/g, ""),
                    moment_time: moment(tasks[i].response_time).fromNow(), //format("Do MMM, YYYY").fromNow()
                    response_time: new Date(tasks[i].response_time)
                  }
                  this.history.unshift(historyItem);
                }
              }
              // sort the history array by completion time
              this.history.sort(function(x, y) {
                if (x.response_time > y.response_time) {
                  return -1;
                }
                if (x.response_time < y.response_time) {
                  return 1;
                }
                return 0;
              });

              // get all graphs
              for (let i = 0; i < this.studyJSON.modules.length; i++) {
                let graph = this.studyJSON.modules[i].graph;

                let study_name = this.studyJSON.modules[i].name;

                let graph_header = this.studyJSON.modules[i].name;

                // if the module is to display a graph
                if (graph.display) {
                  // get the variable to graph
                  let variableToGraph = graph.variable;

                  // store the labels and data for this module
                  let task_labels = [];
                  let task_data = [];

                  let graph_title = graph.title;
                  let graph_blurb = graph.blurb;
                  let graph_type = graph.type;
                  let graph_maxpoints = -(graph.max_points);

                  // loop through each study_task
                  for (let task in tasks) {
                    // check if the task is this task
                    if (tasks[task].name === study_name) {
                      if (tasks[task].completed) {
                        // get the variable we are to graph
                        for (let k in tasks[task].responses) {
                          if (k === variableToGraph) {
                            // format the response time
                            let response_time = moment(tasks[task].response_time).format("MMM Do, h:mma");
                            task_labels.push(response_time);
                            task_data.push(tasks[task].responses[k]);
                            break;
                          }
                        }
                      }
                    }
                  }

                  // reverse the lists as chart.js adds items RTL
                  //task_labels = task_labels.reverse();
                  //task_data = task_data.reverse();

                  // create a new graph object
                  let graphObj = {
                    data: [{ data: task_data.slice(graph_maxpoints), label: graph_title }],
                    labels: task_labels.slice(graph_maxpoints),
                    options: this.chartOptions,
                    colors: this.chartColors,
                    legend: graph_title,
                    type: graph_type,
                    blurb: graph_blurb,
                    header: graph_header
                  }

                  // if the task had any data to graph, push it
                  if (task_data.length > 0) {
                    this.graphs.push(graphObj);
                  }
                }
              }
            });
          }
        });
      });
    });
  }

  diffDays(d1, d2)
  {
    var ndays;
    var tv1 = d1.valueOf();  // msec since 1970
    var tv2 = d2.valueOf();

    ndays = (tv2 - tv1) / 1000 / 86400;
    ndays = Math.round(ndays - 0.5);
    return ndays;
  }

  async ionViewWillLeave() {
    if (this.enrolledInStudy) {
      let logEvent = {
        timestamp: moment().format(),
        milliseconds: moment().valueOf(),
        page: 'my-progress',
        event: 'exit',
        module_index: -1
      };
      this.surveyDataService.logPageVisitToServer(logEvent);
    }
  }
}
