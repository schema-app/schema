import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Chart } from 'chart.js';
import { ChartsModule } from 'ng2-charts';
import { StudyTasksService } from '../services/study-tasks.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  // array to store the graphs
  private graphs = [];

  // graph options
  public chartOptions: any = {
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
  public chartColors: Array<any> = [
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
    private studyTasksService: StudyTasksService) { }

  ionViewWillEnter() {

    this.graphs = [];

    // localForage used as workaround to db readiness issues
    // https://github.com/ionic-team/ionic-storage/issues/168
    this.storage.ready().then((localForage) => {
      localForage.ready(() => {
        // check if user is currently enrolled in study
        this.storage.get('current-study').then((studyObject) => {
          if (studyObject !== null) {

            let studyJSON = JSON.parse(studyObject);

            // check if any graphs are available
            this.studyTasksService.getAllTasks().then(tasks => {

              for (let i = 0; i < studyJSON.modules.length; i++) {
                let graph = studyJSON.modules[i].graph;

                let study_name = studyJSON.modules[i].name;

                let graph_header = studyJSON.modules[i].name;

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
                            task_labels.push(tasks[task].response_time);
                            task_data.push(tasks[task].responses[k]);
                            break;
                          }
                        }
                      }
                    }
                  }

                  // reverse the lists as chart.js adds items RTL
                  task_labels = task_labels.reverse();
                  task_data = task_data.reverse();

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
}
