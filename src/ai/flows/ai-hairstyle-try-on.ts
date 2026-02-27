'use server';
/**
 * @fileOverview Этот процесс использует API AILabTools (AILabAPI)
 * для реалистичной примерки причесок на фото пользователя.
 * 
 * Интеграция настроена согласно предоставленному коду:
 * 1. POST на /hairstyle-editor-pro (task_type=async)
 * 2. Получение task_id
 * 3. GET на /get_async_result для проверки статуса (polling)
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
  "Фейд": "LowFade",
  "Классический Помпадур": "Pompadour",
  "Текстурированный Квифф": "TexturedFringe",
  "Пробор на бок": "Side-Parted_Textured",
  "Мужской пучок": "ManBun",
  "Бокс": "BuzzCut",
  "Длинные кудри": "LongCurly",
  "Тейпер": "HighTightFade",
  "Квифф": "TexturedFringe",
  "Андеркат": "UnderCut",
  "Афро": "Afro",
  "Дреды": "Dreadlocks"
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
    // Вставляем ваш проверенный ключ
    const apiKey = "VjEL6M5wqiYtQZnJUeTRoK3LBuzpxIw3zWrAhtHGOaW0xDrlfdn9DAyFCFMGhj1N";

    // 1. Подготовка бинарных данных из Data URI
    const parts = input.photoDataUri.split(',');
    if (parts.length < 2) {
      throw new Error('Некорректный формат изображения.');
    }
    const base64Data = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: contentType });

    // Получаем корректный ID прически из маппинга
    const styleId = STYLE_MAP[input.hairstyleDescription] || "BuzzCut";

    // Формируем FormData для отправки задачи
    const formData = new FormData();
    formData.append('task_type', 'async');
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
        console.error('AILab Create Task Error:', createResult);
        throw new Error(`Ошибка API (${createResult.error_code}): ${createResult.error_msg || 'Не удалось создать задачу'}`);
      }

      const taskId = createResult.data?.task_id;
      if (!taskId) {
        throw new Error('Сервер не вернул task_id. Попробуйте другое фото.');
      }

      console.log('AILab: Задача создана успешно. ID:', taskId);

      // 3. Опрос (Polling) результата - цикл как в вашем примере
      let resultImage = null;
      let attempts = 0;
      const maxAttempts = 20; // Ожидаем до 100 секунд (20 попыток по 5 сек)

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`AILab: Ожидание результата... (Попытка ${attempts}/${maxAttempts})`);
        
        // Ждем 5 секунд перед проверкой (как в time.sleep(5))
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResponse = await fetch(`https://www.ailabapi.com/api/common/get_async_result?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'ailabapi-api-key': apiKey,
          },
        });

        const pollResult = await pollResponse.json();

        if (pollResult.error_code !== 0) {
          throw new Error(`Ошибка проверки статуса: ${pollResult.error_msg}`);
        }

        // task_status: 2 - готово, 0/1 - в очереди или обработке
        const taskStatus = pollResult.data?.task_status;
        console.log(`AILab: Текущий статус задачи: ${taskStatus}`);

        if (taskStatus === 2) {
          // Успех! Извлекаем изображение из списка результатов
          resultImage = pollResult.data.result_list?.[0]?.image;
          if (resultImage) {
            console.log('AILab: Изображение успешно получено!');
            break;
          }
        } else if (taskStatus === 3) {
          throw new Error('Ошибка обработки на стороне сервера (возможно, лицо не найдено)');
        }
      }

      if (!resultImage) {
        throw new Error('Превышено время ожидания обработки ИИ.');
      }

      // Возвращаем результат (сервис обычно возвращает base64 или URL)
      return { 
        generatedHairstyleImage: resultImage.startsWith('http') ? resultImage : `data:image/png;base64,${resultImage}` 
      };

    } catch (error: any) {
      console.error('AILabTools Critical Error:', error);
      throw new Error(error.message || 'Произошла ошибка при связи с сервером ИИ.');
    }
  }
);