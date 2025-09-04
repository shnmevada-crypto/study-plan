const ical = require('node-ical');
const fetch = require('node-fetch');

const YEAR11_REGEX = /\b(Year\s*11|Y\s*11|Y11|Yr\s*11|Year11|All students|Whole school|All)\b/i;

exports.handler = async (event) => {
  try {
    const url = (event.queryStringParameters && event.queryStringParameters.url) || process.env.CALENDAR_URL;
    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing calendar URL. Provide ?url=ICS_URL or set CALENDAR_URL env var.' })};
    }

    const res = await fetch(url);
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch calendar', status: res.status })};
    }
    const text = await res.text();

    const data = ical.parseICS(text);
    const events = Object.values(data)
      .filter(item => item.type === 'VEVENT')
      .map(ev => ({
        uid: ev.uid,
        summary: ev.summary || '',
        description: ev.description || '',
        location: ev.location || '',
        start: ev.start ? ev.start.toISOString() : null,
        end: ev.end ? ev.end.toISOString() : null,
        categories: ev.categories || null
      }))
      .filter(ev => {
        const hay = `${ev.summary} ${ev.description} ${ev.categories || ''}`;
        return YEAR11_REGEX.test(hay);
      })
      .sort((a,b) => new Date(a.start) - new Date(b.start));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' },
      body: JSON.stringify({ source: url, count: events.length, events })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
