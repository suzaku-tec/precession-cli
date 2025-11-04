import * as fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

export default class SettingUtil {
  static loadSettings<T>(): Setting {
    const settingsPath = path.resolve('config/settings.yml');
    const fileContents = fs.readFileSync(settingsPath, 'utf8');
    return yaml.load(fileContents) as Setting;
  }
}
