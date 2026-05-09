function createAccordion(onChange) {
  let _active = -1;

  function setActive(index) {
    if (_active === index) {
      _active = -1;
    } else {
      _active = index;
    }
    if (onChange) onChange(_active);
    return _active;
  }

  function getActive() {
    return _active;
  }

  function closeAll() {
    _active = -1;
    if (onChange) onChange(-1);
  }

  return { setActive, getActive, closeAll };
}

export { createAccordion };
