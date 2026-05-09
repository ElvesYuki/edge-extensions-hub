function createDefaultEventDep() {
  return { type: 'OCCURRING_ALL', eventCodes: [] };
}

function createDefaultAiEvent() {
  return {
    eventCode: 'ADD',
    eventDesc: '',
    eventScore: 0,
    duration: 1,
    eventPriority: 1,
    eventStatus: 0,
    eventDeps: [],
  };
}

function createDefaultScoreEvent() {
  return {
    scoreEventCode: 'ADD',
    scoreEventType: 0,
    scoreEventDesc: '',
    scoreEventEnable: 1,
    scoreEventDefaultStatus: 1,
    scoreEventIsCorrect: 1,
    scoreEventValue: 0,
    scoreEventStatus: 0,
    events: [],
  };
}

function createDefaultScorePoint() {
  return {
    scoreCode: 'ADD',
    scoreType: 0,
    scoreDesc: '',
    scoreEnable: 1,
    scoreDefaultScoreType: 1,
    scoreIsCorrect: 1,
    scoreTotalScore: 0,
    scoreEvents: [],
  };
}

function createDefaultStep(num) {
  return {
    stepCode: 'ADD',
    stepNum: num,
    stepType: 0,
    stepTotalScore: 0,
    stepDesc: '',
    stepName: '',
    stepEnable: 1,
    stepDefaultScoreType: 1,
    stepDeps: [],
    stepFinishedRules: [[]],
    scorePoints: [],
  };
}

function createDefaultConfig() {
  return {
    name: '请输入实验名称',
    experimentCode: '',
    subjectType: 1,
    version: 'V1.0.0',
    paperType: 1,
    ratingLevel: 3,
    experimentTotalScore: 0,
    steps: [createDefaultStep(1)],
    errorEvents: [],
  };
}

function formatConfigAiEvent(event) {
  if (!event.hasOwnProperty('eventCode')) {
    event.eventCode = '';
  }
  if (!event.hasOwnProperty('eventDesc')) {
    event.eventDesc = '';
  }
  if (!event.hasOwnProperty('eventScore')) {
    event.eventScore = 0;
  }
  if (!event.hasOwnProperty('duration')) {
    event.duration = 1;
  }
  if (!event.hasOwnProperty('eventPriority')) {
    event.eventPriority = 1;
  }
  if (!event.hasOwnProperty('eventStatus')) {
    event.eventStatus = 0;
  }
  if (!event.hasOwnProperty('eventDeps')) {
    event.eventDeps = [];
  }
}

function formatConfigScoreEvent(scoreEvent) {
  if (!scoreEvent.hasOwnProperty('scoreEventCode')) {
    scoreEvent.scoreEventCode = '';
  }
  if (!scoreEvent.hasOwnProperty('scoreEventType')) {
    scoreEvent.scoreEventType = 0;
  }
  if (!scoreEvent.hasOwnProperty('scoreEventDesc')) {
    scoreEvent.scoreEventDesc = '请输入评分事件--' + scoreEvent.scoreEventCode + '--描述';
  }
  if (!scoreEvent.hasOwnProperty('scoreEventEnable')) {
    scoreEvent.scoreEventEnable = 1;
  }
  if (!scoreEvent.hasOwnProperty('scoreEventDefaultStatus')) {
    scoreEvent.scoreEventDefaultStatus = 1;
  }
  if (!scoreEvent.hasOwnProperty('scoreEventIsCorrect')) {
    scoreEvent.scoreEventIsCorrect = 1;
  }
  if (!scoreEvent.hasOwnProperty('scoreEventValue')) {
    scoreEvent.scoreEventValue = 0;
  }
  if (!scoreEvent.hasOwnProperty('scoreEventStatus')) {
    scoreEvent.scoreEventStatus = 0;
  }
  if (!scoreEvent.hasOwnProperty('events')) {
    scoreEvent.events = [];
  }
  if (scoreEvent.events.length > 0) {
    for (let l = 0; l < scoreEvent.events.length; l++) {
      formatConfigAiEvent(scoreEvent.events[l]);
    }
  }
}

