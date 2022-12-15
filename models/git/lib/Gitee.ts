import GitServer from './GitServer';
class Gitee extends GitServer {
  constructor() {
    super('gitee');
  }
  async createRepo(name: string) {
    console.log('createRepo');
  }
  async createOrgRepo(name: string, login: string) {
    console.log('createOrgRepo');
  }
  async getRemote() {
    console.log('getRomte');
  }
  async getUser() {
    console.log('getUser');
  }
  async getOrg() {
    console.log('getOrg');
  }
  getTokenUrl(): string {
    return 'https://gitee.com/personal_access_tokens';
  }

  getTokenHelpUrl(): string {
    return 'https://gitee.com/help/articles/4191';
  }
}

export default Gitee;
