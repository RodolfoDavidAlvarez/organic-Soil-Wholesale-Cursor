import QRCode from 'qrcode';
import { findSurveyCouponByCode, parseSurveyCouponQrRequest } from './surveyResponses.js';

export async function buildSurveyCouponQr({ db, fileName }) {
  const parsed = parseSurveyCouponQrRequest(fileName);
  if (!parsed) return { status: 404 };
  const redemption = await findSurveyCouponByCode(db, parsed.code);
  if (!redemption) return { status: 404 };

  if (parsed.format === 'png') {
    const png = await QRCode.toBuffer(parsed.code, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 600,
    });
    return { status: 200, contentType: 'image/png', body: png };
  }

  const svg = await QRCode.toString(parsed.code, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 360,
  });
  return { status: 200, contentType: 'image/svg+xml; charset=utf-8', body: svg };
}

export function sendSurveyCouponQr(res, result) {
  if (!result || result.status === 404) return res.status(404).send('Not found');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('Content-Type', result.contentType);
  return res.status(200).send(result.body);
}
