'use strict';
import { io } from 'socket.io-client';
import { get } from 'lodash-es';
import inquirer from 'inquirer';

import Git from './index';
const log = require('@imooc-cli-dev/log');
const request = require('@imooc-cli-dev/request');

const WS_SERVER = process.env.MC91_CLI_BASE_URL;
const TIME_OUT = 5 * 60 * 1000;
const CONNECT_TIME_OUT = 5 * 1000;

const FAILED_CODE = [
  'prepare failed',
  'download failed',
  'install failed',
  'build failed',
  'pre-publish failed',
  'publish failed',
];

class CloudBuild {
  git: Git;
  buildCmd: string;
  prod: boolean = false;
  timeout: number = TIME_OUT;
  constructor(
    git: Git,
    options: {
      buildCmd: string;
      prod: boolean;
    },
  ) {
    this.git = git;
    this.buildCmd = options.buildCmd;
    this.prod = options.prod;
  }
}

export default CloudBuild;
