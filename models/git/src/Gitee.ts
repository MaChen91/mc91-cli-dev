import GitServer from './GitServer';
import GiteeRequest from './GiteeRequest';
class Gitee extends GitServer {
  request: GiteeRequest;
  constructor() {
    super('gitee');
  }

  setToken(token) {
    super.setToken(token);
    this.request = new GiteeRequest(token);
  }

  getRepo(login, name) {
    return new Promise((resolve, reject) => {
      this.request
        .get(`/repos/${login}/${name}`)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => reject(err));
    });
  }
  createRepo(name: string) {
    return this.request.post('/user/repos', {
      name,
    });
  }
  createOrgRepo(name: string, login: string) {
    return this.request.post(`/orgs/${login}/repos`, {
      name,
    });
  }
  getRemote(name: string, login: string): string {
    return `git@gitee.com:${login}/${name}.git`;
  }
  getUser() {
    return this.request.get('/user');
  }
                                          async getOrg(username: string) {
    return this.request.get(`/users/${username}/orgs`, {
      page: 1,
      per_page: 100,
    });
  }
  getTokenUrl(): string {
    return 'https://gitee.com/personal_access_tokens';
  }

  getTokenHelpUrl(): string {
    return 'https://gitee.com/help/articles/4191';
  }
}

export default Gitee;
