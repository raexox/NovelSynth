import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.ASSEMBLYAI_API_KEY || 'f0a22b0a32aa47838c391f8590a4a55a';

  return {
    plugins: [
      react(),
      {
        name: 'assemblyai-token-proxy',
        configureServer(server) {
          server.middlewares.use('/api/assemblyai/token', async (req, res) => {
            try {
              const response = await fetch('https://streaming.assemblyai.com/v3/token?expires_in_seconds=60', {
                headers: {
                  authorization: apiKey
                }
              });

              if (!response.ok) {
                const errText = await response.text();
                res.statusCode = response.status;
                res.end(JSON.stringify({ error: errText }));
                return;
              }

              const data = await response.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (error: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
            }
          });
        }
      }
    ],
  };
});

