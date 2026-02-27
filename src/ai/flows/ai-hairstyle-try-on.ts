'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools для асинхронной примерки причесок.
 * Включает отправку задачи и опрос статуса (polling) каждые 5 секунд.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z.string().describe("Фото пользователя в формате Data URI."),
  hairstyleDescription: z.string().describe('Название или описание прически.'),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z.string().describe('URL обработанного изображения.'),
});
export type AiHairstyleTryOnOutput = z.infer<typeof AiHairstyleTryOnOutputSchema>;

// Карта стилей согласно документации AILabTools
const STYLE_MAP: Record<string, string> = {
  "Бокс": "BuzzCut",
  "Фейд": "LowFade",
  "Классический Помпадур": "Pompadour",
  "Текстурированный Квифф": "TexturedFringe",
  "Пробор на бок": "Side-Parted_Textured",
  "Мужской пучок": "ManBun",
  "Андеркат": "UnderCut",
  "Афро": "Afro",
  "Длинные кудри": "LongCurly",
  "Дреды": "Dreadlocks",
  "Тейпер": "HighTightFade",
  "Квифф": "TexturedFringe"
};

export async function aiHairstyleTryOn(
  input: AiHairstyleTryOnInput
): Promise<AiHairstyleTryOnOutput> {
  return aiHairstyleTryOnFlow(input);
}

const aiHairstyleTryOnFlow = ai.defineFlow(
  {
    name: 'aiHairstyleTryOnFlow',
    inputSchema: AiHairstyleTryOnInputSchema,
    outputSchema: AiHairstyleTryOnOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.AILAB_API_KEY || "VjEL6M5wqiYtQZnJUeTRoK3LBuzpxIw3zWrAhtHGOaW0xDrlfdn9DAyFCFMGhj1N";

    // Конвертация Data URI в Blob
    const parts = input.photoDataUri.split(',');
    const base64Data = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: contentType });

    const styleId = STYLE_MAP[input.hairstyleDescription] || input.hairstyleDescription;

    // 1. Создание задачи (Асинхронно)
    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('auto', '1');
    formData.append('image', blob, 'face.jpg');
    formData.append('hair_style', styleId);

    const createResponse = await fetch('https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro', {
      method: 'POST',
      headers: { 'ailabapi-api-key': apiKey },
      body: formData,
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok || createResult.error_code !== 0) {
      throw new Error(`Ошибка API (${createResult.error_code}): ${createResult.error_msg || 'Некорректные параметры'}`);
    }

    const taskId = createResult.task_id || createResult.data?.task_id;
    if (!taskId) throw new Error('Сервер не вернул task_id. Попробуйте другое фото.');

    // 2. Опрос статуса (Polling)
    let resultImage = null;
    let attempts = 0;
    const maxAttempts = 24; // ~2 минуты (24 * 5 сек)

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const pollResponse = await fetch(`https://www.ailabapi.com/api/common/query-async-task-result?task_id=${taskId}`, {
        method: 'GET',
        headers: { 'ailabapi-api-key': apiKey },
      });

      const pollResult = await pollResponse.json();

      if (pollResult.error_code !== 0) {
        throw new Error(`Ошибка статуса: ${pollResult.error_msg}`);
      }

      // task_status: 0-очередь, 1-обработка, 2-успех
      if (pollResult.task_status === 2) {
        resultImage = pollResult.data?.images?.[0];
        if (resultImage) break;
      } else if (pollResult.task_status === 3) {
        throw new Error('Ошибка обработки на стороне сервера ИИ.');
      }
    }

    if (!resultImage) throw new Error('Время ожидания истекло. Попробуйте фото меньшего размера.');

    return { generatedHairstyleImage: resultImage };
  }
);
