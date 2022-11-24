'use strict';
const axios = require('axios');

const semver = require('semver');
module.exports = {
  getNpmInfo,
  getDefaultRegistry,
  getNpmVersions,
  getNpmSemverVersion,
  getLatestVersion,
};

// 获取npm包信息
async function getNpmInfo(npmName, registry) {
  const urlJoin = (await import('url-join')).default;
  // 获取npm包信息
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  try {
    const {data} = await axios.get(npmInfoUrl);
    return data;
  } catch (err) {
    return Promise.reject(err);
  }
}

// 获取npm包所有版本号
async function getNpmVersions(npmName, registry) {
  try {
    const {versions} = await getNpmInfo(npmName, registry);
    return Object.keys(versions);
  } catch (error) {
    return [];
  }
}

function getSemverVersions(baseVersion, versions) {
  //console.log(versions);
  return versions
    .filter(version => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a));
}

async function getLatestVersion(npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  if (versions && versions.length > 0) {
    return versions.sort((a, b) => semver.compare(b, a))[0];
  }
  return null;
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = getSemverVersions(baseVersion, versions);
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
}

function getDefaultRegistry(isOriginal = true) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}
