import {
  formatConfigJson,
} from './model.js';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function formatExportConfigJson(configJson) {
  formatConfigJson(configJson);
  let current = deepClone(configJson);

  if (current.steps.length > 0) {
    for (let i = 0; i < current.steps.length; i++) {
      let step = current.steps[i];
      if (step.scorePoints.length > 0) {
        for (let j = 0; j < step.scorePoints.length; j++) {
          let sp = step.scorePoints[j];
          delete sp.scoreIsCorrect;
          if (sp.scoreEvents.length > 0) {
            for (let k = 0; k < sp.scoreEvents.length; k++) {
              let se = sp.scoreEvents[k];
              if (se.events.length > 0) {
                for (let l = 0; l < se.events.length; l++) {
                  delete se.events[l].eventScore;
                }
              }
            }
          }
        }
      }
    }
  }

  if (current.errorEvents.length > 0) {
    for (let i = 0; i < current.errorEvents.length; i++) {
      delete current.errorEvents[i].duration;
      delete current.errorEvents[i].eventDeps;
    }
  }
  delete current.errorEvents;

  return current;
}

function formatPlatformConfigJson(configJson) {
  formatConfigJson(configJson);
  let current = deepClone(configJson);

  if (current.steps.length > 0) {
    for (let i = 0; i < current.steps.length; i++) {
      let step = current.steps[i];
      delete step.stepFinishedRules;
      delete step.stepDefaultScoreType;
      if (step.scorePoints.length > 0) {
        for (let j = 0; j < step.scorePoints.length; j++) {
          let sp = step.scorePoints[j];
          delete sp.scoreDefaultScoreType;
          delete sp.scoreIsCorrect;
          if (sp.scoreEvents.length > 0) {
            for (let k = 0; k < sp.scoreEvents.length; k++) {
              let se = sp.scoreEvents[k];
              if (se.events.length > 0) {
                for (let l = 0; l < se.events.length; l++) {
                  delete se.events[l].duration;
                  delete se.events[l].eventDeps;
                }
              }
            }
          }
        }
      }
    }
  }

  if (current.errorEvents.length > 0) {
    for (let i = 0; i < current.errorEvents.length; i++) {
      delete current.errorEvents[i].duration;
      delete current.errorEvents[i].eventDeps;
    }
  }
  delete current.paperType;
  delete current.ratingLevel;
  delete current.errorEvents;

  return current;
}

function formatAiServerConfigJson(configJson) {
  formatConfigJson(configJson);
  let current = deepClone(configJson);

  delete current.subjectType;
  delete current.paperType;
  delete current.experimentTotalScore;

  if (current.steps.length > 0) {
    for (let i = 0; i < current.steps.length; i++) {
      let step = current.steps[i];
      delete step.stepNum;
      delete step.stepEnable;
      delete step.stepDefaultScoreType;
      delete step.stepType;
      delete step.stepTotalScore;
      delete step.stepName;
      delete step.stepDeps;
      delete step.stepFinishedRules;

      if (step.scorePoints.length > 0) {
        for (let j = 0; j < step.scorePoints.length; j++) {
          let sp = step.scorePoints[j];
          delete sp.scoreEnable;
          delete sp.scoreDefaultScoreType;
          delete sp.scoreType;
          delete sp.scoreIsCorrect;
          delete sp.scoreTotalScore;
          if (sp.scoreEvents.length > 0) {
            for (let k = 0; k < sp.scoreEvents.length; k++) {
              let se = sp.scoreEvents[k];
              delete se.scoreEventType;
              delete se.scoreEventValue;
              delete se.scoreEventIsCorrect;
              delete se.scoreEventEnable;
              delete se.scoreEventDefaultStatus;
              if (se.events.length > 0) {
                for (let l = 0; l < se.events.length; l++) {
                  let evt = se.events[l];
                  delete evt.duration;
                  delete evt.eventPriority;
                  delete evt.eventDeps;
                }
              }
            }
          }
        }
      }
    }
  }

  return current;
}

function downloadJsonFile(configJson, name, suffix) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const filename = `${name}-${suffix}-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(configJson)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export {
  formatExportConfigJson,
  formatPlatformConfigJson,
  formatAiServerConfigJson,
  downloadJsonFile,
};
