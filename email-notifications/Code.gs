/**
 * Studio People: article notification + confirmed email subscriptions.
 * Required Script Properties:
 * WEBHOOK_SECRET, OWNER_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Never expose the Supabase service-role key in client-side code.
 */
const SITE_URL = 'https://people-stationery.github.io/';
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwS_ElSWjEjrXZPxHou2bhzJX3XSTf3vCjSPE7kN9qu0L5zK5N0IfBaFbLdx9Ko9tTN/exec';

function doPost(e) {
  const action = String((e && e.parameter && e.parameter.action) || '');
  if (action === 'subscribe') return handleSubscribe_(e);
  return handleArticleNotification_(e);
}

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '');
  const token = String((e && e.parameter && e.parameter.token) || '');
  if (!token || token.length > 200) return page_('Studio People', 'リンクが正しくありません。');
  if (action === 'confirm') return handleConfirm_(token);
  if (action === 'unsubscribe') return handleUnsubscribe_(token);
  return page_('Studio People', 'このリンクは無効です。');
}

function handleSubscribe_(e) {
  try {
    const email = normalizeEmail_(e && e.parameter && e.parameter.email);
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return page_('入力内容をご確認ください', '有効なメールアドレスを入力してください。');
    }

    const cache = CacheService.getScriptCache();
    const throttleKey = 'newsletter:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email));
    if (cache.get(throttleKey)) {
      return page_('確認メールを確認してください', 'このアドレスには直近で確認メールを送信しています。少し時間をおいてからお試しください。');
    }

    const props = PropertiesService.getScriptProperties();
    const existing = findSubscriberByEmail_(props, email);
    if (existing && existing.confirmed && !existing.unsubscribed) {
      return page_('登録済みです', 'このメールアドレスはすでに購読中です。');
    }

    const confirmToken = randomToken_();
    const unsubscribeToken = (existing && existing.unsubscribe_token) || randomToken_();
    const record = {
      email: email,
      confirmed: false,
      unsubscribed: false,
      confirm_token: confirmToken,
      unsubscribe_token: unsubscribeToken,
      confirmed_at: null,
      unsubscribed_at: null
    };

    if (existing) {
      const oldId = existing.id;
      const result = supabaseRequest_(props, '/rest/v1/email_subscribers?id=eq.' + encodeURIComponent(oldId), 'patch', record, 'return=minimal');
      if (result.code < 200 || result.code >= 300) throw new Error('Could not update subscriber: ' + result.code);
    } else {
      const result = supabaseRequest_(props, '/rest/v1/email_subscribers', 'post', record, 'return=minimal');
      if (result.code < 200 || result.code >= 300) {
        // Avoid revealing whether a particular address exists.
        throw new Error('Could not create subscriber: ' + result.code);
      }
    }

    const confirmUrl = WEB_APP_URL + '?action=confirm&token=' + encodeURIComponent(confirmToken);
    const subject = '【Studio People】メール購読の確認';
    const textBody = 'Studio People のメール購読を申し込みいただきありがとうございます。\n\n' +
      '購読を開始するには、次のリンクを開いてください。\n' + confirmUrl +
      '\n\nお心当たりがない場合は、このメールを無視してください。\n\n文房具を、ちょっと深く。\nStudio People';
    const htmlBody = '<div style="font-family:Arial,sans-serif;line-height:1.9;color:#263746;max-width:560px;margin:auto">' +
      '<p style="color:#6c8aa5;letter-spacing:.15em;font-size:12px">STUDIO PEOPLE</p>' +
      '<h2 style="color:#426791">メール購読の確認</h2>' +
      '<p>新しい記事のお知らせを受け取るには、下のボタンを押して登録を確認してください。</p>' +
      '<p><a href="' + escapeHtml_(confirmUrl) + '" style="display:inline-block;padding:12px 20px;background:#426791;color:#fff;text-decoration:none;border-radius:6px">購読を確認する ↗</a></p>' +
      '<p style="font-size:12px;color:#718096">お心当たりがない場合は、このメールを無視してください。確認されるまで配信は始まりません。</p>' +
      '<p>文房具を、ちょっと深く。<br>Studio People</p></div>';
    MailApp.sendEmail(email, subject, textBody, {htmlBody: htmlBody, name: 'Studio People'});
    cache.put(throttleKey, '1', 300);
    return page_('確認メールを送りました', '入力したメールアドレスをご確認ください。メール内の「購読を確認する」を押すと登録が完了します。');
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return page_('申し込みを処理できませんでした', '時間をおいてから、もう一度お試しください。');
  }
}

