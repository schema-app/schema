import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { StudyTasksService } from '../services/study-tasks.service';
import { UuidService } from '../services/uuid.service';
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
    private uuidService: UuidService,
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

  async saveToLocalStorage(key, data) {
    this.storage.set(key, data);
  }

  /**
   * Attempts to submit a survey response to the server, and if unsuccessful saves it for later attempts
   * @param surveyData An object containing all metadata about a survey response
   */
  sendSurveyDataToServer(surveyData) {
    return Promise.all([this.storage.get("current-study"), this.storage.get("uuid"), this.studyTasksService.getAllTasks()]).then((values) => {
      let studyJSON = JSON.parse(values[0]);
      let uuid = values[1];
      let tasks = values[2];
      let dataUuid = this.uuidService.generateUUIDForData();

      // create form data to store the survey data 
      let bodyData = new FormData();
      // type of post data
      bodyData.append("data_type", "survey_response");
      // user id
      bodyData.append("user_id", uuid);
      // study id 
      bodyData.append("study_id", studyJSON.properties.study_id);
      // module index 
      bodyData.append("module_index", surveyData.module_index);
      // module name
      bodyData.append("module_name", surveyData.module_name);
      // responses
      bodyData.append("responses", JSON.stringify(surveyData.responses));
      // response time
      bodyData.append("response_time", surveyData.response_time);
      // response time in ms
      bodyData.append("response_time_in_ms", surveyData.response_time_in_ms);
      // alert time
      bodyData.append("alert_time", surveyData.alert_time);
      // platform 
      bodyData.append("platform", this.platform.platforms()[0]);

      return this.attemptHttpPost(studyJSON.properties.post_url, bodyData).then((postSuccessful) => {
        if (!postSuccessful) {
          var object = {};
          bodyData.forEach(function(value, key){
              object[key] = value;
          });
          var json = JSON.stringify(object);
          this.storage.set(dataUuid, json);
        }
      });
    });
  }

  /**
   * Attempts to send a log (e.g. page visit) to the server, and if unsuccessful saves it for later attempts
   * @param logEvent An object containing metadata about a log event
   */
  logPageVisitToServer(logEvent) {
    return Promise.all([this.storage.get("current-study"), this.storage.get("uuid")]).then(values => {
      let studyJSON = JSON.parse(values[0]);
      let uuid = values[1];
      let logUuid = this.uuidService.generateUUIDForLog();

      // create form data to store the log data
      let bodyData = new FormData();
      // type of post_data
      bodyData.append("data_type", "log");
      // append user id
      bodyData.append("user_id", uuid);
      // study id 
      bodyData.append("study_id", studyJSON.properties.study_id);
      // module index
      bodyData.append("module_index", logEvent.module_index);
      // page
      bodyData.append("page", logEvent.page);
      // event
      bodyData.append("event", logEvent.event);
      // timestamp
      bodyData.append("timestamp", logEvent.timestamp);
      // timestamp in milliseconds
      bodyData.append("timestamp_in_ms", logEvent.milliseconds);
      // platform 
      bodyData.append("platform", this.platform.platforms()[0]);

      return this.attemptHttpPost(studyJSON.properties.post_url, bodyData).then((postSuccessful) => {
        if (!postSuccessful) {
          var object = {};
          bodyData.forEach(function(value, key){
              object[key] = value;
          });
          var json = JSON.stringify(object);
          this.storage.set(logUuid, json);
        }
      });
    });
  }

  /**
   * Attempts to upload any logs/data that was unsuccessfully sent to the server on previous attempts
   * @param dataType The type of data to attempt to upload, e.g. 'pending-logs' (log events) or 'pending-data' (survey responses)
   */
  uploadPendingData(dataType) {
    return Promise.all([this.storage.get("current-study"), this.storage.keys()]).then(values => {
      let studyJSON = JSON.parse(values[0]);
      let keys = values[1];

      let pendingLogKeys = [];
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith(dataType)) {
          pendingLogKeys.push(keys[i]);
        }
      }
      return {
        pendingLogKeys: pendingLogKeys,
        post_url: studyJSON.properties.post_url
      };
    }).then((data) => {
      data.pendingLogKeys.map(pendingKey => {
        this.storage.get(pendingKey).then((log) => {
          let logJSONObj = JSON.parse(log);
          let bodyData = new FormData();
          for (var key in logJSONObj) {
            if (logJSONObj.hasOwnProperty(key)) {
              bodyData.append(key, logJSONObj[key]);
            }
          }
          this.attemptHttpPost(data.post_url, bodyData).then((postSuccessful) => {
            if (postSuccessful) {
              this.storage.remove(pendingKey);
            }
          });
        });
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
