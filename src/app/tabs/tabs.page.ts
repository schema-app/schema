import { Component } from '@angular/core';
import { TranslateConfigService } from '../translate-config.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  // the current language of the device
  selectedLanguage:string;
 
  constructor(private translateConfigService: TranslateConfigService){
    // get the default language of the device
    this.selectedLanguage = this.translateConfigService.getDefaultLanguage();
  }
}


