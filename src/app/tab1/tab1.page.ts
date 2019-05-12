import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AlertController, LoadingController } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { SurveyDataService } from '../services/survey-data.service';
import { StudyTasksService } from '../services/study-tasks.service';
import { UuidService } from '../services/uuid.service';
import { LoadingService } from '../services/loading-service.service';
import { NotificationsService } from '../services/notifications.service';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import * as moment from 'moment';
import { _iterableDiffersFactory } from '@angular/core/src/application_module';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  // flag to display enrol options
  private hideEnrolOptions = true;
  // track whether the user is currently enrolled in a study
  private isEnrolledInStudy = false;
  // stores the details of the study
  private study;
  // stores the list of tasks to be completed by the user
  private task_list;

  constructor(private barcodeScanner : BarcodeScanner,
    private surveyDataService : SurveyDataService,
    private notificationsService : NotificationsService,
    private studyTasksService : StudyTasksService,
    private uuidService : UuidService,
    private router : Router,
    private statusBar : StatusBar,
    private loadingController : LoadingController,
    private loadingService : LoadingService,
    private alertController : AlertController,
    private localNotifications : LocalNotifications,
    private storage : Storage) {
    }

    ngOnInit() {
      // set statusBar to be visible on Android
      this.statusBar.styleLightContent();
      this.statusBar.backgroundColorByHexString('#0F2042');

      // need to subscribe to this event in order
      // to ensure that the page will refresh every
      // time it is navigated to because ionViewWillEnter()
      // is not called when navigating here from other pages
      this.router.events.subscribe(event => {
        if(event instanceof NavigationStart) {
          if(event.url == '/') {
            this.ionViewWillEnter();
          }
        }
      });

      // if entering from a notification, refresh the task list
      this.localNotifications.on('click').subscribe(notification => {
        this.ionViewWillEnter();
      });
    }

  ionViewWillEnter() {

    this.loadingService.present();

    this.hideEnrolOptions = true;
    this.isEnrolledInStudy = false;
    
    // localForage used as workaround to db readiness issues
    // https://github.com/ionic-team/ionic-storage/issues/168
    this.storage.ready().then((localForage) => {
      localForage.ready(() => {

        // check if user is currently enrolled in study
        this.storage.get('current-study').then((studyObject) => {
          if (studyObject !== null) {

            // convert the study to a JSON object
            this.study = JSON.parse(studyObject);

            // set up next round of notifications
            this.notificationsService.setNext30Notifications();

            // attempt to post any pending data to server
            this.surveyDataService.postDataToServer();

            // load the study tasks
            this.loadStudyDetails();
          } else {
            this.hideEnrolOptions = false;

            this.loadingService.dismiss();
          } 
        });

        // on first run, generate a UUID for the user
        // and set the notifications-enabled to true
        this.storage.get('uuid-set').then((uuidSet) => {
          if (!uuidSet) {
            // set a UUID
            let uuid = this.uuidService.generateUUID();
            this.storage.set('uuid', uuid);
            // set a flag that UUID was set
            this.storage.set('uuid-set', true);
            // set a flag that notifications are enabled
            this.storage.set('notifications-enabled', true);
          } 
        });
      });
    });
  }

  /**
   * Uses the barcode scanner to enrol in a study
   */
  async scanBarcode() {
    this.barcodeScanner.scan().then(barcodeData => {
      if (!barcodeData.cancelled) {
        // show loading bar
        this.loadingService.present();

        // attempt to download the study protocol from the URL
        this.surveyDataService.getRemoteData(barcodeData.text).then(data => {

          // check if the data received from the URL contains JSON properties/modules
          // in order to determine if it's a schema study before continuing
          let validStudy = JSON.parse(data['_body']).properties !== undefined
            && JSON.parse(data['_body']).modules !== undefined;

          if (validStudy) {
            this.enrolInStudy(data);
          } else {
            // hide loading bar
            this.loadingService.dismiss();

            this.displayEnrolError(true);
          }
        });
      } 
     }).catch(err => {
         console.log('Error', err);
     });
  }

  /**
   * Handles the alert dialog to enrol via URL
   */
  async enterURL() {
      const alert = await this.alertController.create({
        header: 'Enter URL',
        inputs: [
          {
            name: 'url',
            type: 'text',
            placeholder: 'e.g. https://getschema.app/study'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          }, {
            text: 'Enrol',
            handler: response => {
              // show loading bar
              this.loadingService.present();

              this.surveyDataService.getRemoteData(response.url).then(data => {
                
                // check if the data received from the URL contains JSON properties/modules
                // in order to determine if it's a schema study before continuing
                let validStudy = JSON.parse(data['_body']).properties !== undefined
                                && JSON.parse(data['_body']).modules !== undefined;

                if (validStudy) {
                  this.enrolInStudy(data);
                } else {
                  this.loadingService.dismiss();
                  this.displayEnrolError(false);
                }

              });
            }
          }
        ]
      });
  
      await alert.present();
    
  }

  /**
   * Enrols the user in the study, sets up notifications and tasks
   * @param data A data object returned from the server to represent a study object
   */
  enrolInStudy(data) {
    this.isEnrolledInStudy = true;
    this.hideEnrolOptions = true;

    // convert received data to JSON object
    this.study = JSON.parse(data['_body']);

    // set an enrolled flag and save the JSON for the current study
    this.storage.set('current-study', JSON.stringify(this.study));

    // setup the study task objects
    this.studyTasksService.generateStudyTasks(this.study);

    // setup the notifications
    this.notificationsService.setNext30Notifications();
              
    this.loadStudyDetails();
  }

  /**
   * Loads the details of the current study, including overdue tasks
   */
  loadStudyDetails() {
    //this.jsonText = this.study['properties'].study_name;
    this.studyTasksService.getTaskDisplayList().then(tasks => {
      this.task_list = tasks;

      for (let i = 0; i < this.task_list.length; i++) {
        this.task_list[i].moment = moment(this.task_list[i].locale).fromNow();
      }

      // show the study tasks
      this.isEnrolledInStudy = true;

      // hide loading bar
      this.loadingService.dismiss();
    });
  }

  /**
   * Displays an alert to indicate that something went wrong during study enrolment
   * @param isQRCode Denotes whether the error was caused via QR code enrolment
   */
  async displayEnrolError(isQRCode) {
    let msg = isQRCode ? "The QR code you scanned is not a valid study." : "The URL you entered is not a valid study.";
    const alert = await this.alertController.create({
      header: 'Error',
      message: msg,
      buttons: ['Dismiss']
    });
    await alert.present();
  }

  /**
   * Reverses the list of tasks for sorting purposes
   */
  sortTasksList() {
    this.task_list.reverse();
  }

}
