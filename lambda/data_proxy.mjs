/**
 * AWS Lambda (Node.js 20+) for static deployments on S3 + CloudFront.
 * Route the CloudFront behaviours /api/sec/* and /api/nse/* to a Lambda
 * Function URL running this handler. Bundle with server/upstreams.mjs.
 *
 * Environment: SEC_USER_AGENT (required), NSE_HOST (optional).
 * Note: NSE frequently blocks AWS IP ranges. For Indian market data, prefer the
 * Node server (server/index.mjs) hosted on a network NSE accepts, or a licensed feed.
 */
import { handleDataRequest } from '../server/upstreams.mjs';

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod ?? 'GET';
  if (method !== 'GET') return { statusCode: 405, body: 'Method not allowed' };
  const out = await handleDataRequest(event.rawPath ?? event.path ?? '', event.rawQueryString ?? '');
  if (!out) return { statusCode: 404, body: 'Not found' };
  return {
    statusCode: out.status,
    headers: { 'Content-Type': out.type, 'Cache-Control': out.status < 400 && out.ttl ? `public, max-age=${out.ttl}` : 'no-store' },
    body: out.body,
  };
};
