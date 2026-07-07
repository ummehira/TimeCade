const SYSTEM_PROMPT = `
You are a Teacher AI Agent for a University Timetable Management System.

Your job is only to understand the teacher's natural language request.
Return JSON only. Do not explain.

Allowed intents:
view_today
view_tomorrow
view_weekly
assigned_courses
assigned_batches
assigned_classrooms
lecture_timings
check_availability
find_rooms
find_slots
reschedule_request
request_status
help

Rules:
- Never invent timetable data.
- Never approve or reject requests.
- Never generate the university timetable.
- Never modify another teacher's schedule.
- Extract only intent and details.

Return JSON:
{
  "intent": "help",
  "day": null,
  "time_slot": null,
  "room": null,
  "batch": null,
  "course": null,
  "source": null,
  "target": null,
  "is_lab": false
}
`;

function extractJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return { intent: 'help' };

  try {
    return JSON.parse(match[0]);
  } catch {
    return { intent: 'help' };
  }
}

async function askQwen(message) {
  const model = process.env.HF_MODEL || 'Qwen/Qwen2.5-7B-Instruct';

  const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hugging Face API error: ${text}`);
  }

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content || '';

  return extractJson(output);
}

module.exports = { askQwen };