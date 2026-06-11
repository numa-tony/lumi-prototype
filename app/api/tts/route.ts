// Kokoro TTS via DopeyFace/Kokoro-TTS HuggingFace Space (API-open duplicate of hexgrad/Kokoro-82M).
// Free, no character limits. fn_index 4 = generate_first(text, voice, speed, use_gpu).

export const maxDuration = 30;

const SPACE = "https://dopeyface-kokoro-tts.hf.space";
const VOICE = "af_heart"; // Lumi's default — warm American female. Others: af_sarah, bf_alice, bm_george…

export async function POST(req: Request) {
  const { text, voice }: { text: string; voice?: string } = await req.json();
  const selectedVoice = voice || VOICE;
  const sessionHash = Math.random().toString(36).slice(2, 10);
  const hfHeaders: Record<string, string> = {};
  if (process.env.HF_TOKEN) hfHeaders["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

  // Step 1: Join queue
  const joinRes = await fetch(`${SPACE}/gradio_api/queue/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...hfHeaders },
    body: JSON.stringify({ fn_index: 4, data: [text, selectedVoice, 1, false], session_hash: sessionHash }),
  });
  if (!joinRes.ok) {
    console.error("[tts] queue/join failed:", joinRes.status);
    return new Response(null, { status: 502 });
  }

  // Step 2: Poll SSE — read all lines, find process_completed
  const pollRes = await fetch(`${SPACE}/gradio_api/queue/data?session_hash=${sessionHash}`, {
    headers: hfHeaders,
  });
  if (!pollRes.ok) {
    console.error("[tts] queue/data failed:", pollRes.status);
    return new Response(null, { status: 502 });
  }

  const sseText = await pollRes.text();

  let audioUrl: string | null = null;
  for (const line of sseText.split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const msg = JSON.parse(line.slice(5).trim()) as {
        msg: string;
        output?: { data?: [{ url: string }, string] };
        success?: boolean;
      };
      if (msg.msg === "process_completed" && msg.success && msg.output?.data?.[0]?.url) {
        audioUrl = msg.output.data[0].url;
        break;
      }
    } catch { /* skip non-JSON lines */ }
  }

  if (!audioUrl) {
    console.error("[tts] Kokoro: no audio URL in SSE response");
    return new Response(null, { status: 502 });
  }

  // Step 3: Proxy the WAV
  const audioRes = await fetch(audioUrl, { headers: hfHeaders });
  if (!audioRes.ok) {
    console.error("[tts] audio fetch failed:", audioRes.status);
    return new Response(null, { status: 502 });
  }
  return new Response(audioRes.body, { headers: { "Content-Type": "audio/wav" } });
}
