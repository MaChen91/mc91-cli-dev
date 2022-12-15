'use strict';
import { SimpleGit, simpleGit } from 'simple-git';
import path from 'path';
import userHome from 'user-home';

interface projectInfo {
  name: string;
  version: string;
  dir: string;
}
const DEFAULT_CLI_HOME = process.env.CLI_HOME_PATH ?? '.mc91-cli-dev';
class Git {
  name: string;
  version: string;
  dir: string;
  git: SimpleGit;
  homePath: String;
  constructor(projectInfo: projectInfo) {
    Object.keys(projectInfo).forEach((key) => {
      this[key] = projectInfo[key];
    });
    this.git = simpleGit(this.dir);
    console.log('project info git', this.git);
  }

  async prepare() {
    if (!this.homePath) {
      this.homePath = path.resolve(userHome, DEFAULT_CLI_HOME);
    }
    //log.verbose();

    //检查缓存主目录
  }
  init() {
    console.log('exec init git');
  }
}

export default Git;