function handleConfirm_(token) {
  try {
    const props = PropertiesService.getScriptProperties();
    const matches = supabaseRequest_(props, '/rest/v1/email_subscribers?select=id,email&confirm_token=eq.' + encodeURIComponent(token) + '&limit=1', 'get');
    if (matches.code < 200 || matches.code >= 300) throw new Error('Supabase lookup failed: ' + matches.code);
    const rows = JSON.parse(matches.body || '[]');
    if (!rows.length) return page_('リンクを確認できません', 'この確認リンクは無効か、すでに使用されています。必要であれば、もう一度購読を申し込んでください。');
    const updated = supabaseRequest_(props, '/rest/v1/email_subscribers?id=eq.' + encodeURIComponent(rows[0].id), 'patch', {
      confirmed: true, unsubscribed: false, confirm_token: null,
      confirmed_at: new Date().toISOString(), unsubscribed_at: null
    }, 'return=minimal');
    if (updated.code < 200 || updated.code >= 300) throw new Error('Confirmation update failed: ' + updated.code);
    return page_('購読が完了しました', '登録が確認できました。Studio Peopleの新しい記事をメールでお知らせします。');
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return page_('処理できませんでした', '時間をおいてから、もう一度リンクを開いてください。');
  }
}

function handleUnsubscribe_(token) {
  try {
    const props = PropertiesService.getScriptProperties();
    const matches = supabaseRequest_(props, '/rest/v1/email_subscribers?select=id&unsubscribe_token=eq.' + encodeURIComponent(token) + '&limit=1', 'get');
    if (matches.code < 200 || matches.code >= 300) throw new Error('Supabase lookup failed: ' + matches.code);
    const rows = JSON.parse(matches.body || '[]');
    if (!rows.length) return page_('リンクを確認できません', '配信停止リンクが無効です。');
    const updated = supabaseRequest_(props, '/rest/v1/email_subscribers?id=eq.' + encodeURIComponent(rows[0].id), 'patch', {
      unsubscribed: true, unsubscribed_at: new Date().toISOString()
    }, 'return=minimal');
    if (updated.code < 200 || updated.code >= 300) throw new Error('Unsubscribe update failed: ' + updated.code);
    return page_('配信を停止しました', '今後、新しい記事のお知らせメールは届きません。');
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return page_('処理できませんでした', '時間をおいてから、もう一度リンクを開いてください。');
  }
}

