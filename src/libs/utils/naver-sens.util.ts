import * as crypto from 'crypto';

export function makeSignature({
  method,
  url,
  timestamp,
  accessKey,
  secretKey,
}: {
  method: string;
  url: string;
  timestamp: string;
  accessKey: string;
  secretKey: string;
}) {
  const space = ' ';
  const newLine = '\n';

  const hmac = crypto.createHmac('sha256', secretKey);
  const message = [
    method,
    space,
    url,
    newLine,
    timestamp,
    newLine,
    accessKey,
  ].join('');

  return hmac.update(message).digest('base64');
}
