'use server';
/**
 * @fileOverview Этот процесс позволяет клиентам загружать свои фотографии и генерировать изображения
 *   себя с различными предлагаемыми прическами с помощью ИИ, чтобы они могли визуально
 *   увидеть, как разные стрижки будут смотреться на них.
 *
 * - aiHairstyleTryOn - Функция, обрабатывающая процесс ИИ-визуализации прически.
 * - AiHairstyleTryOnInput - Тип входных данных для функции aiHairstyleTryOn.
 * - AiHairstyleTryOnOutput - Тип возвращаемых данных для функции aiHairstyleTryOn.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiHairstyleTryOnInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Фотография клиента в виде data URI, которая должна включать MIME-тип и использовать кодировку Base64. Ожидаемый формат: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  hairstyleDescription: z
    .string()
    .describe(
      'Описание желаемой прически, например, "короткий бокс", "длинные кудрявые волосы", "классический помпадур", "гладкий боб".'
    ),
});
export type AiHairstyleTryOnInput = z.infer<typeof AiHairstyleTryOnInputSchema>;

const AiHairstyleTryOnOutputSchema = z.object({
  generatedHairstyleImage: z
    .string()
    .describe('Data URI сгенерированного изображения, показывающего клиента с новой прической.')
    .refine((val) => val.startsWith('data:image/'), 'Должен быть data URI для изображения. Ожидаемый формат: data:image/<mime_type>;base64,<encoded_data>'),
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
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image',
      prompt: [
        { media: { url: input.photoDataUri } },
        {
          text:
            `Please modify the hair of the person in this photo. Apply the following hairstyle: ${input.hairstyleDescription}. ` +
            `The new hairstyle must look natural, blending perfectly with the person's head shape, facial features, and skin tone. ` +
            `Keep the background, lighting, and overall image quality exactly as they are in the original photo. ` +
            `Return ONLY the modified image.`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Не удалось сгенерировать изображение прически. Попробуйте другое фото или описание.');
    }

    return { generatedHairstyleImage: media.url };
  }
);
