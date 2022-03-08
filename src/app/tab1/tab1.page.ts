import { Component } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Storage } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AlertController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { SurveyDataService } from '../services/survey-data.service';
import { StudyTasksService } from '../services/study-tasks.service';
import { SurveyCacheService } from '../services/survey-cache.service';
import { UuidService } from '../services/uuid.service';
import { LoadingService } from '../services/loading-service.service';
import { NotificationsService } from '../services/notifications.service';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import * as moment from 'moment';
import { TranslateConfigService } from '../translate-config.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  // resume event subscription
  resumeEvent: any
  // flag to display enrol options
  hideEnrolOptions: boolean = true
  // track whether the user is currently enrolled in a study
  isEnrolledInStudy: boolean = false
  // stores the details of the study
  study: any = null
  // stores the list of tasks to be completed by the user
  task_list: Array<any> = new Array()
  // dark mode
  darkMode: boolean = false

  //translations loaded from the appropriate language file
  // defaults are provided but will be overridden if language file 
  // is loaded successfully
  translations: any = {
    "btn_cancel": "Cancel",
    "btn_dismiss": "Dismiss",
    "btn_enrol": "Enrol",
    "btn_enter-url": "Enter URL",
    "btn_study-id": "Study ID",
    "error_loading-qr-code": "We couldn't load your study. Please check your internet connection and ensure you are scanning the correct code.",
    "error_loading-study": "We couldn't load your study. Please check your internet connection and ensure you are entering the correct URL.",
    "heading_error": "Oops...",
    "label_loading": "Loading...",
    "msg_caching": "Downloading media for offline use - please wait!",
    "msg_camera": "Camera permission is required to scan QR codes. You can allow this permission in Settings."
  }
  
  safeURL: string;

  // the current language of the device
  selectedLanguage: string;

  constructor(private barcodeScanner : BarcodeScanner,
    private surveyDataService : SurveyDataService,
    private notificationsService : NotificationsService,
    private surveyCacheService : SurveyCacheService,
    private studyTasksService : StudyTasksService,
    private uuidService : UuidService,
    private router : Router,
    private platform : Platform,
    private statusBar : StatusBar,
    private loadingService : LoadingService,
    private alertController : AlertController,
    private localNotifications : LocalNotifications,
    private storage : Storage,
    private translateConfigService: TranslateConfigService,
    private translate: TranslateService) {
      // get the default language of the device
      this.selectedLanguage = this.translateConfigService.getDefaultLanguage()
    }

    colorTest(systemInitiatedDark) {
      if (systemInitiatedDark.matches) {
        this.darkMode = true
      } else {
        this.darkMode = false
      }
    }

    ngOnInit() {
      // set statusBar to be visible on Android
      this.statusBar.styleLightContent()
      this.statusBar.backgroundColorByHexString('#0F2042')

      // need to subscribe to this event in order
      // to ensure that the page will refresh every
      // time it is navigated to because ionViewWillEnter()
      // is not called when navigating here from other pages
      this.router.events.subscribe(event => {
        if(event instanceof NavigationStart) {
          if(event.url == '/') {
            if (!this.loadingService.isLoading) this.ionViewWillEnter()
          }
        }
      });

      // trigger this to run every time the app is resumed from the background
      this.resumeEvent = this.platform.resume.subscribe(() => {
        if (this.router.url === "/tabs/tab1") {
          if (!this.loadingService.isLoading) this.ionViewWillEnter()
        }
      })
    }

  ionViewWillEnter() {

    // check if dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // dark mode
      this.darkMode = true
    } else {
      this.darkMode = false
    }

    // load the correct translations for dynamic labels/messages
    const labels = [
      "btn_cancel",
      "btn_dismiss",
      "btn_enrol",
      "btn_enter-url",
      "btn_study-id",
      "error_loading-qr-code",
      "error_loading-study",
      "heading_error",
      "label_loading",
      "msg_caching",
      "msg_camera"
    ];
    this.translate.get(labels).subscribe(res => { this.translations = res; })

    this.localNotifications.requestPermission()

    this.loadingService.isCaching = false
    this.loadingService.present(this.translations["label_loading"])

    this.hideEnrolOptions = true
    this.isEnrolledInStudy = false
    

    // check if user is currently enrolled in study
    Promise.all([this.storage.get("current-study")]).then(values => {

      const studyObject = values[0]
      if (studyObject !== null) {

        // convert the study to a JSON object
        this.study = JSON.parse(studyObject)

        // log the user visiting this tab
        this.surveyDataService.logPageVisitToServer({
          timestamp: moment().format(),
          milliseconds: moment().valueOf(),
          page: 'home',
          event: 'entry',
          module_index: -1
        })

        // attempt to upload any pending logs and survey data
        this.surveyDataService.uploadPendingData("pending-log")
        this.surveyDataService.uploadPendingData("pending-data")

        // set up next round of notifications
        this.notificationsService.setNext30Notifications()
            
        // load the study tasks
        this.loadStudyDetails()
      } else {
        this.hideEnrolOptions = false

        this.loadingService.dismiss()
      } 
    });

    // on first run, generate a UUID for the user
    // and set the notifications-enabled to true
    this.storage.get('uuid-set').then((uuidSet) => {
      if (!uuidSet) {
        // set a UUID
        const uuid = this.uuidService.generateUUID("")
        this.storage.set('uuid', uuid)
        // set a flag that UUID was set
        this.storage.set('uuid-set', true)
        // set a flag that notifications are enabled
        this.storage.set('notifications-enabled', true)
      } 
    })
  }

  /**
   * Lifecycle event called when the current page is about to become paused/closed
   */
  ionViewWillLeave() { 
    if (this.isEnrolledInStudy) {
      // log the user exiting this tab
      this.surveyDataService.logPageVisitToServer({
        timestamp: moment().format(),
        milliseconds: moment().valueOf(),
        page: 'home',
        event: 'exit',
        module_index: -1
      })

      // attempt to upload any pending logs and survey data
      this.surveyDataService.uploadPendingData("pending-log")
      this.surveyDataService.uploadPendingData("pending-data")
    }
  }

  /**
   * Attempt to download a study from the URL scanned/entered by a user
   * @param url The URL to attempt to download a study from
   */
  attemptToDownloadStudy(url, isQRCode) {
    // show loading bar
    this.loadingService.isCaching = false
    this.loadingService.present(this.translations["label_loading"])

    this.surveyDataService.getRemoteData(url).then(data => {
  
      // check if the data received from the URL contains JSON properties/modules
      // in order to determine if it's a schema study before continuing
      let validStudy = false
      try {
        // checks if the returned text is parseable as JSON, and whether it contains
        // some of the key fields used by schema so it can determine whether it is
        // actually a schema study URL
        validStudy = JSON.parse(data['data']).properties !== undefined
                  && JSON.parse(data['data']).modules !== undefined
                  && JSON.parse(data['data']).properties.study_id !== undefined
      } catch(e) {
        validStudy = false
      }
      if (validStudy) {
        this.enrolInStudy(data)
      } else {
        this.loadingService.dismiss()
        this.displayEnrolError(isQRCode)
      }
    });  
  }

  /**
   * Uses the barcode scanner to enrol in a study
   */
  async scanBarcode() {
    this.barcodeScanner.scan().then(barcodeData => {
      if (!barcodeData.cancelled) {
        this.attemptToDownloadStudy(barcodeData.text, true)
      } 
     }).catch(err => {
        this.loadingService.dismiss()
        this.displayBarcodeError()
     });
  }

  /**
   * Handles the alert dialog to enrol via URL
   */
  async enterURL() {
      const alert = await this.alertController.create({
        header: this.translations["btn_enter-url"],
        cssClass: 'alertStyle',
        inputs: [
          {
            name: 'url',
            type: 'url',
            placeholder: 'e.g. https://bit.ly/2Q4O9jI',
            value: 'https://'
          }
        ],
        buttons: [
          {
            text: this.translations["btn_cancel"],
            role: 'cancel',
            cssClass: 'secondary'
          }, {
            text: this.translations["btn_enrol"],
            handler: response => {
              this.attemptToDownloadStudy(response.url, false)
            }
          }
        ]
      })
  
      await alert.present()
  }

  /**
   * 
   * Handles the alert dialog to enrol via Study ID
   */
  async enterStudyID() {
    const alert = await this.alertController.create({
      header: this.translations["btn_study-id"],
      cssClass: 'alertStyle',
      inputs: [
        {
          name: 'id',
          type: 'text',
          placeholder: 'e.g. STUDY01'
        }
      ],
      buttons: [
        {
          text: this.translations["btn_cancel"],
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translations["btn_enrol"],
          handler: response => {
            // create URL for study
            const url = "https://getschema.app/study.php?study_id=" + response.id
            this.attemptToDownloadStudy(url, false)
          }
        }
      ]
    })

    await alert.present()
  }

  /**
   * Enrols the user in the study, sets up notifications and tasks
   * @param data A data object returned from the server to represent a study object
   */
  enrolInStudy(data) {
    this.isEnrolledInStudy = true
    this.hideEnrolOptions = true

    // convert received data to JSON object
    this.study = JSON.parse(data['data']);

    // set the enrolled date
    this.storage.set('enrolment-date', new Date())

    // set an enrolled flag and save the JSON for the current study
    this.storage.set('current-study', JSON.stringify(this.study)).then(() => {
      // log the enrolment event
      this.surveyDataService.logPageVisitToServer({
        timestamp: moment().format(),
        milliseconds: moment().valueOf(),
        page: 'home',
        event: 'enrol',
        module_index: -1
      })

      // cache all media files if this study has set this property to true
      if (this.study.properties.cache === true) {

        this.loadingService.dismiss().then(() => {
          this.loadingService.isCaching = true
          this.loadingService.present(this.translations["msg_caching"])
        })
        this.surveyCacheService.cacheAllMedia(this.study)
      }

      // setup the study task objects
      this.studyTasksService.generateStudyTasks(this.study)

      // setup the notifications
      this.notificationsService.setNext30Notifications()
                
      this.loadStudyDetails()
    });
  }

  /**
   * Loads the details of the current study, including overdue tasks
   */
  loadStudyDetails() {
    //this.jsonText = this.study['properties'].study_name;
    this.studyTasksService.getTaskDisplayList().then(tasks => {
      this.task_list = tasks;

      for (let i = 0; i < this.task_list.length; i++) {
        this.task_list[i].moment = moment(this.task_list[i].locale).fromNow()
      }

      // show the study tasks
      this.isEnrolledInStudy = true
      this.hideEnrolOptions = true

      // reverse the order of the tasks list to show oldest first
      this.sortTasksList()

      // hide loading controller if not caching
      if (!this.loadingService.isCaching) {
        setTimeout(() => {
          this.loadingService.dismiss()
        }, 1000)
      }
    })
  }

  /**
   * Displays an alert to indicate that something went wrong during study enrolment
   * @param isQRCode Denotes whether the error was caused via QR code enrolment
   */
  async displayEnrolError(isQRCode) {
    const msg = isQRCode ? "We couldn't load your study. Please check your internet connection and ensure you are scanning the correct code." : "We couldn't load your study. Please check your internet connection and ensure you are entering the correct URL or ID."
    const alert = await this.alertController.create({
      header: "Oops...",
      message: msg,
      cssClass: 'alertStyle',
      buttons: ["Dismiss"]
    });
    await alert.present()
  }

  /**
   * Displays a message when camera permission is not allowed
   */
  async displayBarcodeError() {
    const msg = "Camera permission is required to scan QR codes. You must allow this permission if you wish to use this feature.";
    const alert = await this.alertController.create({
      header: "Permission Required",
      cssClass: 'alertStyle',
      message: msg,
      buttons: ["Dismiss"]
    })
    await alert.present()
  }

  /**
   * Reverses the list of tasks for sorting purposes
   */
  sortTasksList() {
    this.task_list.reverse()
  }

  /**
   * Refreshes the list of tasks
   */
  doRefresh(refresher) {
    if (!this.loadingService.isLoading) this.ionViewWillEnter()
    setTimeout(() => {
      refresher.target.complete()
    }, 250)
  }
}