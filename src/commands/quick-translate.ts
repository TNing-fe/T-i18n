import * as vscode from 'vscode';
import { translate } from '../service/translation';
const fs = require('fs');

async function writeJson(result) {
  const { value, lang, idValue } = result;
  const editorConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(
    'termix-i18n.translate'
  );
  const outPath = editorConfig.get(`outPath.${lang}`);
  const messageJson = fs.readFileSync(outPath, 'utf8');
  let config = JSON.parse(messageJson);
  config[idValue] = value;
  fs.writeFileSync(outPath, JSON.stringify(config), 'utf8');
}
async function quickTranslate() {
  const editor = vscode.window.activeTextEditor;
  const { document, selection } = editor as Record<string, any>;
  const activeText = document.getText(selection);
  if (!activeText) {
    return;
  }
  // 解析获取的string，提取id 和 defaultMessage
  const [idStr = '', messageStr = ''] = activeText.replace(/['\"\s]/g, '').split(',');
  const [, idValue] = idStr.split(':');
  const [, messageValue] = messageStr.split(':');
  if (!messageValue) {
    return;
  }
  const queryString = messageValue;
  const lang = ['en', 'zh-CHT'];
  vscode.window.showInformationMessage('快马加鞭翻译。。。');
  try {
    const resList = await Promise.all([
      translate(queryString, lang[0]),
      translate(queryString, lang[1]),
    ]);
    const result = resList.map((item = {}, index) => {
      const { translation = [] } = item.data;
      const [value] = translation;
      return { lang: lang[index], value: value || '', idValue };
    });
    const promiseList = result.map(item => {
      return writeJson(item);
    });
    await Promise.all(promiseList);
    vscode.window.showInformationMessage('翻译结束');

    // editor?.edit(editBuilder => {
    //   editBuilder.replace(selection, dst);
    // });
  } catch (error) {
    console.log('error', error);
  }
}

export default quickTranslate;
