'use server';
/**
 * @fileOverview Этот процесс позволяет клиентам загружать свои фотографии
 *   и генерировать изображения себя с различными прическами с помощью ИИ.
 *
 * - aiHairstyleTryOn - Функция, обрабатывающая процесс ИИ-визуализации прически.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Фотография клиента в виде data URI или URL-ссылки."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'Описание желаемой прически.'
    ),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z
    .string()
    .describe('Data URI сгенерированного изображения с новой прической.'),
});
export type AiHairstyleTryOnOutput = z.infer<typeof AiHairstyleTryOnOutputSchema>;

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
    let finalPhotoUri = input.photoDataUri;

    // Если это URL, скачиваем его на сервере
    if (finalPhotoUri.startsWith('http')) {
      try {
        const response = await fetch(finalPhotoUri, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        finalPhotoUri = `data:${contentType};base64,${base64}`;
      } catch (error: any) {
        throw new Error(`Не удалось загрузить изображение: ${error.message}`);
      }
    }

    try {
      // Модель gemini-2.5-flash-image требует четкого разделения контента
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: finalPhotoUri } },
          {
            text: `You are a professional hair stylist. Change the hairstyle of the person in this photo to: ${input.hairstyleDescription}. Keep the face, background and clothes identical. Only change the hair. Return only the edited image.`
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        },
      });

      const media = response.media;

      if (!media || !media.url) {
        throw new Error('ИИ не вернул изображение. Попробуйте использовать более простое описание прически или другое фото.');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      console.error('AI Flow Error:', error);
      
      const errMsg = error.message || '';
      
      // Обработка типичных ошибок API
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Лимит запросов исчерпан. Подождите 60 секунд.');
      }

      if (errMsg.includes('400') || errMsg.includes('invalid_argument')) {
        throw new Error('Ошибка: Ваше фото слишком большое или формат не поддерживается. Попробуйте уменьшить размер фото (до 2МБ) или использовать пример.');
      }
      
      throw new Error(`Ошибка ИИ: ${errMsg}`);
    }
  }
);