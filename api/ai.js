export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body
    const HF_TOKEN = process.env.HF_TOKEN

    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'HF_TOKEN missing' })
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-6.7b-instruct",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 2048, temperature: 0.2, wait_for_model: true }
        })
      }
    )

    const data = await response.json()
    
    if (data.error) {
      return res.status(500).json({ error: data.error })
    }

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}