function handleArticleNotification_(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('WEBHOOK_SECRET');
    if (!expectedSecret) return json_({ok:false,error:'Server is not configured'});
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.secret || !constantTimeEquals_(String(body.secret), expectedSecret)) return json_({ok:false,error:'Unauthorized'});
    const title = String(body.title || '').trim().slice(0, 200);
    const url = String(body.url || '').trim();
    const path = String(body.path || '').trim();
    if (!title || !/^https:\/\/people-stationery\.github\.io\/[0-9]+\.html$/.test(url) ||
        !/^[0-9]+\.html$/.test(path) || url !== SITE_URL + path) return json_({ok:false,error:'Invalid article data'});
    const ownerEmail = normalizeEmail_(props.getProperty('OWNER_EMAIL'));
    if (!ownerEmail) return json_({ok:false,error:'OWNER_EMAIL is not configured'});
    const subject = '【Studio People】新しい記事を公開しました：' + title;
    const textBody = 'Studio People に新しい記事を公開しました！\n\n' + title + '\n' + url + '\n\n文房具を、ちょっと深く。\nStudio People';
    const htmlBody = '<div style="font-family:Arial,sans-serif;line-height:1.8;color:#24364b"><p>Studio People に新しい記事を公開しました！</p><h2 style="color:#426791">' +
      escapeHtml_(title) + '</h2><p><a href="' + escapeHtml_(url) + '" style="display:inline-block;padding:12px 20px;background:#426791;color:#fff;text-decoration:none;border-radius:6px">記事を読む ↗</a></p><p>文房具を、ちょっと深く。<br>Studio People</p></div>';
    MailApp.sendEmail(ownerEmail, subject, textBody, {htmlBody: htmlBody, name: 'Studio People'});

    const subscribers = getConfirmedSubscribers_(props);
    const uniqueRecipients = [...new Set(subscribers.map(s => normalizeEmail_(s.email)).filter(Boolean))]
      .filter(email => email !== ownerEmail);
    const unsubscribeForEmail = {};
    subscribers.forEach(s => { if (s.email && s.unsubscribe_token) unsubscribeForEmail[normalizeEmail_(s.email)] = s.unsubscribe_token; });
    uniqueRecipients.forEach(email => {
      const unsubscribeUrl = WEB_APP_URL + '?action=unsubscribe&token=' + encodeURIComponent(unsubscribeForEmail[email] || '');
      const readerText = textBody + '\n\n配信停止：' + unsubscribeUrl;
      const readerHtml = htmlBody + '<hr style="border:0;border-top:1px solid #e3eaf1;margin:28px 0"><p style="font-size:12px;color:#718096">今後のお知らせが不要な場合は、<a href="' + escapeHtml_(unsubscribeUrl) + '">こちらから配信停止</a>できます。</p>';
      MailApp.sendEmail(email, subject, readerText, {htmlBody: readerHtml, name: 'Studio People'});
    });
    return json_({ok:true,ownerNotified:true,subscriberCount:uniqueRecipients.length});
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ok:false,error:'Notification failed'});
  }
}

function getConfirmedSubscribers_(props) {
  const result = supabaseRequest_(props, '/rest/v1/email_subscribers?select=email,unsubscribe_token&confirmed=eq.true&unsubscribed=eq.false', 'get');
  if (result.code < 200 || result.code >= 300) throw new Error('Could not read subscribers: HTTP ' + result.code);
  return JSON.parse(result.body || '[]');
}

function findSubscriberByEmail_(props, email) {
  const result = supabaseRequest_(props, '/rest/v1/email_subscribers?select=id,email,confirmed,unsubscribed,unsubscribe_token&email=eq.' + encodeURIComponent(email) + '&limit=1', 'get');
  if (result.code < 200 || result.code >= 300) throw new Error('Could not find subscriber: ' + result.code);
  const rows = JSON.parse(result.body || '[]');
  return rows[0] || null;
}

function supabaseRequest_(props, path, method, body, prefer) {
  const baseUrl = props.getProperty('SUPABASE_URL');
  const serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!baseUrl || !serviceKey) throw new Error('Supabase configuration is missing');
  const options = {
    method: method,
    headers: {apikey: serviceKey, Authorization: 'Bearer ' + serviceKey},
    muteHttpExceptions: true
  };
  if (body !== undefined) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }
  if (prefer) options.headers.Prefer = prefer;
  const response = UrlFetchApp.fetch(baseUrl.replace(/\/$/, '') + path, options);
  return {code: response.getResponseCode(), body: response.getContentText()};
}

function randomToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}
function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function page_(title, message) {
  return HtmlService.createHtmlOutput('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml_(title) + ' | Studio People</title><body style="margin:0;background:#f7f9fc;color:#263746;font-family:Arial,sans-serif;line-height:1.8;display:grid;min-height:100vh;place-items:center"><main style="box-sizing:border-box;width:min(560px,calc(100% - 32px));padding:36px 28px;background:#fff;border:1px solid #e3eaf1;border-radius:18px;box-shadow:0 12px 36px #24364b12"><p style="margin:0 0 12px;color:#6c8aa5;font-size:12px;letter-spacing:.16em">STUDIO PEOPLE</p><h1 style="margin:0 0 16px;color:#426791;font-size:24px">' + escapeHtml_(title) + '</h1><p>' + escapeHtml_(message) + '</p><a href="' + SITE_URL + '" style="display:inline-block;margin-top:16px;color:#426791">Studio Peopleへ戻る ↗</a></main></body></html>').setTitle(title);
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
