// small wrapper around external embedding/search microservice
import axios from 'axios';
const EMB_URL = process.env.EMB_SERVICE_URL;

async function search(text, topk = 200) {
  try {
    if (!EMB_URL) return { ids: [], dists: [] }; // Mock/Skip if no service configured
    const res = await axios.post(`${EMB_URL}/search`, { text, topk }, { timeout: 8000 });
    // expecting { ids: [...], dists: [...] }
    return res.data || {};
  } catch (err) {
    console.warn('embedClient.search failed', err.message);
    return { ids: [], dists: [] };
  }
}

export default { search };
