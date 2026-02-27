'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (AILabAPI)
 * для асинхронной примерки причесок.
 * 
 * Логика в точном соответствии с документацией:
 * 1. POST на /hairstyle-editor-pro с task_type=async.
 * 2. Получение task_id.
 * 3. Циклический опрос /query-async-task-result каждые 5 секунд.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z.string().describe("Фото пользователя в формате Data URI."),
  hairstyleDescription: z.string().describe('Название или описание прически.'),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z.string().describe('Data URI или URL обработанного изображения.'),
});
export type AiHairstyleTryOnOutput = z.infer<typeof AiHairstyleTryOnOutputSchema>;

/**
 * Карта соответствия названий причесок строковым идентификаторам AILabTools.
 */
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
    // Используем переменную окружения для безопасности на публичном сайте
    const apiKey = process.env.AILAB_API_KEY || "VjEL6M5wqiYtQZnJUeTRoK3LBuzpxIw3zWrAhtHGOaW0xDrlfdn9DAyFCFMGhj1N";

    // 1. Подготовка бинарных данных изображения
    const parts = input.photoDataUri.split(',');
    if (parts.length < 2) {
      throw new Error('Некорректный формат изображения.');
    }
    const base64Data = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: contentType });

    const styleId = STYLE_MAP[input.hairstyleDescription] || "BuzzCut";

    const formData = new FormData();
    formData.append('task_type', 'async');
    formData.append('auto', '1');
    formData.append('image', blob, 'image.jpg');
    formData.append('hair_style', styleId);

    try {
      console.log(`AILab: Отправка задачи... (Стиль: ${styleId})`);
      
      const createResponse = await fetch('https://www.ailabapi.com/api/portrait/effects/hairstyle-editor-pro', {
        method: 'POST',
        headers: {
          'ailabapi-api-key': apiKey,
        },
        body: formData,
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok || createResult.error_code !== 0) {
        throw new Error(`Ошибка API (${createResult.error_code}): ${createResult.error_msg || 'Не удалось создать задачу'}`);
      }

      // task_id может быть в корне или в data
      const taskId = createResult.task_id || createResult.data?.task_id;
      
      if (!taskId) {
        throw new Error('Сервер не вернул task_id. Попробуйте другое фото.');
      }

      console.log('AILab: Задача создана. ID:', taskId);

      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 24; // 2 минуты

      const queryUrl = "https://www.ailabapi.com/api/common/query-async-task-result";

      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResponse = await fetch(`${queryUrl}?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        if (pollResult.error_code !== 0) {
          throw new Error(`Ошибка статуса: ${pollResult.error_msg}`);
        }

        const taskStatus = pollResult.task_status;

        if (taskStatus === 2) {
          const images = pollResult.data?.images;
          resultImage = images?.[0];
          if (resultImage) break;
        } else if (taskStatus === 3) {
          throw new Error('Ошибка обработки на сервере.');
        }
      }

      if (!resultImage) {
        throw new Error('Время ожидания истекло.');
      }

      return { generatedHairstyleImage: resultImage };

    } catch (error: any) {
      console.error('AILabTools Error:', error);
      throw new Error(error.message || 'Ошибка связи с сервером ИИ.');
    }
  }
);
