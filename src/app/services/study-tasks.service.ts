import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class StudyTasksService {

  constructor(private storage: Storage) { }

  /**
   * Creates a list of tasks (e.g. surveys, interventions) based on their
   * alert schedules
   * @param studyObject A JSON object that contains all data about a study
   */
  generateStudyTasks(studyObject) {

    // allocate the participant to a study condition
    let min = 1;
    let max = studyObject.properties.conditions.length;
    let condition_index = (Math.floor(Math.random() * (max - min + 1)) + min) - 1;
    let condition = studyObject.properties.conditions[condition_index];

    let study_tasks = [];

    // the ID for a task
    let task_ID = 101;

    // loop through all of the modules in this study
    // and create the associated study tasks based
    // on the alert schedule
    for (let i = 0; i < studyObject.modules.length; i++) {

      let mod = studyObject.modules[i];

      // if the module is assigned to the participant's condition
      // add it to the list, otherwise just skip it
      if (mod.condition === condition || mod.condition === "*") {

        let module_duration = mod.alerts.duration;
        let module_offset = mod.alerts.start_offset;
        let module_random = mod.alerts.random;
        let module_sticky = mod.alerts.sticky;
        let module_timeout = mod.alerts.timeout;
        let module_timeout_after = mod.alerts.timeout_after;
        let module_randomInterval = mod.alerts.random_interval;
        let module_times = mod.alerts.times;
        let alert_title = mod.alerts.title;
        let alert_message = mod.alerts.message;
        let module_type;
        if (mod.type === "survey") module_type = "checkbox";
        if (mod.type === "video") module_type = "logo-youtube";
        if (mod.type === "audio") module_type = "headset";
        if (mod.type === "info") module_type = "bulb";

        let module_name = studyObject.modules[i].name;
        let module_index = i;

        let startDay = new Date(); // set a date object for today
        startDay.setHours(0, 0, 0, 0); // set the time to midnight

        // add offset days to get first day of alerts
        startDay.setDate(startDay.getDate() + module_offset);

        for (let numDays = 0; numDays < module_duration; numDays++) {
          // for each alert time, get the hour and minutes and if necessary randomise it
          for (let t = 0; t < module_times.length; t++) {
            let hours = module_times[t].hours;
            let mins = module_times[t].minutes;

            let taskTime = new Date(startDay.getTime());
            taskTime.setHours(hours);
            taskTime.setMinutes(mins);

            if (module_random) {
              // remove the randomInterval from the time
              taskTime.setMinutes(taskTime.getMinutes() - module_randomInterval);

              // calc a random number between 0 and (randomInterval * 2) 
              // to account for randomInterval either side
              let randomMinutes = Math.random() * ((module_randomInterval * 2) - 0) + 0;

              // add the random number of minutes to the dateTime
              taskTime.setMinutes(taskTime.getMinutes() + randomMinutes);
            }

            // create a task object
            let options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
            let task_obj = {
              index: module_index,
              task_id: task_ID,
              name: module_name,
              type: module_type,
              sticky: module_sticky,
              alert_title: alert_title,
              alert_message: alert_message,
              timeout: module_timeout,
              timeout_after: module_timeout_after,
              time: taskTime.toString(),
              locale: taskTime.toLocaleString("en-US", options)
            };

            study_tasks.push(task_obj);

            // increment task id
            task_ID++;
          }
          // as a final step increment the date by 1 to set for next day
          startDay.setDate(startDay.getDate() + 1);
        }
      }
    }

    study_tasks.sort(function (a, b) {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      let dateA = new Date(a.time);
      let dateB = new Date(b.time);

      return dateA.getTime() - dateB.getTime();
    });

    // save tasks and condition to storage
    this.storage.set("condition", condition);
    this.storage.set("study-tasks", study_tasks);

    return study_tasks;

  }

  /**
   * Returns all the tasks that have been created for a study
   */
  getAllTasks() {
    return this.storage.get('study-tasks').then((tasks) => {
      return tasks;
    });
  }

  /**
   * Gets the tasks that are currently available for the user to complete
   */
  getTaskDisplayList() {
    return this.storage.get('study-tasks').then((val) => {
      let study_tasks = val;

      let tasks_to_display = [];

      for (let i = 0; i < study_tasks.length; i++) {
        let task = study_tasks[i];
        let alertTime = new Date(Date.parse(task.time));
        let now = new Date();

        if (now > alertTime) {
          // check if task is set to timeout
          if (task.timeout) {
            let timeoutTime = new Date(Date.parse(task.time));
            timeoutTime.setMinutes(timeoutTime.getMinutes() + task.timeout_limit);

            if (now < timeoutTime) {
              tasks_to_display.push(task);
            }
          }
          else if (task.sticky) {
            tasks_to_display.push(task);
          }
          else if (!task.completed) {
            tasks_to_display.push(task);
          }
        }
      }
      return tasks_to_display.reverse();
    });
  }
}
