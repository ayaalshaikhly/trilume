// TRILUME results email: a clean, table-based HTML email (works in Outlook, Gmail and on phones),
// sent from the TRILUME Gmail account with the logo and the map pictures built into the email.
const nodemailer = require('nodemailer');
const LOGO = require('./_email-logo');

const INK = '#1f2a44';
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeColor(c) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : INK; }

// data: { session, presenter, ideas: [{ slot, color, tools: [{ name, color, xName, x, yName, y, inZone, sug }], comments: [text] }] }
// images: [{ label, src }] where src is "cid:..." (email) or a data URL (preview)
function buildHtml(data, images, logoSrc) {
  const first = String(data.presenter || '').split(' ')[0];
  let ideas = '';
  (data.ideas || []).forEach(idea => {
    let rows = '';
    (idea.tools || []).forEach(t => {
      rows += '<tr>' +
        '<td style="padding:8px 10px;border-top:1px solid #eeeae2;font:700 14px Arial,sans-serif;color:' + safeColor(t.color) + ';white-space:nowrap;vertical-align:top">' + esc(t.name) + '</td>' +
        '<td style="padding:8px 10px;border-top:1px solid #eeeae2;font:13px Arial,sans-serif;color:#3f3e3a;vertical-align:top">' +
        esc(t.xName) + ' <b>' + esc(t.x) + '</b> &middot; ' + esc(t.yName) + ' <b>' + esc(t.y) + '</b><br>' +
        '<span style="color:' + (t.inZone ? '#1a7f43' : '#3f3e3a') + '">' + (t.inZone ? '&#10003; ' : '&#8599; ') + esc(t.sug) + '</span></td></tr>';
    });
    let comments = '';
    if (idea.comments && idea.comments.length) {
      comments = '<tr><td colspan="2" style="padding:10px 10px 4px;border-top:1px solid #eeeae2;font:700 13px Arial,sans-serif;color:' + INK + '">Classmates&rsquo; comments</td></tr>' +
        idea.comments.map(c => '<tr><td colspan="2" style="padding:4px 10px 6px 18px;font:italic 13px Arial,sans-serif;color:#3f3e3a">&ldquo;' + esc(c) + '&rdquo;</td></tr>').join('');
    }
    ideas += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e2d9;border-radius:10px;margin:0 0 14px;background:#ffffff">' +
      '<tr><td colspan="2" style="padding:12px 10px 8px;font:700 16px Arial,sans-serif;color:' + INK + '">' +
      '<span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:' + safeColor(idea.color) + ';margin-right:8px;vertical-align:-1px"></span>' +
      (data.ideas.length > 1 ? 'Idea ' + esc(idea.slot) : 'Your idea') + '</td></tr>' +
      (rows || '<tr><td colspan="2" style="padding:8px 10px;font:13px Arial,sans-serif;color:#6b6a66">No ratings yet.</td></tr>') + comments + '</table>';
  });
  const maps = (images || []).map(im =>
    '<tr><td style="padding:0 0 14px"><img src="' + esc(im.src) + '" width="560" alt="' + esc(im.label) + '" style="display:block;width:100%;max-width:560px;height:auto;border:1px solid #e6e2d9;border-radius:8px"></td></tr>'
  ).join('');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TRILUME results</title></head>' +
    '<body style="margin:0;padding:0;background:#f7f5f0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e6e2d9;border-radius:14px">' +
    // header
    '<tr><td style="padding:22px 24px 12px;border-bottom:4px solid #e3a008">' +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="vertical-align:middle"><img src="' + esc(logoSrc) + '" width="36" height="36" alt="" style="display:block"></td>' +
    '<td style="vertical-align:middle;padding-left:10px;font:800 20px Arial,sans-serif;letter-spacing:3px;color:' + INK + '">TRILUME</td>' +
    '</tr></table>' +
    '<div style="font:13px Arial,sans-serif;color:#6b6a66;margin-top:4px">One idea, three lenses</div></td></tr>' +
    // intro
    '<tr><td style="padding:20px 24px 6px">' +
    '<div style="font:700 20px Arial,sans-serif;color:' + INK + '">Your results: ' + esc(data.session) + '</div>' +
    '<div style="font:15px Arial,sans-serif;color:#3f3e3a;margin-top:8px;line-height:1.5">Hi ' + esc(first) + ', here is how your classmates saw your ideas. ' +
    'Every idea has potential: the suggestions show which way you could develop it. This is feedback, not a grade.</div></td></tr>' +
    // ideas
    '<tr><td style="padding:14px 24px 4px">' + ideas + '</td></tr>' +
    // maps
    (maps ? '<tr><td style="padding:4px 24px 8px"><div style="font:700 16px Arial,sans-serif;color:' + INK + ';margin:4px 0 8px">Your maps</div>' +
      '<div style="font:13px Arial,sans-serif;color:#6b6a66;margin-bottom:8px">Each diamond is the class average for one idea. The dashed circle is the target zone.</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + maps + '</table></td></tr>' : '') +
    // footer
    '<tr><td style="padding:16px 24px 22px;border-top:1px solid #eeeae2;font:12px Arial,sans-serif;color:#8a877f;line-height:1.5">' +
    'This is an automatic email from TRILUME. If you have questions, please ask your instructor.<br>' +
    'TRILUME was designed and developed by Aya Al-Shaikhly, School of Industrial Design, Carleton University.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function buildText(data) {
  let t = 'TRILUME: your results for ' + data.session + '\n\nHi ' + String(data.presenter || '').split(' ')[0] + ', here is how your classmates saw your ideas.\n';
  (data.ideas || []).forEach(idea => {
    t += '\nIdea ' + idea.slot + '\n';
    (idea.tools || []).forEach(x => { t += '- ' + x.name + ': ' + x.xName + ' ' + x.x + ', ' + x.yName + ' ' + x.y + '. ' + x.sug + '\n'; });
    (idea.comments || []).forEach(c => { t += '  "' + c + '"\n'; });
  });
  return t + '\nThis is an automatic email from TRILUME. If you have questions, please ask your instructor.\n';
}

// Turn data URLs into inline (cid) attachments.
function inlineImages(images) {
  const atts = [], list = [];
  (images || []).slice(0, 6).forEach((im, i) => {
    const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(im.dataUrl || '');
    if (!m) return;
    const cid = 'map' + i + '@trilume';
    atts.push({ filename: 'TRILUME_' + String(im.label || 'map').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_') + '.' + (m[1] === 'jpeg' ? 'jpg' : 'png'), content: Buffer.from(m[2], 'base64'), cid });
    list.push({ label: String(im.label || '').slice(0, 80), src: 'cid:' + cid });
  });
  return { atts, list };
}

function previewHtml(data, images) {
  const list = (images || []).slice(0, 6).filter(im => /^data:image\/(png|jpeg);base64,/.test(im.dataUrl || '')).map(im => ({ label: im.label, src: im.dataUrl }));
  return buildHtml(data, list, 'data:image/png;base64,' + LOGO);
}

let transport = null;
async function send(to, data, images) {
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('The TRILUME email account is not set up yet.');
  transport = transport || nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  const { atts, list } = inlineImages(images);
  atts.unshift({ filename: 'trilume-logo.png', content: Buffer.from(LOGO, 'base64'), cid: 'logo@trilume' });
  await transport.sendMail({
    from: { name: 'TRILUME', address: user },
    to,
    subject: 'Your TRILUME results: ' + data.session,
    text: buildText(data),
    html: buildHtml(data, list, 'cid:logo@trilume'),
    attachments: atts
  });
}

module.exports = { send, previewHtml, accountAddress: () => process.env.GMAIL_USER || '' };
