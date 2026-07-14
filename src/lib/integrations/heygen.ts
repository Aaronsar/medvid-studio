interface AnimateAvatarParams {
  imageUrl: string;
  script: string;
  voiceId?: string;
}

export async function animateAvatar(
  params: AnimateAvatarParams
): Promise<{ videoId: string; status: string; demo: boolean }> {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    return {
      videoId: "demo-" + Date.now(),
      status: "completed",
      demo: true,
    };
  }

  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "talking_photo",
            talking_photo_url: params.imageUrl,
          },
          voice: {
            type: "text",
            input_text: params.script,
            voice_id: params.voiceId ?? "1bd001e7e50f421d891986aad5158bc3",
          },
        },
      ],
      dimension: { width: 1080, height: 1920 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HeyGen API error: ${error}`);
  }

  const data = await response.json();
  return {
    videoId: data.data?.video_id ?? "",
    status: "processing",
    demo: false,
  };
}

export async function getVideoStatus(
  videoId: string
): Promise<{ status: string; videoUrl: string | null }> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return { status: "completed", videoUrl: null };
  }

  const response = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
    {
      headers: { "X-Api-Key": apiKey },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get video status");
  }

  const data = await response.json();
  return {
    status: data.data?.status ?? "unknown",
    videoUrl: data.data?.video_url ?? null,
  };
}
