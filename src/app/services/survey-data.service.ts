import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { StudyTasksService } from '../services/study-tasks.service';
import { UuidService } from '../services/uuid.service';
import { Http } from '@angular/http';
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
    this.http2.setRequestTimeout(7)
    this.http2.post(surveyURL, {seed: 'f2d91e73'}, {}).then(data => {
        resolve(data)
      }).catch(error => {
        resolve(error)
      });
    });
  }

  async saveToLocalStorage(key, data) {
    this.storage.set(key, data)
  }

  /**
   * Attempts to submit a survey response to the server, and if unsuccessful saves it for later attempts
   * @param surveyData An object containing all metadata about a survey response
   */
  sendSurveyDataToServer(surveyData) {
    return Promise.all([this.storage.get("current-study"), this.storage.get("uuid"), this.studyTasksService.getAllTasks()]).then((values) => {
      const studyJSON = JSON.parse(values[0])
      const uuid = values[1]
      const tasks = values[2]
      const dataUuid = this.uuidService.generateUUID("pending-data")

      // create form data to store the survey data 
      const bodyData = new FormData()
      bodyData.append("data_type", "survey_response")
      bodyData.append("user_id", uuid)
      bodyData.append("study_id", studyJSON.properties.study_id)
      bodyData.append("module_index", surveyData.module_index)
      bodyData.append("module_name", surveyData.module_name)
      bodyData.append("responses", JSON.stringify(surveyData.responses))
      bodyData.append("response_time", surveyData.response_time)
      bodyData.append("response_time_in_ms", surveyData.response_time_in_ms)
      bodyData.append("alert_time", surveyData.alert_time)
      bodyData.append("platform", this.platform.platforms()[0])

      return this.attemptHttpPost(studyJSON.properties.post_url, bodyData).then((postSuccessful) => {
        if (!postSuccessful) {
          var object = {}
          bodyData.forEach(function(value, key){
              object[key] = value
          });
          var json = JSON.stringify(object)
          this.storage.set(dataUuid, json)
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
      const studyJSON = JSON.parse(values[0])
      const uuid = values[1]
      const logUuid = this.uuidService.generateUUID("pending-log")

      // create form data to store the log data
      const bodyData = new FormData()
      bodyData.append("data_type", "log")
      bodyData.append("user_id", uuid)
      bodyData.append("study_id", studyJSON.properties.study_id)
      bodyData.append("module_index", logEvent.module_index)
      bodyData.append("page", logEvent.page)
      bodyData.append("event", logEvent.event)
      bodyData.append("timestamp", logEvent.timestamp)
      bodyData.append("timestamp_in_ms", logEvent.milliseconds)
      bodyData.append("platform", this.platform.platforms()[0])

      return this.attemptHttpPost(studyJSON.properties.post_url, bodyData).then((postSuccessful) => {
        if (!postSuccessful) {
          var object = {}
          bodyData.forEach(function(value, key){
              object[key] = value
          });
          var json = JSON.stringify(object)
          this.storage.set(logUuid, json)
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
      const studyJSON = JSON.parse(values[0])
      const keys = values[1];

      let pendingLogKeys = [];
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith(dataType)) {
          pendingLogKeys.push(keys[i])
        }
      }
      return {
        pendingLogKeys: pendingLogKeys,
        post_url: studyJSON.properties.post_url
      }
    }).then((data) => {
      data.pendingLogKeys.map(pendingKey => {
        this.storage.get(pendingKey).then((log) => {
          const logJSONObj = JSON.parse(log)
          const bodyData = new FormData()
          for (var key in logJSONObj) {
            if (logJSONObj.hasOwnProperty(key)) {
              bodyData.append(key, logJSONObj[key])
            }
          }
          this.attemptHttpPost(data.post_url, bodyData).then((postSuccessful) => {
            if (postSuccessful) {
              this.storage.remove(pendingKey)
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
            resolve(true)
          } else {
            resolve(false)
          }
        },
        err => {
          resolve(false)
        }
      );
    });
  }
}
