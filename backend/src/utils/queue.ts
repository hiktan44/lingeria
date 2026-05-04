import Queue from 'bull';
import axios from 'axios';
import dotenv from 'dotenv';
import { supabase } from '../config/database';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const generationQueue = new Queue('image-generation', redisUrl);

generationQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

generationQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

generationQueue.process(async (job) => {
  const { imageUrl, prompt, outputMode, complianceMode, modelName, userId } = job.data;
  
  try {
    const kieBaseUrl = process.env.KIE_BASE_URL || 'https://api.kie.ai';
    const kieApiKey = process.env.KIE_API_KEY || 'test-key';
    
    if (kieApiKey === 'your-kie-api-key' || kieApiKey === 'test-key') {
        const dummyResult = await new Promise((resolve) => setTimeout(() => resolve({
           data: {
             resultUrl: 'https://images.unsplash.com/photo-15993883271-e2003c90cb8c?auto=format&fit=crop&q=80',
             qualityScore: 92,
             complianceStatus: 'Catalog Ready'
           }
        }), 3000));
        const result = (dummyResult as any).data;
        
        if (userId) {
          await supabase.from('generations').insert({
            user_id: userId,
            result_url: result.resultUrl,
            model: modelName,
            prompt,
            cost: 0,
          });
        }
        
        return { success: true, originalUrl: imageUrl, ...result };
    }

    const startExecution = await axios.post(`${kieBaseUrl}/api/v1/jobs/createTask`, {
      model: modelName || 'nano-banana-pro',
      input: { prompt, image_url: imageUrl }
    }, {
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const taskId = startExecution.data?.data?.taskId;
    if (!taskId) throw new Error('taskId alınamadı');

    const resultUrl = await pollTaskResult(taskId, kieApiKey, kieBaseUrl);

    if (userId) {
      await supabase.from('generations').insert({
        user_id: userId,
        result_url: resultUrl,
        model: modelName,
        prompt,
        cost: 10,
      });
    }

    return {
      success: true,
      originalUrl: imageUrl,
      resultUrl,
      qualityScore: 95,
      complianceStatus: complianceMode
    };

  } catch (error: any) {
    throw new Error(error?.response?.data?.error?.message || error?.message || 'AI Generation failed');
  }
});

async function pollTaskResult(taskId: string, apiKey: string, baseUrl: string, maxWait = 120000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await axios.get(`${baseUrl}/api/v1/jobs/recordInfo`, {
      params: { taskId },
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const { state, resultJson, failMsg } = res.data?.data || {};
    if (state === 'success') {
      const parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      return parsed?.resultUrls?.[0] || parsed?.url || '';
    }
    if (state === 'failed') throw new Error(failMsg || 'Görev başarısız');
  }
  throw new Error('Zaman aşımı');
}

export async function addGenerationJob(jobData: any) {
  return generationQueue.add(jobData, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
}
