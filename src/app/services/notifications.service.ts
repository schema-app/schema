import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LocalNotifications, ELocalNotificationTriggerUnit } from '@ionic-native/local-notifications/ngx';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(private localNotifications: LocalNotifications,
    private storage: Storage) { }

  /**
   * Schedules a notification, takoing parameters from a task
   * @param task The task that the notification is for
   */
  scheduleNotification(task) {
    this.localNotifications.schedule({
      id: task.task_id,
      title: task.alert_title,
      text: task.alert_message,
      foreground: true,
      trigger: { at: new Date(Date.parse(task.time)) },
      smallIcon: 'res://notification_icon',
      data: { task_index: task.index, task_id: task.task_id, task_time: task.time }
    });
  }

  /**
   * Cancels all notifications that have been set
   */
  cancelAllNotifications() {
    this.localNotifications.cancelAll();
  }

  /**
   * Sets the next 30 notifications based on the next 30 tasks
   */
  setNext30Notifications() {
    this.localNotifications.cancelAll().then(() => {
      // localForage used as workaround to db readiness issues
      // https://github.com/ionic-team/ionic-storage/issues/168
      this.storage.ready().then((localForage) => {
        localForage.ready(() => {
          this.storage.get('notifications-enabled').then(notificationsEnabled => {
            if (notificationsEnabled) {
              this.storage.get('study-tasks').then((tasks) => {
                if (tasks !== null) {
                  var alertCount = 0;
                  for (var i = 0; i < tasks.length; i++) {
                    var task = tasks[i];
                    var alertTime = new Date(Date.parse(task.time));

                    // now
                    var now = new Date();

                    if (alertTime > now) {
                      this.scheduleNotification(task);
                      alertCount++;
                    }

                    // only set 30 alerts into the future
                    if (alertCount === 30) break;
                  }
                }
              });
            }
          });
        });
      });
    });
  }
}
