'use server';
/**
 * @fileOverview Этот процесс позволяет клиентам загружать свои фотографии или ссылки на фото
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
      "Фотография клиента в виде data URI или URL-ссылки. Если это data URI, он должен включать MIME-тип и Base64."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'Описание желаемой прически, например, "короткий бокс", "длинные кудрявые волосы".'
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
        throw new Error(`Не удалось загрузить изображение-пример: ${error.message}`);
      }
    }

    try {
      // Используем gemini-2.5-flash-image (nano-banana) для редактирования
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: finalPhotoUri } },
          {
            text:
              `You are a professional hair stylist. Change the hairstyle of the person in the photo to: ${input.hairstyleDescription}. ` +
              `Maintain the face, background, and lighting. Output ONLY the resulting photo.`,
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        },
      });

      if (!media || !media.url) {
        throw new Error('ИИ не смог сгенерировать изображение. Попробуйте другое фото.');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      console.error('Genkit error details:', error);
      
      const errMsg = error.message || '';
      
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(
          'Бесплатный лимит Google AI исчерпан. Это общая очередь для всех пользователей. ' +
          'Пожалуйста, подождите ровно 60 секунд и нажмите кнопку еще раз. ' +
          'Если ошибка повторяется, попробуйте создать новый API ключ в другом проекте Google Cloud.'
        );
      }
      
      throw new Error(`Ошибка ИИ: ${errMsg}`);
    }
  }
);
