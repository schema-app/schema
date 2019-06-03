import { Injectable } from '@angular/core';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { LoadingService } from '../services/loading-service.service';
import { File } from '@ionic-native/file/ngx';
import { Storage } from '@ionic/storage';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SurveyCacheService {

  win: any = window;

  mediaToCache = {};
  localMediaURLs = {};
  mediaCount = 0;
  mediaDownloadedCount = 0;

  constructor(private fileTransfer: FileTransfer,
    private file: File,
    private storage: Storage,
    private loadingService: LoadingService) { }

  
  /**
   * Downloads a remote file and converts it to a local URL
   * @param url Remote URL to a media file
   */
  downloadFile(url) {
    const transfer: FileTransferObject = this.fileTransfer.create();

    // get the fileName from the URL
    let urlSplit = url.split("/");
    let fileName = urlSplit[urlSplit.length - 1];

    return transfer.download(url, this.file.dataDirectory + fileName).then((entry) => {
      return entry.toURL(); // <!------- <--------- trying this as an alternative!
    }, (error) => {
      // handle error
      return "";
    });
  }

  /**
   * Gets all of the remote URLs from the media elements in this study
   * @param study The study protocol
   */
  getMediaURLs(study) {
    // get banner url
    this.mediaToCache["banner"] = study.properties.banner_url;

    // get urls from media elements
    for (let i = 0; i < study.modules.length; i++) {
      for (let j = 0; j < study.modules[i].sections.length; j++) {
        for (let k = 0; k < study.modules[i].sections[j].questions.length; k++) {
          let question = study.modules[i].sections[j].questions[k];
          if (question.type === "media") { 
            try {
              this.mediaToCache[question.id] = question.src;
            } catch(e) {
              console.log("error: " + e);
            }
          }
        }
      }
    }
    // set mediaCount to be number of media items
    this.mediaCount = Object.keys(this.mediaToCache).length;
  }

  /**
   * Gets all of the media URLs from the study protocol and downloads the files
   * @param study The study protocol
   */
  cacheAllMedia(study) {
    this.mediaCount = 0;
    this.mediaDownloadedCount = 0;
    // map media question ids to their urls
    this.getMediaURLs(study);
    this.downloadAllMedia();
  }

  /**
   * Downloads all of the media items from the remote URLs
   */
  downloadAllMedia() {
    // download all media items
    let keys = Object.keys(this.mediaToCache);
    for (let i = 0; i < keys.length; i++) {
      this.downloadFile(this.mediaToCache[keys[i]]).then(entryURL => {
        this.localMediaURLs[keys[i]] = this.win.Ionic.WebView.convertFileSrc(entryURL);
        this.mediaDownloadedCount = this.mediaDownloadedCount + 1;
        this.checkIfFinished();
      });
    }
  }

  /**
   * Checks if all of the media has been downloaded, if so update the protocol 
   */
  checkIfFinished() {
    if (this.mediaDownloadedCount === this.mediaCount) {
      this.updateMediaURLsInStudy();
    }
  }

  /**
   * Replaces the remote URLs for media items with the local URLs
   */
  updateMediaURLsInStudy() {
    this.storage.get('current-study').then((studyString) => {
      try { 
        let studyObject = JSON.parse(studyString);
        // update the banner url first
        studyObject.properties.banner_url = this.localMediaURLs["banner"];

        // update the other media items to the corresponding local URL
        for (let i = 0; i < studyObject.modules.length; i++) {
          for (let j = 0; j < studyObject.modules[i].sections.length; j++) {
            for (let k = 0; k < studyObject.modules[i].sections[j].questions.length; k++) {
              let question = studyObject.modules[i].sections[j].questions[k];
              if (question.id in this.localMediaURLs) {
                question.src = this.localMediaURLs[question.id];
              }
            }
          }
        }

        // update the study protocol in storage 
        this.storage.set('current-study', JSON.stringify(studyObject));
      } catch (e) {
        console.log("error: " + e);
      }

      // dismiss the loading spinner
      this.loadingService.dismiss();
    });
  }
}
