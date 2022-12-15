import GitServer from './GitServer';
class GitHub extends GitServer {
  constructor() {
    super('github');
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
    return 'https://github.com/settings/tokens';
  }

  getTokenHelpUrl(): string {
    return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh';
  }
}

export default GitHub;
