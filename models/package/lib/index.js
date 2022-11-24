'use strict';
const {isObject} = require('@mc91-cli-dev/utils');
const {getDefaultRegistry} = require('@mc91-cli-dev/get-npm-info');
const path = require('path');
const npminstall = require('npminstall');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options不能为空');
    }
    if (!isObject(options)) {
      throw new Error('Package类的options必须为对象');
    }
    console.log('targetPath', options.targetPath);
    //package的路径
    this.targetPath = options.targetPath;
    //缓存package路径
    this.storeDir = options.storeDir;
    //package的name
    this.packageName = options.packageName;
    //package的version
    this.packageVersion = options.packageVersion;
  }

  //是否存在
  exists() {}

  install() {
    npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }

  //更新package
  update() {}

  //获取入口文件的路径
  async getRootFilePath() {
    const {packageDirectorySync} = await import('pkg-dir');
    //1.获取package.json所在目录
    const dir = packageDirectorySync({cwd: this.targetPath});
    if (dir) {
      //2.读取package.json
      const pkgFile = require(path.resolve(dir, 'package.json'));
      //3.获取main/lib
      if (pkgFile && pkgFile.main) {
        //4.拼接路径 - path.join
        return path.resolve(dir, pkgFile.main);
      }
    }
  }
}

module.exports = Package;
