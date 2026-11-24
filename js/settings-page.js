// ============================================
// СТРАНИЦА НАСТРОЕК УРОВНЕЙ
// ============================================

const settingsFields = document.getElementById("settingsFields");
const advancedFields = document.getElementById("advancedFields");
const advancedPanel = document.querySelector(".advanced-panel");
const levelSelect = document.getElementById("levelSelect");
const levelHint = document.getElementById("levelHint");
const presetsElement = document.getElementById("presets");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const previewBtn = document.getElementById("previewBtn");
const statusElement = document.getElementById("status");
const toastElement = document.getElementById("toast");

let selectedKey = "";
let dirty = false;
let toastTimer = null;

const fieldRefs = [];

function fieldScale(field) {
  return field.scale || 1;
}

function toDisplayValue(field, rawValue) {
  return Number(rawValue) / fieldScale(field);
}

function toRawValue(field, displayValue) {
  return Number(displayValue) * fieldScale(field);
}

function fieldDisplayStep(field) {
  return field.step / fieldScale(field);
}

function fieldDecimals(field) {
  const step = fieldDisplayStep(field);

  return String(step).includes(".")
    ? String(step).split(".")[1].length
    : 0;
}

function formatValue(field, rawValue) {
  const display = toDisplayValue(field, rawValue);
  return String(Number(display.toFixed(fieldDecimals(field))));
}

function markDirty() {
  dirty = true;
  setStatus("Есть несохранённые изменения", "warn");
}

function setStatus(text, type) {
  statusElement.textContent = text;
  statusElement.className = type ? `status ${type}` : "status";
}

function showToast(message, type) {
  toastElement.textContent = message;
  toastElement.className = "toast visible";

  if (type) {
    toastElement.classList.add(type);
  }

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toastElement.classList.remove("visible");
  }, 3200);
}

function buildFields() {
  settingsFields.innerHTML = "";
  advancedFields.innerHTML = "";

  for (const field of EDITABLE_SETTINGS) {
    const wrapper = document.createElement("div");
    wrapper.className = "setting-field";

    const head = document.createElement("div");
    head.className = "setting-head";

    const label = document.createElement("label");
    label.textContent = field.label;
    label.htmlFor = `setting-${field.key}`;

    const scale = fieldScale(field);

    const number = document.createElement("input");
    number.type = "number";
    number.id = `setting-${field.key}`;
    number.min = field.min / scale;
    number.max = field.max / scale;
    number.step = field.step / scale;
    number.inputMode = "decimal";

    head.appendChild(label);
    head.appendChild(number);

    const range = document.createElement("input");
    range.type = "range";
    range.min = field.min / scale;
    range.max = field.max / scale;
    range.step = field.step / scale;
    range.setAttribute("aria-label", field.label);

    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = field.hint;

    range.addEventListener("input", () => {
      number.value = formatValue(
        field,
        toRawValue(field, range.value)
      );
      markDirty();
    });

    number.addEventListener("input", () => {
      markDirty();
    });

    number.addEventListener("change", () => {
      const clean = clampSettingValue(
        field,
        toRawValue(field, number.value)
      );

      number.value = formatValue(field, clean);
      range.value = String(toDisplayValue(field, clean));
      markDirty();
    });

    wrapper.appendChild(head);
    wrapper.appendChild(range);
    wrapper.appendChild(hint);

    const target =
      field.group === "advanced" ? advancedFields : settingsFields;

    target.appendChild(wrapper);
    fieldRefs.push({ field, number, range });
  }
}

function setFormValues(overrides) {
  for (const ref of fieldRefs) {
    const raw =
      overrides && overrides[ref.field.key] !== undefined
        ? overrides[ref.field.key]
        : DEFAULT_SETTINGS[ref.field.key];

    const clean = clampSettingValue(ref.field, raw);

    ref.number.value = formatValue(ref.field, clean);
    ref.range.value = String(toDisplayValue(ref.field, clean));
  }
}

function readFormValues() {
  const values = {};

  for (const ref of fieldRefs) {
    values[ref.field.key] = clampSettingValue(
      ref.field,
      toRawValue(ref.field, ref.number.value)
    );
  }

  return values;
}

// В localStorage храним только отличия от обычных настроек.
function buildOverrides() {
  const values = readFormValues();
  const overrides = {};

  for (const field of EDITABLE_SETTINGS) {
    if (values[field.key] !== DEFAULT_SETTINGS[field.key]) {
      overrides[field.key] = values[field.key];
    }
  }

  return overrides;
}

function hasAdvancedValues(values) {
  return EDITABLE_SETTINGS.some(
    field =>
      field.group === "advanced" &&
      values &&
      values[field.key] !== undefined &&
      values[field.key] !== DEFAULT_SETTINGS[field.key]
  );
}

