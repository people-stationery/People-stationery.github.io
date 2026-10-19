/**
 * Studio People article notification endpoint.
 *
 * Deploy this file as a Google Apps Script web app.
 * Store these values under Project Settings > Script properties:
 *   WEBHOOK_SECRET            a long random secret shared with GitHub Actions
 *   OWNER_EMAIL               your own Gmail address
 *   SUPABASE_URL              https://qmwfmtaeoeyvuphtelmf.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY Supabase service-role key (never put this in GitHub)
 *
 * Expected Supabase table: public.email_subscribers
 * Columns: email (text), confirmed (boolean), unsubscribed (boolean)
 *
 * The public subscription form and confirmation/unsubscribe flow must be added
 * before reader delivery is enabled.
 */

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const expectedSecret = props.getProperty('WEBHOOK_SECRET');
    if (!expectedSecret) return json_({ ok: false, error: 'Server is not configured' }, 500);

    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.secret || !constantTimeEquals_(String(body.secret), expectedSecret)) {
      return json_({ ok: false, error: 'Unauthorized' }, 401);
    }

    const title = String(body.title || '').trim().slice(0, 200);
    const url = String(body.url || '').trim();
    const path = String(body.path || '').trim();
    if (!title || !/^https:\/\/people-stationery\.github\.io\/[0-9]+\.html$/.test(url) ||
        !/^[0-9]+\.html$/.test(path) || url !== 'https://people-stationery.github.io/' + path) {
      return json_({ ok: false, error: 'Invalid article data' }, 400);
    }

    const ownerEmail = props.getProperty('OWNER_EMAIL');
    if (!ownerEmail) return json_({ ok: false, error: 'OWNER_EMAIL is not configured' }, 500);

    const subject = '【Studio People】新しい記事を公開しました：' + title;
    const textBody = 'Studio People に新しい記事を公開しました！\n\n' +
      title + '\n' + url + '\n\n文房具を、ちょっと深く。\nStudio People';
    const htmlBody = '<div style="font-family:Arial,sans-serif;line-height:1.8;color:#24364b">' +
      '<p>Studio People に新しい記事を公開しました！</p>' +
      '<h2 style="color:#426791">' + escapeHtml_(title) + '</h2>' +
      '<p><a href="' + escapeHtml_(url) + '" style="display:inline-block;padding:12px 20px;background:#426791;color:#fff;text-decoration:none;border-radius:6px">記事を読む ↗</a></p>' +
      '<p>文房具を、ちょっと深く。<br>Studio People</p></div>';

    // Always notify the site owner.
    GmailApp.sendEmail(ownerEmail, subject, textBody, { htmlBody: htmlBody, name: 'Studio People' });

    // Reader mail is only sent to explicitly confirmed, non-unsubscribed addresses.
    // Until the table and consent flow are set up, the owner notification still works.
    const subscribers = getConfirmedSubscribers_(props);
    const uniqueRecipients = [...new Set(subscribers.map(s => String(s.email || '').trim().toLowerCase()).filter(Boolean))]
      .filter(email => email !== ownerEmail.toLowerCase());

    // Send individually so subscriber addresses are never exposed to one another.
    for (const email of uniqueRecipients) {
      GmailApp.sendEmail(email, subject, textBody, { htmlBody: htmlBody, name: 'Studio People' });
    }

    return json_({ ok: true, ownerNotified: true, subscriberCount: uniqueRecipients.length });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: 'Notification failed' });
  }
}

function getConfirmedSubscribers_(props) {
  const baseUrl = props.getProperty('SUPABASE_URL');
  const serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!baseUrl || !serviceKey) return [];

  const endpoint = baseUrl.replace(/\/$/, '') +
    '/rest/v1/email_subscribers?select=email&confirmed=eq.true&unsubscribed=eq.false';
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'get',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey
    },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Could not read subscriber list from Supabase: HTTP ' + response.getResponseCode());
  }
  return JSON.parse(response.getContentText());
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
