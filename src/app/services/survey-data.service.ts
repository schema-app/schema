import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { StudyTasksService } from '../services/study-tasks.service';
import { Http, Headers, RequestOptions } from '@angular/http';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable({
  providedIn: 'root'
})
export class SurveyDataService {

  constructor(private http: Http,
    private http2: HTTP,
    private storage: Storage,
    private platform: Platform,
    private studyTasksService: StudyTasksService) { }

  /**
   * Downloads a survey from a remote URL
   * @param surveyURL The web URL where a survey is hosted.
   */
  getRemoteData(surveyURL: string) {
  return new Promise(resolve => {
    this.http2.setRequestTimeout(7);
    this.http2.post(surveyURL, {seed: 'f2d91e73'}, {}).then(data => {
        resolve(data)
      }).catch(error => {
        resolve(error);
      });
    });
  }

  /**
   * Attempts to submit a survey response to the server along with the relevant metadata
   */
  postDataToServer() {

    this.studyTasksService.getAllTasks().then(tasks => {
      Promise.all([this.storage.get("current-study"), this.storage.get("uuid"), this.storage.get("logs")]).then(values => {

        let studyJSON = JSON.parse(values[0]);
        let uuid = values[1];

        // attempt to post all survey responses
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].completed && !tasks[i].uploaded) {

            // get all questions and their responses
            let bodyData = new FormData();

            // type of post data
            bodyData.append("data_type", "survey_response");
            // user id
            bodyData.append("user_id", uuid);
            // study id 
            bodyData.append("study_id", studyJSON.properties.study_id);
            // module index 
            bodyData.append("module_index", tasks[i].index);
            // module name
            bodyData.append("module_name", tasks[i].name);
            // responses
            bodyData.append("responses", JSON.stringify(tasks[i].responses));
            // response time
            bodyData.append("response_time", tasks[i].response_time);
            // alert time
            bodyData.append("alert_time", tasks[i].alert_time);
            // platform 
            bodyData.append("platform", this.platform.platforms()[0]);

            this.attemptHttpPost(studyJSON.properties.post_url, bodyData).then(success => {
              if (success) {
                tasks[i].uploaded = true;
                // write the tasks back to storage
                this.storage.set('study-tasks', tasks);
              }
            });
          }
        }

        // attempt to post all log data
        let logs = values[2];

        for (let i = 0; i < logs.length; i++) {
          if (logs[i].uploaded === false) {
            let bodyData = new FormData();
            // type of post_data
            bodyData.append("data_type", "log");
            // append user id
            bodyData.append("user_id", uuid);
            // study id 
            bodyData.append("study_id", studyJSON.properties.study_id);
            // module index
            bodyData.append("module_index", logs[i].module_index);
            // page
            bodyData.append("page", logs[i].page);
            // timestamp
            bodyData.append("timestamp", logs[i].timestamp);
            // platform 
            bodyData.append("platform", this.platform.platforms()[0]);

            this.attemptHttpPost(studyJSON.properties.post_url, bodyData).then(success => {
              if (success) {
                logs[i].uploaded = true;
                this.storage.set('logs', logs);
              }
            });
          }
        }
      });
    });
  }

  /**
   * Attempts to send the survey data via POST to a server
   * @param postURL The URL for a study's data collection server
   * @param bodyData The data to send to that server
   */
  attemptHttpPost(postURL, bodyData) {
    return new Promise(resolve => {
      this.http
      .post(postURL, bodyData)
      .subscribe(
        data => {
          if (data.status === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        err => {
          resolve(false);
        }
      );
    });
  }
}