function buildPresets() {
  presetsElement.innerHTML = "";

  for (const preset of SETTINGS_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.label;

    button.addEventListener("click", () => {
      setFormValues(preset.values);

      if (advancedPanel && hasAdvancedValues(preset.values)) {
        advancedPanel.open = true;
      }

      dirty = true;
      setStatus(
        `Пресет «${preset.label}» выбран. Нажми «Сохранить».`,
        "warn"
      );
    });

    presetsElement.appendChild(button);
  }
}

function populateLevels() {
  const previous = selectedKey;
  levelSelect.innerHTML = "";

  const builtinGroup = document.createElement("optgroup");
  builtinGroup.label = "Готовые уровни";

  LEVEL_NAMES.forEach((name, index) => {
    const option = document.createElement("option");
    option.value = `builtin:${index}`;
    option.textContent = `${index + 1}. ${name}`;
    builtinGroup.appendChild(option);
  });

  levelSelect.appendChild(builtinGroup);

  const customLevels = getCustomLevels();
  const customGroup = document.createElement("optgroup");
  customGroup.label = "Мои уровни";

  if (customLevels.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Пока нет сохранённых уровней";
    option.disabled = true;
    customGroup.appendChild(option);
  } else {
    for (const level of customLevels) {
      const option = document.createElement("option");
      option.value = `custom:${level.id}`;
      option.textContent = level.name;
      customGroup.appendChild(option);
    }
  }

  levelSelect.appendChild(customGroup);

  const requested = new URLSearchParams(window.location.search).get("level");
  const values = Array.from(levelSelect.options).map(option => option.value);
  const next =
    requested && values.includes(requested)
      ? requested
      : values.includes(previous) && previous
        ? previous
        : "builtin:0";

  levelSelect.value = next;
}

function loadSelectedLevel() {
  selectedKey = levelSelect.value;

  if (!selectedKey) {
    setStatus("Выбери уровень", "warn");
    return;
  }

  const overrides = getLevelSettings(selectedKey);
  setFormValues(overrides);
  dirty = false;

  if (advancedPanel && hasAdvancedValues(overrides)) {
    advancedPanel.open = true;
  }

  if (selectedKey.startsWith("builtin:")) {
    const index = Number(selectedKey.split(":")[1]);
    const name = LEVEL_NAMES[index] || `Уровень ${index + 1}`;
    levelHint.textContent = `Готовый уровень ${index + 1}: «${name}».`;
  } else {
    const id = selectedKey.slice("custom:".length);
    const level = getCustomLevel(id);
    levelHint.textContent = level
      ? `Свой уровень «${level.name}».`
      : "Этот уровень больше не найден.";
  }

  setStatus(
    overrides ? "Свои настройки уровня" : "Обычные настройки",
    overrides ? "ok" : ""
  );
}

function saveSettings(showMessage) {
  if (!selectedKey) {
    setStatus("Сначала выбери уровень", "warn");
    return false;
  }

  const overrides = buildOverrides();
  const saved = saveLevelSettings(selectedKey, overrides);

  if (!saved) {
    setStatus("Не удалось сохранить настройки", "error");
    showToast("Браузер не разрешил сохранить настройки.", "error");
    return false;
  }

  dirty = false;

  if (Object.keys(overrides).length === 0) {
    setStatus("Обычные настройки", "ok");
  } else {
    setStatus("Настройки сохранены", "ok");
  }

  if (showMessage !== false) {
    showToast(
      Object.keys(overrides).length === 0
        ? "Уровень снова использует обычные настройки."
        : "Настройки уровня сохранены.",
      "success"
    );
  }

  return true;
}

function resetToDefaults() {
  if (!selectedKey) {
    return;
  }

  if (!confirm("Вернуть обычные настройки для этого уровня?")) {
    return;
  }

  deleteLevelSettings(selectedKey);
  setFormValues(null);
  dirty = false;
  setStatus("Сброшено к обычным", "ok");
  showToast("Настройки уровня сброшены.", "success");
}

function previewLevel() {
  if (!saveSettings(false)) {
    return;
  }

  let url = "index.html";

  if (selectedKey.startsWith("builtin:")) {
    const index = Number(selectedKey.split(":")[1]);
    url = `index.html?level=${index}`;
  } else {
    const id = selectedKey.slice("custom:".length);
    url = `index.html?play=${encodeURIComponent(id)}`;
  }

  const previewWindow = window.open(url, "_blank");

  if (!previewWindow) {
    window.location.href = url;
  }
}

levelSelect.addEventListener("change", () => {
  if (
    dirty &&
    !confirm("Несохранённые настройки будут потеряны. Перейти к другому уровню?")
  ) {
    levelSelect.value = selectedKey;
    return;
  }

  loadSelectedLevel();
});

saveBtn.addEventListener("click", () => saveSettings(true));
resetBtn.addEventListener("click", resetToDefaults);
previewBtn.addEventListener("click", previewLevel);

window.addEventListener("beforeunload", event => {
  if (!dirty) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
});

buildFields();
buildPresets();
populateLevels();
loadSelectedLevel();
