// src/ai/flows/intelligent-donor-matches.ts
'use server';

/**
 * @fileOverview An AI agent that suggests potential blood donors based on specific needs and location.
 *
 * - intelligentDonorMatches - A function that suggests potential blood donors.
 * - IntelligentDonorMatchesInput - The input type for the intelligentDonorMatches function.
 * - IntelligentDonorMatchesOutput - The return type for the intelligentDonorMatches function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentDonorMatchesInputSchema = z.object({
  patientBloodType: z.string().describe('The blood type of the patient needing a donor.'),
  patientCity: z.string().describe('The city where the patient is located.'),
  patientNeeds: z.string().describe('Specific needs or requirements for the donor (e.g., specific health conditions, age range).'),
  searchRadiusKm: z.number().describe('The radius in kilometers to search for potential donors.'),
});
export type IntelligentDonorMatchesInput = z.infer<typeof IntelligentDonorMatchesInputSchema>;

const IntelligentDonorMatchesOutputSchema = z.object({
  suggestedDonors: z.array(
    z.object({
      donorName: z.string().describe('The name of the potential donor.'),
      donorBloodType: z.string().describe('The blood type of the potential donor.'),
      distanceKm: z.number().describe('The distance in kilometers from the patient to the donor.'),
      contactInformation: z.string().describe('How to contact the potential donor.'),
      suitabilityScore: z.number().describe('A score indicating how well the donor matches the patient needs.'),
      additionalNotes: z.string().optional().describe('Any additional notes about the donor.'),
    })
  ).describe('A list of potential blood donors who meet the specified criteria.'),
  summary: z.string().describe('A summary of the search results and any important considerations.'),
});
export type IntelligentDonorMatchesOutput = z.infer<typeof IntelligentDonorMatchesOutputSchema>;

export async function intelligentDonorMatches(input: IntelligentDonorMatchesInput): Promise<IntelligentDonorMatchesOutput> {
  return intelligentDonorMatchesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentDonorMatchesPrompt',
  input: {schema: IntelligentDonorMatchesInputSchema},
  output: {schema: IntelligentDonorMatchesOutputSchema},
  prompt: `You are an AI assistant designed to find suitable blood donors for patients in urgent need. Based on the patient's blood type ({{{patientBloodType}}}), location ({{{patientCity}}}), specific needs ({{{patientNeeds}}}), and the desired search radius ({{{searchRadiusKm}}} km), identify potential donors and provide their relevant information.

Consider factors such as distance, blood type compatibility, and any additional notes about the donors' health conditions or availability. Provide a suitability score for each donor based on how well they match the patient's needs.

Format your output as a JSON object with a 'suggestedDonors' array, where each object in the array represents a potential donor with fields like 'donorName', 'donorBloodType', 'distanceKm', 'contactInformation', 'suitabilityScore', and 'additionalNotes'. Also, include a 'summary' field that summarizes the search results and any important considerations.

Ensure that the 'suggestedDonors' array is sorted by suitability score in descending order (highest score first).
`, 
});

const intelligentDonorMatchesFlow = ai.defineFlow(
  {
    name: 'intelligentDonorMatchesFlow',
    inputSchema: IntelligentDonorMatchesInputSchema,
    outputSchema: IntelligentDonorMatchesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
