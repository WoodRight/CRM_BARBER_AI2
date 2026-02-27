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

    // Если это URL, скачиваем его на сервере, чтобы избежать CORS
    if (finalPhotoUri.startsWith('http')) {
      try {
        const response = await fetch(finalPhotoUri);
        if (!response.ok) throw new Error('Failed to fetch image from URL');
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        finalPhotoUri = `data:${contentType};base64,${base64}`;
      } catch (error) {
        console.error('Error fetching image on server:', error);
        throw new Error('Не удалось загрузить изображение по ссылке. Попробуйте загрузить файл напрямую.');
      }
    }

    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: finalPhotoUri } },
          {
            text:
              `Modify the hair of the person in this image. Apply the following style: ${input.hairstyleDescription}. ` +
              `Maintain the person's identity, face, and background exactly as they are. ` +
              `Only change the hair. The result should look professional and realistic.`,
          },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
          ],
        },
      });

      if (!media || !media.url) {
        throw new Error('Model did not return an image');
      }

      return { generatedHairstyleImage: media.url };
    } catch (error: any) {
      console.error('Genkit error:', error);
      throw new Error(error.message || 'Ошибка при генерации прически. Попробуйте другое описание.');
    }
  }
);
