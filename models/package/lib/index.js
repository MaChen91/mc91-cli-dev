'use strict';
const {isObject} = require('@mc91-cli-dev/utils');
const {getDefaultRegistry, getLatestVersion} = require('@mc91-cli-dev/get-npm-info');
const path = require('path');
const npminstall = require('npminstall');
const fse = require('fs-extra');

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
    console.log('this.packageName', this.packageName);
    //缓存package目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`,
    );
  }

  //如果是latest版本，获取最新版本号
  async prepare() {
    const {pathExistsSync} = await import('path-exists');
    console.log(this.packageVersion);

    //创建缓存目录
    if (this.storeDir && !pathExistsSync(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }

    if (this.packageVersion === 'latest') {
      this.packageVersion = await getLatestVersion(this.packageName);
    }
  }

  //是否存在
  async exists() {
    const {pathExistsSync} = await import('path-exists');
    if (this.storeDir) {
      await this.prepare();
      console.log('this.cacheFilePath', this.cacheFilePath);
      return pathExistsSync(this.cacheFilePath);
    } else {
      return pathExistsSync(this.targetPath);
    }
  }

  async install() {
    await this.prepare();
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
  //如果最新版本存在 跳过更新
  async update() {
    await this.prepare();
  }

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