function formatConfigScorePoint(scorePoint) {
  if (!scorePoint.hasOwnProperty('scoreCode')) {
    scorePoint.scoreCode = '';
  }
  if (!scorePoint.hasOwnProperty('scoreDesc')) {
    scorePoint.scoreDesc = '请输入评分点--' + scorePoint.scoreCode + '--描述';
  }
  if (!scorePoint.hasOwnProperty('scoreEnable')) {
    scorePoint.scoreEnable = 1;
  }
  if (!scorePoint.hasOwnProperty('scoreDefaultScoreType')) {
    scorePoint.scoreDefaultScoreType = 1;
  }
  if (!scorePoint.hasOwnProperty('scoreIsCorrect')) {
    scorePoint.scoreIsCorrect = 1;
  }
  if (!scorePoint.hasOwnProperty('scoreType')) {
    scorePoint.scoreType = 0;
  }
  scorePoint.scoreTotalScore = 0;
  if (!scorePoint.hasOwnProperty('scoreEvents')) {
    scorePoint.scoreEvents = [];
  }
  if (scorePoint.scoreEvents.length > 0) {
    for (let k = 0; k < scorePoint.scoreEvents.length; k++) {
      let scoreEvent = scorePoint.scoreEvents[k];
      formatConfigScoreEvent(scoreEvent);
      if (scoreEvent.scoreEventIsCorrect === 1) {
        scorePoint.scoreTotalScore = Math.round((scorePoint.scoreTotalScore * 100 + scoreEvent.scoreEventValue * 100)) / 100;
      }
    }
  }
}

function formatConfigStep(index, step) {
  step.stepNum = index + 1;
  if (!step.hasOwnProperty('stepCode')) {
    step.stepCode = '';
  }
  if (!step.hasOwnProperty('stepDesc')) {
    step.stepDesc = '请输入实验步骤--' + step.stepCode + '--描述';
  }
  if (!step.hasOwnProperty('stepName')) {
    step.stepName = '步骤' + (index + 1);
  }
  if (!step.hasOwnProperty('stepDeps')) {
    step.stepDeps = [];
  }
  if (!step.hasOwnProperty('stepEnable')) {
    step.stepEnable = 1;
  }
  if (!step.hasOwnProperty('stepDefaultScoreType')) {
    step.stepDefaultScoreType = 1;
  }
  if (!step.hasOwnProperty('stepType')) {
    step.stepType = 0;
  }
  step.stepTotalScore = 0;
  if (!step.hasOwnProperty('stepFinishedRules')) {
    step.stepFinishedRules = [[]];
  }
  if (!step.hasOwnProperty('scorePoints')) {
    step.scorePoints = [];
  }
  if (step.scorePoints.length > 0) {
    for (let j = 0; j < step.scorePoints.length; j++) {
      formatConfigScorePoint(step.scorePoints[j]);
      step.stepTotalScore = Math.round((step.stepTotalScore * 100 + step.scorePoints[j].scoreTotalScore * 100)) / 100;
    }
  }
}

