import {
  addElementToCache,
  getCachedElement,
} from '../common/plugin-element-cache';
import { generateExampleContent, getSupportedFields } from './openai-generator';
import { getPluginSettings } from './settings';

const getCacheKey = (pluginInfo, formUniqueKey) =>
  `${pluginInfo.id}-form-sidebar-${formUniqueKey}`;

const getErrorMessage = (error) => {
  if (error.message === 'unsupported-fields') {
    return 'This content type has no supported fields to generate.';
  }

  if (error.message === 'invalid-response') {
    return 'OpenAI returned unusable content. Please generate again.';
  }

  return 'Could not generate example content. Check your OpenAI settings and try again.';
};

const updatePanel = (panel, { isGenerating, error, hasGenerated }) => {
  const button = panel.querySelector('button');
  const status = panel.querySelector('[data-status]');

  button.disabled = isGenerating;
  button.textContent = isGenerating
    ? 'Generating example content...'
    : hasGenerated
      ? 'Generate again'
      : 'Generate example content';
  status.textContent = error || '';
  status.hidden = !error;
};

const createPanel = () => {
  const panel = document.createElement('section');
  const button = document.createElement('button');
  const status = document.createElement('p');

  panel.className = 'ai-example-content-panel';
  button.className = 'ai-example-content-button';
  button.type = 'button';
  status.className = 'ai-example-content-status';
  status.dataset.status = 'true';
  status.setAttribute('role', 'alert');
  status.hidden = true;

  panel.append(button, status);
  return panel;
};

export const addFormSidebarPanel = (data, pluginInfo, globals) => {
  if (!data.create || data.disabled || data.form?.readonly) return null;

  const cacheKey = getCacheKey(pluginInfo, data.formUniqueKey);
  let cachedPanel = getCachedElement(cacheKey);
  let panel = cachedPanel?.element;

  if (!panel) {
    panel = createPanel();
    cachedPanel = {
      data: {
        isGenerating: false,
        hasGenerated: false,
        form: data.form,
        contentType: data.contentType,
      },
    };

    panel.querySelector('button').addEventListener('click', async () => {
      const settings = getPluginSettings(globals);
      const state = getCachedElement(cacheKey)?.data;

      if (!settings.openAiApiKey) {
        updatePanel(panel, {
          ...state,
          error: 'Configure an OpenAI API key in this plugin settings first.',
        });
        return;
      }

      if (!Object.keys(getSupportedFields(state.contentType)).length) {
        updatePanel(panel, {
          ...state,
          error: 'This content type has no supported fields to generate.',
        });
        return;
      }

      Object.assign(state, {
        isGenerating: true,
        error: '',
        hasGenerated: true,
      });
      updatePanel(panel, state);

      try {
        const generatedValues = await generateExampleContent({
          apiKey: settings.openAiApiKey,
          projectDescription: settings.projectDescription,
          contentType: state.contentType,
        });
        state.form.setValues({ ...state.form.getValues(), ...generatedValues });
      } catch (error) {
        state.error = getErrorMessage(error);
      } finally {
        state.isGenerating = false;
        updatePanel(panel, state);
      }
    });

    addElementToCache(panel, cacheKey, cachedPanel.data);
  }

  Object.assign(cachedPanel.data, {
    form: data.form,
    contentType: data.contentType,
  });
  updatePanel(panel, cachedPanel.data);
  return panel;
};
