import { api } from "./api";

/** The consent API behind /oauth/authorize. Query parameters pass through untouched. */
export const OAUTH_AUTHORIZE_API = "api/oauth/authorize";

export interface AuthorizeRequestInfo {
  client_name?: string;
  redirect_host?: string;
  requested_write?: boolean;
  /** Set when the request is malformed but safe to bounce back to the client. */
  error_redirect_url?: string;
}

export const describeAuthorizeRequestApi = async (search: string): Promise<AuthorizeRequestInfo> =>
  (await api.get<AuthorizeRequestInfo>(`${OAUTH_AUTHORIZE_API}${search}`)).data;

export const decideAuthorizeRequestApi = async (
  search: string,
  approve: boolean,
  canWrite: boolean,
): Promise<string> => {
  const params = Object.fromEntries(new URLSearchParams(search));
  const { data } = await api.post<{ redirect_url: string }>(OAUTH_AUTHORIZE_API, {
    ...params,
    approve,
    can_write: canWrite,
  });
  return data.redirect_url;
};
