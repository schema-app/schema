import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(private localNotifications: LocalNotifications,
    private storage: Storage) { }

    /**
   * Schedules a notification, taking parameters from a task
   * @param task The task that the notification is for
   */
  scheduleDummyNotification() {
    this.localNotifications.schedule({
      title: "Hello",
      text: "World",
      foreground: true,
      trigger: {at: new Date(new Date().getTime() + 10000)},
      smallIcon: 'res://notification_icon',
      icon: 'res//notification_icon',
      data: { task_index: 0 },
      launch: true,
      wakeup: true,
      priority: 2
    })
  }

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
      icon: 'res//notification_icon',
      data: { task_index: task.index, task_id: task.task_id, task_time: task.time },
      launch: true,
      wakeup: true,
      priority: 2
    })
  }

  /**
   * Cancels all notifications that have been set
   */
  cancelAllNotifications() {
    this.localNotifications.cancelAll()
  }

  /**
   * Sets the next 30 notifications based on the next 30 tasks
   */
  async setNext30Notifications() {
    await this.localNotifications.cancelAll()

    const notificationsEnabled = await this.storage.get('notifications-enabled')

    if (notificationsEnabled) {
      const tasks = await this.storage.get('study-tasks')
      if (tasks !== null) {
        var alertCount = 0
        for (var i = 0; i < tasks.length; i++) {
          var task = tasks[i]
          var alertTime = new Date(Date.parse(task.time))

          if (alertTime > new Date()) {
            if (this.checkTaskIsUnlocked(task, tasks)) {
              this.scheduleNotification(task)
              alertCount++
            }
          }

          // only set 30 alerts into the future
          if (alertCount === 30) break
        }
      }
    }

    /*this.localNotifications.cancelAll().then(() => {
      this.storage.get('notifications-enabled').then(notificationsEnabled => {
        if (notificationsEnabled) {
          this.storage.get('study-tasks').then((tasks) => {
            if (tasks !== null) {
              var alertCount = 0;
              for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                var alertTime = new Date(Date.parse(task.time));

                if (alertTime > new Date()) {
                  if (this.checkTaskIsUnlocked(task, tasks)) {
                    this.scheduleNotification(task);
                    alertCount++;
                  }
                }

                // only set 30 alerts into the future
                if (alertCount === 30) break;
              }
            }
          });
        }
      });
    });*/
  }

    /**
   * 
   * @param task 
   * @param study_tasks 
   */
  checkTaskIsUnlocked(task, study_tasks) {

    // get a set of completed task uuids
    let completedUUIDs = new Set()
    for (let i = 0; i < study_tasks.length; i++) {
      if (study_tasks[i].completed) {
        completedUUIDs.add(study_tasks[i].uuid);
      }
    }

    // get the list of prereqs from the task
    let prereqs = task.unlock_after
    let unlock = true
    for (let i = 0; i < prereqs.length; i++) {
      if (!completedUUIDs.has(prereqs[i])) {
        unlock = false
        break
      }
    }

    return unlock
  }
}
