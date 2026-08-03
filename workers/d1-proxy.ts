import {
  D1BindingClient,
  D1BindingReplayGuard,
  handleD1HttpRequest,
  type D1DatabaseLike,
} from "../server/infrastructure/persistence/d1";

export interface D1ProxyEnv {
  DB: D1DatabaseLike;
  D1_HTTP_TOKEN: string;
}

/**
 * Cloudflare entrypoint. Vercel does not use this file: it uses D1HttpClient
 * with D1_TRANSPORT=http against this Worker.
 */
const d1ProxyWorker = {
  async fetch(request: Request, env: D1ProxyEnv): Promise<Response> {
    const client = new D1BindingClient(env.DB);
    return handleD1HttpRequest(request, {
      database: env.DB,
      sharedToken: env.D1_HTTP_TOKEN,
      replayGuard: new D1BindingReplayGuard(client),
    });
  },
};

export default d1ProxyWorker;