function formatConfigJson(configJson) {
  if (!configJson.hasOwnProperty('experimentCode')) {
    return { error: '文件格式错误: 缺少 experimentCode' };
  }
  if (!configJson.hasOwnProperty('name')) {
    configJson.name = '请输入实验名称';
  }
  if (!configJson.hasOwnProperty('version')) {
    configJson.version = 'V1.0.0';
  }
  if (!configJson.hasOwnProperty('subjectType')) {
    configJson.subjectType = 1;
  }
  if (!configJson.hasOwnProperty('paperType')) {
    configJson.paperType = 1;
  }
  if (!configJson.hasOwnProperty('ratingLevel')) {
    configJson.ratingLevel = 3;
  }
  configJson.experimentTotalScore = 0;
  if (!configJson.hasOwnProperty('errorEvents')) {
    configJson.errorEvents = [];
  }
  if (!configJson.hasOwnProperty('steps')) {
    configJson.steps = [];
  }

  const stepCodes = [];
  if (configJson.steps.length > 0) {
    for (let i = 0; i < configJson.steps.length; i++) {
      let step = configJson.steps[i];
      if (stepCodes.includes(step.stepCode)) {
        return { error: '有重复的实验步骤，编码 ==> ' + step.stepCode };
      }
      stepCodes.push(step.stepCode);
      formatConfigStep(i, step);
      configJson.experimentTotalScore = Math.round((configJson.experimentTotalScore * 100 + step.stepTotalScore * 100)) / 100;
    }
  }

  if (configJson.errorEvents.length > 0) {
    for (let i = 0; i < configJson.errorEvents.length; i++) {
      let errorEvent = configJson.errorEvents[i];
      formatConfigAiEvent(errorEvent);
      if (!errorEvent.hasOwnProperty('belongStep')) {
        errorEvent.belongStep = '';
      }
    }
  }

  return null;
}

// Score sum functions
function sumStepScore(config) {
  if (!config.hasOwnProperty('steps') || config.steps.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < config.steps.length; i++) {
    total += config.steps[i].stepTotalScore * 100;
  }
  return (total / 100).toFixed(2);
}

function sumStepScoreCorrect(config, totalScore) {
  return (totalScore * 100 / 100).toFixed(2) === sumStepScore(config);
}

function sumStepScorePoint(step) {
  if (!step.hasOwnProperty('scorePoints') || step.scorePoints.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < step.scorePoints.length; i++) {
    let sp = step.scorePoints[i];
    if (sp.scoreIsCorrect === 1) {
      total += sp.scoreTotalScore * 100;
    }
  }
  return (total / 100).toFixed(2);
}

function sumStepScorePointCorrect(step, stepTotalScore) {
  return (stepTotalScore * 100 / 100).toFixed(2) === sumStepScorePoint(step);
}

function sumStepScorePointEvent(scorePoint) {
  if (!scorePoint.hasOwnProperty('scoreEvents') || scorePoint.scoreEvents.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < scorePoint.scoreEvents.length; i++) {
    let se = scorePoint.scoreEvents[i];
    if (se.scoreEventIsCorrect === 1) {
      total += se.scoreEventValue * 100;
    }
  }
  return (total / 100).toFixed(2);
}

function sumStepScorePointEventCorrect(scorePoint, totalScore) {
  return (totalScore * 100 / 100).toFixed(2) === sumStepScorePointEvent(scorePoint);
}

function getAllAiEvents(configJson) {
  const events = [];
  if (!configJson.steps) return events;
  for (let i = 0; i < configJson.steps.length; i++) {
    let step = configJson.steps[i];
    if (!step.scorePoints) continue;
    for (let j = 0; j < step.scorePoints.length; j++) {
      let sp = step.scorePoints[j];
      if (!sp.scoreEvents) continue;
      for (let k = 0; k < sp.scoreEvents.length; k++) {
        let se = sp.scoreEvents[k];
        if (!se.events) continue;
        for (let l = 0; l < se.events.length; l++) {
          events.push(se.events[l]);
        }
      }
    }
  }
  return events;
}

function getAllAiEventCodes(configJson) {
  return getAllAiEvents(configJson).map(e => e.eventCode).filter(Boolean);
}

export {
  createDefaultConfig, createDefaultStep, createDefaultScorePoint,
  createDefaultScoreEvent, createDefaultAiEvent, createDefaultEventDep,
  formatConfigJson, formatConfigStep, formatConfigScorePoint,
  formatConfigScoreEvent, formatConfigAiEvent,
  sumStepScore, sumStepScoreCorrect,
  sumStepScorePoint, sumStepScorePointCorrect,
  sumStepScorePointEvent, sumStepScorePointEventCorrect,
  getAllAiEvents, getAllAiEventCodes,
};
