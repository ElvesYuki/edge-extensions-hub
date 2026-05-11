const PLACEHOLDER_CODE = 'ADD';

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

function isPlaceholder(value) {
  return String(value ?? '').trim() === PLACEHOLDER_CODE;
}

function addIssue(issues, path, message) {
  issues.push({ path, message });
}

function checkCode(issues, path, label, code) {
  if (isBlank(code)) {
    addIssue(issues, path, `${label}不能为空`);
    return;
  }
  if (isPlaceholder(code)) {
    addIssue(issues, path, `${label}仍为 ADD，请改成正式编码`);
  }
}

function checkDuplicate(issues, seen, path, label, code) {
  if (isBlank(code) || isPlaceholder(code)) return;
  if (seen.has(code)) {
    addIssue(issues, path, `${label}重复：${code}`);
    return;
  }
  seen.add(code);
}

function collectEventCodes(configJson) {
  const codes = new Set();
  (configJson.steps || []).forEach((step) => {
    (step.scorePoints || []).forEach((scorePoint) => {
      (scorePoint.scoreEvents || []).forEach((scoreEvent) => {
        (scoreEvent.events || []).forEach((event) => {
          if (!isBlank(event.eventCode) && !isPlaceholder(event.eventCode)) {
            codes.add(event.eventCode);
          }
        });
      });
    });
  });
  return codes;
}

function validateDeps(issues, path, deps, validEventCodes) {
  (deps || []).forEach((dep, depIndex) => {
    const depPath = `${path} / 依赖${depIndex + 1}`;
    if (isBlank(dep.type)) {
      addIssue(issues, depPath, '依赖类型不能为空');
    }
    (dep.eventCodes || []).forEach((code) => {
      if (!validEventCodes.has(code)) {
        addIssue(issues, depPath, `依赖事件不存在：${code}`);
      }
    });
  });
}

function validateConfig(configJson) {
  const issues = [];
  if (!configJson) {
    addIssue(issues, '配置', '当前没有可校验的配置');
    return issues;
  }

  checkCode(issues, '基础信息', '实验编码', configJson.experimentCode);

  const validEventCodes = collectEventCodes(configJson);
  const stepCodes = new Set();

  (configJson.steps || []).forEach((step, stepIndex) => {
    const stepPath = `步骤${stepIndex + 1}`;
    checkCode(issues, stepPath, '步骤编码', step.stepCode);
    checkDuplicate(issues, stepCodes, stepPath, '步骤编码', step.stepCode);

    const scorePointCodes = new Set();
    (step.scorePoints || []).forEach((scorePoint, scorePointIndex) => {
      const scorePointPath = `${stepPath} / 评分点${scorePointIndex + 1}`;
      checkCode(issues, scorePointPath, '评分点编码', scorePoint.scoreCode);
      checkDuplicate(issues, scorePointCodes, scorePointPath, '评分点编码', scorePoint.scoreCode);

      const scoreEventCodes = new Set();
      (scorePoint.scoreEvents || []).forEach((scoreEvent, scoreEventIndex) => {
        const scoreEventPath = `${scorePointPath} / 评分事件${scoreEventIndex + 1}`;
        checkCode(issues, scoreEventPath, '评分事件编码', scoreEvent.scoreEventCode);
        checkDuplicate(issues, scoreEventCodes, scoreEventPath, '评分事件编码', scoreEvent.scoreEventCode);

        const eventCodes = new Set();
        (scoreEvent.events || []).forEach((event, eventIndex) => {
          const eventPath = `${scoreEventPath} / AI事件${eventIndex + 1}`;
          checkCode(issues, eventPath, 'AI事件编码', event.eventCode);
          checkDuplicate(issues, eventCodes, eventPath, 'AI事件编码', event.eventCode);
          validateDeps(issues, eventPath, event.eventDeps, validEventCodes);
        });
      });
    });

    (step.stepFinishedRules || []).forEach((rule, ruleIndex) => {
      (rule || []).forEach((code) => {
        if (!validEventCodes.has(code)) {
          addIssue(issues, `${stepPath} / 完成规则${ruleIndex + 1}`, `完成规则事件不存在：${code}`);
        }
      });
    });
  });

  const validStepCodes = new Set((configJson.steps || [])
    .map(step => step.stepCode)
    .filter(code => !isBlank(code) && !isPlaceholder(code)));
  const errorEventCodes = new Set();

  (configJson.errorEvents || []).forEach((event, eventIndex) => {
    const eventPath = `错误事件${eventIndex + 1}`;
    checkCode(issues, eventPath, '错误事件编码', event.eventCode);
    checkDuplicate(issues, errorEventCodes, eventPath, '错误事件编码', event.eventCode);
    if (!isBlank(event.belongStep) && !validStepCodes.has(event.belongStep)) {
      addIssue(issues, eventPath, `归属步骤不存在：${event.belongStep}`);
    }
    validateDeps(issues, eventPath, event.eventDeps, validEventCodes);
  });

  return issues;
}

export { validateConfig };
