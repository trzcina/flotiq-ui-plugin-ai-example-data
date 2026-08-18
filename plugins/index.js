import { registerFn } from '../common/plugin-element-cache';
import pluginInfo from '../plugin-manifest.json';
import cssString from 'inline:./styles/style.css';
import { addFormSidebarPanel } from './form-sidebar';
import { getSettingsSchema } from './settings';

registerFn(pluginInfo, (handler, _client, globals) => {
  /**
   * Add plugin styles to the head of the document
   */
  if (!document.getElementById(`${pluginInfo.id}-styles`)) {
    const style = document.createElement('style');
    style.id = `${pluginInfo.id}-styles`;
    style.textContent = cssString;
    document.head.appendChild(style);
  }

  handler.on('flotiq.plugins.manage::form-schema', getSettingsSchema);
  handler.on('flotiq.form.sidebar-panel::add', (data) =>
    addFormSidebarPanel(data, pluginInfo, globals),
  );
});
