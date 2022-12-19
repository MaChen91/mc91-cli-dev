type gitType = 'github' | 'gitee';
abstract class GitServer {
  type: gitType;
  token: string;
  constructor(type: gitType) {
    this.type = type;
  }
  abstract createRepo(name: string): Promise<any>;
  abstract createOrgRepo(name: string, login: string): Promise<any>;
  abstract getRepo(name: string, login: string): Promise<any>;
  abstract getRemote(name: string, login: string): string;
  abstract getUser(): Promise<any>;
  abstract getOrg(username: string): Promise<any>;
  abstract getTokenUrl(): string;
  abstract getTokenHelpUrl(): string;

  setToken(token: string): void {
    this.token = token;
  }

  isHttpResponse = (response) => {
    return response && response.status;
  };

  handleResponse = (response) => {
    if (this.isHttpResponse(response) && response !== 200) {
      return null;
    } else {
      return response;
    }
  };
}

export default GitServer;
