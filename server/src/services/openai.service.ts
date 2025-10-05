import OpenAI from "openai";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface AttachmentTagRequest {
  title: string;
  content: string;
  limit?: number;
}

export interface AttachmentTagResult {
  tags: string[];
}

const TAG_SCHEMA = {
  name: "document_tags",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["tags"],
    properties: {
      tags: {
        type: "array",
        minItems: 1,
        items: {
          type: "string",
          minLength: 1,
          maxLength: 64,
        },
      },
    },
  },
} as const;

function buildPrompt({ title, content, limit }: AttachmentTagRequest): string {
  const boundedContent = content.trim().slice(0, 5000);
  const safeTitle = title.trim().slice(0, 200) || "Ismertelen dokumentum";
  const maxTags = limit ?? env.ATTACHMENT_TAG_LIMIT;
  return `Elemezd a következő kutatási dokumentumot és térj vissza a legfontosabb ${maxTags} kulcscímkével magyarul.

Cím: ${safeTitle}

Szöveg:
"""
${boundedContent}
"""

Csak a címkéket add vissza, relevancia szerint sorbarendezve.`;
}

export async function generateAttachmentTags(
  input: AttachmentTagRequest,
): Promise<AttachmentTagResult> {
  const limit = Math.max(1, Math.min(input.limit ?? env.ATTACHMENT_TAG_LIMIT, env.ATTACHMENT_TAG_LIMIT));
  const prompt = buildPrompt({ ...input, limit });

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Te egy tudományos kutatási asszisztens vagy. A feladatod, hogy dokumentumokból kulcscímkéket határozz meg.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: TAG_SCHEMA,
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI válasz üres");
    }

    const parsed = JSON.parse(content) as AttachmentTagResult;
    const normalized = Array.isArray(parsed.tags)
      ? parsed.tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => tag.slice(0, 64))
      : [];

    return {
      tags: normalized.slice(0, limit),
    };
  } catch (err) {
    logger.error("OpenAI tag generálási hiba", { err });
    throw err;
  }
}
