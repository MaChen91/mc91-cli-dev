//https://docs.github.com/zh/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28
import GitServer from './GitServer';
import GitHubRequest from './GitHubRequest';
class GitHub extends GitServer {
  request: GitHubRequest;
  constructor() {
    super('github');
  }

  setToken(token) {
    super.setToken(token);
    this.request = new GitHubRequest(token);
  }

  getRepo(name: string, login: string) {
    return new Promise((resolve, reject) => {
      this.request
        .get(`/repos/${login}/${name}`)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => reject(err));
    });
  }

  getRemote(name: string, login: string) {
    return `git@github.com:${login}/${name}.git`;
  }
  async getUser() {
    return this.request.get('/user');
  }
  async getOrg(username: string) {
    return this.request.get(`/users/${username}/orgs`, {
      page: 1,
      per_page: 100,
    });
  }

  async createRepo(name: string): Promise<any> {
    return this.request.post(
      '/user/repos',
      { name },
      { Accept: 'application/vnd.github.v3+json' },
    );
  }

  async createOrgRepo(name: string, login: string): Promise<any> {
    return this.request.post(
      `/orgs/${login}/repos`,
      { name },
      { Accept: 'application/vnd.github.v3+json' },
    );
  }

  getTokenUrl(): string {
    return 'https://github.com/settings/tokens';
  }

  getTokenHelpUrl(): string {
    return 'https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh';
  }
}

export default GitHub;
