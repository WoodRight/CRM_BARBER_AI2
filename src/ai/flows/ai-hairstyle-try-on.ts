
'use server';
/**
 * @fileOverview Этот процесс позволяет клиентам загружать свои фотографии
 *   и генерировать изображения себя с различными прическами с помощью ИИ.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Фотография клиента в виде data URI. Формат: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'Описание желаемой прически (на английском для лучшего результата).'
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
    let finalPhotoUri = input.photoDataUri.trim();

    // Если это URL, скачиваем его и превращаем в чистый Base64 на сервере
    if (finalPhotoUri.startsWith('http')) {
      try {
        const response = await fetch(finalPhotoUri, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        finalPhotoUri = `data:${contentType};base64,${base64}`;
      } catch (error: any) {
        throw new Error(`Ошибка загрузки: ${error.message}`);
      }
    }

    try {
      // Прямой вызов модели для редактирования изображения
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: finalPhotoUri } },
          { text: `Modify the hairstyle of the person in the photo. Style: ${input.hairstyleDescription}. Keep the face, background and clothing exactly the same.` }
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          // Минимальные настройки безопасности для стабильности
          safetySettings: [
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        },
      });

      const media = response.media;

      if (!media || !media.url) {
        throw new Error('ИИ не вернул изображение. Попробуйте использовать более простое описание прически.');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      console.error('Genkit Error:', error);
      const errMsg = error.message || '';
      
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Лимит запросов исчерпан. Пожалуйста, подождите 60 секунд перед следующей попыткой.');
      }

      if (errMsg.includes('400') || errMsg.includes('invalid_argument')) {
        throw new Error('Ошибка параметров: Попробуйте загрузить скриншот фото (он весит меньше) или используйте демо-фото.');
      }
      
      throw new Error(`Ошибка генерации: ${errMsg}`);
    }
  }
);
